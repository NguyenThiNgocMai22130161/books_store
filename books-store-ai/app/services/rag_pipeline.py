"""
RAG Pipeline
Retrieval-Augmented Generation for book recommendations
"""

from typing import List, Dict, Optional
import logging
from app.services.retriever import retriever, SearchResult
from app.services.llm_client import llm_client

logger = logging.getLogger(__name__)


class RAGPipeline:
    """
    RAG pipeline for answering questions about books
    """
    
    def __init__(self):
        """Initialize RAG pipeline"""
        logger.info("[OK] RAG pipeline initialized")
    
    def answer(
        self,
        question: str,
        context_books: Optional[List[SearchResult]] = None,
        category: Optional[str] = None
    ) -> Dict:
        """
        Answer a question using RAG
        
        Args:
            question: User's question
            context_books: Optional pre-fetched books (if None, will search)
            category: Optional category filter
            
        Returns:
            Dict with 'answer' and 'sources'
        """
        try:
            # Step 0: Check for greeting messages
            intent = self._classify_intent(question)
            if intent == 'greeting':
                return {
                    'answer': "Xin chào!  Tôi là trợ lý AI của Books Store. Tôi có thể giúp bạn:\n\n"
                             "[OK] Tìm sách phù hợp với sở thích\n"
                             "[OK] Gợi ý sách hay theo chủ đề\n"
                             "[OK] So sánh các đầu sách\n"
                             "💰 Tư vấn sách theo ngân sách\n\n"
                             "Bạn đang tìm loại sách nào ạ?",
                    'sources': [],
                    'intent': 'greeting'
                }
            
            # Step 1: Retrieve relevant books if not provided
            if context_books is None:
                logger.info(f"[OK] Retrieving context for: {question[:50]}...")
                context_books = retriever.search(
                    query=question,
                    category=category,
                    top_k=5
                )
            
            if not context_books:
                return {
                    'answer': "Xin lỗi, tôi không tìm thấy thông tin về sách bạn đang tìm kiếm. Bạn có thể thử cách diễn đạt khác không?",
                    'sources': [],
                    'intent': 'no_results'
                }
            
            # Step 2: Build context from books
            context = self._build_context(context_books)
            
            # Step 3: Build prompt
            prompt = self._build_prompt(question, context)
            
            # Step 4: Generate answer
            logger.info("[OK] Generating answer...")
            answer = llm_client.generate(prompt)
            
            # Step 5: Extract sources
            sources = [
                {
                    'book_id': book.book_id,
                    'title': book.title,
                    'author': book.author,
                    'price': book.price,
                    'score': book.score
                }
                for book in context_books[:3]  # Top 3 sources
            ]
            
            logger.info("[OK] Answer generated successfully")
            
            return {
                'answer': answer,
                'sources': sources,
                'intent': self._classify_intent(question)
            }
            
        except Exception as e:
            logger.error(f"[OK] RAG error: {str(e)}")
            return {
                'answer': "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
                'sources': [],
                'intent': 'error'
            }
    
    def _build_context(self, books: List[SearchResult]) -> str:
        """
        Build context string from search results
        
        Args:
            books: List of search results
            
        Returns:
            Formatted context string
        """
        context_parts = []
        
        for i, book in enumerate(books[:5], 1):  # Top 5 books
            context_parts.append(
                f"[OK] Sách {i}: {book.title}\n"
                f"   Tác giả: {book.author}\n"
                f"   Thể loại: {book.category}\n"
                f"   Giá: {book.price:,.0f}đ\n"
                f"   Mô tả: {book.description[:200] if book.description else 'Không có mô tả'}...\n"
            )
        
        return "\n".join(context_parts)
    
    def _build_prompt(self, question: str, context: str) -> str:
        """
        Build complete prompt for LLM
        
        Args:
            question: User's question
            context: Context from retrieved books
            
        Returns:
            Complete prompt
        """
        prompt = f"""Bạn là trợ lý AI chuyên tư vấn sách tại cửa hàng Books Store.

NHIỆM VỤ:
- Tư vấn sách phù hợp với nhu cầu của khách hàng
- Trả lời câu hỏi về sách dựa trên thông tin được cung cấp
- Gợi ý sách dựa trên nội dung, tác giả, thể loại, giá cả
- So sánh các đầu sách khi được yêu cầu

NGUYÊN TẮC QUAN TRỌNG:
1. CHỈ sử dụng thông tin từ danh sách sách được cung cấp bên dưới
2. KHÔNG bịa đặt hoặc thêm thông tin không có trong danh sách
3. Nếu không tìm thấy thông tin phù hợp → nói thẳng "Tôi không tìm thấy..."
4. Trả lời ngắn gọn, thân thiện, dễ hiểu
5. Luôn kèm giá sách khi đề xuất
6. Trả lời bằng tiếng Việt

DANH SÁCH SÁCH LIÊN QUAN:
{context}

CÂU HỎI CỦA KHÁCH HÀNG:
{question}

HÃY TRẢ LỜI:"""

        return prompt
    
    def _classify_intent(self, question: str) -> str:
        """
        Classify user intent (simple keyword-based)
        
        Args:
            question: User's question
            
        Returns:
            Intent category
        """
        question_lower = question.lower()
        
        # Greeting
        if any(word in question_lower for word in ['xin chào', 'hello', 'hi', 'chào']):
            return 'greeting'
        
        # Search
        if any(word in question_lower for word in ['tìm', 'có', 'sách nào', 'gợi ý', 'recommend']):
            return 'search'
        
        # Comparison
        if any(word in question_lower for word in ['so sánh', 'khác', 'giống', 'compare']):
            return 'comparison'
        
        # Question
        if any(word in question_lower for word in ['là gì', 'tại sao', 'như thế nào', 'what', 'why', 'how']):
            return 'question'
        
        return 'general'


# Global RAG pipeline instance
rag_pipeline = RAGPipeline()
