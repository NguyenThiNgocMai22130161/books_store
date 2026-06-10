"""
Ingest Router
Endpoints for data synchronization
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import psycopg2
import logging
import time
from app.core.config import settings
from app.clients.backend_client import backend_client
from app.services.embedder import embedder
from app.utils.text_processing import build_search_text, extract_metadata

logger = logging.getLogger(__name__)

router = APIRouter()


class IngestResponse(BaseModel):
    """Response model for ingest endpoints"""
    success: bool
    message: str
    books_processed: int = 0
    books_total: int = 0


async def ingest_book(book_id: int, book_data: dict, conn) -> bool:
    """
    Ingest single book into vector database
    
    Args:
        book_id: Book ID
        book_data: Book data from backend
        conn: Database connection
        
    Returns:
        True if successful
    """
    try:
        cursor = conn.cursor()
        
        # Check if already exists
        cursor.execute(
            "SELECT id FROM book_vectors WHERE book_id = %s",
            (book_id,)
        )
        if cursor.fetchone():
            logger.debug(f"Book {book_id} already exists, skipping")
            cursor.close()
            return True
        
        # Build search text
        search_text = build_search_text(book_data)
        
        if not search_text:
            logger.warning(f"Empty search text for book {book_id}")
            cursor.close()
            return False
        
        # Create embedding
        logger.info(f"[OK] Creating embedding for book {book_id}: {book_data.get('title', 'N/A')[:50]}...")
        embeddings = embedder.encode(search_text)
        
        if not embeddings or not embeddings[0]:
            logger.error(f"Failed to create embedding for book {book_id}")
            cursor.close()
            return False
        
        embedding = embeddings[0]
        
        # Extract metadata
        metadata = extract_metadata(book_data)
        
        # Insert into database
        cursor.execute("""
            INSERT INTO book_vectors (
                book_id, search_text, embedding,
                avg_rating, total_reviews, total_orders
            ) VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (book_id) DO UPDATE SET
                search_text = EXCLUDED.search_text,
                embedding = EXCLUDED.embedding,
                updated_at = NOW()
        """, (
            book_id,
            search_text,
            str(embedding),  # Convert list to string for pgvector
            metadata['avg_rating'],
            metadata['total_reviews'],
            metadata['total_orders']
        ))
        
        conn.commit()
        cursor.close()
        
        logger.info(f"[OK] Ingested book {book_id}")
        return True
        
    except Exception as e:
        logger.error(f"[OK] Error ingesting book {book_id}: {str(e)}")
        conn.rollback()
        return False


async def sync_all_books_background():
    """
    Background task to sync all books from backend
    """
    logger.info("[OK] Starting full sync...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(settings.PG_DSN)
        
        # Fetch all books from backend
        books = await backend_client.get_all_books()
        
        if not books:
            logger.error("No books fetched from backend")
            return
        
        total = len(books)
        success_count = 0
        
        logger.info(f"[OK] Processing {total} books...")
        
        # Process each book
        for i, book in enumerate(books, 1):
            book_id = book.get('id')
            
            if not book_id:
                logger.warning(f"Book at index {i} has no ID, skipping")
                continue
            
            # Ingest book
            success = await ingest_book(book_id, book, conn)
            
            if success:
                success_count += 1
            
            # Progress update every 10 books
            if i % 10 == 0:
                logger.info(f"Progress: {i}/{total} ({i/total*100:.1f}%) - {success_count} successful")
            
            # Rate limit: wait 0.5s between requests to avoid hitting Gemini API limits
            if i < total:
                time.sleep(0.5)
        
        conn.close()
        
        logger.info(f"[OK] Sync complete! {success_count}/{total} books ingested")
        
    except Exception as e:
        logger.error(f"[OK] Sync failed: {str(e)}")


@router.post("/sync", response_model=IngestResponse)
async def sync_all_books(background_tasks: BackgroundTasks):
    """
    Trigger full sync of all books (runs in background)
    """
    try:
        # Check backend connectivity
        backend_up = await backend_client.health_check()
        if not backend_up:
            raise HTTPException(
                status_code=503,
                detail="Backend is not reachable"
            )
        
        # Start background task
        background_tasks.add_task(sync_all_books_background)
        
        return IngestResponse(
            success=True,
            message="Sync started in background. Check logs for progress.",
            books_processed=0
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting sync: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{book_id}", response_model=IngestResponse)
async def ingest_single_book(book_id: int):
    """
    Ingest a single book by ID
    """
    try:
        # Fetch book from backend
        book_data = await backend_client.get_book_by_id(book_id)
        
        if not book_data:
            raise HTTPException(status_code=404, detail=f"Book {book_id} not found")
        
        # Connect to database
        conn = psycopg2.connect(settings.PG_DSN)
        
        # Ingest
        success = await ingest_book(book_id, book_data, conn)
        
        conn.close()
        
        if success:
            return IngestResponse(
                success=True,
                message=f"Book {book_id} ingested successfully",
                books_processed=1,
                books_total=1
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to ingest book {book_id}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ingesting book {book_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_ingest_status():
    """
    Get current ingestion status
    """
    try:
        conn = psycopg2.connect(settings.PG_DSN)
        cursor = conn.cursor()
        
        # Count vectors
        cursor.execute("SELECT COUNT(*) FROM book_vectors")
        vector_count = cursor.fetchone()[0]
        
        # Count books
        cursor.execute("SELECT COUNT(*) FROM books")
        book_count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        progress = (vector_count / book_count * 100) if book_count > 0 else 0
        
        return {
            "vectors_created": vector_count,
            "total_books": book_count,
            "progress_percent": round(progress, 2),
            "status": "complete" if vector_count == book_count else "incomplete"
        }
    
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
