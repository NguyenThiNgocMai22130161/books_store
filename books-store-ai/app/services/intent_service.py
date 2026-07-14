"""
Intent Detection Service
Detect user intent with priority-based matching and entity extraction
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional
from app.utils.text_utils import normalize_text, contains_any_phrase
from app.utils.entity_extractor import extract_entities
from app.utils.price_parser import parse_price_range, has_budget_mention


# Intent constants
class Intent:
    # Conversation
    GREETING = "greeting"
    IDENTITY = "identity"
    HELP = "help"
    THANKS = "thanks"
    GOODBYE = "goodbye"
    CASUAL = "casual"
    
    # Book information
    BOOK_PRICE = "book_price"
    BOOK_AUTHOR = "book_author"
    BOOK_CATEGORY = "book_category"
    BOOK_SUMMARY = "book_summary"
    BOOK_AUDIENCE = "book_audience"
    BOOK_REASON = "book_reason"
    BOOK_STOCK = "book_stock"
    BOOK_DETAILS = "book_details"
    SIMILAR_BOOKS = "similar_books"
    
    # Search & Recommendation
    SEARCH_BOOK = "search_book"
    RECOMMEND_BY_CATEGORY = "recommend_by_category"
    RECOMMEND_BY_BUDGET = "recommend_by_budget"
    RECOMMEND_BY_AGE = "recommend_by_age"
    RECOMMEND_BY_PURPOSE = "recommend_by_purpose"
    RECOMMEND_AS_GIFT = "recommend_as_gift"
    
    # Comparison
    COMPARE_BOOKS = "compare_books"
    
    # Order management
    ORDER_STATUS = "order_status"
    ORDER_CANCEL = "order_cancel"
    ORDER_ISSUE = "order_issue"
    
    # General
    GENERAL = "general"


@dataclass
class IntentResult:
    """Result of intent detection"""
    intent: str
    confidence: float
    entities: Dict[str, Any]
    requires_book_context: bool = False
    requires_user_auth: bool = False


class IntentService:
    """
    Intent detection service with priority-based matching
    """
    
    def __init__(self):
        """Initialize intent service"""
        pass
    
    def detect_intent(
        self,
        message: str,
        has_book_context: bool = False,
        has_user_auth: bool = False
    ) -> IntentResult:
        """
        Detect intent from user message
        
        Priority order:
        1. Book-specific questions (when has_book_context)
        2. Order-related intents (when has_user_auth)
        3. Comparison intent
        4. Recommendation intents
        5. Conversational intents
        6. General fallback
        
        Args:
            message: User message
            has_book_context: Whether request has book_id
            has_user_auth: Whether user is authenticated
            
        Returns:
            IntentResult with intent, confidence, and entities
        """
        message_normalized = normalize_text(message)
        entities = extract_entities(message)
        
        # Extract price range if mentioned
        min_price, max_price = parse_price_range(message)
        if min_price or max_price:
            entities['min_price'] = min_price
            entities['max_price'] = max_price
        
        # Priority 1: Book-specific questions (only when has_book_context)
        if has_book_context:
            result = self._detect_book_specific_intent(message_normalized, entities)
            if result:
                return result
        
        # Priority 2: Order-related intents
        result = self._detect_order_intent(message_normalized, entities, has_user_auth)
        if result:
            return result
        
        # Priority 3: Comparison intent (before search to avoid false positives)
        result = self._detect_comparison_intent(message_normalized, message, entities)
        if result:
            return result
        
        # Priority 4: Recommendation intents
        result = self._detect_recommendation_intent(message_normalized, entities)
        if result:
            return result
        
        # Priority 5: Conversational intents
        result = self._detect_conversational_intent(message_normalized, message, entities)
        if result:
            return result
        
        # Priority 6: General search or question
        return IntentResult(
            intent=Intent.GENERAL,
            confidence=0.5,
            entities=entities,
            requires_book_context=False,
            requires_user_auth=False
        )
    
    def _detect_book_specific_intent(
        self,
        message: str,
        entities: Dict
    ) -> Optional[IntentResult]:
        """Detect intents specific to current book context"""
        
        # Similar books
        if contains_any_phrase(message, [
            'tương tự', 'giống', 'liên quan', 'similar'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.SIMILAR_BOOKS,
                confidence=0.95,
                entities=entities,
                requires_book_context=True
            )
        
        # Stock availability
        if contains_any_phrase(message, [
            'còn hàng', 'hết hàng', 'tồn kho', 'còn không',
            'còn bao nhiêu', 'available', 'in stock'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.BOOK_STOCK,
                confidence=0.95,
                entities=entities,
                requires_book_context=True
            )
        
        # Book summary/content
        if contains_any_phrase(message, [
            'nói về gì', 'kể về gì', 'nội dung', 'tóm tắt',
            'sách này là gì', 'about what', 'summary'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.BOOK_SUMMARY,
                confidence=0.95,
                entities=entities,
                requires_book_context=True
            )
        
        # Audience suitability
        if contains_any_phrase(message, [
            'người mới', 'phù hợp', 'dành cho', 'ai nên đọc',
            'beginner', 'suitable for', 'dễ đọc', 'khó đọc'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.BOOK_AUDIENCE,
                confidence=0.90,
                entities=entities,
                requires_book_context=True
            )
        
        # Why should read
        if contains_any_phrase(message, [
            'tại sao nên', 'vì sao nên', 'có nên', 'đáng đọc',
            'why should', 'worth reading'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.BOOK_REASON,
                confidence=0.90,
                entities=entities,
                requires_book_context=True
            )
        
        # Author
        if contains_any_phrase(message, [
            'tác giả', 'ai viết', 'người viết', 'author', 'writer'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.BOOK_AUTHOR,
                confidence=0.95,
                entities=entities,
                requires_book_context=True
            )
        
        # Price (only when asking about current book)
        if contains_any_phrase(message, [
            'giá', 'bao nhiêu tiền', 'price', 'cost', 'mắc không', 'rẻ không'
        ], word_boundary=True) and 'này' in message:
            return IntentResult(
                intent=Intent.BOOK_PRICE,
                confidence=0.95,
                entities=entities,
                requires_book_context=True
            )
        
        # Category
        if contains_any_phrase(message, [
            'thể loại', 'category', 'genre', 'loại sách'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.BOOK_CATEGORY,
                confidence=0.90,
                entities=entities,
                requires_book_context=True
            )
        
        return None
    
    def _detect_order_intent(
        self,
        message: str,
        entities: Dict,
        has_user_auth: bool
    ) -> Optional[IntentResult]:
        """Detect order-related intents"""
        
        # Order status
        if contains_any_phrase(message, [
            'đơn hàng', 'đơn của tôi', 'kiểm tra đơn', 'order',
            'đơn đang ở đâu', 'giao chưa', 'đã giao chưa'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.ORDER_STATUS,
                confidence=0.95,
                entities=entities,
                requires_user_auth=True
            )
        
        # Cancel order
        if contains_any_phrase(message, [
            'hủy đơn', 'cancel order', 'không muốn', 'đổi ý'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.ORDER_CANCEL,
                confidence=0.95,
                entities=entities,
                requires_user_auth=True
            )
        
        # Order issues
        if contains_any_phrase(message, [
            'nhận sai', 'sai sách', 'bị rách', 'hư hỏng',
            'chưa nhận', 'hoàn tiền', 'refund', 'complaint'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.ORDER_ISSUE,
                confidence=0.90,
                entities=entities,
                requires_user_auth=True
            )
        
        return None
    
    def _detect_comparison_intent(
        self,
        message: str,
        original_message: str,
        entities: Dict
    ) -> Optional[IntentResult]:
        """Detect book comparison intent"""
        
        # Try to extract book titles first
        from app.utils.text_utils import extract_book_titles
        titles = extract_book_titles(original_message)
        if len(titles) == 2:
            entities['book_titles'] = titles
        
        # Strong comparison indicators
        if contains_any_phrase(message, [
            'so sánh', 'compare', 'khác nhau', 'giống nhau'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.COMPARE_BOOKS,
                confidence=0.95,
                entities=entities
            )
        
        # "A với B" or "A và B" pattern (but not simple search)
        if ' với ' in message or ' và ' in message:
            # If we successfully extracted 2 titles, it's a comparison
            if len(titles) == 2:
                return IntentResult(
                    intent=Intent.COMPARE_BOOKS,
                    confidence=0.85,
                    entities=entities
                )
        
        # "cuốn nào" questions (requires previous comparison context)
        if contains_any_phrase(message, [
            'cuốn nào', 'quyển nào', 'which one', 'nên chọn'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.COMPARE_BOOKS,
                confidence=0.70,
                entities=entities
            )
        
        return None
    
    def _detect_recommendation_intent(
        self,
        message: str,
        entities: Dict
    ) -> Optional[IntentResult]:
        """Detect recommendation intents"""
        
        # Gift recommendation
        if contains_any_phrase(message, [
            'làm quà', 'tặng', 'quà sinh nhật', 'biếu', 'gift'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.RECOMMEND_AS_GIFT,
                confidence=0.95,
                entities=entities
            )
        
        # Age-based recommendation (must check age entity)
        if entities.get('age') or contains_any_phrase(message, [
            'thiếu nhi', 'trẻ em', 'học sinh', 'sinh viên'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.RECOMMEND_BY_AGE,
                confidence=0.90,
                entities=entities
            )
        
        # Budget-based recommendation
        if has_budget_mention(message):
            return IntentResult(
                intent=Intent.RECOMMEND_BY_BUDGET,
                confidence=0.90,
                entities=entities
            )
        
        # Purpose-based recommendation
        if entities.get('purpose'):
            return IntentResult(
                intent=Intent.RECOMMEND_BY_PURPOSE,
                confidence=0.85,
                entities=entities
            )
        
        # Category recommendation or search
        if contains_any_phrase(message, [
            'gợi ý', 'tư vấn', 'recommend', 'suggest', 'nên đọc'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.RECOMMEND_BY_CATEGORY,
                confidence=0.85,
                entities=entities
            )
        
        # General search
        if contains_any_phrase(message, [
            'tìm sách', 'tìm kiếm', 'search', 'find book', 'có sách'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.SEARCH_BOOK,
                confidence=0.90,
                entities=entities
            )
        
        return None
    
    def _detect_conversational_intent(
        self,
        message: str,
        original_message: str,
        entities: Dict
    ) -> Optional[IntentResult]:
        """Detect conversational intents"""
        
        # Greeting (must be standalone or at start)
        if contains_any_phrase(message, [
            'xin chào', 'chào bạn', 'hello', 'hi there', 'hey there'
        ], word_boundary=True):
            # But NOT if it's part of a longer query about books
            if len(message.split()) <= 3:
                return IntentResult(
                    intent=Intent.GREETING,
                    confidence=0.95,
                    entities=entities
                )
        
        # Simple "hi" or "hey" standalone
        if message in ['hi', 'hey', 'hello', 'chào']:
            return IntentResult(
                intent=Intent.GREETING,
                confidence=0.95,
                entities=entities
            )
        
        # Identity (exclude "Your Name" as book title)
        # Must have question word or "your name" specifically
        if 'what is your name' in message or 'who are you' in message:
            return IntentResult(
                intent=Intent.IDENTITY,
                confidence=0.95,
                entities=entities
            )
        
        if contains_any_phrase(message, [
            'bạn tên gì', 'tên bạn là gì', 'bạn là ai', 'mày là ai'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.IDENTITY,
                confidence=0.95,
                entities=entities
            )
        
        # Help
        if contains_any_phrase(message, [
            'giúp gì', 'làm được gì', 'what can you do',
            'bạn có thể', 'giúp tôi'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.HELP,
                confidence=0.95,
                entities=entities
            )
        
        # Thanks
        if contains_any_phrase(message, [
            'cảm ơn', 'cám ơn', 'thank', 'thanks'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.THANKS,
                confidence=0.95,
                entities=entities
            )
        
        # Goodbye
        if contains_any_phrase(message, [
            'tạm biệt', 'bye', 'goodbye', 'hẹn gặp lại'
        ], word_boundary=True):
            return IntentResult(
                intent=Intent.GOODBYE,
                confidence=0.95,
                entities=entities
            )
        
        # Casual conversation
        if contains_any_phrase(message, [
            'bạn khỏe không', 'how are you', 'thế nào'
        ], word_boundary=False):
            return IntentResult(
                intent=Intent.CASUAL,
                confidence=0.90,
                entities=entities
            )
        
        return None


# Global instance
intent_service = IntentService()
