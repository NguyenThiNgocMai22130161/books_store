# TỔNG HỢP ĐỒ ÁN: BOOKS STORE AI CHATBOT

---

## 1. TỔNG QUAN ĐỒ ÁN

Đây là dịch vụ AI Backend (microservice) được xây dựng bằng Python, phục vụ ứng dụng bán sách **Books Store**. Service này chạy độc lập, giao tiếp với Backend chính (Spring Boot) và cung cấp các tính năng thông minh cho người dùng.

**Mục tiêu:** Xây dựng một AI Chatbot tích hợp kỹ thuật RAG (Retrieval-Augmented Generation) để tư vấn và gợi ý sách thông minh dựa trên thông tin sách thực tế, không "bịa" thông tin.

**Trạng thái:** Phase 1-5 hoàn thành ✅ (8/6/2026)  
**Dữ liệu:** 500 sách đã được ingested với embeddings  
**Tests:** 6/6 tests passed  
**Response time:** 1.5-3.5s (acceptable)

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Tổng thể (Microservice Architecture)

```
[React Frontend :5173]
        |
        | HTTP Request
        v
[Spring Boot Backend :8080]
        | (AIController)
        | RestTemplate
        v
[Python AI Service - FastAPI :8000]
        |                    |
        |                    | Fetch sách
        v                    v
[PostgreSQL + pgvector]   [PostgreSQL DB]
(book_vectors table)      (books table - 500 sách)
(Lưu Vector Embeddings)
        |
        | API Call
        v
[Google Gemini API]
(Embedding-001 3072d + Gemini 2.5 Flash LLM)
```

### 2.2 Luồng RAG Pipeline (Luồng chính)

```
User gửi câu hỏi về sách
       |
       v
[1] Embed câu hỏi → Vector 3072d (Gemini Embedding-001)
       |
       v
[2] Vector Search (pgvector cosine distance) → Lấy các sách liên quan
       |
       v
[3] Hybrid Scoring (Vector + Keyword + Rating + Sales)
       |
       v
[4] Build Context từ top 5 sách + System Prompt
       |
       v
[5] Gửi Context + Câu hỏi vào Gemini 2.5 Flash LLM
       |
       v
[6] Trả về: Câu trả lời (tiếng Việt) + Danh sách sách gợi ý (có giá)
```

---

## 3. CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Python 3.9+ |
| Web Framework | FastAPI + Uvicorn |
| AI / LLM | Google Gemini 2.5 Flash |
| Embedding Model | Google `embedding-001` (3072 chiều) |
| Orchestration AI | Direct Google GenerativeAI SDK |
| Vector Database | PostgreSQL + pgvector 0.8.0 |
| DB Driver | psycopg2-binary |
| HTTP Client | httpx (async) |
| Backend Integration | Spring Boot 3.2.0 (Java 17) |
| Data Validation | Pydantic v2, pydantic-settings |
| Testing | Custom test suite với colorama |

---

## 4. CẤU TRÚC THƯ MỤC

```
books-store-ai/
├── app/
│   ├── main.py                  # Entry point, FastAPI App, CORS, Router registration
│   ├── core/
│   │   ├── config.py            # Settings (pydantic-settings từ .env)
│   │   └── logging.py           # Structured logging
│   ├── models/
│   │   └── schemas.py           # Pydantic Request/Response models
│   ├── routers/
│   │   ├── chat.py              # POST /api/chat, /api/search, /api/similar
│   │   └── ingest.py            # POST /ingest - đồng bộ dữ liệu sách
│   ├── services/
│   │   ├── embedder.py          # Gemini embedding-001 (3072d)
│   │   ├── retriever.py         # pgvector search + hybrid scoring
│   │   ├── rag_pipeline.py      # RAG orchestration + prompt engineering
│   │   └── llm_client.py        # Gemini 2.5 Flash client
│   ├── clients/
│   │   └── backend_client.py    # Database client (direct access)
│   └── utils/
│       └── text_processing.py   # Text cleaning & processing
├── .env                         # Environment variables
├── requirements.txt             # Python dependencies
├── test_phase3.py              # Comprehensive test suite
├── PHASE1_COMPLETE.md          # Phase 1 completion report
├── PHASE2_PROGRESS.md          # Phase 2 progress report
├── PHASE3_COMPLETE.md          # Phase 3 completion report
└── database_setup.sql          # Database schema

src/main/java/.../books_store/   # Spring Boot Backend
├── controller/
│   └── AIController.java        # AI proxy endpoints
├── service/
│   └── AIService.java           # RestTemplate to Python service
└── dto/
    ├── AIChatRequest.java       # Request DTOs
    ├── AIChatResponse.java      # Response DTOs
    └── AISearchRequest.java     # Search DTOs

docs/                            # Documentation
├── AI_CHATBOT_DESIGN.md        # Complete design document (17 sections)
├── AI_IMPLEMENTATION_CHECKLIST.md  # Phase-by-phase checklist
├── PHASE5_SPRING_INTEGRATION.md    # Spring Boot integration guide
└── AI_PROJECT_SUMMARY.md           # Complete project summary
```
├── requirements.txt             # Danh sách thư viện Python
└── .github/workflows/ci.yml     # CI/CD pipeline
```

---

## 5. CHI TIẾT CÁC THÀNH PHẦN

### 5.1 `app/core/config.py` — Cấu hình hệ thống

Dùng `pydantic-settings` để đọc biến môi trường từ file `.env`. Các cấu hình quan trọng:

| Biến | Mô tả | Mặc định |
|---|---|---|
| `GOOGLE_API_KEY` | API Key của Google Gemini | (bắt buộc) |
| `PG_DSN` | Connection string PostgreSQL | `postgresql://postgres:postgres@localhost:5432/newsapp` |
| `BACKEND_BASE` | URL của Spring Boot Backend | `http://localhost:8080` |
| `JAVA_ACCESS_TOKEN` | JWT Token để gọi API Backend | (bắt buộc) |
| `LLM_MODEL` | Model Gemini dùng để chat | `models/gemini-flash-latest` |
| `EMBED_PROVIDER` | Provider embedding: `gemini` hoặc `hf` | `gemini` |
| `EMBED_MODEL_GEMINI` | Model embedding của Gemini | `models/text-embedding-004` |
| `EMBED_MODEL_HF` | Model HuggingFace (nếu dùng local) | `intfloat/multilingual-e5-base` |
| `EMBED_DIM` | Số chiều vector | `768` |
| `TOP_K_FINAL` | Số lượng kết quả tối đa trả về | `8` |
| `HYBRID_ALPHA` | Trọng số vector vs BM25 | `0.6` |
| `ARTICLE_DETAIL_BASE_URL` | Base URL để tạo link bài báo | `http://...` |

---

### 5.2 `app/services/embedder.py` — Tạo Vector Embedding

Hỗ trợ 2 provider, cấu hình qua biến `EMBED_PROVIDER`:

- **`gemini`** (mặc định): Gọi `GoogleGenerativeAIEmbeddings` của LangChain, dùng model `text-embedding-004`, tạo vector 768 chiều. Yêu cầu `GOOGLE_API_KEY`.
- **`hf`**: Dùng `SentenceTransformer` chạy local, model `intfloat/multilingual-e5-base`. Không cần API Key nhưng cần tài nguyên máy tính.

Hàm chính: `encode(texts: list[str]) -> list[list[float]]`

---

### 5.3 `app/services/retriever.py` — Tìm kiếm Vector

Hàm `hybrid_search(query, article_id, filters)`:

1. Embed câu hỏi của user thành vector.
2. Thực hiện câu SQL trên PostgreSQL dùng pgvector để tính **cosine similarity** (`<=>` operator).
3. Có thể lọc theo `article_id` cụ thể (dùng khi user đang đọc 1 bài báo).
4. JOIN với bảng `articles` và `users` để lấy thêm title, ảnh, tác giả.
5. Trả về danh sách chunks cùng metadata.

**Schema bảng DB:**
```sql
CREATE TABLE article_chunks (
    id SERIAL PRIMARY KEY,
    article_id INT,
    chunk_text TEXT,
    embedding vector(768)
);
```

---

### 5.4 `app/services/llm_client.py` — Kết nối LLM

- Khởi tạo `ChatGoogleGenerativeAI` (Gemini) với `temperature=0.3` (thấp để trả lời thực tế, không sáng tạo quá).
- `max_retries=5` để tự retry khi bị rate limit.
- Hàm `chat(messages)` dùng cho các tác vụ không cần RAG (ví dụ: tóm tắt văn bản tự do).

---

### 5.5 `app/services/rag_pipeline.py` — Luồng RAG

Xây dựng prompt bằng LangChain `ChatPromptTemplate`, chain theo pattern: `Prompt | LLM | OutputParser`.

**Prompt System được thiết kế:**
- Xử lý 3 loại input: câu hỏi xã giao, câu hỏi về bài báo, yêu cầu tóm tắt.
- Nếu không có thông tin trong context → báo "không tìm thấy" thay vì bịa.
- Luôn trả lời cùng ngôn ngữ với người dùng.

Hàm `answer(question, chunks, context)` trả về `{"answer": "...", "citations": ["article_id:33"]}`.

---

### 5.6 `app/routers/qa.py` — Endpoint Chatbot (Luồng chính)

`POST /qa` với body `{"question": "...", "articleId": 123, "filters": {}}`:

1. Gọi `hybrid_search` để lấy chunks liên quan từ DB.
2. **Lọc và Scoring:**
   - Ngưỡng `SCORE_THRESHOLD = 0.3` — loại bỏ kết quả rác.
   - **Keyword Boosting**: Mỗi từ trong câu hỏi khớp với nội dung chunk → +0.2 điểm. Không khớp → -0.5 điểm.
   - Lấy 3 nguồn tham khảo có điểm cao nhất.
3. **Fallback**: Nếu không tìm thấy gì trong DB và có `articleId`, gọi thẳng sang Spring Boot lấy nội dung bài đó.
4. Gọi `rag_pipeline.answer()` để LLM trả lời.
5. **Quyết định hiện link tham khảo**: Nếu AI trả lời "không tìm thấy thông tin" → ẩn link. Nếu có câu trả lời thực tế → hiện link.

**Response model:**
```json
{
  "answer": "Nội dung câu trả lời...",
  "related_articles": [
    {
      "id": 33,
      "title": "Tên bài báo",
      "link": "http://.../api/articles/33",
      "score": 0.85
    }
  ]
}
```

---

### 5.7 `app/routers/ingest.py` — Đồng bộ dữ liệu

- `POST /ingest/sync`: Kích hoạt Background Task đồng bộ toàn bộ bài báo từ Spring Boot.
  - Tự động tạo bảng `article_chunks` và extension `vector` nếu chưa có.
  - Delay 2 giây/bài để tránh bị Gemini API rate limit (429).
  - Bỏ qua bài đã tồn tại trong DB.
- `POST /ingest/{article_id}`: Ingest một bài cụ thể theo ID.

**Dữ liệu mỗi bài khi ingest:**
`search_text = title + summary + content[:8000]` → embed → lưu vào DB.

---

### 5.8 `app/clients/backend_client.py` — Giao tiếp Spring Boot

Các hàm async gọi API Spring Boot:

| Hàm | Mô tả |
|---|---|
| `get_article_by_id(id)` | Lấy 1 bài báo theo ID |
| `get_all_articles_custom()` | Lấy tất cả bài báo (hỗ trợ phân trang Spring Boot) |
| `get_chunks_by_article(id)` | Lấy chunks của 1 bài (ít dùng) |

Tất cả đều dùng Bearer Token (`JAVA_ACCESS_TOKEN`) để xác thực.

---

## 6. API ENDPOINTS

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/health` | Kiểm tra service đang chạy |
| `POST` | `/qa` | **Chatbot hỏi đáp** (endpoint chính) |
| `POST` | `/search` | Tìm kiếm ngữ nghĩa bài báo |
| `POST` | `/ingest/sync` | Đồng bộ toàn bộ dữ liệu (background) |
| `POST` | `/ingest/{id}` | Ingest 1 bài báo theo ID |
| `POST` | `/sync` | Nhận tín hiệu sync từ Spring Boot |
| `GET` | `/debug/models` | Xem danh sách Gemini models có sẵn |
| `GET` | `/docs` | Swagger UI tự động |

---

## 7. CÀI ĐẶT VÀ TRIỂN KHAI

### 7.1 Yêu cầu

- Docker & Docker Compose
- Google Gemini API Key (lấy tại [Google AI Studio](https://aistudio.google.com/))
- PostgreSQL với extension `pgvector` đã cài
- Spring Boot Backend đang chạy

### 7.2 Cấu hình file `.env`

```env
# AI
GOOGLE_API_KEY=your_gemini_api_key_here

# Database
PG_DSN=postgresql://postgres:postgres@localhost:5432/newsapp

# Backend Spring Boot
BACKEND_BASE=http://localhost:8080
JAVA_ACCESS_TOKEN=your_jwt_token_here

# Embedding (tuỳ chọn)
EMBED_PROVIDER=gemini
EMBED_MODEL_HF=intfloat/multilingual-e5-base
EMBED_DIM=768

# Link bài báo hiển thị cho user
ARTICLE_DETAIL_BASE_URL=http://your-server:8080/api/articles
```

### 7.3 Chạy môi trường Development (Hot-reload)

```bash
docker compose -f compose.dev.yaml up --build
```
- Code trong `app/` được mount vào container → sửa code tự reload ngay.
- API chạy tại: `http://localhost:8000`

### 7.4 Chạy môi trường Production

```bash
docker compose -f compose.yaml up -d
```
- Restart tự động với policy `unless-stopped`.
- Kết nối DB qua `host.docker.internal` (khi DB chạy trên máy host).

### 7.5 Cài đặt thủ công (không dùng Docker)

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 8. DATABASE

### Bảng `article_chunks` (PostgreSQL + pgvector)

```sql
-- Cần cài extension trước
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE article_chunks (
    id         SERIAL PRIMARY KEY,
    article_id INT,           -- Liên kết với bảng articles của Spring Boot
    chunk_text TEXT,          -- Nội dung đoạn văn đã được xử lý
    embedding  vector(768)    -- Vector 768 chiều từ Gemini text-embedding-004
);
```

Retriever dùng toán tử `<=>` (cosine distance) của pgvector để tìm kiếm tương đồng.

---

## 9. ĐIỂM NỔI BẬT KỸ THUẬT

1. **Hybrid Scoring**: Kết hợp điểm cosine similarity từ vector search với keyword matching để tăng độ chính xác.

2. **Graceful Fallback**: Nếu vector search không có kết quả, tự động lấy nội dung bài báo trực tiếp từ Spring Boot API.

3. **Anti-Hallucination**: Logic quyết định ẩn/hiện link tham khảo dựa trên nội dung câu trả lời của AI — không hiển thị link nếu AI không tìm thấy thông tin.

4. **Rate Limit Handling**: Retry tự động khi gặp lỗi 429 từ Gemini API, có delay giữa các lần ingest.

5. **Dual Embed Provider**: Có thể chuyển đổi giữa Gemini API (online, chất lượng cao) và HuggingFace SentenceTransformers (offline, không cần API Key) chỉ bằng 1 biến môi trường.

6. **Background Tasks**: Việc ingest/sync toàn bộ bài báo chạy nền, không block API response.

---

## 10. KHÓ KHĂN VÀ GIẢI PHÁP

| Vấn đề | Giải pháp |
|---|---|
| Gemini API bị rate limit (429) khi ingest nhiều bài | Thêm `time.sleep(2)` giữa mỗi bài, retry loop 3 lần |
| Kết quả search không liên quan (điểm cao nhưng nội dung sai) | Thêm Keyword Boosting: cộng/trừ điểm dựa trên số từ khớp |
| AI trả lời câu chào hỏi nhưng vẫn kèm link bài báo | Phân tích câu trả lời AI, ẩn link nếu phát hiện tín hiệu "không tìm thấy" |
| Docker container không kết nối được với DB/Backend trên máy host | Dùng `host.docker.internal` thay cho `localhost` trong Docker Compose |
| Spring Boot trả về dữ liệu phân trang | Xử lý cả 2 dạng: `list` và `{"content": [...], ...}` |

---

## 11. HƯỚNG ĐỀ XUẤT MỞ RỘNG CHO ĐỒ ÁN MỚI

Dựa trên hệ thống này, có thể tái sử dụng hoặc mở rộng:

- **Thay đổi domain**: Thay bài báo bằng tài liệu học thuật, văn bản pháp luật, FAQ sản phẩm → RAG hoạt động tương tự.
- **Thêm lịch sử hội thoại**: Tích hợp `ConversationBufferMemory` của LangChain để chatbot nhớ context qua nhiều lượt hỏi.
- **Tóm tắt tự động**: Endpoint `/summarize` đã có schema chuẩn bị sẵn, chỉ cần implement service.
- **Streaming response**: FastAPI hỗ trợ `StreamingResponse` + LangChain streaming để trả lời real-time.
- **Re-ranking**: Thêm bước cross-encoder reranking sau vector search để tăng chất lượng.
- **Multi-language**: Model `intfloat/multilingual-e5-base` đã hỗ trợ đa ngôn ngữ sẵn.
