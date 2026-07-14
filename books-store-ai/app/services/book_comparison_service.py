"""
Book Comparison Service
Compare two books based on various attributes
"""

from typing import Dict, Optional, Tuple, List
from app.services.retriever import retriever
from app.clients.backend_client import backend_client
import logging
import re

logger = logging.getLogger(__name__)


class BookComparisonService:
    """
    Service for comparing two books
    """
    
    def __init__(self):
        """Initialize comparison service"""
        pass
    
    async def find_books_for_comparison(
        self,
        title1: str,
        title2: str
    ) -> Tuple[Optional[Dict], Optional[Dict]]:
        """
        Find two different books by their titles using separate searches
        
        Strategy:
        1. Search each title separately (not together)
        2. Find best title match for each
        3. Ensure different book_ids
        4. Fetch full details from backend
        
        Args:
            title1: First book title (cleaned)
            title2: Second book title (cleaned)
            
        Returns:
            Tuple of (book1_dict, book2_dict) or (None, None) if not found
        """
        try:
            logger.info(f"[OK] Finding books for comparison: '{title1}' vs '{title2}'")
            
            # Search for first book separately
            results1 = retriever.search(query=title1, top_k=5)
            book1_id = None
            book1_title_match = None
            
            if results1:
                # Find best title match for title1
                best_match = self._select_best_match(results1, title1)
                if best_match:
                    book1_id = best_match.book_id
                    book1_title_match = best_match.title
                    logger.info(f"[OK] Found book1: {book1_title_match} (ID: {book1_id})")
            
            # Search for second book separately
            results2 = retriever.search(query=title2, top_k=5)
            book2_id = None
            book2_title_match = None
            
            if results2:
                # Find best title match for title2 (excluding book1)
                for result in results2:
                    # Skip if same as book1
                    if book1_id and result.book_id == book1_id:
                        continue
                    
                    if self._is_title_match(result.title, title2):
                        book2_id = result.book_id
                        book2_title_match = result.title
                        logger.info(f"[OK] Found book2: {book2_title_match} (ID: {book2_id})")
                        break
                
                # If no exact match, use first result that's not book1
                if not book2_id and results2:
                    for result in results2:
                        if not book1_id or result.book_id != book1_id:
                            book2_id = result.book_id
                            book2_title_match = result.title
                            logger.info(f"[OK] Using fallback book2: {book2_title_match} (ID: {book2_id})")
                            break
            
            # Fetch full book details from backend
            book1 = None
            book2 = None
            
            if book1_id:
                book1 = await backend_client.get_book_by_id(book1_id)
                if not book1:
                    logger.warning(f"[WARN] Book ID {book1_id} not found in backend")
            
            if book2_id:
                book2 = await backend_client.get_book_by_id(book2_id)
                if not book2:
                    logger.warning(f"[WARN] Book ID {book2_id} not found in backend")
            
            # Final safety check
            if book1 and book2 and book1.get('id') == book2.get('id'):
                logger.error(f"[ERROR] Same book returned for both: {book1.get('title')}")
                return (book1, None)
            
            if not book1:
                logger.warning(f"[WARN] Could not find book matching: '{title1}'")
            if not book2:
                logger.warning(f"[WARN] Could not find book matching: '{title2}'")
            
            return (book1, book2)
            
        except Exception as e:
            logger.error(f"[ERROR] Error finding books for comparison: {str(e)}")
            return (None, None)
    
    def _select_best_match(self, results: List, requested_title: str):
        """
        Select best matching book from search results
        
        Priority:
        1. Exact match (normalized)
        2. Requested title contained in candidate
        3. Candidate contained in requested
        4. Highest score
        
        Args:
            results: List of SearchResult objects
            requested_title: The title user requested
            
        Returns:
            Best matching SearchResult or None
        """
        if not results:
            return None
        
        requested_norm = self._normalize_title(requested_title)
        
        # Priority 1: Exact match
        for result in results:
            if self._normalize_title(result.title) == requested_norm:
                return result
        
        # Priority 2: High overlap match
        for result in results:
            if self._is_title_match(result.title, requested_title):
                return result
        
        # Priority 3: Return highest score
        return results[0]
    
    def _normalize_title(self, title: str) -> str:
        """
        Normalize title for comparison
        
        Args:
            title: Book title
            
        Returns:
            Normalized title (lowercase, no extra spaces/punctuation)
        """
        import unicodedata
        
        # Lowercase
        title = title.lower()
        
        # Vietnamese character mapping for undecomposable characters
        vietnamese_map = {
            'đ': 'd', 'Đ': 'd',
            'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
            'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
            'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
            'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
            'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
            'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
            'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
            'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
            'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
            'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
            'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
            'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        }
        
        # Replace Vietnamese characters
        for viet_char, latin_char in vietnamese_map.items():
            title = title.replace(viet_char, latin_char)
        
        # Try unicode normalization for any remaining accents
        try:
            title = unicodedata.normalize('NFKD', title)
            title = ''.join([c for c in title if not unicodedata.combining(c)])
        except:
            pass
        
        # Remove punctuation
        title = re.sub(r'[^\w\s]', ' ', title)
        
        # Normalize whitespace
        title = re.sub(r'\s+', ' ', title).strip()
        
        return title
    
    def _is_title_match(self, actual_title: str, search_title: str) -> bool:
        """
        Check if titles match (fuzzy)
        
        Args:
            actual_title: Actual book title
            search_title: Search query
            
        Returns:
            True if match
        """
        actual_lower = actual_title.lower()
        search_lower = search_title.lower()
        
        # Exact match
        if actual_lower == search_lower:
            return True
        
        # Search term is in title
        if search_lower in actual_lower:
            return True
        
        # Title is in search term (for long search queries)
        if actual_lower in search_lower:
            return True
        
        # Word overlap (at least 60%)
        actual_words = set(actual_lower.split())
        search_words = set(search_lower.split())
        
        if not search_words:
            return False
        
        overlap = len(actual_words & search_words)
        overlap_ratio = overlap / len(search_words)
        
        return overlap_ratio >= 0.6
    
    def compare_attributes(
        self,
        book1: Dict,
        book2: Dict,
        attribute: str
    ) -> str:
        """
        Compare specific attribute between two books
        
        Args:
            book1: First book
            book2: Second book
            attribute: Attribute to compare ('price', 'category', 'author', etc)
            
        Returns:
            Comparison result string
        """
        from app.utils.text_utils import safe_get, format_price
        
        title1 = safe_get(book1, 'title', default='Sách 1')
        title2 = safe_get(book2, 'title', default='Sách 2')
        
        if attribute == 'price':
            price1 = safe_get(book1, 'price', default=0)
            price2 = safe_get(book2, 'price', default=0)
            
            if price1 < price2:
                diff = price2 - price1
                return f"**{title1}** rẻ hơn {format_price(diff)} so với **{title2}**"
            elif price2 < price1:
                diff = price1 - price2
                return f"**{title2}** rẻ hơn {format_price(diff)} so với **{title1}**"
            else:
                return f"Hai cuốn có cùng mức giá: {format_price(price1)}"
        
        elif attribute == 'category':
            cat1 = safe_get(book1, 'category', default='Chưa rõ')
            cat2 = safe_get(book2, 'category', default='Chưa rõ')
            
            if cat1 == cat2:
                return f"Cả hai đều thuộc thể loại **{cat1}**"
            else:
                return f"**{title1}** thuộc thể loại **{cat1}**, còn **{title2}** thuộc **{cat2}**"
        
        elif attribute == 'author':
            author1 = safe_get(book1, 'author', default='Chưa rõ')
            author2 = safe_get(book2, 'author', default='Chưa rõ')
            
            if author1 == author2:
                return f"Cả hai đều được viết bởi **{author1}**"
            else:
                return f"**{title1}** được viết bởi **{author1}**, còn **{title2}** được viết bởi **{author2}**"
        
        elif attribute == 'length':
            # Note: This requires pageCount field which may not exist
            pages1 = safe_get(book1, 'pageCount', 'pages', 'numberOfPages')
            pages2 = safe_get(book2, 'pageCount', 'pages', 'numberOfPages')
            
            if pages1 and pages2:
                if pages1 < pages2:
                    return f"**{title1}** ngắn hơn ({pages1} trang so với {pages2} trang)"
                elif pages2 < pages1:
                    return f"**{title2}** ngắn hơn ({pages2} trang so với {pages1} trang)"
                else:
                    return f"Cả hai có cùng số trang: {pages1}"
            else:
                return "Không có thông tin về số trang"
        
        return f"Không thể so sánh {attribute}"
    
    def determine_better_for_beginner(
        self,
        book1: Dict,
        book2: Dict
    ) -> str:
        """
        Determine which book is better for beginners
        Based on description keywords
        
        Args:
            book1: First book
            book2: Second book
            
        Returns:
            Recommendation string
        """
        from app.utils.text_utils import safe_get
        
        desc1 = safe_get(book1, 'description', default='').lower()
        desc2 = safe_get(book2, 'description', default='').lower()
        
        beginner_keywords = [
            'người mới', 'cơ bản', 'nhập môn', 'beginner',
            'dễ hiểu', 'dễ đọc', 'từ đầu', 'basic'
        ]
        
        score1 = sum(1 for kw in beginner_keywords if kw in desc1)
        score2 = sum(1 for kw in beginner_keywords if kw in desc2)
        
        title1 = safe_get(book1, 'title', default='Sách 1')
        title2 = safe_get(book2, 'title', default='Sách 2')
        
        if score1 > score2:
            return f"**{title1}** có vẻ phù hợp với người mới bắt đầu hơn"
        elif score2 > score1:
            return f"**{title2}** có vẻ phù hợp với người mới bắt đầu hơn"
        else:
            return "Cả hai cuốn đều có thể phù hợp với người mới. Hãy đọc mô tả chi tiết để quyết định."


# Global instance
book_comparison_service = BookComparisonService()
