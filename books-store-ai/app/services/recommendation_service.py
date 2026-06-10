"""
Personalized Recommendation Service
Generates personalized book recommendations based on user behavior
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional
from app.core.config import settings
from app.services.embedder import embedder
import logging

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for personalized book recommendations"""
    
    def __init__(self):
        self.dsn = settings.PG_DSN
    
    def _get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.dsn)
    
    def get_personalized_recommendations(
        self,
        user_id: int,
        limit: int = 10,
        exclude_owned: bool = True
    ) -> List[Dict]:
        """
        Get personalized book recommendations for user
        
        Based on:
        - Purchase history
        - Wishlist items
        - Chat interactions
        - User preferences
        
        Args:
            user_id: User ID
            limit: Number of recommendations
            exclude_owned: Exclude already purchased books
            
        Returns:
            List of recommended books with scores
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get user's interaction history
                    user_books = self._get_user_interaction_books(cur, user_id)
                    
                    if not user_books:
                        # New user - return popular books
                        return self._get_popular_books(cur, limit)
                    
                    # Get user preferences
                    preferences = self._get_user_preferences(cur, user_id)
                    
                    # Build recommendation query
                    query = self._build_recommendation_query(
                        user_books,
                        preferences,
                        exclude_owned,
                        user_id,
                        limit
                    )
                    
                    cur.execute(query)
                    recommendations = [dict(row) for row in cur.fetchall()]
                    
                    logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
                    return recommendations
                    
        except Exception as e:
            logger.error(f"Error getting personalized recommendations: {e}")
            return []
    
    def _get_user_interaction_books(
        self,
        cursor,
        user_id: int
    ) -> List[int]:
        """Get books user has interacted with"""
        cursor.execute("""
            SELECT DISTINCT book_id
            FROM (
                -- From orders
                SELECT DISTINCT b.id as book_id
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN books b ON oi.book_id = b.id
                WHERE o.user_id = %s
                
                UNION
                
                -- From wishlist
                SELECT DISTINCT book_id
                FROM wishlist
                WHERE user_id = %s
                
                UNION
                
                -- From chat history
                SELECT DISTINCT book_id
                FROM chat_history
                WHERE user_id = %s AND book_id IS NOT NULL
            ) AS user_books
        """, (user_id, user_id, user_id))
        
        return [row[0] for row in cursor.fetchall()]
    
    def _get_user_preferences(
        self,
        cursor,
        user_id: int
    ) -> Optional[Dict]:
        """Get user preferences"""
        cursor.execute("""
            SELECT 
                favorite_categories,
                reading_interests,
                price_range_min,
                price_range_max,
                preferred_authors
            FROM user_preferences
            WHERE user_id = %s
        """, (user_id,))
        
        row = cursor.fetchone()
        return dict(row) if row else None
    
    def _build_recommendation_query(
        self,
        user_books: List[int],
        preferences: Optional[Dict],
        exclude_owned: bool,
        user_id: int,
        limit: int
    ) -> str:
        """Build SQL query for recommendations"""
        
        # Base query - find similar books
        query = f"""
            WITH user_book_vectors AS (
                SELECT embedding
                FROM book_vectors
                WHERE book_id IN ({','.join(map(str, user_books))})
            ),
            avg_user_vector AS (
                SELECT AVG(embedding) as avg_embedding
                FROM user_book_vectors
            )
            SELECT 
                b.id as book_id,
                b.title,
                b.author,
                b.category,
                b.price,
                b.image_url,
                (1 - (bv.embedding <=> (SELECT avg_embedding FROM avg_user_vector))) as similarity_score,
                COALESCE(b.avg_rating, 0) as avg_rating,
                COALESCE(b.total_reviews, 0) as total_reviews
            FROM books b
            JOIN book_vectors bv ON b.id = bv.book_id
            WHERE b.id NOT IN ({','.join(map(str, user_books))})
        """
        
        # Add preference filters
        if preferences:
            if preferences.get('favorite_categories'):
                categories = [f"'{cat}'" for cat in preferences['favorite_categories']]
                query += f" AND b.category IN ({','.join(categories)})"
            
            if preferences.get('price_range_min'):
                query += f" AND b.price >= {preferences['price_range_min']}"
            
            if preferences.get('price_range_max'):
                query += f" AND b.price <= {preferences['price_range_max']}"
        
        # Exclude owned books if requested
        if exclude_owned:
            query += f"""
                AND b.id NOT IN (
                    SELECT DISTINCT oi.book_id
                    FROM orders o
                    JOIN order_items oi ON o.id = oi.order_id
                    WHERE o.user_id = {user_id}
                )
            """
        
        query += f"""
            ORDER BY similarity_score DESC, avg_rating DESC
            LIMIT {limit}
        """
        
        return query
    
    def _get_popular_books(
        self,
        cursor,
        limit: int
    ) -> List[Dict]:
        """Get popular books for new users"""
        cursor.execute("""
            SELECT 
                b.id as book_id,
                b.title,
                b.author,
                b.category,
                b.price,
                b.image_url,
                COALESCE(b.avg_rating, 0) as avg_rating,
                COALESCE(b.total_reviews, 0) as total_reviews,
                COUNT(oi.id) as order_count
            FROM books b
            LEFT JOIN order_items oi ON b.id = oi.book_id
            WHERE b.avg_rating >= 4.0
            GROUP BY b.id
            ORDER BY order_count DESC, b.avg_rating DESC
            LIMIT %s
        """, (limit,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def save_user_preferences(
        self,
        user_id: int,
        favorite_categories: Optional[List[str]] = None,
        reading_interests: Optional[List[str]] = None,
        price_range_min: Optional[float] = None,
        price_range_max: Optional[float] = None,
        preferred_authors: Optional[List[str]] = None
    ) -> bool:
        """Save or update user preferences"""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO user_preferences 
                        (user_id, favorite_categories, reading_interests, 
                         price_range_min, price_range_max, preferred_authors)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (user_id) 
                        DO UPDATE SET
                            favorite_categories = COALESCE(EXCLUDED.favorite_categories, user_preferences.favorite_categories),
                            reading_interests = COALESCE(EXCLUDED.reading_interests, user_preferences.reading_interests),
                            price_range_min = COALESCE(EXCLUDED.price_range_min, user_preferences.price_range_min),
                            price_range_max = COALESCE(EXCLUDED.price_range_max, user_preferences.price_range_max),
                            preferred_authors = COALESCE(EXCLUDED.preferred_authors, user_preferences.preferred_authors),
                            updated_at = NOW()
                    """, (
                        user_id,
                        favorite_categories,
                        reading_interests,
                        price_range_min,
                        price_range_max,
                        preferred_authors
                    ))
                    conn.commit()
                    logger.info(f"Saved preferences for user {user_id}")
                    return True
        except Exception as e:
            logger.error(f"Error saving user preferences: {e}")
            return False


# Global instance
recommendation_service = RecommendationService()
