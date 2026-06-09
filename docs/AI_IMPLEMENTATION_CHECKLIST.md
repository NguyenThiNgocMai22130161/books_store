# CHECKLIST TRIỂN KHAI AI CHATBOT CHO BOOKS STORE

## 📋 PHASE 1: SETUP & FOUNDATION

### 1.1 Chuẩn bị môi trường

- [ ] **Cài đặt Python 3.11+**
  ```bash
  python --version
  ```

- [ ] **Tạo project structure**
  ```bash
  mkdir books-store-ai
  cd books-store-ai
  mkdir -p app/{core,models,routers,services,clients,utils}
  touch app/__init__.py app/main.py
  ```

- [ ] **Tạo virtual environment**
  ```bash
  python -m venv venv
  source venv/bin/activate  # Mac/Linux
  # venv\Scripts\activate   # Windows
  ```

- [ ] **Tạo requirements.txt**
  ```txt
  fastapi==0.104.1
  uvicorn[standard]==0.24.0
  pydantic==2.5.0
  pydantic-settings==2.1.0
  langchain==0.1.0
  langchain-google-genai==0.0.6
  google-generativeai==0.3.1
  psycopg2-binary==2.9.9
  pgvector==0.2.3
  httpx==0.25.2
  python-dotenv==1.0.0
  ```

- [ ] **Lấy Google Gemini API Key**
  - Truy cập: https://aistudio.google.com/
  - Tạo API key mới
  - Lưu vào file `.env`

### 1.2 Database Setup

- [ ] **Kiểm tra PostgreSQL connection**
  ```bash
  psql "postgresql://neondb_owner:npg_N9hKEuY1iBsv@ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
  ```

- [ ] **Cài đặt pgvector extension**
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  \dx  -- Kiểm tra extension đã cài
  ```

- [ ] **Tạo bảng book_vectors**
  ```sql
  CREATE TABLE book_vectors (
      id              SERIAL PRIMARY KEY,
      book_id         BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      search_text     TEXT NOT NULL,
      embedding       vector(768) NOT NULL,
      avg_rating      DECIMAL(3,2) DEFAULT 0,
      total_reviews   INTEGER DEFAULT 0,
      total_orders    INTEGER DEFAULT 0,
      created_at      TIMESTAMP DEFAULT NOW(),
      updated_at      TIMESTAMP DEFAULT NOW(),
      UNIQUE(book_id)
  );
  
  CREATE INDEX ON book_vectors USING hnsw (embedding vector_cosine_ops);
  CREATE INDEX idx_book_vectors_book_id ON book_vectors(book_id);
  ```

- [ ] **Test connection từ Python**
  ```python
  import psycopg2
  conn = psycopg2.connect("your_connection_string")
  print("Connected successfully!")
  conn.close()
  ```

### 1.3 Config & Core Files


- [ ] **Tạo `.env` file**
  ```env
  # Database
  PG_DSN=postgresql://neondb_owner:password@host/neondb?sslmode=require
  
  # Backend
  BACKEND_BASE_URL=http://localhost:8080
  JWT_TOKEN=your_jwt_token_from_spring_boot
  
  # Google AI
  GOOGLE_API_KEY=your_gemini_api_key_here
  
  # Models
  LLM_MODEL=models/gemini-1.5-flash
  EMBED_MODEL=models/text-embedding-004
  EMBED_DIM=768
  
  # RAG Config
  TOP_K_RESULTS=8
  SCORE_THRESHOLD=0.3
  TEMPERATURE=0.3
  ```

- [ ] **Implement `app/core/config.py`**
  - Sử dụng pydantic-settings
  - Load từ .env
  - Validation

- [ ] **Implement `app/main.py`**
  - Khởi tạo FastAPI app
  - CORS middleware
  - Register routers
  - Exception handlers

- [ ] **Test server chạy**
  ```bash
  uvicorn app.main:app --reload --port 8000
  # Truy cập: http://localhost:8000/docs
  ```

---

## 📋 PHASE 2: EMBEDDING SERVICE

### 2.1 Embedder Implementation

- [ ] **Tạo `app/services/embedder.py`**
  - Class Embedder
  - Method: `encode(texts: List[str]) -> List[List[float]]`
  - Support Gemini text-embedding-004

- [ ] **Test embedding**
  ```python
  from app.services.embedder import embedder
  vectors = embedder.encode(["test text", "another text"])
  assert len(vectors) == 2
  assert len(vectors[0]) == 768
  print("✓ Embedding works!")
  ```

- [ ] **Handle errors:**
  - Rate limit (429)
  - Timeout
  - Invalid API key

### 2.2 Data Ingestion

- [ ] **Implement `app/clients/backend_client.py`**
  - `get_all_books()` - fetch từ Spring Boot
  - `get_book_by_id(id)`
  - Handle pagination
  - JWT authentication

- [ ] **Implement `app/routers/ingest.py`**
  - `POST /ingest/sync` - sync toàn bộ
  - `POST /ingest/{book_id}` - sync 1 sách
  - Background task
  - Rate limiting

- [ ] **Implement text processing (`app/utils/text_processing.py`)**
  - Build search_text từ book data
  - Clean HTML/special chars
  - Truncate long text

- [ ] **Test ingest 1 sách**
  ```bash
  curl -X POST http://localhost:8000/ingest/33
  ```

- [ ] **Test ingest toàn bộ**
  ```bash
  curl -X POST http://localhost:8000/ingest/sync
  # Kiểm tra logs
  ```

- [ ] **Verify trong database**
  ```sql
  SELECT COUNT(*) FROM book_vectors;
  SELECT book_id, LEFT(search_text, 100) FROM book_vectors LIMIT 5;
  ```

---

## 📋 PHASE 3: VECTOR SEARCH (RETRIEVER)

### 3.1 Basic Vector Search

- [ ] **Implement `app/services/retriever.py`**
  - `search(query: str, top_k: int) -> List[SearchResult]`
  - Cosine similarity với pgvector
  - JOIN với bảng books

- [ ] **Test search**
  ```python
  results = retriever.search("Python programming", top_k=5)
  for r in results:
      print(f"{r.title} - Score: {r.score}")
  ```

### 3.2 Hybrid Scoring

- [ ] **Implement `app/utils/scoring.py`**
  - Keyword matching
  - Rating boost
  - Sales boost
  - Ngưỡng filtering

- [ ] **Add filters:**
  - Filter by category
  - Filter by price range
  - Filter by book_id (context)

- [ ] **Test with filters**
  ```python
  results = retriever.search(
      query="web development",
      filters={"category": "Technology", "max_price": 500000}
  )
  ```

---

## 📋 PHASE 4: RAG PIPELINE & LLM

### 4.1 LLM Client

- [ ] **Implement `app/services/llm_client.py`**
  - Initialize ChatGoogleGenerativeAI
  - `chat(messages) -> str`
  - Error handling
  - Retry logic

- [ ] **Test LLM**
  ```python
  response = llm_client.chat([
      {"role": "user", "content": "Hello"}
  ])
  print(response)
  ```

### 4.2 RAG Pipeline

- [ ] **Implement `app/services/rag_pipeline.py`**
  - Build context từ search results
  - Create prompt template
  - LangChain integration
  - Parse citations

- [ ] **Design System Prompt**
  - Role definition
  - Guidelines
  - Output format
  - Anti-hallucination rules

- [ ] **Test RAG end-to-end**
  ```python
  answer = rag_pipeline.answer(
      question="Tìm sách về Python",
      search_results=[...]
  )
  print(answer)
  ```

### 4.3 Intent Classification

- [ ] **Implement `app/services/intent_classifier.py`**
  - Classify: search, recommendation, comparison, greeting, etc.
  - Rule-based hoặc LLM-based

- [ ] **Test intent classification**

---

## 📋 PHASE 5: API ENDPOINTS

### 5.1 Core Endpoints

- [ ] **`GET /health`**
  - Check service status
  - Check DB connection
  - Check Gemini API

- [ ] **`POST /chat`**
  - Request: ChatRequest
  - Response: ChatResponse
  - Full RAG pipeline
  - Handle context (book_id)

- [ ] **`POST /search`**
  - Semantic search
  - Return scored books

- [ ] **`POST /recommend`**
  - User-based recommendation
  - Similar books

### 5.2 Test APIs

- [ ] **Test với Swagger UI** (http://localhost:8000/docs)

- [ ] **Test với curl:**
  ```bash
  # Chat
  curl -X POST http://localhost:8000/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Tìm sách về lập trình Python"}'
  
  # Search
  curl -X POST http://localhost:8000/search \
    -H "Content-Type: application/json" \
    -d '{"query": "machine learning", "top_k": 5}'
  ```

- [ ] **Test error cases:**
  - Empty message
  - Invalid book_id
  - Rate limit exceeded

---

## 📋 PHASE 6: SPRING BOOT INTEGRATION

### 6.1 Backend Changes

- [ ] **Thêm `AIServiceController.java`**
  - Proxy endpoints
  - RestTemplate configuration

- [ ] **Update `application.properties`**
  ```properties
  ai.service.url=http://localhost:8000
  ai.service.enabled=true
  ai.service.timeout=30000
  ```

- [ ] **Thêm webhook trong BookService**
  - Trigger sync khi create/update book
  - Async call

- [ ] **Test integration**
  ```bash
  # Từ Spring Boot, gọi AI service
  curl http://localhost:8080/api/ai/chat \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello"}'
  ```

### 6.2 Authentication

- [ ] **Generate JWT token từ Spring Boot**
  - User ADMIN
  - Long expiration (30 days)

- [ ] **Configure trong Python AI service**
  - Add token vào .env
  - Use trong BackendClient

- [ ] **Test authenticated calls**

---

## 📋 PHASE 7: FRONTEND (REACT)

### 7.1 Chatbot Widget

- [ ] **Tạo `frontend/src/components/chatbot/ChatbotWidget.jsx`**
  - Floating button
  - Chat window UI
  - Message list
  - Input box
  - Send message logic

- [ ] **Tạo `frontend/src/components/chatbot/ChatbotWidget.css`**
  - Styling
  - Animations
  - Responsive

- [ ] **Tạo `frontend/src/api/aiService.js`**
  ```javascript
  export const sendChatMessage = async (message, bookId = null) => {
    const response = await axios.post('/api/ai/chat', {
      message,
      book_id: bookId,
      session_id: sessionStorage.getItem('chat_session')
    });
    return response.data;
  };
  ```

- [ ] **Test chatbot UI**
  - Open/close animation
  - Send message
  - Display response
  - Show book recommendations

### 7.2 Integration vào Pages

- [ ] **Thêm vào BookDetail.jsx**
  ```jsx
  <ChatbotWidget bookId={id} />
  ```

- [ ] **Thêm vào BookList.jsx** (optional)
  - General chatbot không có context

- [ ] **Thêm "Ask AI" button**

### 7.3 Smart Search

- [ ] **Tạo `SmartSearchBar.jsx`**
  - Input field
  - Search button
  - Results display
  - Loading state

- [ ] **Integrate vào Header/NavBar**

---

## 📋 PHASE 8: ADVANCED FEATURES

### 8.1 Recommendations

- [ ] **Implement personalized recommendations**
  - Based on purchase history
  - Based on wishlist
  - Similar books

- [ ] **Endpoint: `POST /recommend`**

- [ ] **UI: "Recommended for you" section**

### 8.2 Review Analysis

- [ ] **Create `book_review_vectors` table**

- [ ] **Implement review embedding**

- [ ] **Endpoint: `POST /analyze-reviews/{book_id}`**
  - Sentiment analysis
  - Topic extraction
  - Pros/Cons summary

- [ ] **UI: Show analysis in BookDetail**

### 8.3 Chat History

- [ ] **Create `chat_history` table**

- [ ] **Save chat messages**

- [ ] **Load chat history**
  - By session_id
  - By user_id

- [ ] **UI: Chat history panel**

### 8.4 Caching

- [ ] **Implement memory cache cho embeddings**

- [ ] **Implement Redis (optional)**

- [ ] **Cache search results**

---

## 📋 PHASE 9: TESTING & OPTIMIZATION

### 9.1 Testing

- [ ] **Unit tests (Python)**
  ```bash
  pytest tests/
  ```

- [ ] **Integration tests**

- [ ] **Manual test cases**
  - 20+ scenarios
  - Edge cases
  - Error handling

- [ ] **Load testing**
  ```bash
  # Sử dụng locust hoặc ab
  ab -n 1000 -c 10 http://localhost:8000/chat
  ```

### 9.2 Performance Optimization

- [ ] **Monitor response times**

- [ ] **Optimize vector search**
  - Index tuning
  - Limit results

- [ ] **Reduce API calls**
  - Caching
  - Batch processing

- [ ] **Profile slow queries**
  ```sql
  EXPLAIN ANALYZE SELECT ...
  ```

### 9.3 Error Handling

- [ ] **Graceful degradation**
  - Fallback khi AI service down
  - Default responses

- [ ] **User-friendly error messages**

- [ ] **Logging & monitoring**
  - Structured logging
  - Error tracking (Sentry optional)

---

## 📋 PHASE 10: DEPLOYMENT

### 10.1 Docker Setup

- [ ] **Tạo `Dockerfile`**
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY app ./app
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```

- [ ] **Tạo `compose.yaml`**

- [ ] **Build & test Docker image**
  ```bash
  docker build -t books-ai:latest .
  docker run -p 8000:8000 --env-file .env books-ai:latest
  ```

### 10.2 Production Checklist

- [ ] **Environment variables secured**
  - Không commit .env vào git
  - Use secrets management

- [ ] **Database connection pooling**

- [ ] **Rate limiting**
  - Per user
  - Per IP

- [ ] **CORS configured properly**

- [ ] **Health checks working**

- [ ] **Monitoring setup**
  - Uptime monitoring
  - Log aggregation

### 10.3 Deploy

- [ ] **Deploy Python AI service**
  - VPS / Cloud (Heroku, Railway, etc.)
  - Or keep local with ngrok for testing

- [ ] **Update Spring Boot config**
  - Point to production AI service URL

- [ ] **Deploy frontend**
  - Update API endpoints

- [ ] **Smoke tests on production**

---

## 📋 PHASE 11: DOCUMENTATION

- [ ] **README.md cho AI service**
  - Setup instructions
  - API documentation
  - Examples

- [ ] **API documentation (Swagger)**
  - Auto-generated from FastAPI

- [ ] **User guide**
  - How to use chatbot
  - Sample questions
  - Tips & tricks

- [ ] **Developer guide**
  - Architecture overview
  - Code structure
  - How to extend

---

## 🎯 FINAL CHECKS

- [ ] ✅ All tests passing
- [ ] ✅ Code reviewed
- [ ] ✅ Documentation complete
- [ ] ✅ Performance acceptable (<3s chat response)
- [ ] ✅ Security audit done
- [ ] ✅ User acceptance testing
- [ ] ✅ Monitoring & alerts configured
- [ ] ✅ Backup strategy defined
- [ ] ✅ Rollback plan ready

---

## 📊 SUCCESS METRICS

Sau khi deploy, track các metrics:

- [ ] **Usage:**
  - Number of chat messages/day
  - Active users
  - Popular queries

- [ ] **Performance:**
  - Average response time
  - Error rate
  - Uptime %

- [ ] **Business:**
  - Conversion rate (chat → purchase)
  - User satisfaction (ratings)
  - Cost per query

---

**Ghi chú:** 
- Checklist này có thể điều chỉnh tùy theo tiến độ thực tế
- Mỗi task nên được test kỹ trước khi chuyển sang task tiếp theo
- Commit code thường xuyên với message rõ ràng

**Good luck! 🚀**
