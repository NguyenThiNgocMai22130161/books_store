"""
Backend Client
Communicates with Spring Boot Backend API
"""

import httpx
from typing import List, Dict, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class BackendClient:
    """
    HTTP client for Spring Boot backend
    """
    
    def __init__(self):
        """Initialize client with backend URL and auth"""
        self.base_url = settings.BACKEND_BASE_URL
        self.headers = {
            "Content-Type": "application/json"
        }
        
        # Add JWT token if available
        if settings.JWT_TOKEN and settings.JWT_TOKEN != "TEMPORARY_TOKEN_WILL_BE_REPLACED":
            self.headers["Authorization"] = f"Bearer {settings.JWT_TOKEN}"
        
        self.timeout = 60.0  # 60 seconds timeout
        logger.info(f"[OK] Backend client initialized: {self.base_url}")
    
    async def get_all_books(self) -> List[Dict]:
        """
        Fetch all books from backend
        
        Returns:
            List of book dictionaries
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/books",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Handle both list and paginated response
                    if isinstance(data, list):
                        books = data
                    elif isinstance(data, dict) and 'content' in data:
                        # Spring Boot Page format
                        books = data['content']
                    else:
                        books = []
                    
                    logger.info(f"[OK] Fetched {len(books)} books from backend")
                    return books
                else:
                    logger.error(f"Failed to fetch books: {response.status_code}")
                    return []
        
        except Exception as e:
            logger.error(f"Error fetching books: {str(e)}")
            return []
    
    async def get_book_by_id(self, book_id: int) -> Optional[Dict]:
        """
        Fetch single book by ID
        
        Args:
            book_id: Book ID
            
        Returns:
            Book dictionary or None
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/books/{book_id}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Book {book_id} not found: {response.status_code}")
                    return None
        
        except Exception as e:
            logger.error(f"Error fetching book {book_id}: {str(e)}")
            return None
    
    async def health_check(self) -> bool:
        """
        Check if backend is reachable
        
        Returns:
            True if backend is up
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/actuator/health",
                    headers=self.headers
                )
                return response.status_code == 200
        except:
            # Try root endpoint if actuator not available
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(
                        f"{self.base_url}/",
                        headers=self.headers
                    )
                    return response.status_code < 500
            except:
                return False


# Global backend client instance
backend_client = BackendClient()
