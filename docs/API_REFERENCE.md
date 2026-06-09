# 📡 API REFERENCE - Books Store AI

## 📋 Overview

Complete API reference for Books Store AI Service.

**Base URL:** `http://localhost:8000`  
**API Version:** 1.0.0  
**Content-Type:** `application/json`

---

## 🔐 Authentication

Currently, authentication is handled at the nginx/proxy level. For direct API access:

```bash
# No authentication required for development
curl http://localhost:8000/health

# For production with API key (if enabled)
curl -H "X-API-Key: your_api_key" http://localhost:8000/api/chat
```

---

## 📚 Core Endpoints

### 1. Health Check

**GET /health**

Kiểm tra trạng thái service.

**Response:**
```json
{
  "status": "healthy",
  "service": "Books Store AI",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2026-06-08T10:30:00Z"
}
```

**Example:**
```bash
curl http://localhost:8000/health
```

---

### 2. Chat Endpoint

**POST /api/chat**

Gửi tin nhắn cho AI chatbot và nhận phản hồi với gợi ý sách.

**Request Body:**
```json
{
  "message": "string (required)",
  "session_id": "string (optional)",
  "book_id": "integer (optional)",
  "category": "string (optional)"
}
```

**Response:**
```json
{
  "answer": "string",
  "sources": [
    {
      "book_id": "integer",
      "title": "string",
      "author": "string",
      "price": "float",
      "score": "float"
    }
  ],
  "intent": "string",
  "session_id": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm sách về lập trình Python cho người mới",
    "session_id": "user123-session"
  }'
```

**Response Example:**
```json
{
  "answer": "Tôi gợi ý cho bạn một số sách Python phù hợp cho người mới bắt đầu...",
  "sources": [
    {
      "book_id": 45,
      "title": "Python Crash Course",
      "author": "Eric Matthes",
      "price": 450000,
      "score": 0.92
    },
    {
      "book_id": 67,
      "title": "Automate the Boring Stuff",
      "author": "Al Sweigart",
      "price": 380000,
      "score": 0.88
    }
  ],
  "intent": "book_search",
  "session_id": "user123-session"
}
```

**Parameters:**
- `message` (required): Câu hỏi hoặc yêu cầu của người dùng
- `session_id` (optional): ID phiên chat để theo dõi ngữ cảnh
- `book_id` (optional): ID sách để cung cấp ngữ cảnh cụ thể
- `category` (optional): Lọc theo thể loại

**Status Codes:**
- `200`: Success
- `400`: Bad request (empty message)
- `422`: Validation error
- `500`: Server error

---

### 3. Semantic Search

**POST /api/search**

Tìm kiếm sách bằng ngữ nghĩa (không chỉ từ khóa).

**Request Body:**
```json
{
  "query": "string (required)",
  "top_k": "integer (default: 5)",
  "category": "string (optional)",
  "min_price": "float (optional)",
  "max_price": "float (optional)"
}
```

**Response:**
```json
{
  "results": [
    {
      "book_id": "integer",
      "title": "string",
      "author": "string",
      "price": "float",
      "category": "string",
      "score": "float"
    }
  ],
  "total": "integer",
  "query": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "top_k": 5,
    "category": "Technology",
    "max_price": 500000
  }'
```

**Status Codes:**
- `200`: Success
- `422`: Validation error

---

### 4. Similar Books

**POST /api/similar**

Tìm sách tương tự dựa trên vector similarity.

**Request Body:**
```json
{
  "book_id": "integer (required)",
  "top_k": "integer (default: 6)"
}
```

**Response:**
```json
{
  "reference_book_id": "integer",
  "similar_books": [
    {
      "book_id": "integer",
      "title": "string",
      "author": "string",
      "price": "float",
      "category": "string",
      "score": "float"
    }
  ],
  "total": "integer"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/similar \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": 33,
    "top_k": 6
  }'
```

**Status Codes:**
- `200`: Success
- `404`: Book not found
- `422`: Validation error

---

## 🎯 Advanced Features (Phase 8)

### 5. Personalized Recommendations

**GET /api/recommendations/{user_id}**

Gợi ý sách cá nhân hóa dựa trên lịch sử người dùng.

**Path Parameters:**
- `user_id` (required): ID người dùng

**Query Parameters:**
- `limit` (default: 10): Số lượng gợi ý
- `exclude_owned` (default: true): Loại trừ sách đã mua

**Response:**
```json
{
  "user_id": "integer",
  "recommendations": [
    {
      "book_id": "integer",
      "title": "string",
      "author": "string",
      "price": "float",
      "similarity_score": "float",
      "avg_rating": "float"
    }
  ],
  "total": "integer",
  "personalized": true
}
```

**Example:**
```bash
curl http://localhost:8000/api/recommendations/1?limit=5&exclude_owned=true
```

---

### 6. Chat History

**GET /api/history/session/{session_id}**

Lấy lịch sử chat của một phiên.

**Path Parameters:**
- `session_id` (required): ID phiên chat

**Query Parameters:**
- `limit` (default: 50): Số lượng tin nhắn

**Response:**
```json
{
  "session_id": "string",
  "messages": [
    {
      "id": "integer",
      "role": "user|assistant",
      "message": "string",
      "intent": "string",
      "sources": "array",
      "created_at": "timestamp"
    }
  ],
  "total": "integer"
}
```

**Example:**
```bash
curl http://localhost:8000/api/history/session/user123-session
```

---

**GET /api/history/user/{user_id}**

Lấy lịch sử chat của người dùng.

**Path Parameters:**
- `user_id` (required): ID người dùng

**Query Parameters:**
- `days` (default: 30): Số ngày nhìn lại
- `limit` (default: 100): Số lượng tin nhắn

**Example:**
```bash
curl http://localhost:8000/api/history/user/1?days=7&limit=50
```

---

**DELETE /api/history/session/{session_id}**

Xóa lịch sử chat của một phiên.

**Response:**
```json
{
  "message": "Session deleted successfully",
  "session_id": "string"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/history/session/user123-session
```

---

### 7. Review Analysis

**GET /api/reviews/analyze/{book_id}**

Phân tích đánh giá sách bằng AI.

**Path Parameters:**
- `book_id` (required): ID sách

**Response:**
```json
{
  "book_id": "integer",
  "total_reviews": "integer",
  "sentiment_distribution": {
    "positive": "float",
    "neutral": "float",
    "negative": "float",
    "counts": {
      "positive": "integer",
      "neutral": "integer",
      "negative": "integer"
    }
  },
  "summary": "string",
  "pros": ["string"],
  "cons": ["string"],
  "key_themes": ["string"]
}
```

**Example:**
```bash
curl http://localhost:8000/api/reviews/analyze/33
```

**Response Example:**
```json
{
  "book_id": 33,
  "total_reviews": 25,
  "sentiment_distribution": {
    "positive": 72.0,
    "neutral": 20.0,
    "negative": 8.0
  },
  "summary": "Đa số độc giả đánh giá cao nội dung sách, đặc biệt là các ví dụ thực tế...",
  "pros": [
    "Nội dung dễ hiểu",
    "Ví dụ thực tế phong phú",
    "Thiết kế bìa đẹp"
  ],
  "cons": [
    "Giá hơi cao",
    "Thiếu bài tập thực hành"
  ],
  "key_themes": [
    "Lập trình Python",
    "Machine Learning",
    "Thực hành"
  ]
}
```

---

### 8. Cache Management

**GET /api/cache/stats**

Lấy thống kê cache.

**Response:**
```json
{
  "status": "ok",
  "cache": {
    "size": "integer",
    "hits": "integer",
    "misses": "integer",
    "hit_rate": "float",
    "total_requests": "integer"
  },
  "message": "string"
}
```

**Example:**
```bash
curl http://localhost:8000/api/cache/stats
```

---

**POST /api/cache/clear**

Xóa tất cả cache (admin only).

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/cache/clear
```

---

## 📊 Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Input validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service down |

---

## ⚡ Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/chat | 5 req/s | Per IP |
| /api/search | 10 req/s | Per IP |
| /api/* | 10 req/s | Per IP |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

---

## 🧪 Testing Examples

### Python

```python
import requests

# Chat
response = requests.post(
    "http://localhost:8000/api/chat",
    json={
        "message": "Tìm sách về Python",
        "session_id": "test-session"
    }
)
data = response.json()
print(data["answer"])

# Search
response = requests.post(
    "http://localhost:8000/api/search",
    json={
        "query": "machine learning",
        "top_k": 5
    }
)
results = response.json()["results"]
for book in results:
    print(f"{book['title']} - Score: {book['score']:.2f}")
```

### JavaScript

```javascript
// Chat
fetch('http://localhost:8000/api/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: 'Tìm sách về Python',
    session_id: 'test-session'
  })
})
.then(res => res.json())
.then(data => console.log(data.answer));

// Search
fetch('http://localhost:8000/api/search', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    query: 'machine learning',
    top_k: 5
  })
})
.then(res => res.json())
.then(data => console.log(data.results));
```

---

## 📝 OpenAPI Documentation

Interactive API documentation available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

---

## 🆘 Error Responses

### Validation Error (422)
```json
{
  "detail": [
    {
      "loc": ["body", "message"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Server Error (500)
```json
{
  "detail": "Internal server error",
  "error_id": "abc123",
  "timestamp": "2026-06-08T10:30:00Z"
}
```

---

## 📞 Support

For API issues or questions:
- Check interactive docs: http://localhost:8000/docs
- Review this documentation
- Contact development team

---

**Last Updated:** June 8, 2026  
**API Version:** 1.0.0
