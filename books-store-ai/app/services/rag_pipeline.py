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
        """
        try:
            intent = self._classify_intent(question)
            question_lower = question.lower().strip()

            # Greeting / identity / small talk: không search sách
            if intent == "greeting":
                return {
                    "answer": (
                        "Xin chào! Tôi là trợ lý AI của Books Store. Tôi có thể giúp bạn:\n\n"
                        "📚 Tìm sách phù hợp với sở thích\n"
                        "💡 Gợi ý sách hay theo chủ đề\n"
                        "⚖️ So sánh các đầu sách\n"
                        "💰 Tư vấn sách theo ngân sách\n"
                        "📖 Trả lời câu hỏi về sách cụ thể\n\n"
                        "Bạn đang tìm loại sách nào ạ?"
                    ),
                    "sources": [],
                    "intent": "greeting"
                }

            if intent == "identity":
                return {
                    "answer": (
                        "Tôi là trợ lý AI của Books Store. "
                        "Tôi có thể giúp bạn tìm sách, gợi ý sách phù hợp, trả lời câu hỏi về sách "
                        "và đề xuất các cuốn sách tương tự."
                    ),
                    "sources": [],
                    "intent": "identity"
                }

            if intent == "thanks":
                return {
                    "answer": "Rất vui được giúp bạn! Nếu cần tìm hoặc hỏi thêm về sách, bạn cứ nhắn tôi nhé.",
                    "sources": [],
                    "intent": "thanks"
                }

            if intent == "help":
                return {
                    "answer": (
                        "Tôi có thể giúp bạn:\n\n"
                        "1. Tìm sách theo chủ đề, tác giả hoặc thể loại.\n"
                        "2. Gợi ý sách phù hợp với nhu cầu.\n"
                        "3. Trả lời câu hỏi về một cuốn sách cụ thể.\n"
                        "4. Đề xuất sách tương tự.\n"
                        "5. Tư vấn sách theo giá tiền hoặc thể loại.\n\n"
                        "Ví dụ bạn có thể hỏi: “Gợi ý sách lập trình Java”, "
                        "“Sách này nói về gì?”, hoặc “Có sách nào tương tự không?”."
                    ),
                    "sources": [],
                    "intent": "help"
                }

            # Retrieve relevant books nếu chưa có context
            if context_books is None:
                logger.info(f"[OK] Retrieving context for: {question[:50]}...")
                context_books = retriever.search(
                    query=question,
                    category=category,
                    top_k=5
                )

            if not context_books:
                return {
                    "answer": (
                        "Xin lỗi, tôi chưa tìm thấy thông tin sách phù hợp với câu hỏi này. "
                        "Bạn có thể hỏi cụ thể hơn về tên sách, thể loại hoặc chủ đề bạn muốn tìm không?"
                    ),
                    "sources": [],
                    "intent": "no_results"
                }

            # Build context
            context = self._build_context(context_books)

            # Dùng LLM để trả lời linh hoạt hơn
            try:
                prompt = self._build_prompt(question, context)
                logger.info("[OK] Generating answer with LLM...")
                answer = llm_client.generate(prompt)

                if not answer or len(answer.strip()) < 10:
                    logger.warning("LLM answer empty, fallback to template")
                    answer = self._build_template_answer(context_books, intent, question)

            except Exception as e:
                logger.error(f"LLM failed, fallback to template: {str(e)}")
                answer = self._build_template_answer(context_books, intent, question)

            sources = [
                {
                    "book_id": book.book_id,
                    "title": book.title,
                    "author": book.author,
                    "price": book.price,
                    "score": book.score
                }
                for book in context_books[:3]
            ]

            logger.info("[OK] Answer generated successfully")

            return {
                "answer": answer,
                "sources": sources,
                "intent": intent
            }

        except Exception as e:
            logger.error(f"[OK] RAG error: {str(e)}")
            return {
                "answer": "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
                "sources": [],
                "intent": "error"
            }

    def _build_template_answer(self, books: List[SearchResult], intent: str, question: str) -> str:
        """
        Build template answer without LLM fallback
        """
        if not books:
            return "Xin lỗi, tôi không tìm thấy sách phù hợp."

        question_lower = question.lower()
        main_book = books[0]

        # Câu hỏi về sách hiện tại
        if any(phrase in question_lower for phrase in [
            "sách này nói về gì",
            "nội dung chính",
            "nói về gì",
            "cuốn này nói về gì",
            "book about",
            "what is this book about"
        ]):
            desc = main_book.description or "Hiện sách chưa có mô tả chi tiết."
            return (
                f"Cuốn **{main_book.title}** của **{main_book.author}** thuộc thể loại "
                f"**{main_book.category or 'chưa rõ'}**.\n\n"
                f"📖 **Nội dung/Mô tả:** {desc[:500]}...\n\n"
                f"💰 **Giá:** {main_book.price:,.0f}đ"
            )

        if any(phrase in question_lower for phrase in [
            "người mới bắt đầu",
            "beginner",
            "mới học",
            "mới đọc",
            "dễ đọc không",
            "khó đọc không"
        ]):
            desc = main_book.description or "Hiện sách chưa có mô tả chi tiết."
            return (
                f"Về cuốn **{main_book.title}** của **{main_book.author}**:\n\n"
                f"Dựa trên thể loại **{main_book.category or 'chưa rõ'}** và mô tả sách, "
                f"cuốn này có thể phù hợp cho người mới bắt đầu nếu bạn quan tâm đến chủ đề này.\n\n"
                f"📖 **Mô tả ngắn:** {desc[:350]}...\n\n"
                f"💰 **Giá:** {main_book.price:,.0f}đ\n\n"
                f"Gợi ý: bạn nên đọc mô tả và vài trang đầu để xem văn phong có phù hợp không."
            )

        if any(phrase in question_lower for phrase in [
            "tại sao nên đọc",
            "vì sao nên đọc",
            "có nên đọc",
            "có nên mua",
            "why should i read"
        ]):
            desc = main_book.description or "Hiện sách chưa có mô tả chi tiết."
            return (
                f"Bạn có thể cân nhắc đọc **{main_book.title}** vì:\n\n"
                f"1. Sách thuộc thể loại **{main_book.category or 'chưa rõ'}**.\n"
                f"2. Tác giả là **{main_book.author}**.\n"
                f"3. Nội dung sách phù hợp nếu bạn quan tâm đến chủ đề được mô tả.\n\n"
                f"📖 **Mô tả:** {desc[:400]}...\n\n"
                f"💰 **Giá:** {main_book.price:,.0f}đ"
            )

        if any(phrase in question_lower for phrase in [
            "tác giả",
            "author",
            "ai viết"
        ]):
            return f"Cuốn **{main_book.title}** được viết bởi **{main_book.author}**."

        if any(phrase in question_lower for phrase in [
            "giá",
            "bao nhiêu tiền",
            "price",
            "cost"
        ]):
            return f"Cuốn **{main_book.title}** hiện có giá **{main_book.price:,.0f}đ**."

        if any(phrase in question_lower for phrase in [
            "thể loại",
            "category",
            "genre"
        ]):
            return (
                f"Cuốn **{main_book.title}** thuộc thể loại "
                f"**{main_book.category or 'chưa rõ'}**."
            )

        if any(phrase in question_lower for phrase in [
            "tương tự",
            "giống",
            "similar",
            "sách nào giống"
        ]):
            similar_books = books[1:] if len(books) > 1 else books
            answer_parts = [
                f"Một số sách tương tự hoặc liên quan đến **{main_book.title}** là:\n"
            ]

            for i, book in enumerate(similar_books[:3], 1):
                answer_parts.append(
                    f"\n{i}. **{book.title}** - {book.author}\n"
                    f"   💰 Giá: {book.price:,.0f}đ\n"
                    f"   📚 Thể loại: {book.category or 'Chưa rõ'}\n"
                    f"   📖 {book.description[:120] if book.description else 'Sách có nội dung liên quan'}..."
                )

            return "".join(answer_parts)

        # Tìm/gợi ý sách chung
        if intent == "search" or any(word in question_lower for word in ["tìm", "gợi ý", "recommend", "sách nào"]):
            answer_parts = ["Dựa trên yêu cầu của bạn, tôi gợi ý các cuốn sách sau:\n"]

            for i, book in enumerate(books[:3], 1):
                answer_parts.append(
                    f"\n{i}. **{book.title}** - {book.author}\n"
                    f"   💰 Giá: {book.price:,.0f}đ\n"
                    f"   📖 {book.description[:100] if book.description else 'Sách hay về chủ đề này'}..."
                )

            answer_parts.append("\n\nBạn muốn biết thêm chi tiết về cuốn nào không?")
            return "".join(answer_parts)

        # So sánh
        if intent == "comparison" or "so sánh" in question_lower:
            if len(books) >= 2:
                book1, book2 = books[0], books[1]
                return (
                    f"So sánh giữa **{book1.title}** và **{book2.title}**:\n\n"
                    f"📚 **{book1.title}**\n"
                    f"   - Tác giả: {book1.author}\n"
                    f"   - Giá: {book1.price:,.0f}đ\n"
                    f"   - Thể loại: {book1.category or 'Đa dạng'}\n\n"
                    f"📚 **{book2.title}**\n"
                    f"   - Tác giả: {book2.author}\n"
                    f"   - Giá: {book2.price:,.0f}đ\n"
                    f"   - Thể loại: {book2.category or 'Đa dạng'}\n\n"
                    f"Bạn có thể chọn dựa trên thể loại, giá và nhu cầu đọc."
                )

        # Default: trả lời về cuốn đầu tiên, không ép gợi ý sách nữa
        desc = main_book.description or "Hiện sách chưa có mô tả chi tiết."
        return (
            f"Về cuốn **{main_book.title}** của **{main_book.author}**:\n\n"
            f"📚 **Thể loại:** {main_book.category or 'Chưa rõ'}\n"
            f"💰 **Giá:** {main_book.price:,.0f}đ\n"
            f"📖 **Mô tả:** {desc[:400]}...\n\n"
            f"Bạn có thể hỏi thêm như: sách này phù hợp với ai, có sách nào tương tự, "
            f"hoặc tại sao nên đọc cuốn này."
        )

    def _build_context(self, books: List[SearchResult]) -> str:
        """
        Build context string from search results
        """
        context_parts = []

        for i, book in enumerate(books[:5], 1):
            context_parts.append(
                f"Sách {i}: {book.title}\n"
                f"   ID: {book.book_id}\n"
                f"   Tác giả: {book.author}\n"
                f"   Thể loại: {book.category}\n"
                f"   Giá: {book.price:,.0f}đ\n"
                f"   Mô tả: {book.description[:500] if book.description else 'Không có mô tả'}\n"
            )

        return "\n".join(context_parts)

    def _build_prompt(self, question: str, context: str) -> str:
        """
        Build complete prompt for LLM
        """
        prompt = f"""Bạn là trợ lý AI tư vấn sách của Books Store.

Bạn cần trả lời câu hỏi của khách hàng dựa trên DANH SÁCH SÁCH LIÊN QUAN bên dưới.

QUY TẮC TRẢ LỜI:
1. Chỉ dùng thông tin có trong danh sách sách được cung cấp.
2. Không bịa thêm nội dung, đánh giá, review hoặc thông tin không có.
3. Nếu khách hỏi "sách này", hãy hiểu là cuốn sách đầu tiên trong danh sách.
4. Nếu khách hỏi nội dung, hãy tóm tắt dựa trên mô tả sách.
5. Nếu khách hỏi phù hợp với ai, hãy suy luận nhẹ từ thể loại và mô tả, nhưng phải nói rõ là "dựa trên mô tả".
6. Nếu khách hỏi giá, tác giả, thể loại, hãy trả lời trực tiếp.
7. Nếu khách hỏi sách tương tự, hãy gợi ý các sách còn lại trong danh sách.
8. Nếu không đủ thông tin, hãy nói: "Hiện tôi chưa có đủ thông tin để trả lời chính xác."
9. Trả lời bằng tiếng Việt, thân thiện, ngắn gọn, dễ hiểu.
10. Không phải câu nào cũng gợi ý sách. Hãy trả lời đúng trọng tâm câu hỏi.
11. Nếu câu hỏi không liên quan tới sách, hãy trả lời ngắn gọn lịch sự rồi hướng người dùng quay lại chủ đề sách.

DANH SÁCH SÁCH LIÊN QUAN:
{context}

CÂU HỎI CỦA KHÁCH:
{question}

HÃY TRẢ LỜI ĐÚNG TRỌNG TÂM:"""

        return prompt

    def _classify_intent(self, question: str) -> str:
        """
        Classify user intent
        """
        question_lower = question.lower().strip()

        # Greeting
        if any(word in question_lower for word in [
            "xin chào", "hello", "hi", "chào", "hey"
        ]):
            return "greeting"

        # Identity
        if any(phrase in question_lower for phrase in [
            "your name",
            "what is your name",
            "who are you",
            "bạn tên gì",
            "tên bạn là gì",
            "bạn là ai",
            "mày là ai"
        ]):
            return "identity"

        # Thanks
        if any(phrase in question_lower for phrase in [
            "cảm ơn", "cám ơn", "thank", "thanks"
        ]):
            return "thanks"

        # Help
        if any(phrase in question_lower for phrase in [
            "what can you do",
            "bạn làm được gì",
            "bạn giúp được gì",
            "help",
            "giúp tôi"
        ]):
            return "help"

        # Comparison
        if any(word in question_lower for word in [
            "so sánh", "khác", "giống", "compare"
        ]):
            return "comparison"

        # Search / recommendation
        if any(word in question_lower for word in [
            "tìm", "sách nào", "gợi ý", "recommend", "đề xuất"
        ]):
            return "search"

            # Nếu người dùng gõ ngắn như tên sách, ví dụ "your name", "effective java"
        if len(question_lower.split()) <= 5:
            return "search"

        # Question
        if any(word in question_lower for word in [
            "là gì", "tại sao", "vì sao", "như thế nào", "what", "why", "how",
            "ai", "bao nhiêu", "nói về gì", "phù hợp"
        ]):
            return "question"

        return "general"


# Global RAG pipeline instance
rag_pipeline = RAGPipeline()