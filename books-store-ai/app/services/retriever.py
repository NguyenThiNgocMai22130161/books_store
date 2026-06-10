"""
Retriever Service
Vector similarity search with hybrid scoring
"""

import psycopg2
from typing import List, Dict, Optional
import logging
from app.core.config import settings
from app.services.embedder import embedder

logger = logging.getLogger(__name__)


class SearchResult:
    """Search result with book info and score"""
    
    def __init__(self, row: tuple):
        """Initialize from database row"""
        self.book_id = row[0]
        self.title = row[1]
        self.author = row[2]
        self.category = row[3]
        self.price = row[4]
        self.description = row[5]
        self.search_text = row[6]
        self.similarity = float(row[7]) if row[7] else 0.0
        self.avg_rating = float(row[8]) if row[8] else 0.0
        self.total_reviews = row[9] if row[9] else 0
        self.total_orders = row[10] if row[10] else 0
        
        # Final score (will be calculated with hybrid scoring)
        self.score = self.similarity
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'book_id': self.book_id,
            'title': self.title,
            'author': self.author,
            'category': self.category,
            'price': self.price,
            'description': self.description[:200] if self.description else None,
            'similarity': round(self.similarity, 4),
            'score': round(self.score, 4),
            'avg_rating': self.avg_rating,
            'total_reviews': self.total_reviews,
            'total_orders': self.total_orders
        }


class Retriever:
    """
    Vector similarity search with hybrid scoring
    """
    
    def __init__(self):
        """Initialize retriever"""
        self.conn_string = settings.PG_DSN
        logger.info("[OK] Retriever initialized")
    
    def search(
        self,
        query: str,
        top_k: int = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None
    ) -> List[SearchResult]:
        """
        Search for books using vector similarity
        
        Args:
            query: Search query string
            top_k: Number of results to return (default from settings)
            category: Filter by category
            min_price: Minimum price filter
            max_price: Maximum price filter
            
        Returns:
            List of SearchResult objects
        """
        if top_k is None:
            top_k = settings.TOP_K_RESULTS
        
        try:
            # Create query embedding
            logger.info(f"[OK] Searching for: {query[:50]}...")
            query_vector = embedder.encode_query(query)
            
            # Connect to database
            conn = psycopg2.connect(self.conn_string)
            cursor = conn.cursor()
            
            # Build SQL query with filters
            sql = """
                SELECT 
                    b.id,
                    b.title,
                    b.author,
                    b.category,
                    b.price,
                    b.description,
                    bv.search_text,
                    1 - (bv.embedding <=> %s::vector) as similarity,
                    bv.avg_rating,
                    bv.total_reviews,
                    bv.total_orders
                FROM book_vectors bv
                JOIN books b ON bv.book_id = b.id
                WHERE 1=1
            """
            
            params = [str(query_vector)]
            
            # Add filters
            if category:
                sql += " AND b.category = %s"
                params.append(category)
            
            if min_price is not None:
                sql += " AND b.price >= %s"
                params.append(min_price)
            
            if max_price is not None:
                sql += " AND b.price <= %s"
                params.append(max_price)
            
            # Order by similarity and limit
            sql += f" ORDER BY similarity DESC LIMIT %s"
            params.append(top_k * 2)  # Fetch more for hybrid scoring
            
            # Execute query
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            # Convert to SearchResult objects
            results = [SearchResult(row) for row in rows]
            
            # Apply hybrid scoring
            results = self._hybrid_scoring(results, query)
            
            # Filter by threshold
            results = [r for r in results if r.score >= settings.SCORE_THRESHOLD]
            
            # Return top_k results
            results = results[:top_k]
            
            logger.info(f"[OK] Found {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"[OK] Search error: {str(e)}")
            return []
    
    def _hybrid_scoring(self, results: List[SearchResult], query: str) -> List[SearchResult]:
        """
        Apply hybrid scoring: vector similarity + keyword matching + metadata
        
        Args:
            results: List of search results
            query: Original query
            
        Returns:
            Scored and sorted results
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        for result in results:
            score = result.similarity
            
            # Keyword boost: +0.2 for each query word found in title/author
            title_lower = result.title.lower()
            author_lower = result.author.lower()
            
            matches = 0
            for word in query_words:
                if len(word) > 2:  # Skip very short words
                    if word in title_lower:
                        matches += 1
                    if word in author_lower:
                        matches += 0.5
            
            keyword_boost = matches * settings.KEYWORD_BOOST
            score += keyword_boost
            
            # Rating boost: +0.1 if rating >= 4
            if result.avg_rating >= 4.0:
                score += settings.RATING_BOOST
            
            # Sales boost: +0.15 if orders > 50 (placeholder, adjust when data available)
            if result.total_orders > 50:
                score += settings.SALES_BOOST
            
            result.score = score
        
        # Sort by final score
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results
    
    def get_similar_books(self, book_id: int, top_k: int = 5) -> List[SearchResult]:
        """
        Find books similar to a given book
        
        Args:
            book_id: Reference book ID
            top_k: Number of similar books to return
            
        Returns:
            List of similar books
        """
        try:
            conn = psycopg2.connect(self.conn_string)
            cursor = conn.cursor()
            
            # Get vector of reference book
            cursor.execute("""
                SELECT embedding, search_text
                FROM book_vectors
                WHERE book_id = %s
            """, (book_id,))
            
            row = cursor.fetchone()
            if not row:
                logger.warning(f"Book {book_id} not found in vectors")
                cursor.close()
                conn.close()
                return []
            
            reference_vector = row[0]
            reference_text = row[1]
            
            # Find similar books
            cursor.execute("""
                SELECT 
                    b.id,
                    b.title,
                    b.author,
                    b.category,
                    b.price,
                    b.description,
                    bv.search_text,
                    1 - (bv.embedding <=> %s::vector) as similarity,
                    bv.avg_rating,
                    bv.total_reviews,
                    bv.total_orders
                FROM book_vectors bv
                JOIN books b ON bv.book_id = b.id
                WHERE bv.book_id != %s
                ORDER BY bv.embedding <=> %s::vector
                LIMIT %s
            """, (reference_vector, book_id, reference_vector, top_k))
            
            rows = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            results = [SearchResult(row) for row in rows]
            
            logger.info(f"[OK] Found {len(results)} similar books to book {book_id}")
            return results
            
        except Exception as e:
            logger.error(f"[OK] Error finding similar books: {str(e)}")
            return []


# Global retriever instance
retriever = Retriever()
