"""
Chat Router
Main chatbot endpoints with advanced features
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
from app.services.rag_pipeline import rag_pipeline
from app.services.retriever import retriever
from app.services.chat_history_service import chat_history_service
from app.services.recommendation_service import recommendation_service
from app.services.review_analysis_service import review_analysis_service
from app.services.cache_service import cache_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chatbot endpoint - answer user questions using RAG
    
    Args:
        request: ChatRequest with message and optional context
        
    Returns:
        ChatResponse with answer and sources
    """
    try:
        logger.info(f"[OK] Chat request: {request.message[:50]}...")
        
        # Generate or use existing session ID
        session_id = request.session_id or str(uuid.uuid4())
        
        # Enhanced greeting and common questions handler
        message_lower = request.message.lower().strip()
        
        # Greetings
        if any(word in message_lower for word in ['xin chào', 'chào', 'hello', 'hi', 'hey', 'xin chao']):
            return ChatResponse(
                answer="Xin chào! Tôi là trợ lý AI của Books Store. Tôi có thể giúp bạn:\n\n"
                       "📚 Tìm sách phù hợp với sở thích\n"
                       "💡 Gợi ý sách hay theo chủ đề\n"
                       "⚖️ So sánh các đầu sách\n"
                       "💰 Tư vấn sách theo ngân sách\n"
                       "⭐ Đánh giá và review sách\n\n"
                       "Bạn đang tìm loại sách nào ạ?",
                sources=[],
                intent='greeting',
                session_id=session_id
            )
        
        # How are you / Thank you
        if any(phrase in message_lower for phrase in ['bạn khỏe không', 'how are you', 'bạn thế nào', 'có khỏe không']):
            return ChatResponse(
                answer="Tôi khỏe, cảm ơn bạn đã hỏi! 😊\n\n"
                       "Tôi luôn sẵn sàng giúp bạn tìm những cuốn sách tuyệt vời. "
                       "Bạn muốn tìm sách về chủ đề gì?",
                sources=[],
                intent='casual',
                session_id=session_id
            )
        
        if any(phrase in message_lower for phrase in ['cảm ơn', 'cám ơn', 'thank', 'thanks', 'cảm ơn bạn']):
            return ChatResponse(
                answer="Rất vui được giúp bạn! 🙏\n\n"
                       "Nếu cần tư vấn thêm về sách, cứ hỏi tôi bất cứ lúc nào nhé!",
                sources=[],
                intent='casual',
                session_id=session_id
            )
        
        # Help / What can you do
        if any(phrase in message_lower for phrase in ['giúp gì', 'làm được gì', 'what can you do', 'bạn có thể', 'giúp tôi']):
            return ChatResponse(
                answer="Tôi có thể giúp bạn:\n\n"
                       "1️⃣ **Tìm sách theo chủ đề**: Ví dụ \"Tìm sách về lập trình\"\n"
                       "2️⃣ **Gợi ý sách hay**: \"Gợi ý sách kinh doanh hay nhất\"\n"
                       "3️⃣ **So sánh sách**: \"So sánh 'Sapiens' và 'Homo Deus'\"\n"
                       "4️⃣ **Tư vấn theo giá**: \"Sách dưới 200k về tâm lý học\"\n"
                       "5️⃣ **Giải thích nội dung**: \"Nói về cuốn 'Nhà Giả Kim'\"\n"
                       "6️⃣ **Tìm sách tương tự**: Khi xem chi tiết sách\n\n"
                       "Hãy thử hỏi tôi bất cứ điều gì về sách nhé! 😊",
                sources=[],
                intent='help',
                session_id=session_id
            )
        
        # Goodbye
        if any(phrase in message_lower for phrase in ['tạm biệt', 'bye', 'goodbye', 'hẹn gặp lại', 'chào tạm biệt']):
            return ChatResponse(
                answer="Tạm biệt! Chúc bạn tìm được những cuốn sách tuyệt vời! 👋📚\n\n"
                       "Hẹn gặp lại bạn lần sau!",
                sources=[],
                intent='goodbye',
                session_id=session_id
            )
        
        # Get context books if book_id provided
        context_books = None
        if request.book_id:
            logger.info(f"[OK] Finding similar books to book_id={request.book_id}")
            context_books = retriever.get_similar_books(
                book_id=request.book_id,
                top_k=5
            )
        
        # Generate answer using RAG pipeline
        result = rag_pipeline.answer(
            question=request.message,
            context_books=context_books,
            category=request.category
        )
        
        # Convert sources to BookRecommendation format
        sources = [
            BookRecommendation(
                book_id=source['book_id'],
                title=source['title'],
                author=source['author'],
                price=source['price'],
                score=source['score']
            )
            for source in result['sources']
        ]
        
        response = ChatResponse(
            answer=result['answer'],
            sources=sources,
            intent=result['intent'],
            session_id=session_id
        )
        
        logger.info(f"[OK] Chat response generated: {len(sources)} sources")
        return response
        
    except Exception as e:
        logger.error(f"[OK] Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """
    Semantic search endpoint - find relevant books
    
    Args:
        request: SearchRequest with query and filters
        
    Returns:
        SearchResponse with matching books
    """
    try:
        logger.info(f"[OK] Search request: {request.query}")
        
        # Perform search
        results = retriever.search(
            query=request.query,
            top_k=request.top_k,
            category=request.category,
            min_price=request.min_price,
            max_price=request.max_price
        )
        
        # Convert to BookRecommendation format
        books = [
            BookRecommendation(
                book_id=result.book_id,
                title=result.title,
                author=result.author,
                price=result.price,
                category=result.category,
                score=result.score
            )
            for result in results
        ]
        
        response = SearchResponse(
            results=books,
            total=len(books),
            query=request.query
        )
        
        logger.info(f"[OK] Search completed: {len(books)} results")
        return response
        
    except Exception as e:
        logger.error(f"[OK] Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.post("/similar", response_model=SimilarBooksResponse)
async def get_similar_books(request: SimilarBooksRequest):
    """
    Get similar books endpoint
    
    Args:
        request: SimilarBooksRequest with book_id
        
    Returns:
        SimilarBooksResponse with similar books
    """
    try:
        logger.info(f"[OK] Finding similar books to book_id={request.book_id}")
        
        # Get similar books
        results = retriever.get_similar_books(
            book_id=request.book_id,
            top_k=request.top_k
        )
        
        if not results:
            raise HTTPException(
                status_code=404, 
                detail=f"Book {request.book_id} not found or has no similar books"
            )
        
        # Convert to BookRecommendation format
        similar_books = [
            BookRecommendation(
                book_id=result.book_id,
                title=result.title,
                author=result.author,
                price=result.price,
                category=result.category,
                score=result.score
            )
            for result in results
        ]
        
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
        logger.error(f"[OK] Similar books error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/test")
async def test_chat():
    """
    Test endpoint to verify chat router is working
    """
    return {
        "status": "ok",
        "message": "Chat router is working!",
        "endpoints": {
            "chat": "POST /chat",
            "search": "POST /search",
            "similar": "POST /similar"
        }
    }


# ===== PHASE 8: ADVANCED FEATURES ENDPOINTS =====

@router.get("/recommendations/{user_id}")
async def get_personalized_recommendations(
    user_id: int,
    limit: int = 10,
    exclude_owned: bool = True
):
    """
    Get personalized book recommendations for user
    
    Based on purchase history, wishlist, and preferences
    """
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
        logger.error(f"[OK] Recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/session/{session_id}")
async def get_session_history(session_id: str, limit: int = 50):
    """Get chat history for a session"""
    try:
        logger.info(f"📜 Getting history for session {session_id}")
        
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
        logger.error(f"[OK] History error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/user/{user_id}")
async def get_user_history(
    user_id: int,
    days: int = 30,
    limit: int = 100
):
    """Get chat history for a user"""
    try:
        logger.info(f"📜 Getting history for user {user_id}")
        
        messages = chat_history_service.get_user_history(
            user_id=user_id,
            days=days,
            limit=limit
        )
        
        return {
            "user_id": user_id,
            "messages": messages,
            "total": len(messages),
            "days": days
        }
        
    except Exception as e:
        logger.error(f"[OK] History error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/session/{session_id}")
async def delete_session_history(session_id: str):
    """Delete chat history for a session"""
    try:
        logger.info(f"🗑[OK]  Deleting session {session_id}")
        
        success = chat_history_service.delete_session(session_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted successfully", "session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[OK] Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/analyze/{book_id}")
async def analyze_book_reviews(book_id: int):
    """
    Analyze all reviews for a book
    
    Returns sentiment analysis, key themes, pros/cons, and summary
    """
    try:
        logger.info(f"[OK] Analyzing reviews for book {book_id}")
        
        # Check cache first
        cached = cache_service.get_review_analysis(book_id)
        if cached:
            logger.info("[OK] Review analysis from cache")
            return cached
        
        # Analyze reviews
        analysis = await review_analysis_service.analyze_book_reviews(book_id)
        
        # Cache result
        cache_service.set_review_analysis(book_id, analysis, ttl_seconds=3600)
        
        logger.info("[OK] Review analysis completed")
        return analysis
        
    except Exception as e:
        logger.error(f"[OK] Review analysis error: {str(e)}")
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
        logger.error(f"[OK] Cache stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_cache():
    """Clear all cache (admin only)"""
    try:
        cache_service.clear()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"[OK] Cache clear error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
