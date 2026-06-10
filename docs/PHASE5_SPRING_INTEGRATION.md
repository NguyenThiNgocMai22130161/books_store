# ✅ PHASE 5 - SPRING BOOT INTEGRATION

## 📋 Tổng quan

Phase 5 tích hợp AI service (Python FastAPI) vào Spring Boot backend, cho phép frontend gọi AI thông qua Spring Boot API.

**Ngày hoàn thành:** 8/6/2026  
**Trạng thái:** ✅ HOÀN THÀNH (Code ready, cần test khi chạy Spring Boot)

---

## 🎯 Các thành phần đã tạo

### 1. DTO Classes

#### `AIChatRequest.java`
Request cho chat endpoint
```java
{
    "message": "Tìm sách về Python",
    "bookId": null,
    "category": "Technology",
    "sessionId": "optional"
}
```

#### `AIChatResponse.java`
Response từ chat endpoint
```java
{
    "answer": "Tôi gợi ý...",
    "sources": [...],
    "intent": "search",
    "sessionId": "abc123"
}
```

#### `AISearchRequest.java`
Request cho search endpoint
```java
{
    "query": "machine learning",
    "topK": 5,
    "category": "Technology",
    "maxPrice": 500000
}
```

### 2. Service Layer

#### `AIService.java`
Service xử lý communication với Python AI service

**Methods:**
- `chat(AIChatRequest)` - Gọi `/api/chat`
- `search(AISearchRequest)` - Gọi `/api/search`
- `getSimilarBooks(bookId, topK)` - Gọi `/api/similar`
- `checkHealth()` - Gọi `/health`

**Features:**
- RestTemplate integration
- Proper headers (Content-Type: application/json)
- Error handling

### 3. Controller Layer

#### `AIController.java`
REST endpoints cho AI features

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/chat` | Chat with AI |
| POST | `/api/ai/search` | Semantic search |
| GET | `/api/ai/similar/{bookId}` | Similar books |
| GET | `/api/ai/health` | AI service health |

**Features:**
- `@CrossOrigin` enabled
- Error handling với fallback messages
- Proper HTTP status codes (500, 503)

### 4. Configuration

#### `application.properties`
```properties
# AI Service Configuration
ai.service.url=http://localhost:8000
ai.service.enabled=true
ai.service.timeout=30000
```

---

## 🔌 API Integration

### Architecture

```
Frontend (React)
    ↓
Spring Boot (8080)
    ↓ RestTemplate
Python AI Service (8000)
    ↓
PostgreSQL + Gemini AI
```

### Request Flow

1. **Frontend** gửi request đến Spring Boot
   ```javascript
   axios.post('/api/ai/chat', { message: "..." })
   ```

2. **Spring Boot** AIController nhận request
   ```java
   @PostMapping("/api/ai/chat")
   public ResponseEntity<AIChatResponse> chat(...)
   ```

3. **AIService** gọi Python service
   ```java
   restTemplate.postForObject("http://localhost:8000/api/chat", ...)
   ```

4. **Python AI Service** xử lý RAG pipeline
   - Embedder: Encode query
   - Retriever: Vector search
   - LLM: Generate answer

5. **Response** quay lại Frontend
   ```json
   {
     "answer": "...",
     "sources": [...]
   }
   ```

---

## 🧪 Testing

### Test AI Service Health

```bash
# Start Python AI service first
cd books-store-ai
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Start Spring Boot (in another terminal)
cd ..
./mvnw spring-boot:run

# Test health endpoint
curl http://localhost:8080/api/ai/health
```

**Expected:**
```json
{
  "status": "healthy",
  "service": "Books Store AI Chatbot",
  "version": "1.0.0"
}
```

### Test Chat Endpoint

```bash
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm sách về Python cho người mới bắt đầu",
    "category": "Technology"
  }'
```

**Expected:**
```json
{
  "answer": "Tôi gợi ý cho bạn...",
  "sources": [
    {
      "bookId": 33,
      "title": "Python Crash Course",
      "author": "Eric Matthes",
      "price": 450000,
      "score": 0.92
    }
  ],
  "intent": "search",
  "sessionId": "..."
}
```

### Test Search Endpoint

```bash
curl -X POST http://localhost:8080/api/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "topK": 5
  }'
```

### Test Similar Books

```bash
curl http://localhost:8080/api/ai/similar/33?topK=5
```

---

## 📊 Error Handling

### AI Service Down

**Scenario:** Python service không chạy

**Response:**
```json
{
  "answer": "Xin lỗi, AI service đang bận. Vui lòng thử lại sau.",
  "intent": "error"
}
```

**HTTP Status:** 500 Internal Server Error

### Invalid Request

**Scenario:** Message empty hoặc quá dài

**Response:** 
- Spring Boot validation sẽ reject
- Hoặc Python service trả về 422 Unprocessable Entity

### Timeout

**Scenario:** AI service response chậm

**Configuration:**
```properties
ai.service.timeout=30000  # 30 seconds
```

---

## 🔧 Configuration Options

### Development
```properties
ai.service.url=http://localhost:8000
ai.service.enabled=true
ai.service.timeout=30000
```

### Production (VPS/Cloud)
```properties
ai.service.url=http://your-ai-service.com:8000
ai.service.enabled=true
ai.service.timeout=30000
```

### Disable AI Features
```properties
ai.service.enabled=false
```

Then add conditional check trong controller:
```java
@Value("${ai.service.enabled}")
private boolean aiEnabled;

if (!aiEnabled) {
    return ResponseEntity.status(503).body("AI features disabled");
}
```

---

## 🚀 Next Steps

### Phase 6: Frontend Integration

#### 1. Create API Service

**File:** `frontend/src/api/aiService.js`

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/ai';

export const aiService = {
    // Chat with AI
    chat: async (message, bookId = null, category = null) => {
        const response = await axios.post(`${API_URL}/chat`, {
            message,
            bookId,
            category
        });
        return response.data;
    },
    
    // Semantic search
    search: async (query, topK = 5, filters = {}) => {
        const response = await axios.post(`${API_URL}/search`, {
            query,
            topK,
            ...filters
        });
        return response.data;
    },
    
    // Get similar books
    getSimilarBooks: async (bookId, topK = 5) => {
        const response = await axios.get(
            `${API_URL}/similar/${bookId}?topK=${topK}`
        );
        return response.data;
    },
    
    // Health check
    checkHealth: async () => {
        const response = await axios.get(`${API_URL}/health`);
        return response.data;
    }
};
```

#### 2. Create Chatbot Widget

**File:** `frontend/src/components/chatbot/ChatbotWidget.jsx`

**Features:**
- Floating button (bottom-right)
- Chat window UI
- Message history
- Send message
- Display recommendations
- Loading state
- Error handling

**Key features:**
```jsx
const [messages, setMessages] = useState([]);
const [input, setInput] = useState('');
const [loading, setLoading] = useState(false);
const [isOpen, setIsOpen] = useState(false);

const handleSend = async () => {
    // Add user message
    setMessages([...messages, { role: 'user', content: input }]);
    
    // Call AI
    setLoading(true);
    const response = await aiService.chat(input);
    setLoading(false);
    
    // Add AI response
    setMessages([...messages, 
        { role: 'user', content: input },
        { role: 'assistant', content: response.answer, sources: response.sources }
    ]);
};
```

#### 3. Create Smart Search Bar

**File:** `frontend/src/components/search/SmartSearchBar.jsx`

**Features:**
- Search input
- AI-powered suggestions
- Results display
- Filter by category/price

#### 4. Integration Points

**BookDetail.jsx:**
```jsx
import ChatbotWidget from '../chatbot/ChatbotWidget';

// In component
<ChatbotWidget bookId={id} />
```

**BookList.jsx:**
```jsx
import SmartSearchBar from '../search/SmartSearchBar';

// In component
<SmartSearchBar onSearch={handleAISearch} />
```

**Similar Books Section:**
```jsx
const [similarBooks, setSimilarBooks] = useState([]);

useEffect(() => {
    aiService.getSimilarBooks(bookId).then(data => {
        setSimilarBooks(data.similar_books);
    });
}, [bookId]);
```

---

## 📁 File Structure

```
src/main/java/myproject/study/books_store/
├── controller/
│   ├── AIController.java          ✅ NEW
│   ├── BookController.java
│   └── ...
├── service/
│   ├── AIService.java             ✅ NEW
│   ├── BookService.java
│   └── ...
├── dto/
│   ├── AIChatRequest.java         ✅ NEW
│   ├── AIChatResponse.java        ✅ NEW
│   ├── AISearchRequest.java       ✅ NEW
│   └── ...
└── ...

src/main/resources/
└── application.properties          ✅ UPDATED

frontend/src/
├── api/
│   └── aiService.js               ⏭️ TODO
├── components/
│   ├── chatbot/
│   │   └── ChatbotWidget.jsx     ⏭️ TODO
│   └── search/
│       └── SmartSearchBar.jsx    ⏭️ TODO
└── ...
```

---

## ✅ Checklist - Phase 5

### Spring Boot Integration
- [x] Create DTO classes
  - [x] AIChatRequest
  - [x] AIChatResponse
  - [x] AISearchRequest
- [x] Create AIService
  - [x] RestTemplate setup
  - [x] chat() method
  - [x] search() method
  - [x] getSimilarBooks() method
  - [x] checkHealth() method
- [x] Create AIController
  - [x] POST /api/ai/chat
  - [x] POST /api/ai/search
  - [x] GET /api/ai/similar/{id}
  - [x] GET /api/ai/health
- [x] Update application.properties
- [x] Error handling
- [x] CORS configuration

### Testing (TODO)
- [ ] Start Spring Boot
- [ ] Test health endpoint
- [ ] Test chat endpoint
- [ ] Test search endpoint
- [ ] Test similar books
- [ ] Test error cases
- [ ] Integration test with frontend

### Frontend Integration (TODO - Phase 6)
- [ ] Create aiService.js
- [ ] Create ChatbotWidget
- [ ] Create SmartSearchBar
- [ ] Integrate vào BookDetail
- [ ] Integrate vào BookList
- [ ] Test end-to-end

---

## 🎓 Best Practices

### 1. Error Handling
- **Always** provide fallback messages
- Use proper HTTP status codes
- Log errors for debugging
- Graceful degradation khi AI service down

### 2. Performance
- Consider caching common queries
- Set appropriate timeout (30s)
- Monitor response times
- Use async if possible

### 3. Security
- Validate input in Spring Boot
- Rate limiting (nếu cần)
- Authentication/Authorization (nếu cần)
- CORS properly configured

### 4. Monitoring
- Log all AI service calls
- Track response times
- Monitor error rates
- Alert on service down

---

## 🚦 Testing Instructions

### Start Both Services

**Terminal 1 - Python AI Service:**
```bash
cd books-store-ai
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Spring Boot:**
```bash
cd ..
./mvnw spring-boot:run
# Or: java -jar target/books-store-0.0.1-SNAPSHOT.jar
```

### Verify Services

```bash
# Check Python AI
curl http://localhost:8000/health

# Check Spring Boot proxy
curl http://localhost:8080/api/ai/health
```

### Test Integration

```bash
# Via Spring Boot
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AI"}'
```

---

## 📞 Troubleshooting

### AI Service Not Reachable

**Error:** `Connection refused to localhost:8000`

**Solutions:**
1. Check Python service is running: `curl http://localhost:8000/health`
2. Check firewall settings
3. Verify `ai.service.url` in application.properties

### Timeout Errors

**Error:** `Read timed out`

**Solutions:**
1. Increase timeout: `ai.service.timeout=60000`
2. Check AI service performance
3. Optimize Python service (caching, etc.)

### CORS Issues

**Error:** `CORS policy blocked`

**Solutions:**
1. Check `@CrossOrigin` trong AIController
2. Verify FastAPI CORS middleware
3. Update allowed origins

---

## 🎉 Summary

**Phase 5 Complete!**

✅ **Completed:**
- Spring Boot proxy layer for AI service
- DTO classes for requests/responses
- AIService with RestTemplate
- AIController with 4 endpoints
- Configuration in application.properties
- Error handling & fallback

⏭️ **Next Phase 6:**
- Frontend chatbot widget
- Smart search bar
- Integration với BookDetail/BookList
- End-to-end testing

🚀 **Ready to integrate AI features into React frontend!**

