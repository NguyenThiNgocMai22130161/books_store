# THIẾT KẾ CHI TIẾT: AI CHATBOT CHO BOOKS STORE

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Giới thiệu
Tài liệu này mô tả chi tiết thiết kế hệ thống AI Chatbot cho Books Store - một web bán sách trực tuyến. Hệ thống được xây dựng dựa trên kiến trúc RAG (Retrieval-Augmented Generation) tương tự NewsApp nhưng được tùy chỉnh cho domain bán sách.

### 1.2 Mục tiêu
- **Tư vấn sách thông minh**: Trả lời câu hỏi về nội dung, tác giả, thể loại sách
- **Gợi ý cá nhân hóa**: Đề xuất sách dựa trên sở thích và lịch sử mua hàng
- **Tìm kiếm ngữ nghĩa**: Tìm sách theo mô tả nội dung thay vì chỉ tên sách
- **Tóm tắt & phân tích**: Tổng hợp reviews, so sánh sách tương tự
- **Hỗ trợ mua hàng**: Trả lời câu hỏi về giá, khuyến mãi, giao hàng

### 1.3 Phạm vi áp dụng
- Dựa trên codebase hiện tại: Spring Boot 3.2.0 + PostgreSQL + React Frontend
- Thêm Python AI Microservice độc lập (FastAPI)
- Không thay đổi logic nghiệp vụ hiện tại của Books Store

---

## 2. PHÂN TÍCH HỆ THỐNG HIỆN TẠI

### 2.1 Tech Stack hiện có

| Thành phần | Công nghệ | Version |
|---|---|---|
| Backend | Spring Boot | 3.2.0 |
| Language | Java | 17 |
| Database | PostgreSQL | (Neon Cloud) |
| ORM | Spring Data JPA | - |
| Security | Spring Security + JWT + OAuth2 | - |
| Frontend | React + Vite | - |
| Payment | MoMo, VNPay | - |

### 2.2 Database Schema hiện tại

**Bảng chính:**
- `books`: Thông tin sách (id, title, author, price, year, category, description, imageUrl, quantity)
- `users`: Thông tin người dùng
- `reviews`: Đánh giá sách (rating, comment, verified_purchase)
- `orders`, `order_items`: Đơn hàng
- `cart`, `cart_items`: Giỏ hàng
- `wishlist`: Danh sách yêu thích
- `categories`: Danh mục sách

### 2.3 API Endpoints hiện có

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/books` | Lấy danh sách sách (có filter) |
| GET | `/api/books/{id}` | Lấy chi tiết 1 sách |
| POST/PUT/DELETE | `/api/books/*` | CRUD sách (Admin) |
| GET | `/api/categories` | Danh mục |
| POST | `/api/reviews` | Tạo review |
| GET | `/api/cart` | Giỏ hàng |
| POST | `/api/orders` | Đặt hàng |

### 2.4 Điểm mạnh cần tận dụng
- ✅ Database PostgreSQL sẵn có (hỗ trợ pgvector extension)
- ✅ Authentication/Authorization đã hoàn thiện (JWT + OAuth2)
- ✅ Review system với verified purchase
- ✅ Rich metadata: description, category, author, reviews
- ✅ Order history (cho personalization)

---

## 3. KIẾN TRÚC AI CHATBOT

### 3.1 Kiến trúc tổng thể (Microservice)

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 5173)                │
│         BookDetail, BookList, Chatbot Component             │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────────┐        ┌────────────────────┐
│  Spring Boot      │◄──────►│ Python AI Service  │
│  Backend :8080    │        │  FastAPI :8000     │
│                   │        │                    │
│ • Books API       │        │ • RAG Pipeline     │
│ • Reviews API     │        │ • Embeddings       │
│ • Orders API      │        │ • LLM Integration  │
│ • Auth (JWT)      │        │ • Vector Search    │
└─────────┬─────────┘        └──────────┬─────────┘
          │                             │
          │     ┌───────────────────────┘
          │     │
          ▼     ▼
┌─────────────────────────────┐
│  PostgreSQL Database         │
│  • books, reviews, orders... │
│  • book_vectors (NEW)        │
│  • book_reviews_vectors      │
│  • pgvector extension        │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│    Google Gemini API         │
│  • Embedding: text-embed-004 │
│  • LLM: gemini-1.5-flash     │
└─────────────────────────────┘
```

### 3.2 Luồng RAG Pipeline

```
[1] User Input
    ↓
    "Tìm sách về lập trình Python cho người mới bắt đầu"
    ↓
[2] Embedding Query
    ↓
    Vector 768 chiều (Google text-embedding-004)
    ↓
[3] Vector Search (PostgreSQL + pgvector)
    ↓
    • Cosine similarity trên book_vectors
    • JOIN với books, reviews
    • Lấy TOP 8 kết quả
    ↓
[4] Hybrid Scoring
    ↓
    • Base score: cosine similarity
    • Keyword matching: +0.2/từ
    • Review score boost: rating > 4 → +0.1
    • Sales boost: orders > 50 → +0.15
    • Ngưỡng: 0.3
    ↓
[5] Context Building
    ↓
    • Book metadata (title, author, price, category)
    • Description (nội dung sách)
    • Top reviews (verified purchase)
    • Stats (rating, orders)
    ↓
[6] LLM Processing (Gemini 1.5 Flash)
    ↓
    Prompt = System + Context + User Question
    ↓
[7] Response
    ↓
    {
      "answer": "Dựa trên mô tả của bạn...",
      "recommended_books": [
        {"id": 33, "title": "...", "price": 299000, "score": 0.87}
      ]
    }
```

---

## 4. THIẾT KẾ DATABASE (PHẦN MỞ RỘNG)

### 4.1 Bảng mới: `book_vectors`

```sql
-- Cài extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Bảng lưu vector embedding của sách
CREATE TABLE book_vectors (
    id              SERIAL PRIMARY KEY,
    book_id         BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    
    -- Nội dung đã được xử lý để tạo embedding
    search_text     TEXT NOT NULL,
    
    -- Vector 768 chiều từ Google text-embedding-004
    embedding       vector(768) NOT NULL,
    
    -- Metadata cho scoring
    avg_rating      DECIMAL(3,2) DEFAULT 0,
    total_reviews   INTEGER DEFAULT 0,
    total_orders    INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(book_id)
);

-- Index cho vector search (HNSW cho performance tốt hơn)
CREATE INDEX ON book_vectors USING hnsw (embedding vector_cosine_ops);

-- Index cho foreign key
CREATE INDEX idx_book_vectors_book_id ON book_vectors(book_id);
```

**Cấu trúc `search_text`:**
```
{title} - {author}

Mô tả: {description}

Thể loại: {category}

Top Reviews:
- {review_1}
- {review_2}
- {review_3}

Năm: {year} | Giá: {price}đ | Rating: {avg_rating}/5
```

### 4.2 Bảng mới: `book_review_vectors` (Optional - cho tính năng nâng cao)

```sql
-- Lưu vector của từng review (cho phân tích sentiment chi tiết)
CREATE TABLE book_review_vectors (
    id              SERIAL PRIMARY KEY,
    review_id       BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    book_id         BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    
    review_text     TEXT NOT NULL,
    embedding       vector(768) NOT NULL,
    
    -- Metadata
    rating          INTEGER NOT NULL,
    is_verified     BOOLEAN DEFAULT false,
    
    created_at      TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(review_id)
);

CREATE INDEX ON book_review_vectors USING hnsw (embedding vector_cosine_ops);
```

### 4.3 Bảng mới: `chat_history` (Optional - cho context memory)

```sql
-- Lưu lịch sử hội thoại
CREATE TABLE chat_history (
    id              SERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    session_id      VARCHAR(255) NOT NULL,
    
    role            VARCHAR(20) NOT NULL, -- 'user' hoặc 'assistant'
    message         TEXT NOT NULL,
    
    -- Metadata
    book_ids        BIGINT[], -- Các sách được đề cập trong tin nhắn này
    intent          VARCHAR(50), -- 'search', 'recommendation', 'comparison', 'question'
    
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_history_user_session ON chat_history(user_id, session_id, created_at);
```

---

## 5. PYTHON AI SERVICE - CẤU TRÚC CHI TIẾT

### 5.1 Cấu trúc thư mục

```
books-store-ai/
├── app/
│   ├── main.py                     # FastAPI app entry point
│   ├── core/
│   │   ├── config.py               # Settings (Pydantic)
│   │   ├── logging.py              # Logging config
│   │   └── dependencies.py         # Dependency injection
│   ├── models/
│   │   ├── schemas.py              # Request/Response models
│   │   └── database.py             # SQLAlchemy models (optional)
│   ├── routers/
│   │   ├── health.py               # GET /health
│   │   ├── chat.py                 # POST /chat - Main chatbot
│   │   ├── search.py               # POST /search - Semantic search
│   │   ├── recommend.py            # POST /recommend - Recommendations
│   │   ├── ingest.py               # POST /ingest/* - Data sync
│   │   └── admin.py                # Admin tools
│   ├── services/
│   │   ├── embedder.py             # Embedding service
│   │   ├── retriever.py            # Vector search
│   │   ├── rag_pipeline.py         # RAG orchestration
│   │   ├── llm_client.py           # Gemini LLM client
│   │   ├── recommender.py          # Recommendation engine
│   │   └── intent_classifier.py    # Phân loại intent
│   ├── clients/
│   │   └── backend_client.py       # HTTP client → Spring Boot
│   └── utils/
│       ├── text_processing.py      # Text cleaning, chunking
│       ├── scoring.py              # Hybrid scoring logic
│       └── cache.py                # Redis/Memory cache (optional)
├── Dockerfile
├── compose.yaml                    # Production
├── compose.dev.yaml                # Development
├── requirements.txt
├── .env.example
└── README.md
```

### 5.2 Core Configuration (`app/core/config.py`)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Books Store AI Chatbot"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    PG_DSN: str = "postgresql://user:pass@localhost:5432/books_store"
    
    # Backend API
    BACKEND_BASE_URL: str = "http://localhost:8080"
    JWT_TOKEN: str = ""  # Token để gọi API Spring Boot
    
    # Google Gemini
    GOOGLE_API_KEY: str
    LLM_MODEL: str = "models/gemini-1.5-flash"
    EMBED_MODEL: str = "models/text-embedding-004"
    EMBED_DIM: int = 768
    TEMPERATURE: float = 0.3
    MAX_RETRIES: int = 5
    
    # RAG Settings
    TOP_K_RESULTS: int = 8
    SCORE_THRESHOLD: float = 0.3
    KEYWORD_BOOST: float = 0.2
    RATING_BOOST: float = 0.1
    SALES_BOOST: float = 0.15
    
    # Advanced
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 3600
    MAX_CHAT_HISTORY: int = 10
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 5.3 Request/Response Schemas (`app/models/schemas.py`)

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

# ===== Enums =====
class ChatIntent(str, Enum):
    SEARCH = "search"
    RECOMMENDATION = "recommendation"
    COMPARISON = "comparison"
    QUESTION = "question"
    GREETING = "greeting"
    ORDER_INQUIRY = "order_inquiry"

# ===== Chat Endpoint =====
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    book_id: Optional[int] = None  # Context: đang xem sách nào
    
class BookRecommendation(BaseModel):
    id: int
    title: str
    author: str
    price: float
    category: str
    image_url: Optional[str] = None
    avg_rating: float
    score: float  # Relevance score
    reason: Optional[str] = None  # Lý do gợi ý
    
class ChatResponse(BaseModel):
    answer: str
    intent: ChatIntent
    recommended_books: List[BookRecommendation] = []
    session_id: str

# ===== Search Endpoint =====
class SearchRequest(BaseModel):
    query: str
    filters: Optional[dict] = None
    top_k: int = 8
    
class SearchResponse(BaseModel):
    books: List[BookRecommendation]
    total: int

# ===== Recommendation Endpoint =====
class RecommendRequest(BaseModel):
    user_id: int
    based_on: Optional[str] = "history"  # "history", "wishlist", "similar"
    book_id: Optional[int] = None  # Cho "similar"
    top_k: int = 5
    
# ===== Ingest Endpoint =====
class IngestResponse(BaseModel):
    success: bool
    message: str
    books_processed: int
```

---

## 6. TÍNH NĂNG CHI TIẾT

### 6.1 Chatbot Tư Vấn Sách (Main Feature)

**Endpoint:** `POST /chat`


**Luồng xử lý:**

```python
# Pseudocode
async def chat(request: ChatRequest):
    # 1. Phân loại intent
    intent = classify_intent(request.message)
    
    # 2. Xử lý theo intent
    if intent == "GREETING":
        return greeting_response()
    
    if intent == "ORDER_INQUIRY":
        return handle_order_question(request.user_id, request.message)
    
    # 3. RAG Pipeline (cho search/recommendation/comparison)
    # 3.1 Embed query
    query_vector = embedder.encode(request.message)
    
    # 3.2 Vector search
    candidates = retriever.hybrid_search(
        query_vector=query_vector,
        book_id=request.book_id,  # Context nếu có
        top_k=TOP_K_RESULTS
    )
    
    # 3.3 Hybrid scoring
    scored_books = scorer.apply_hybrid_scoring(
        candidates=candidates,
        query=request.message,
        user_id=request.user_id
    )
    
    # 3.4 Filter by threshold
    relevant_books = [b for b in scored_books if b.score >= SCORE_THRESHOLD]
    
    # 3.5 Build context
    context = build_context(relevant_books)
    
    # 3.6 Generate answer with LLM
    answer = rag_pipeline.generate(
        question=request.message,
        context=context,
        intent=intent
    )
    
    # 4. Return response
    return ChatResponse(
        answer=answer,
        intent=intent,
        recommended_books=relevant_books[:5],
        session_id=request.session_id
    )
```

**Ví dụ Prompts:**

```
System Prompt:
Bạn là trợ lý AI chuyên tư vấn sách tại Books Store. Nhiệm vụ của bạn:
1. Tư vấn sách dựa trên nhu cầu của khách hàng
2. Gợi ý sách phù hợp với sở thích và ngân sách
3. So sánh các đầu sách khi được yêu cầu
4. Trả lời thông tin về giá, tác giả, nội dung
5. LUÔN dựa trên thông tin được cung cấp, KHÔNG bịa đặt

Nguyên tắc:
- Trả lời ngắn gọn, thân thiện
- Nếu không có thông tin → nói thẳng "Tôi không tìm thấy..."
- Luôn kèm giá và link sách khi gợi ý
- Ưu tiên sách có đánh giá tốt và nhiều người mua

Context (Danh sách sách liên quan):
{context}

Câu hỏi của khách hàng: {question}

Hãy trả lời:
```

**Test Cases:**

| Input | Expected Output |
|---|---|
| "Tìm sách về lập trình Python cho người mới" | Gợi ý 3-5 sách Python cơ bản, có giá, rating |
| "So sánh Clean Code và The Pragmatic Programmer" | So sánh 2 sách về nội dung, giá, độ khó |
| "Sách nào dưới 200k về kỹ năng mềm?" | Filter theo giá + category |
| "Mua sách này có freeship không?" | Trả lời về chính sách (từ DB/config) |

### 6.2 Tìm Kiếm Ngữ Nghĩa

**Endpoint:** `POST /search`

**Khác biệt với search hiện tại:**
- **Search cũ (BookApiController):** Filter theo title, author, category, price → exact match
- **Search mới (AI):** Hiểu ngữ nghĩa → tìm theo ý nghĩa

**Ví dụ:**
```
Query: "sách giúp quản lý thời gian hiệu quả"
→ AI tìm: "Atomic Habits", "Deep Work", "Getting Things Done"
(không cần có từ "quản lý thời gian" trong title)
```

### 6.3 Gợi Ý Cá Nhân Hóa

**Endpoint:** `POST /recommend`

**Ba chiến lược:**


**1. Based on Purchase History:**
```sql
-- Lấy thể loại, tác giả user đã mua
SELECT category, author 
FROM order_items oi 
JOIN books b ON oi.book_id = b.id
WHERE oi.user_id = :user_id
GROUP BY category, author
ORDER BY COUNT(*) DESC
LIMIT 3
```
→ Vector search trên các category/author đó

**2. Based on Wishlist:**
```sql
-- Lấy sách trong wishlist
SELECT book_id FROM wishlist WHERE user_id = :user_id
```
→ Tìm sách tương tự (similar books)

**3. Similar Books:**
```python
# Lấy vector của sách gốc
book_vector = get_book_vector(book_id)

# Tìm sách có vector tương đồng
similar = vector_search(
    query_vector=book_vector,
    exclude_ids=[book_id],
    top_k=5
)
```

### 6.4 Phân Tích & Tóm Tắt Reviews

**Endpoint:** `POST /analyze-reviews/{book_id}`

**Output:**
```json
{
  "book_id": 33,
  "summary": "Đa số người dùng đánh giá cao nội dung sách...",
  "sentiment": {
    "positive": 75,
    "neutral": 20,
    "negative": 5
  },
  "common_topics": [
    {"topic": "Nội dung dễ hiểu", "count": 25},
    {"topic": "Ví dụ thực tế", "count": 18},
    {"topic": "Giá hơi cao", "count": 8}
  ],
  "pros": ["Viết dễ hiểu", "Nhiều ví dụ"],
  "cons": ["Giá cao", "Một số lỗi chính tả"]
}
```

---

## 7. INTEGRATION VỚI SPRING BOOT BACKEND

### 7.1 Thêm API Endpoints mới vào Spring Boot


**Tạo file mới:** `AIServiceController.java`

```java
@RestController
@RequestMapping("/api/ai")
public class AIServiceController {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${ai.service.url}")
    private String aiServiceUrl; // http://localhost:8000
    
    /**
     * Proxy request sang Python AI Service
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest request) {
        String url = aiServiceUrl + "/chat";
        return restTemplate.postForEntity(url, request, ChatResponse.class);
    }
    
    @PostMapping("/search")
    public ResponseEntity<?> semanticSearch(@RequestBody SearchRequest request) {
        String url = aiServiceUrl + "/search";
        return restTemplate.postForEntity(url, request, SearchResponse.class);
    }
    
    @PostMapping("/recommend")
    public ResponseEntity<?> recommend(@RequestBody RecommendRequest request) {
        String url = aiServiceUrl + "/recommend";
        return restTemplate.postForEntity(url, request, List.class);
    }
}
```

**Thêm vào `application.properties`:**
```properties
# AI Service Configuration
ai.service.url=http://localhost:8000
ai.service.enabled=true
ai.service.timeout=30000
```

### 7.2 Webhook để sync data

**Khi có sách mới/cập nhật → Trigger sync sang Python AI:**


```java
@Service
public class BookService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${ai.service.url}")
    private String aiServiceUrl;
    
    @Value("${ai.service.enabled}")
    private boolean aiServiceEnabled;
    
    public Book saveBook(Book book) {
        Book saved = bookRepository.save(book);
        
        // Trigger AI service sync (async)
        if (aiServiceEnabled) {
            CompletableFuture.runAsync(() -> {
                try {
                    String url = aiServiceUrl + "/ingest/" + saved.getId();
                    restTemplate.postForEntity(url, null, Void.class);
                } catch (Exception e) {
                    log.warn("Failed to sync book to AI service: " + e.getMessage());
                }
            });
        }
        
        return saved;
    }
}
```

### 7.3 Authentication Flow

**Python AI Service xác thực với Spring Boot:**

```python
# app/clients/backend_client.py
import httpx

class BackendClient:
    def __init__(self, base_url: str, jwt_token: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json"
        }
    
    async def get_book(self, book_id: int):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/books/{book_id}",
                headers=self.headers
            )
            return response.json()
    
    async def get_all_books(self):
        # Handle pagination if exists
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                f"{self.base_url}/api/books",
                headers=self.headers
            )
            return response.json()
```

---

## 8. FRONTEND INTEGRATION (REACT)

### 8.1 Component mới: `ChatbotWidget.jsx`


```jsx
// frontend/src/components/chatbot/ChatbotWidget.jsx
import { useState } from 'react';
import axios from 'axios';

export default function ChatbotWidget({ bookId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        message: input,
        book_id: bookId,
        session_id: sessionStorage.getItem('chat_session_id')
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.answer,
        books: response.data.recommended_books
      }]);

      sessionStorage.setItem('chat_session_id', response.data.session_id);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-widget">
      {/* Floating button */}
      <button 
        className="chatbot-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        💬
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Trợ lý AI</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <p>{msg.content}</p>
                {msg.books && (
                  <div className="book-suggestions">
                    {msg.books.map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="typing-indicator">...</div>}
          </div>

          <div className="chatbot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Hỏi về sách..."
            />
            <button onClick={sendMessage}>Gửi</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 8.2 Tích hợp vào BookDetail


```jsx
// Trong BookDetail.jsx
import ChatbotWidget from '../chatbot/ChatbotWidget';

function BookDetail() {
  const { id } = useParams();
  // ... existing code

  return (
    <div className="book-detail">
      {/* Existing book detail UI */}
      
      {/* AI Chatbot với context của sách hiện tại */}
      <ChatbotWidget bookId={id} />
      
      {/* Suggestion: "Hỏi AI về sách này" button */}
      <button onClick={() => {/* open chatbot with context */}}>
        💡 Hỏi AI về sách này
      </button>
    </div>
  );
}
```

### 8.3 Semantic Search Bar

```jsx
// frontend/src/components/search/SmartSearchBar.jsx
export default function SmartSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const response = await axios.post('/api/ai/search', {
        query: query,
        top_k: 8
      });
      setResults(response.data.books);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="smart-search">
      <input
        type="text"
        placeholder="Ví dụ: Tìm sách về kỹ năng giao tiếp..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>
        {searching ? '🔍 Đang tìm...' : '🔍 Tìm kiếm thông minh'}
      </button>
      
      <div className="search-results">
        {results.map(book => (
          <BookCard key={book.id} book={book} score={book.score} />
        ))}
      </div>
    </div>
  );
}
```

---

## 9. DEPLOYMENT

### 9.1 Docker Compose Setup


```yaml
# compose.yaml (Production)
version: '3.8'

services:
  # Python AI Service
  books-ai:
    build: ./books-store-ai
    container_name: books-ai-service
    ports:
      - "8000:8000"
    environment:
      - PG_DSN=postgresql://neondb_owner:npg_N9hKEuY1iBsv@ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
      - BACKEND_BASE_URL=http://host.docker.internal:8080
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - JWT_TOKEN=${JAVA_JWT_TOKEN}
    restart: unless-stopped
    depends_on:
      - postgres
    extra_hosts:
      - "host.docker.internal:host-gateway"

  # PostgreSQL (nếu chạy local, nếu dùng Neon thì bỏ)
  postgres:
    image: pgvector/pgvector:pg16
    container_name: books-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: books_store
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 9.2 Environment Variables

**File `.env` cho Python AI Service:**

```env
# Database
PG_DSN=postgresql://neondb_owner:password@host/neondb?sslmode=require

# Backend
BACKEND_BASE_URL=http://localhost:8080
JWT_TOKEN=your_jwt_token_here

# Google AI
GOOGLE_API_KEY=your_gemini_api_key

# Models
LLM_MODEL=models/gemini-1.5-flash
EMBED_MODEL=models/text-embedding-004
EMBED_DIM=768

# RAG Config
TOP_K_RESULTS=8
SCORE_THRESHOLD=0.3
TEMPERATURE=0.3

# Performance
ENABLE_CACHE=true
CACHE_TTL=3600
```

### 9.3 Health Check & Monitoring


```python
# app/routers/health.py
from fastapi import APIRouter, status
from app.core.config import settings
import psycopg2

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    checks = {
        "service": "running",
        "database": "unknown",
        "gemini_api": "unknown"
    }
    
    # Check DB connection
    try:
        conn = psycopg2.connect(settings.PG_DSN)
        conn.close()
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
    
    # Check Gemini API (optional)
    try:
        # Test embedding call
        from app.services.embedder import embedder
        embedder.encode(["test"])
        checks["gemini_api"] = "ok"
    except Exception as e:
        checks["gemini_api"] = f"error: {str(e)}"
    
    return {
        "status": "healthy" if all(v == "ok" or v == "running" for v in checks.values()) else "degraded",
        "checks": checks,
        "version": settings.VERSION
    }
```

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests

```python
# tests/test_embedder.py
def test_embedding_dimension():
    embedder = Embedder()
    vectors = embedder.encode(["test text"])
    assert len(vectors[0]) == 768

# tests/test_retriever.py
def test_vector_search():
    results = retriever.search("Python programming", top_k=5)
    assert len(results) <= 5
    assert all(r.score >= 0 and r.score <= 1 for r in results)

# tests/test_rag_pipeline.py
def test_answer_generation():
    answer = rag_pipeline.answer(
        question="What is this book about?",
        context=[mock_book_data]
    )
    assert len(answer) > 0
    assert "không tìm thấy" not in answer.lower()
```

### 10.2 Integration Tests


```python
# tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chat_endpoint():
    response = client.post("/chat", json={
        "message": "Tìm sách về Python",
        "user_id": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "recommended_books" in data

def test_search_endpoint():
    response = client.post("/search", json={
        "query": "lập trình web",
        "top_k": 5
    })
    assert response.status_code == 200
    assert len(response.json()["books"]) <= 5
```

### 10.3 Manual Test Cases

| Test Case | Input | Expected Output |
|---|---|---|
| TC-01 | "Sách nào dạy Spring Boot?" | Gợi ý 3-5 sách Spring Boot, có giá |
| TC-02 | "Giá sách Python dưới 300k" | Filter price < 300000 |
| TC-03 | "So sánh Head First Java vs Thinking in Java" | Table so sánh 2 sách |
| TC-04 | "Sách bestseller tuần này" | Top sách bán chạy (cần query orders) |
| TC-05 | Context: BookDetail(id=33), "Có sách tương tự không?" | Similar books to ID 33 |

---

## 11. TIMELINE & MILESTONES

### Phase 1: Foundation (2 tuần)
- ✅ Setup Python AI service (FastAPI)
- ✅ Database migration (thêm pgvector extension)
- ✅ Embedding service (Google Gemini)
- ✅ Basic vector search
- ✅ Health check & monitoring

### Phase 2: RAG Pipeline (2 tuần)
- ⏳ Retriever with hybrid scoring
- ⏳ LLM integration (Gemini)
- ⏳ Prompt engineering
- ⏳ Context building
- ⏳ Intent classification

### Phase 3: Integration (1 tuần)
- ⏳ Spring Boot proxy endpoints
- ⏳ JWT authentication
- ⏳ Data sync mechanism
- ⏳ Error handling

### Phase 4: Frontend (1 tuần)
- ⏳ ChatbotWidget component
- ⏳ Smart search bar
- ⏳ UI/UX polishing
- ⏳ Mobile responsive

### Phase 5: Advanced Features (2 tuần)
- ⏳ Personalized recommendations
- ⏳ Review analysis
- ⏳ Chat history
- ⏳ Caching layer

### Phase 6: Testing & Deployment (1 tuần)
- ⏳ Unit tests
- ⏳ Integration tests
- ⏳ Performance tuning
- ⏳ Production deployment

**Tổng thời gian ước tính:** 9 tuần (2-3 tháng)

---

## 12. RISKS & MITIGATION


| Risk | Impact | Mitigation |
|---|---|---|
| **Gemini API rate limit** | Service unavailable | Implement retry logic, caching, fallback to rule-based |
| **Hallucination (AI bịa thông tin)** | Sai thông tin → mất uy tín | Strict prompts, threshold filtering, citation links |
| **Slow response time** | Bad UX | Async processing, caching, optimize vector search |
| **High API cost** | Budget overrun | Monitor usage, set quotas, cache embeddings |
| **Database vector search slow** | Timeout | Index optimization (HNSW), pagination |
| **Security (prompt injection)** | Data leak | Input sanitization, rate limiting |

---

## 13. COST ESTIMATION

### 13.1 Google Gemini API

| Service | Pricing | Estimated Usage | Monthly Cost |
|---|---|---|---|
| **text-embedding-004** | $0.025/1M chars | 10M chars (ingest + queries) | $0.25 |
| **gemini-1.5-flash** | $0.075/1M input tokens | 50M tokens (chat) | $3.75 |
| **Total** | | | **~$4/month** |

(Với 10,000 queries/tháng, mỗi query ~1000 tokens)

### 13.2 Infrastructure

| Component | Cost |
|---|---|
| PostgreSQL (Neon Free Tier) | $0 |
| Python AI Service (1 instance) | $0 (local) / $10-20 (cloud) |
| **Total** | **$0-20/month** |

### 13.3 Development Cost
- Developer: 1 người x 9 tuần = ~2.5 tháng
- Giả sử lương: 15M/tháng → **37.5M VND**

---

## 14. PERFORMANCE TARGETS

| Metric | Target | Measurement |
|---|---|---|
| Response time (chat) | < 3s | p95 |
| Response time (search) | < 1s | p95 |
| Vector search accuracy | > 80% | Manual evaluation |
| Uptime | > 99% | Monthly |
| Concurrent users | 100+ | Load test |

---

## 15. FUTURE ENHANCEMENTS

### 15.1 Advanced RAG
- **Re-ranking:** Thêm cross-encoder sau vector search
- **Query expansion:** Mở rộng query với synonyms
- **Multi-query:** Tạo nhiều queries từ 1 input

### 15.2 Personalization
- **User profiling:** Học sở thích từ behavior
- **Collaborative filtering:** "Người mua X cũng mua Y"
- **A/B testing:** Test các strategies khác nhau

### 15.3 Multimodal
- **Image search:** Tìm sách theo ảnh bìa
- **Voice input:** Hỏi bằng giọng nói
- **Video reviews:** Phân tích video reviews

### 15.4 Analytics
- **Query analytics:** Queries phổ biến
- **Conversion tracking:** Từ chat → mua hàng
- **User feedback:** Thu thập 👍👎 để improve

---

## 16. APPENDIX

### 16.1 Useful Commands


```bash
# Development
cd books-store-ai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Docker
docker compose -f compose.dev.yaml up --build
docker compose logs -f books-ai

# Database
psql $PG_DSN
\dx  # List extensions
SELECT * FROM book_vectors LIMIT 5;

# Ingest data
curl -X POST http://localhost:8000/ingest/sync

# Test chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tìm sách về Python", "user_id": 1}'
```

### 16.2 References

- **LangChain Docs:** https://python.langchain.com/docs/get_started/introduction
- **Gemini API:** https://ai.google.dev/docs
- **pgvector:** https://github.com/pgvector/pgvector
- **FastAPI:** https://fastapi.tiangolo.com/
- **RAG Best Practices:** https://www.pinecone.io/learn/retrieval-augmented-generation/

### 16.3 Sample Prompt Templates

**Intent Classification:**
```
Phân loại câu hỏi sau vào 1 trong các loại:
- SEARCH: Tìm kiếm sách
- RECOMMENDATION: Gợi ý sách
- COMPARISON: So sánh sách
- QUESTION: Hỏi thông tin cụ thể
- GREETING: Chào hỏi
- ORDER_INQUIRY: Hỏi về đơn hàng

Câu hỏi: {user_input}
Loại:
```

**Book Recommendation:**
```
Dựa trên thông tin sau:
- User profile: {user_profile}
- Purchase history: {purchase_history}
- Current context: {current_book}

Gợi ý 5 sách phù hợp nhất và giải thích lý do.
```

---

## 17. KẾT LUẬN

Tài liệu này cung cấp blueprint chi tiết để xây dựng AI Chatbot cho Books Store sử dụng kiến trúc RAG. Hệ thống được thiết kế:

✅ **Scalable:** Microservice architecture, dễ mở rộng  
✅ **Maintainable:** Code structure rõ ràng, documentation đầy đủ  
✅ **Cost-effective:** Sử dụng free tier, chi phí API thấp  
✅ **Production-ready:** Error handling, monitoring, testing  

**Next Steps:**
1. Review & approval tài liệu này
2. Setup development environment
3. Bắt đầu Phase 1: Foundation

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-08  
**Author:** Kiro AI Assistant  
**Contact:** [Your Email]

