"""
Review Analysis Service
Analyzes book reviews using AI for sentiment and insights
"""

import psycopg2
from psycopg2.extras import RealDictCursor, Json
from typing import List, Dict, Optional
from app.core.config import settings
from app.services.embedder import embedder
from app.services.llm_client import llm_client
import logging

logger = logging.getLogger(__name__)


class ReviewAnalysisService:
    """Service for analyzing book reviews"""
    
    def __init__(self):
        self.dsn = settings.PG_DSN
    
    def _get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.dsn)
    
    async def analyze_book_reviews(
        self,
        book_id: int
    ) -> Dict:
        """
        Analyze all reviews for a book
        
        Returns:
            - Overall sentiment
            - Sentiment distribution
            - Key topics/themes
            - Pros and cons
            - Summary
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get all reviews
                    cur.execute("""
                        SELECT 
                            r.id,
                            r.rating,
                            r.comment,
                            r.created_at,
                            u.username
                        FROM reviews r
                        JOIN users u ON r.user_id = u.id
                        WHERE r.book_id = %s
                        ORDER BY r.created_at DESC
                    """, (book_id,))
                    
                    reviews = [dict(row) for row in cur.fetchall()]
                    
                    if not reviews:
                        return {
                            "book_id": book_id,
                            "total_reviews": 0,
                            "message": "Chưa có đánh giá nào"
                        }
                    
                    # Analyze sentiments
                    sentiments = await self._analyze_sentiments(reviews)
                    
                    # Generate summary
                    summary = await self._generate_review_summary(reviews)
                    
                    # Extract key points
                    key_points = await self._extract_key_points(reviews)
                    
                    return {
                        "book_id": book_id,
                        "total_reviews": len(reviews),
                        "sentiment_distribution": sentiments,
                        "summary": summary,
                        "pros": key_points.get("pros", []),
                        "cons": key_points.get("cons", []),
                        "key_themes": key_points.get("themes", [])
                    }
                    
        except Exception as e:
            logger.error(f"Error analyzing reviews: {e}")
            raise
    
    async def _analyze_sentiments(
        self,
        reviews: List[Dict]
    ) -> Dict:
        """Analyze sentiment of reviews"""
        sentiments = {
            "positive": 0,
            "neutral": 0,
            "negative": 0
        }
        
        for review in reviews:
            rating = review.get('rating', 0)
            
            # Simple sentiment based on rating
            if rating >= 4:
                sentiments["positive"] += 1
            elif rating >= 3:
                sentiments["neutral"] += 1
            else:
                sentiments["negative"] += 1
        
        total = len(reviews)
        return {
            "positive": round(sentiments["positive"] / total * 100, 1),
            "neutral": round(sentiments["neutral"] / total * 100, 1),
            "negative": round(sentiments["negative"] / total * 100, 1),
            "counts": sentiments
        }
    
    async def _generate_review_summary(
        self,
        reviews: List[Dict]
    ) -> str:
        """Generate AI summary of reviews"""
        try:
            # Take top 10 most recent reviews
            review_texts = [
                f"Rating {r['rating']}/5: {r['comment']}" 
                for r in reviews[:10] 
                if r.get('comment')
            ]
            
            if not review_texts:
                return "Các đánh giá chưa có nhận xét chi tiết."
            
            prompt = f"""Phân tích các đánh giá sách sau và tóm tắt ngắn gọn (2-3 câu) về ý kiến chung của độc giả:

{chr(10).join(review_texts)}

Yêu cầu:
- Viết bằng tiếng Việt
- Tóm tắt ngắn gọn, khách quan
- Nêu ý kiến chung (positive/negative)
- Không nêu tên người đánh giá"""

            summary = await llm_client.chat([
                {"role": "user", "content": prompt}
            ])
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Không thể tạo tóm tắt đánh giá."
    
    async def _extract_key_points(
        self,
        reviews: List[Dict]
    ) -> Dict:
        """Extract pros, cons, and themes from reviews"""
        try:
            review_texts = [
                f"Rating {r['rating']}/5: {r['comment']}" 
                for r in reviews[:15] 
                if r.get('comment')
            ]
            
            if not review_texts:
                return {"pros": [], "cons": [], "themes": []}
            
            prompt = f"""Phân tích các đánh giá sách sau và trích xuất:

{chr(10).join(review_texts)}

Trả về JSON format:
{{
  "pros": ["ưu điểm 1", "ưu điểm 2", "ưu điểm 3"],
  "cons": ["nhược điểm 1", "nhược điểm 2"],
  "themes": ["chủ đề 1", "chủ đề 2", "chủ đề 3"]
}}

Yêu cầu:
- Viết bằng tiếng Việt
- Mỗi mục ngắn gọn (5-10 từ)
- Tối đa 3 pros, 2 cons, 3 themes
- Chỉ trả về JSON, không giải thích"""

            response = await llm_client.chat([
                {"role": "user", "content": prompt}
            ])
            
            # Parse JSON response
            import json
            try:
                key_points = json.loads(response)
                return key_points
            except:
                # Fallback
                return {
                    "pros": ["Nội dung chất lượng", "Dễ hiểu"],
                    "cons": ["Cần cải thiện"],
                    "themes": ["Kiến thức hữu ích"]
                }
                
        except Exception as e:
            logger.error(f"Error extracting key points: {e}")
            return {"pros": [], "cons": [], "themes": []}
    
    def store_review_embedding(
        self,
        review_id: int,
        book_id: int,
        review_text: str
    ) -> bool:
        """Store review embedding for future analysis"""
        try:
            # Generate embedding
            embeddings = embedder.encode([review_text])
            if not embeddings:
                return False
            
            embedding = embeddings[0]
            
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO review_vectors 
                        (review_id, book_id, review_text, embedding)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (review_id) 
                        DO UPDATE SET
                            review_text = EXCLUDED.review_text,
                            embedding = EXCLUDED.embedding
                    """, (
                        review_id,
                        book_id,
                        review_text,
                        embedding
                    ))
                    conn.commit()
                    logger.info(f"Stored embedding for review {review_id}")
                    return True
                    
        except Exception as e:
            logger.error(f"Error storing review embedding: {e}")
            return False


# Global instance
review_analysis_service = ReviewAnalysisService()
