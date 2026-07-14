"""
Chat Router - REFACTORED
Main chatbot endpoints with intent-based routing
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
import uuid

from app.models.schemas import (
    ChatRequest, 
    ChatResponse, 
    SearchRequest, 
    SearchResponse,
    SimilarBooksRequest,
    SimilarBooksResponse,
    BookRecommendation
)
from app.services.intent_service import intent_service, Intent
from app.services.rag_pipeline import rag_pipeline
from app.services.retriever import retriever
from app.services.chat_history_service import chat_history_service
from app.services.conversation_context_service import conversation_context_service
from app.services.book_comparison_service import book_comparison_service
from app.services.recommendation_service import recommendation_service
from app.services.review_analysis_service import review_analysis_service
from app.services.cache_service import cache_service
from app.clients.backend_client import backend_client
from app.utils.text_utils import safe_get, format_price, truncate_text
from app.utils.response_builder import (
    build_book_list_response,
    build_book_detail_response,
    build_comparison_response,
    build_order_status_response,
    build_stock_response,
    build_error_response
)

logger = logging.getLogger(__name__)
router = APIRouter()


def save_chat_history(
    session_id: str,
    role: str,
    message: str,
    user_id: Optional[int] = None,
    book_id: Optional[int] = None,
    intent: Optional[str] = None,
    sources: Optional[List] = None
):
    """
    Save message to chat history (non-blocking)
    """
    try:
        chat_history_service.save_message(
            session_id=session_id,
            role=role,
            message=message,
            user_id=user_id,
            book_id=book_id,
            intent=intent,
            sources=sources
        )
    except Exception as e:
        logger.warning(f"[WARN] Failed to save chat history: {str(e)}")


def build_chat_response(
    answer: str,
    sources: List = None,
    intent: str = "general",
    session_id: str = None
) -> ChatResponse:
    """
    Build ChatResponse object
    """
    return ChatResponse(
        answer=answer,
        sources=sources or [],
        intent=intent,
        session_id=session_id
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chatbot endpoint with intent-based routing
    """
    try:
        logger.info(f"[OK] Chat request: {request.message[:50]}...")
        
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Save user message
        save_chat_history(
            session_id=session_id,
            role="user",
            message=request.message,
            user_id=request.user_id,
            book_id=request.book_id
        )
        
        # Get conversation context
        conversation_context = conversation_context_service.get_recent_context(
            session_id=session_id,
            limit=5
        )
        
        # Detect intent
        intent_result = intent_service.detect_intent(
            message=request.message,
            has_book_context=request.book_id is not None,
            has_user_auth=request.user_id is not None
        )
        
        logger.info(f"[OK] Detected intent: {intent_result.intent} (confidence: {intent_result.confidence})")
        
        # Initialize response
        answer = None
        sources = []
        
        # Route to appropriate handler based on intent
        if intent_result.intent == Intent.GREETING:
            answer = handle_greeting()
        
        elif intent_result.intent == Intent.IDENTITY:
            answer = handle_identity()
        
        elif intent_result.intent == Intent.HELP:
            answer = handle_help()
        
        elif intent_result.intent == Intent.THANKS:
            answer = handle_thanks()
        
        elif intent_result.intent == Intent.GOODBYE:
            answer = handle_goodbye()
        
        elif intent_result.intent == Intent.CASUAL:
            answer = handle_casual()
        
        # Book-specific intents (requires book_id)
        elif intent_result.requires_book_context:
            if not request.book_id:
                answer = "Bạn đang hỏi về sách nào? Vui lòng chọn một cuốn sách cụ thể."
            else:
                answer, sources = await handle_book_specific_intent(
                    intent_result=intent_result,
                    book_id=request.book_id,
                    message=request.message
                )
        
        # Order intents (requires user authentication)
        elif intent_result.requires_user_auth:
            if not request.user_id:
                answer = "Bạn cần đăng nhập để xem thông tin đơn hàng. Vui lòng đăng nhập và thử lại."
            else:
                answer, sources = await handle_order_intent(
                    intent_result=intent_result,
                    user_id=request.user_id,
                    message=request.message
                )
        
        # Comparison intent
        elif intent_result.intent == Intent.COMPARE_BOOKS:
            answer, sources = await handle_comparison_intent(
                intent_result=intent_result,
                message=request.message,
                conversation_context=conversation_context
            )
        
        # Recommendation/Search intents
        elif intent_result.intent in [
            Intent.SEARCH_BOOK,
            Intent.RECOMMEND_BY_CATEGORY,
            Intent.RECOMMEND_BY_BUDGET,
            Intent.RECOMMEND_BY_AGE,
            Intent.RECOMMEND_BY_PURPOSE,
            Intent.RECOMMEND_AS_GIFT
        ]:
            answer, sources = await handle_recommendation_intent(
                intent_result=intent_result,
                message=request.message,
                category=request.category
            )
        
        # General fallback - use RAG
        else:
            answer, sources = await handle_general_query(
                message=request.message,
                category=request.category,
                book_id=request.book_id
            )
        
        # Build response
        response = build_chat_response(
            answer=answer,
            sources=sources,
            intent=intent_result.intent,
            session_id=session_id
        )
        
        # Save assistant message
        save_chat_history(
            session_id=session_id,
            role="assistant",
            message=answer,
            user_id=request.user_id,
            book_id=request.book_id,
            intent=intent_result.intent,
            sources=[s.dict() if hasattr(s, 'dict') else s for s in sources]
        )
        
        logger.info(f"[OK] Chat response generated with {len(sources)} sources")
        return response
        
    except Exception as e:
        logger.error(f"[ERROR] Chat error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Không thể xử lý yêu cầu lúc này.")


# ============================================================================
# CONVERSATIONAL HANDLERS
# ============================================================================

def handle_greeting() -> str:
    """Handle greeting intent"""
    return """Xin chào! Tôi là trợ lý AI của Books Store. Tôi có thể giúp bạn:

📚 Tìm sách phù hợp với sở thích
💡 Gợi ý sách hay theo chủ đề
⚖️ So sánh các đầu sách
💰 Tư vấn sách theo ngân sách
⭐ Đánh giá và review sách

Bạn đang tìm loại sách nào ạ?"""


def handle_identity() -> str:
    """Handle identity question"""
    return """Tôi là trợ lý AI của Books Store. Tôi có thể giúp bạn:
- Tìm sách phù hợp
- Gợi ý sách theo nhu cầu
- Trả lời câu hỏi về sách
- So sánh và tư vấn sách

Hãy hỏi tôi bất cứ điều gì về sách nhé! 😊"""


def handle_help() -> str:
    """Handle help request"""
    return """Tôi có thể giúp bạn:

1️⃣ **Tìm sách theo chủ đề**: "Tìm sách về lập trình"
2️⃣ **Gợi ý sách hay**: "Gợi ý sách kinh doanh hay nhất"
3️⃣ **So sánh sách**: "So sánh Atomic Habits và Deep Work"
4️⃣ **Tư vấn theo giá**: "Sách dưới 200k về tâm lý học"
5️⃣ **Giải thích nội dung**: "Sách này nói về gì?"
6️⃣ **Tìm sách tương tự**: Khi xem chi tiết sách
7️⃣ **Kiểm tra đơn hàng**: "Đơn hàng của tôi đang ở đâu?"

Hãy thử hỏi tôi bất cứ điều gì! 😊"""


def handle_thanks() -> str:
    """Handle thank you"""
    return """Rất vui được giúp bạn! 🙏

Nếu cần tư vấn thêm về sách, cứ hỏi tôi bất cứ lúc nào nhé!"""


def handle_goodbye() -> str:
    """Handle goodbye"""
    return """Tạm biệt! Chúc bạn tìm được những cuốn sách tuyệt vời! 👋📚

Hẹn gặp lại bạn lần sau!"""


def handle_casual() -> str:
    """Handle casual conversation"""
    return """Tôi khỏe, cảm ơn bạn đã hỏi! 😊

Tôi luôn sẵn sàng giúp bạn tìm những cuốn sách tuyệt vời. 
Bạn muốn tìm sách về chủ đề gì?"""


# ============================================================================
# BOOK-SPECIFIC HANDLERS
# ============================================================================

async def handle_book_specific_intent(
    intent_result,
    book_id: int,
    message: str
) -> tuple:
    """Handle book-specific questions"""
    try:
        # Get book details
        book = await backend_client.get_book_by_id(book_id)
        if not book:
            return (build_error_response("not_found"), [])
        
        intent = intent_result.intent
        
        # Stock availability
        if intent == Intent.BOOK_STOCK:
            answer = build_stock_response(book)
            return (answer, [])
        
        # Book summary
        if intent == Intent.BOOK_SUMMARY:
            answer = build_book_detail_response(book)
            return (answer, [])
        
        # Book price
        if intent == Intent.BOOK_PRICE:
            title = safe_get(book, 'title', default='Cuốn sách này')
            price = safe_get(book, 'price', default=0)
            answer = f"Cuốn **{title}** hiện có giá **{format_price(price)}**."
            return (answer, [])
        
        # Book author
        if intent == Intent.BOOK_AUTHOR:
            title = safe_get(book, 'title', default='Cuốn sách này')
            author = safe_get(book, 'author', default='Chưa rõ tác giả')
            answer = f"Cuốn **{title}** được viết bởi **{author}**."
            return (answer, [])
        
        # Book category
        if intent == Intent.BOOK_CATEGORY:
            title = safe_get(book, 'title', default='Cuốn sách này')
            category = safe_get(book, 'category', default='Chưa phân loại')
            answer = f"Cuốn **{title}** thuộc thể loại **{category}**."
            return (answer, [])
        
        # Similar books
        if intent == Intent.SIMILAR_BOOKS:
            results = retriever.get_similar_books(book_id=book_id, top_k=5)
            if not results:
                title = safe_get(book, 'title', default='cuốn sách này')
                return (f"Hiện tôi chưa tìm thấy sách tương tự với **{title}**.", [])
            
            title = safe_get(book, 'title', default='cuốn sách này')
            answer = build_book_list_response(
                books=results,
                context=f"Một số sách tương tự với **{title}**:"
            )
            sources = [book_recommendation_from_result(r) for r in results]
            return (answer, sources)
        
        # Book audience
        if intent == Intent.BOOK_AUDIENCE:
            title = safe_get(book, 'title', default='Cuốn sách này')
            category = safe_get(book, 'category', default='thể loại này')
            description = safe_get(book, 'description', default='')
            
            answer = f"**{title}** thuộc thể loại **{category}**.\n\n"
            answer += "Cuốn này phù hợp với người quan tâm đến chủ đề này. "
            answer += "Nếu bạn là người mới bắt đầu, nên đọc mô tả và vài trang đầu để xem văn phong có dễ theo dõi không.\n\n"
            
            if description:
                answer += f"📖 **Mô tả:** {truncate_text(description, 300)}"
            
            return (answer, [])
        
        # Why should read
        if intent == Intent.BOOK_REASON:
            title = safe_get(book, 'title', default='Cuốn sách này')
            category = safe_get(book, 'category', default='thể loại này')
            author = safe_get(book, 'author', default='tác giả này')
            description = safe_get(book, 'description', default='')
            price = safe_get(book, 'price', default=0)
            
            answer = f"Bạn có thể cân nhắc đọc **{title}** vì:\n\n"
            answer += f"1. Sách thuộc thể loại **{category}**\n"
            answer += f"2. Tác giả là **{author}**\n"
            answer += f"3. Giá: {format_price(price)}\n\n"
            
            if description:
                answer += f"📖 **Về nội dung:** {truncate_text(description, 350)}"
            
            return (answer, [])
        
        # Default: use RAG for complex questions
        return await handle_general_query(message, category=None, book_id=book_id)
        
    except Exception as e:
        logger.error(f"[ERROR] Book-specific intent error: {str(e)}")
        return (build_error_response("backend_error"), [])


# ============================================================================
# ORDER HANDLERS
# ============================================================================

async def handle_order_intent(intent_result, user_id: int, message: str) -> tuple:
    """Handle order-related intents"""
    try:
        intent = intent_result.intent
        
        # Order status
        if intent == Intent.ORDER_STATUS:
            orders = await backend_client.get_user_orders(user_id)
            answer = build_order_status_response(orders)
            return (answer, [])
        
        # Cancel order (confirmation required)
        if intent == Intent.ORDER_CANCEL:
            # Get user's orders
            orders = await backend_client.get_user_orders(user_id)
            if not orders:
                return ("Bạn chưa có đơn hàng nào để hủy.", [])
            
            # Get pending orders only
            pending_orders = [o for o in orders if o.get('status') == 'PENDING']
            if not pending_orders:
                return ("Bạn không có đơn hàng nào có thể hủy. Chỉ có thể hủy đơn đang chờ xử lý.", [])
            
            answer = "⚠️ **Xác nhận hủy đơn hàng**\n\n"
            answer += "Bạn có các đơn hàng có thể hủy:\n\n"
            
            for i, order in enumerate(pending_orders[:3], 1):
                order_id = order.get('orderId', order.get('id', 'N/A'))
                total = order.get('totalAmount', order.get('total', 0))
                answer += f"{i}. Đơn #{order_id} - {format_price(total)}\n"
            
            answer += "\n⚠️ **Lưu ý:** Để hủy đơn hàng, vui lòng truy cập trang Đơn hàng và chọn nút Hủy đơn."
            answer += "\n\nTôi không thể tự động hủy đơn hàng để đảm bảo an toàn cho bạn."
            
            return (answer, [])
        
        # Order issues
        if intent == Intent.ORDER_ISSUE:
            answer = """🔧 **Báo cáo vấn đề đơn hàng**

Tôi rất tiếc khi bạn gặp vấn đề với đơn hàng. 

Để được hỗ trợ nhanh nhất, vui lòng:
1. Truy cập trang **Đơn hàng của tôi**
2. Chọn đơn hàng có vấn đề
3. Nhấn **Báo cáo vấn đề** hoặc **Yêu cầu hoàn tiền**

Hoặc liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ trực tiếp."""
            
            return (answer, [])
        
        return (build_error_response("invalid_request"), [])
        
    except Exception as e:
        logger.error(f"[ERROR] Order intent error: {str(e)}")
        return (build_error_response("backend_error"), [])


# ============================================================================
# COMPARISON HANDLER
# ============================================================================

async def handle_comparison_intent(intent_result, message: str, conversation_context: dict) -> tuple:
    """Handle book comparison"""
    try:
        entities = intent_result.entities
        
        # Extract book titles
        book_titles = entities.get('book_titles')
        
        if not book_titles or len(book_titles) != 2:
            return ("Vui lòng cho tôi biết tên 2 cuốn sách bạn muốn so sánh. Ví dụ: 'So sánh Atomic Habits và Deep Work'", [])
        
        # Find both books
        book1, book2 = await book_comparison_service.find_books_for_comparison(
            title1=book_titles[0],
            title2=book_titles[1]
        )
        
        if not book1:
            return (f"Tôi không tìm thấy cuốn **{book_titles[0]}** trong cơ sở dữ liệu.", [])
        
        if not book2:
            return (f"Tôi không tìm thấy cuốn **{book_titles[1]}** trong cơ sở dữ liệu.", [])
        
        # Build comparison
        answer = build_comparison_response(book1, book2)
        
        # Build sources
        sources = [
            BookRecommendation(
                book_id=book1['id'],
                title=book1['title'],
                author=book1['author'],
                price=book1['price'],
                category=book1.get('category'),
                score=1.0
            ),
            BookRecommendation(
                book_id=book2['id'],
                title=book2['title'],
                author=book2['author'],
                price=book2['price'],
                category=book2.get('category'),
                score=1.0
            )
        ]
        
        return (answer, sources)
        
    except Exception as e:
        logger.error(f"[ERROR] Comparison error: {str(e)}")
        return (build_error_response("general"), [])


# ============================================================================
# RECOMMENDATION HANDLER
# ============================================================================

async def handle_recommendation_intent(intent_result, message: str, category: Optional[str]) -> tuple:
    """Handle search and recommendation intents"""
    try:
        entities = intent_result.entities
        intent = intent_result.intent
        
        # Build search query
        query = message
        top_k = entities.get('quantity', 5)
        
        # Get price filters
        min_price = entities.get('min_price')
        max_price = entities.get('max_price')
        
        # Modify query based on entities
        if entities.get('age'):
            age = entities['age']
            if age <= 12:
                query += " thiếu nhi trẻ em"
                category = category or "Thiếu nhi"
            elif age <= 18:
                query += " học sinh thanh thiếu niên"
            elif age >= 20:
                query += " người lớn"
        
        if entities.get('level') == 'beginner':
            query += " người mới bắt đầu cơ bản nhập môn"
        
        if entities.get('author'):
            query += f" {entities['author']}"
        
        if entities.get('purpose') == 'gift':
            query += " làm quà tặng"
        
        # Search books
        results = retriever.search(
            query=query,
            top_k=top_k,
            category=category,
            min_price=min_price,
            max_price=max_price
        )
        
        if not results:
            return ("Tôi chưa tìm thấy cuốn sách phù hợp. Bạn có thể thử tìm với từ khóa khác không?", [])
        
        # Build response based on intent
        if intent == Intent.RECOMMEND_BY_BUDGET:
            if min_price and max_price:
                context = f"Gợi ý sách từ {format_price(min_price)} đến {format_price(max_price)}:"
            elif max_price:
                context = f"Gợi ý sách dưới {format_price(max_price)}:"
            elif min_price:
                context = f"Gợi ý sách từ {format_price(min_price)} trở lên:"
            else:
                context = "Gợi ý sách theo ngân sách của bạn:"
        elif intent == Intent.RECOMMEND_BY_AGE:
            age = entities.get('age', 'phù hợp')
            context = f"Gợi ý sách cho độ tuổi {age}:"
        elif intent == Intent.RECOMMEND_AS_GIFT:
            context = "Gợi ý sách làm quà:"
        else:
            context = "Gợi ý sách cho bạn:"
        
        answer = build_book_list_response(results, context)
        sources = [book_recommendation_from_result(r) for r in results]
        
        return (answer, sources)
        
    except Exception as e:
        logger.error(f"[ERROR] Recommendation error: {str(e)}")
        return (build_error_response("general"), [])


# ============================================================================
# GENERAL QUERY HANDLER (RAG FALLBACK)
# ============================================================================

async def handle_general_query(message: str, category: Optional[str], book_id: Optional[int]) -> tuple:
    """Handle general queries using RAG pipeline"""
    try:
        # Get book context if available
        context_books = None
        if book_id:
            context_books = retriever.get_similar_books(book_id=book_id, top_k=5)
        
        # Use RAG pipeline
        result = rag_pipeline.answer(
            question=message,
            context_books=context_books,
            category=category
        )
        
        # Convert sources to BookRecommendation
        sources = []
        for source in result.get('sources', []):
            sources.append(BookRecommendation(
                book_id=source['book_id'],
                title=source['title'],
                author=source['author'],
                price=source['price'],
                category=source.get('category'),
                score=source['score']
            ))
        
        answer = result['answer']
        
        return (answer, sources)
        
    except Exception as e:
        logger.error(f"[ERROR] RAG query error: {str(e)}")
        return (build_error_response("general"), [])



# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def book_recommendation_from_result(result) -> BookRecommendation:
    """Convert SearchResult to BookRecommendation"""
    return BookRecommendation(
        book_id=result.book_id,
        title=result.title,
        author=result.author,
        price=result.price,
        category=result.category,
        score=result.score,
        image_url=getattr(result, 'image_url', None)
    )


# ============================================================================
# OTHER ENDPOINTS (unchanged)
# ============================================================================

@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Semantic search endpoint"""
    try:
        logger.info(f"[OK] Search request: {request.query}")
        
        results = retriever.search(
            query=request.query,
            top_k=request.top_k,
            category=request.category,
            min_price=request.min_price,
            max_price=request.max_price
        )
        
        books = [book_recommendation_from_result(r) for r in results]
        
        response = SearchResponse(
            results=books,
            total=len(books),
            query=request.query
        )
        
        logger.info(f"[OK] Search completed: {len(books)} results")
        return response
        
    except Exception as e:
        logger.error(f"[ERROR] Search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Không thể tìm kiếm")


@router.post("/similar", response_model=SimilarBooksResponse)
async def get_similar_books(request: SimilarBooksRequest):
    """Get similar books endpoint"""
    try:
        logger.info(f"[OK] Finding similar books to book_id={request.book_id}")
        
        results = retriever.get_similar_books(
            book_id=request.book_id,
            top_k=request.top_k
        )
        
        if not results:
            raise HTTPException(
                status_code=404, 
                detail=f"Book {request.book_id} not found or has no similar books"
            )
        
        similar_books = [book_recommendation_from_result(r) for r in results]
        
        response = SimilarBooksResponse(
            reference_book_id=request.book_id,
            similar_books=similar_books,
            total=len(similar_books)
        )
        
        logger.info(f"[OK] Found {len(similar_books)} similar books")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Similar books error: {str(e)}")
        raise HTTPException(status_code=500, detail="Lỗi khi tìm sách tương tự")


@router.get("/recommendations/{user_id}")
async def get_personalized_recommendations(
    user_id: int,
    limit: int = 10,
    exclude_owned: bool = True
):
    """Get personalized recommendations"""
    try:
        logger.info(f"[OK] Getting recommendations for user {user_id}")
        
        recommendations = recommendation_service.get_personalized_recommendations(
            user_id=user_id,
            limit=limit,
            exclude_owned=exclude_owned
        )
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "total": len(recommendations),
            "personalized": True
        }
        
    except Exception as e:
        logger.error(f"[ERROR] Recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/session/{session_id}")
async def get_session_history(session_id: str, limit: int = 50):
    """Get chat history for session"""
    try:
        logger.info(f"[OK] Getting history for session {session_id}")
        
        messages = chat_history_service.get_session_history(
            session_id=session_id,
            limit=limit
        )
        
        return {
            "session_id": session_id,
            "messages": messages,
            "total": len(messages)
        }
        
    except Exception as e:
        logger.error(f"[ERROR] History error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@router.delete("/history/session/{session_id}")
async def delete_session_history(session_id: str):
    """Delete session history"""
    try:
        logger.info(f"[OK] Deleting session {session_id}")
        
        success = chat_history_service.delete_session(session_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted successfully", "session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/analyze/{book_id}")
async def analyze_book_reviews(book_id: int):
    """Analyze book reviews"""
    try:
        logger.info(f"[OK] Analyzing reviews for book {book_id}")
        
        cached = cache_service.get_review_analysis(book_id)
        if cached:
            logger.info("[OK] Review analysis from cache")
            return cached
        
        analysis = await review_analysis_service.analyze_book_reviews(book_id)
        
        cache_service.set_review_analysis(book_id, analysis, ttl_seconds=3600)
        
        logger.info("[OK] Review analysis completed")
        return analysis
        
    except Exception as e:
        logger.error(f"[ERROR] Review analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics"""
    try:
        stats = cache_service.get_stats()
        return {
            "status": "ok",
            "cache": stats,
            "message": "Cache is working"
        }
    except Exception as e:
        logger.error(f"[ERROR] Cache stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_cache():
    """Clear cache (admin only - should be protected)"""
    try:
        cache_service.clear()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"[ERROR] Cache clear error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test")
async def test_chat():
    """Test endpoint"""
    return {
        "status": "ok",
        "message": "Chat router is working!",
        "endpoints": {
            "chat": "POST /chat",
            "search": "POST /search",
            "similar": "POST /similar"
        }
    }
