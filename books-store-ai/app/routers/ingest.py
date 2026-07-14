"""
Ingest Router
Endpoints for data synchronization
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException, Header, status
from pydantic import BaseModel
import psycopg2
import logging
import time
from typing import Optional
from app.core.config import settings
from app.clients.backend_client import backend_client
from app.services.embedder import embedder
from app.services.book_ingestion_service import book_ingestion_service
from app.models.webhook_schemas import (
    BookChangedWebhookRequest,
    WebhookResponse,
    EventType,
    IngestEventStatus
)
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
    Manually ingest a single book by ID
    """
    try:
        # Use centralized service
        success = await book_ingestion_service.ingest_book(book_id)
        
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



# ==================== WEBHOOK ENDPOINTS ====================

def verify_internal_api_key(x_internal_api_key: Optional[str] = Header(None)):
    """
    Verify internal API key for webhook authentication
    """
    expected_key = getattr(settings, 'AI_INTERNAL_API_KEY', '')
    
    # If no key configured, skip authentication (dev mode)
    if not expected_key or expected_key == '':
        logger.warning("[WARN] No internal API key configured, skipping authentication")
        return
    
    # Check key
    if not x_internal_api_key or x_internal_api_key != expected_key:
        logger.error("[ERROR] Invalid or missing internal API key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )


async def process_book_event_background(event_id: str, book_id: int, event_type: EventType):
    """
    Background task to process book change event
    """
    try:
        logger.info(f"[OK] Processing event {event_id}: {event_type} for book {book_id}")
        
        # Mark as processing
        book_ingestion_service.save_event_status(
            event_id, book_id, event_type.value, IngestEventStatus.PROCESSING.value
        )
        
        # Process based on event type
        success = False
        
        if event_type == EventType.CREATED or event_type == EventType.UPDATED:
            # Ingest or update book
            success = await book_ingestion_service.ingest_book(book_id)
        elif event_type == EventType.DELETED:
            # Delete vector
            success = await book_ingestion_service.delete_book_vector(book_id)
        
        # Update status
        if success:
            book_ingestion_service.save_event_status(
                event_id, book_id, event_type.value, IngestEventStatus.COMPLETED.value
            )
            logger.info(f"[OK] Event {event_id} completed successfully")
        else:
            book_ingestion_service.save_event_status(
                event_id, book_id, event_type.value, IngestEventStatus.FAILED.value,
                error_message="Processing failed, check logs"
            )
            logger.error(f"[ERROR] Event {event_id} failed")
            
    except Exception as e:
        logger.error(f"[ERROR] Exception processing event {event_id}: {str(e)}")
        book_ingestion_service.save_event_status(
            event_id, book_id, event_type.value, IngestEventStatus.FAILED.value,
            error_message=str(e)
        )


@router.post("/events/book-changed", response_model=WebhookResponse)
async def handle_book_changed_webhook(
    event: BookChangedWebhookRequest,
    background_tasks: BackgroundTasks,
    x_internal_api_key: Optional[str] = Header(None)
):
    """
    Webhook endpoint for book change events from Spring Boot
    
    Authenticates request, checks idempotency, and processes event in background
    """
    # Verify authentication
    verify_internal_api_key(x_internal_api_key)
    
    logger.info(f"[OK] Received webhook: {event.dict()}")
    
    # Check idempotency - has this event been processed?
    if book_ingestion_service.check_event_processed(event.event_id):
        logger.info(f"[OK] Event {event.event_id} already processed, skipping")
        return WebhookResponse(
            accepted=True,
            event_id=event.event_id,
            book_id=event.book_id,
            message="Event already processed"
        )
    
    # Validate event type
    try:
        event_type = EventType(event.event_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid event type: {event.event_type}"
        )
    
    # Save as pending
    book_ingestion_service.save_event_status(
        event.event_id, event.book_id, event_type.value, IngestEventStatus.PENDING.value
    )
    
    # Process in background
    background_tasks.add_task(
        process_book_event_background,
        event.event_id,
        event.book_id,
        event_type
    )
    
    return WebhookResponse(
        accepted=True,
        event_id=event.event_id,
        book_id=event.book_id,
        message="Event processing started in background"
    )


@router.delete("/{book_id}", status_code=status.HTTP_200_OK)
async def delete_book_vector(book_id: int):
    """
    Manually delete vector for a book
    """
    try:
        success = await book_ingestion_service.delete_book_vector(book_id)
        
        if success:
            return {"success": True, "message": f"Vector for book {book_id} deleted"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete vector")
            
    except Exception as e:
        logger.error(f"Error deleting vector for book {book_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/status")
async def get_event_status():
    """
    Get summary of event processing status
    """
    try:
        conn = psycopg2.connect(settings.PG_DSN)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'ingest_events'
            )
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            cursor.close()
            conn.close()
            return {
                "events_tracked": 0,
                "pending": 0,
                "processing": 0,
                "completed": 0,
                "failed": 0,
                "message": "No events tracked yet"
            }
        
        # Get counts by status
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM ingest_events
            GROUP BY status
        """)
        
        status_counts = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Get total
        cursor.execute("SELECT COUNT(*) FROM ingest_events")
        total = cursor.fetchone()[0]
        
        # Get recent failures
        cursor.execute("""
            SELECT event_id, book_id, event_type, error_message, updated_at
            FROM ingest_events
            WHERE status = 'FAILED'
            ORDER BY updated_at DESC
            LIMIT 5
        """)
        
        recent_failures = [
            {
                "event_id": row[0],
                "book_id": row[1],
                "event_type": row[2],
                "error_message": row[3],
                "updated_at": row[4].isoformat() if row[4] else None
            }
            for row in cursor.fetchall()
        ]
        
        cursor.close()
        conn.close()
        
        return {
            "events_tracked": total,
            "pending": status_counts.get("PENDING", 0),
            "processing": status_counts.get("PROCESSING", 0),
            "completed": status_counts.get("COMPLETED", 0),
            "failed": status_counts.get("FAILED", 0),
            "recent_failures": recent_failures
        }
        
    except Exception as e:
        logger.error(f"Error getting event status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
