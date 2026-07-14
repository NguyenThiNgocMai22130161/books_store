"""
Centralized book ingestion service
Reused by both manual endpoints and webhooks
"""

import psycopg2
import logging
from typing import Optional, Dict, Any
from app.core.config import settings
from app.clients.backend_client import backend_client
from app.services.embedder import embedder
from app.utils.text_processing import build_search_text, extract_metadata

logger = logging.getLogger(__name__)


class BookIngestionService:
    """Service for ingesting books into vector database"""
    
    def __init__(self):
        self.conn_string = settings.PG_DSN
    
    async def ingest_book(self, book_id: int) -> bool:
        """
        Ingest or update a single book
        
        Args:
            book_id: Book ID to ingest
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Fetch book data from backend
            logger.info(f"[OK] Fetching book {book_id} from backend...")
            book_data = await backend_client.get_book_by_id(book_id)
            
            if not book_data:
                logger.warning(f"[WARN] Book {book_id} not found in backend")
                return False
            
            # Connect to database
            conn = psycopg2.connect(self.conn_string)
            cursor = conn.cursor()
            
            # Build search text
            search_text = build_search_text(book_data)
            
            if not search_text:
                logger.warning(f"[WARN] Empty search text for book {book_id}")
                cursor.close()
                conn.close()
                return False
            
            # Create embedding
            logger.info(f"[OK] Creating embedding for book {book_id}: {book_data.get('title', 'N/A')[:50]}...")
            embeddings = embedder.encode(search_text)
            
            if not embeddings or not embeddings[0]:
                logger.error(f"[ERROR] Failed to create embedding for book {book_id}")
                cursor.close()
                conn.close()
                return False
            
            embedding = embeddings[0]
            
            # Extract metadata
            metadata = extract_metadata(book_data)
            
            # Upsert into database (INSERT or UPDATE)
            cursor.execute("""
                INSERT INTO book_vectors (
                    book_id, search_text, embedding,
                    avg_rating, total_reviews, total_orders,
                    updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (book_id) DO UPDATE SET
                    search_text = EXCLUDED.search_text,
                    embedding = EXCLUDED.embedding,
                    avg_rating = EXCLUDED.avg_rating,
                    total_reviews = EXCLUDED.total_reviews,
                    total_orders = EXCLUDED.total_orders,
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
            conn.close()
            
            logger.info(f"[OK] Successfully ingested book {book_id}")
            return True
            
        except Exception as e:
            logger.error(f"[ERROR] Error ingesting book {book_id}: {str(e)}")
            return False
    
    async def delete_book_vector(self, book_id: int) -> bool:
        """
        Delete vector for a book
        
        Args:
            book_id: Book ID to delete
            
        Returns:
            True if successful (even if vector didn't exist), False on error
        """
        try:
            conn = psycopg2.connect(self.conn_string)
            cursor = conn.cursor()
            
            # Delete vector
            cursor.execute("""
                DELETE FROM book_vectors
                WHERE book_id = %s
            """, (book_id,))
            
            deleted_count = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            
            if deleted_count > 0:
                logger.info(f"[OK] Deleted vector for book {book_id}")
            else:
                logger.info(f"[OK] No vector found for book {book_id}, already deleted")
            
            return True
            
        except Exception as e:
            logger.error(f"[ERROR] Error deleting vector for book {book_id}: {str(e)}")
            return False
    
    def save_event_status(
        self,
        event_id: str,
        book_id: int,
        event_type: str,
        status: str,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Save event processing status to database
        
        Note: Creates table if not exists
        """
        try:
            conn = psycopg2.connect(self.conn_string)
            cursor = conn.cursor()
            
            # Create table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ingest_events (
                    id SERIAL PRIMARY KEY,
                    event_id VARCHAR(255) UNIQUE NOT NULL,
                    book_id INTEGER NOT NULL,
                    event_type VARCHAR(50) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Upsert event status
            cursor.execute("""
                INSERT INTO ingest_events (event_id, book_id, event_type, status, error_message, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (event_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    error_message = EXCLUDED.error_message,
                    updated_at = NOW()
            """, (event_id, book_id, event_type, status, error_message))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"[ERROR] Error saving event status: {str(e)}")
            return False
    
    def check_event_processed(self, event_id: str) -> bool:
        """
        Check if event has already been processed (idempotency)
        
        Args:
            event_id: Event ID to check
            
        Returns:
            True if already processed, False otherwise
        """
        try:
            conn = psycopg2.connect(self.conn_string)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT status FROM ingest_events
                WHERE event_id = %s AND status = 'COMPLETED'
            """, (event_id,))
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            return result is not None
            
        except Exception as e:
            logger.error(f"[ERROR] Error checking event: {str(e)}")
            return False


# Global instance
book_ingestion_service = BookIngestionService()
