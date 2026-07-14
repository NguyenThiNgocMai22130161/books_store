"""
Conversation Context Service
Maintain context across conversation turns
"""

from typing import List, Dict, Optional, Any
from app.services.chat_history_service import chat_history_service
import logging

logger = logging.getLogger(__name__)


class ConversationContextService:
    """
    Service to maintain conversation context
    Tracks:
    - Recently mentioned books
    - Comparison context
    - Previous filters (price, category, etc)
    """
    
    def __init__(self):
        """Initialize conversation context service"""
        pass
    
    def get_recent_context(
        self,
        session_id: str,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Get recent conversation context for a session
        
        Args:
            session_id: Session ID
            limit: Number of recent messages to analyze
            
        Returns:
            Context dict with:
            - recent_books: List of book IDs mentioned
            - comparison_books: Tuple of (book1, book2) if in comparison
            - last_category: Last category filter
            - last_price_range: Last price range
        """
        try:
            messages = chat_history_service.get_session_history(
                session_id=session_id,
                limit=limit
            )
            
            context = {
                'recent_books': [],
                'comparison_books': None,
                'last_category': None,
                'last_price_range': None,
                'recent_intents': []
            }
            
            if not messages:
                return context
            
            # Analyze recent messages (reverse chronological order)
            for msg in reversed(messages):
                intent = msg.get('intent')
                sources = msg.get('sources', [])
                
                if intent:
                    context['recent_intents'].append(intent)
                
                # Extract book IDs from sources
                if sources:
                    for source in sources:
                        if isinstance(source, dict) and 'book_id' in source:
                            book_id = source['book_id']
                            if book_id not in context['recent_books']:
                                context['recent_books'].append(book_id)
                
                # Track comparison context
                if intent == 'compare_books' and len(sources) >= 2:
                    if not context['comparison_books']:
                        context['comparison_books'] = (sources[0], sources[1])
            
            # Keep only recent books (max 10)
            context['recent_books'] = context['recent_books'][:10]
            
            return context
            
        except Exception as e:
            logger.warning(f"[WARN] Cannot get conversation context: {str(e)}")
            return {
                'recent_books': [],
                'comparison_books': None,
                'last_category': None,
                'last_price_range': None,
                'recent_intents': []
            }
    
    def resolve_book_reference(
        self,
        reference: str,
        context: Dict[str, Any]
    ) -> Optional[int]:
        """
        Resolve book reference like "cuốn thứ hai", "cuốn đầu"
        
        Args:
            reference: Reference text
            context: Conversation context
            
        Returns:
            Book ID or None
        """
        recent_books = context.get('recent_books', [])
        
        if not recent_books:
            return None
        
        reference_lower = reference.lower()
        
        # "cuốn thứ X" or "quyển thứ X"
        if 'thứ hai' in reference_lower or 'thứ 2' in reference_lower:
            return recent_books[1] if len(recent_books) > 1 else None
        
        if 'thứ ba' in reference_lower or 'thứ 3' in reference_lower:
            return recent_books[2] if len(recent_books) > 2 else None
        
        if 'thứ nhất' in reference_lower or 'thứ 1' in reference_lower or 'đầu' in reference_lower:
            return recent_books[0] if recent_books else None
        
        if 'cuối' in reference_lower:
            return recent_books[-1] if recent_books else None
        
        # "cuốn này" or "quyển này"
        if 'này' in reference_lower:
            return recent_books[0] if recent_books else None
        
        return None
    
    def get_comparison_context(
        self,
        session_id: str
    ) -> Optional[tuple]:
        """
        Get books being compared in current session
        
        Args:
            session_id: Session ID
            
        Returns:
            Tuple of (book1_dict, book2_dict) or None
        """
        context = self.get_recent_context(session_id, limit=5)
        return context.get('comparison_books')
    
    def extract_follow_up_filters(
        self,
        message: str,
        previous_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract filters from follow-up questions
        
        Example:
        Previous: "Gợi ý sách Java"
        Current: "Có cuốn nào dưới 200k không?"
        -> Keep category="Technology", add max_price=200000
        
        Args:
            message: Current message
            previous_context: Previous context
            
        Returns:
            Updated filters
        """
        from app.utils.price_parser import parse_price_range
        from app.utils.entity_extractor import extract_entities
        
        filters = {}
        
        # Get previous category if any
        last_category = previous_context.get('last_category')
        if last_category:
            filters['category'] = last_category
        
        # Parse new price range
        min_price, max_price = parse_price_range(message)
        if min_price or max_price:
            filters['min_price'] = min_price
            filters['max_price'] = max_price
        
        # Extract other entities
        entities = extract_entities(message)
        if entities.get('age'):
            filters['age'] = entities['age']
        
        if entities.get('quantity'):
            filters['quantity'] = entities['quantity']
        
        return filters


# Global instance
conversation_context_service = ConversationContextService()
