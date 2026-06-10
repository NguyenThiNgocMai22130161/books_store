"""
Chat History Service
Manages conversation history storage and retrieval
"""

import psycopg2
from psycopg2.extras import Json, RealDictCursor
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class ChatHistoryService:
    """Service for managing chat history"""
    
    def __init__(self):
        self.dsn = settings.PG_DSN
    
    def _get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.dsn)
    
    def save_message(
        self,
        session_id: str,
        role: str,
        message: str,
        user_id: Optional[int] = None,
        book_id: Optional[int] = None,
        intent: Optional[str] = None,
        sources: Optional[List[Dict]] = None
    ) -> int:
        """
        Save a chat message to history
        
        Args:
            session_id: Chat session ID
            role: 'user' or 'assistant'
            message: Message content
            user_id: Optional user ID
            book_id: Optional book context
            intent: Optional intent classification
            sources: Optional source books
            
        Returns:
            ID of saved message
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO chat_history 
                        (session_id, user_id, book_id, role, message, intent, sources)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        session_id,
                        user_id,
                        book_id,
                        role,
                        message,
                        intent,
                        Json(sources) if sources else None
                    ))
                    message_id = cur.fetchone()[0]
                    conn.commit()
                    logger.info(f"Saved message {message_id} for session {session_id}")
                    return message_id
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise
    
    def get_session_history(
        self,
        session_id: str,
        limit: int = 50
    ) -> List[Dict]:
        """
        Get chat history for a session
        
        Args:
            session_id: Chat session ID
            limit: Maximum messages to return
            
        Returns:
            List of messages
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT 
                            id, session_id, user_id, book_id,
                            role, message, intent, sources,
                            created_at
                        FROM chat_history
                        WHERE session_id = %s
                        ORDER BY created_at ASC
                        LIMIT %s
                    """, (session_id, limit))
                    
                    messages = [dict(row) for row in cur.fetchall()]
                    return messages
        except Exception as e:
            logger.error(f"Error getting session history: {e}")
            return []
    
    def get_user_history(
        self,
        user_id: int,
        days: int = 30,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get chat history for a user
        
        Args:
            user_id: User ID
            days: Look back days
            limit: Maximum messages
            
        Returns:
            List of messages
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT 
                            id, session_id, user_id, book_id,
                            role, message, intent, sources,
                            created_at
                        FROM chat_history
                        WHERE user_id = %s 
                        AND created_at >= %s
                        ORDER BY created_at DESC
                        LIMIT %s
                    """, (user_id, cutoff_date, limit))
                    
                    messages = [dict(row) for row in cur.fetchall()]
                    return messages
        except Exception as e:
            logger.error(f"Error getting user history: {e}")
            return []
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a chat session
        
        Args:
            session_id: Session to delete
            
        Returns:
            Success status
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        DELETE FROM chat_history
                        WHERE session_id = %s
                    """, (session_id,))
                    conn.commit()
                    logger.info(f"Deleted session {session_id}")
                    return True
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False
    
    def get_recent_sessions(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[Dict]:
        """
        Get user's recent chat sessions
        
        Args:
            user_id: User ID
            limit: Number of sessions
            
        Returns:
            List of sessions with metadata
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT 
                            session_id,
                            COUNT(*) as message_count,
                            MAX(created_at) as last_message_at,
                            MIN(created_at) as started_at
                        FROM chat_history
                        WHERE user_id = %s
                        GROUP BY session_id
                        ORDER BY MAX(created_at) DESC
                        LIMIT %s
                    """, (user_id, limit))
                    
                    sessions = [dict(row) for row in cur.fetchall()]
                    return sessions
        except Exception as e:
            logger.error(f"Error getting recent sessions: {e}")
            return []


# Global instance
chat_history_service = ChatHistoryService()
