# 🚀 OPTIMIZATION GUIDE

## 📋 Overview

Hướng dẫn tối ưu hóa hiệu suất cho AI Service (Books Store)

**Target Metrics:**
- Chat response: <2s (currently: 1.5-3.5s)
- Search response: <1s (currently: 0.5-1s)
- Similar books: <0.5s (currently: 0.3-0.5s)
- Cache hit rate: >70%
- Success rate: >99%

---

## ⚡ Current Performance Status

### Strengths ✅
- Vector search is fast (50-100ms)
- Cache works well (hit rate ~80%)
- Database queries optimized
- Error handling robust

### Areas for Improvement ⚠️
- LLM response time varies (1-3s)
- No Redis cache (only in-memory)
- Sequential processing in some places
- No CDN for static assets

---

## 🎯 Optimization Strategies

### 1. Database Optimizations

#### 1.1 Add Missing Indexes
```sql
-- book_vectors table
CREATE INDEX IF NOT EXISTS idx_book_vectors_embedding 
ON book_vectors USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For books with high ratings
CREATE INDEX IF NOT EXISTS idx_books_popular 
ON books(avg_rating DESC, total_orders DESC)
WHERE avg_rating >= 4.0;

-- For chat history queries
CREATE INDEX IF NOT EXISTS idx_chat_history_composite 
ON chat_history(user_id, created_at DESC);
```

#### 1.2 Query Optimization
```python
# Before: N+1 queries
for book_id in book_ids:
    book = get_book(book_id)

# After: Single query with JOIN
books = get_books_batch(book_ids)
```

#### 1.3 Connection Pooling
```python
from psycopg2 import pool

connection_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=20,
    dsn=settings.PG_DSN
)
```

---

### 2. Caching Improvements

#### 2.1 Implement Redis Cache
```bash
# Install Redis
pip install redis

# Configuration
REDIS_URL = "redis://localhost:6379"
REDIS_TTL = 3600
```

```python
import redis
import json

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# Cache embeddings
def get_embedding_cached(text):
    key = f"embed:{hash(text)}"
    cached = redis_client.get(key)
    
    if cached:
        return json.loads(cached)
    
    embedding = embedder.encode([text])[0]
    redis_client.setex(key, REDIS_TTL, json.dumps(embedding))
    return embedding
```

#### 2.2 Cache Warming
```python
# Warm up cache on startup
def warm_cache():
    """Pre-load popular books and queries"""
    # Cache top 50 popular books
    popular_books = get_popular_books(limit=50)
    for book in popular_books:
        cache_service.set_similar_books(book.id, get_similar(book.id))
    
    # Cache common queries
    common_queries = ["Python", "JavaScript", "Machine Learning"]
    for query in common_queries:
        cache_service.set_search_results(query, None, search(query))
```

#### 2.3 Cache Invalidation Strategy
```python
# Invalidate on data changes
def on_book_update(book_id):
    """Invalidate related cache when book updated"""
    cache_service.delete(f"similar:{book_id}")
    cache_service.delete(f"book:{book_id}")
    # Invalidate search results containing this book
    # (implement cache tagging)
```

---

### 3. API Response Optimization

#### 3.1 Async Processing
```python
import asyncio

# Before: Sequential
embedding = embedder.encode(text)  # 100ms
search_results = retriever.search(embedding)  # 50ms
llm_response = llm.generate(prompt)  # 2000ms

# After: Parallel where possible
async def process_chat(message):
    # Parallel: embedding + load context
    embedding_task = asyncio.create_task(get_embedding_async(message))
    context_task = asyncio.create_task(load_context_async())
    
    embedding, context = await asyncio.gather(embedding_task, context_task)
    
    # Then search and generate
    search_results = await search_async(embedding)
    response = await llm_generate_async(search_results, context)
    
    return response
```

#### 3.2 Streaming Responses
```python
from fastapi.responses import StreamingResponse

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream LLM response as it generates"""
    async def generate():
        async for chunk in llm_client.stream(prompt):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

#### 3.3 Response Compression
```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

---

### 4. LLM Optimization

#### 4.1 Reduce Token Usage
```python
# Before: Send all book details
context = "\n".join([
    f"Title: {b.title}, Author: {b.author}, Description: {b.description}..."
    for b in books
])

# After: Send only relevant fields
context = "\n".join([
    f"{b.title} by {b.author} ({b.category}) - {b.price}đ"
    for b in books
])
```

#### 4.2 Batch Processing
```python
# Process multiple questions in single LLM call when possible
def batch_classify_intents(messages: List[str]):
    prompt = f"""Classify the intent of each message:
    1. {messages[0]}
    2. {messages[1]}
    ...
    Return JSON array of intents."""
    
    return llm.generate(prompt)
```

#### 4.3 Use Smaller Models for Simple Tasks
```python
# For intent classification, use smaller model
SIMPLE_MODEL = "gemini-1.5-flash-8b"  # Faster, cheaper
COMPLEX_MODEL = "gemini-2.5-flash"    # Better quality

if task == "intent_classification":
    model = SIMPLE_MODEL
else:
    model = COMPLEX_MODEL
```

---

### 5. Vector Search Optimization

#### 5.1 HNSW Index (if scaling to 10k+ books)
```sql
-- Create HNSW index for faster approximate search
CREATE INDEX book_vectors_hnsw_idx 
ON book_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Set search parameters
SET hnsw.ef_search = 100;
```

#### 5.2 Reduce Vector Dimension (if needed)
```python
# Use PCA to reduce from 3072d to 768d
from sklearn.decomposition import PCA

pca = PCA(n_components=768)
reduced_embeddings = pca.fit_transform(embeddings_3072d)
```

#### 5.3 Pre-filter Before Vector Search
```python
# Before: Search all books, then filter
results = vector_search(query, top_k=100)
filtered = [r for r in results if r.category == category]

# After: Filter first, then search
results = vector_search_with_filter(
    query, 
    top_k=10,
    where={"category": category}
)
```

---

### 6. Code-Level Optimizations

#### 6.1 Use Connection Pooling
```python
# app/core/database.py
from psycopg2 import pool

class DatabasePool:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.pool = pool.ThreadedConnectionPool(
                minconn=5,
                maxconn=20,
                dsn=settings.PG_DSN
            )
        return cls._instance
    
    def get_connection(self):
        return self.pool.getconn()
    
    def return_connection(self, conn):
        self.pool.putconn(conn)
```

#### 6.2 Lazy Loading
```python
# Don't load everything upfront
class Book:
    def __init__(self, id):
        self.id = id
        self._details = None
    
    @property
    def details(self):
        if self._details is None:
            self._details = load_book_details(self.id)
        return self._details
```

#### 6.3 Batch Database Operations
```python
# Before: Multiple inserts
for message in messages:
    save_message(message)

# After: Batch insert
save_messages_batch(messages)
```

---

### 7. Monitoring & Profiling

#### 7.1 Add Performance Logging
```python
import functools
import time
import logging

def log_performance(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        
        if duration > 1.0:  # Log slow operations
            logging.warning(
                f"SLOW: {func.__name__} took {duration:.2f}s"
            )
        
        return result
    return wrapper

@log_performance
def expensive_operation():
    # ...
```

#### 7.2 Use APM Tools
```python
# Sentry for error tracking
import sentry_sdk
sentry_sdk.init(dsn="...")

# Or: New Relic, DataDog, etc.
```

#### 7.3 Profile Code
```python
# Use cProfile for bottleneck detection
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Run code to profile
chat_endpoint(request)

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)
```

---

### 8. Infrastructure Optimization

#### 8.1 Use CDN
```javascript
// Serve static assets from CDN
<script src="https://cdn.example.com/app.js"></script>
<link href="https://cdn.example.com/styles.css" />
```

#### 8.2 Load Balancing
```nginx
# nginx.conf
upstream ai_backend {
    least_conn;
    server ai1.example.com:8000;
    server ai2.example.com:8000;
    server ai3.example.com:8000;
}

server {
    location /api/ {
        proxy_pass http://ai_backend;
    }
}
```

#### 8.3 Rate Limiting
```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

@app.on_event("startup")
async def startup():
    await FastAPILimiter.init(redis_client)

@router.post("/chat")
@limiter.limit("10/minute")
async def chat(request: Request):
    # ...
```

---

## 📊 Benchmark Results

### Before Optimization
| Metric | Value |
|--------|-------|
| Chat Response | 2.5s avg |
| Search Response | 0.8s avg |
| Similar Books | 0.4s avg |
| Cache Hit Rate | 65% |
| Throughput | 3 req/s |

### After Optimization (Target)
| Metric | Target | Improvement |
|--------|--------|-------------|
| Chat Response | <2s | 20%+ faster |
| Search Response | <0.5s | 37%+ faster |
| Similar Books | <0.3s | 25%+ faster |
| Cache Hit Rate | >80% | +15% |
| Throughput | >10 req/s | 3x better |

---

## ✅ Implementation Checklist

### Quick Wins (1-2 hours)
- [ ] Add database indexes
- [ ] Enable response compression
- [ ] Implement cache warming
- [ ] Add performance logging
- [ ] Optimize LLM prompts (reduce tokens)

### Medium Effort (1-2 days)
- [ ] Implement Redis cache
- [ ] Add connection pooling
- [ ] Batch database operations
- [ ] Implement async processing
- [ ] Add rate limiting

### Long Term (1+ week)
- [ ] Implement streaming responses
- [ ] Set up load balancer
- [ ] Deploy CDN
- [ ] Add APM monitoring
- [ ] Scale to multiple instances

---

## 🧪 Testing Optimizations

### Test Performance Before/After
```bash
# Before optimization
python monitor_performance.py --interval 5

# Make optimization changes

# After optimization
python monitor_performance.py --interval 5

# Compare results
```

### Run Load Test
```bash
# Test with 20 concurrent users
python load_test.py --users 20 --requests 10

# Check results:
# - Success rate should be >95%
# - Average response should improve
# - Throughput should increase
```

---

## 📝 Monitoring Dashboard

### Key Metrics to Track
1. **Response Times** (p50, p95, p99)
2. **Error Rate** (<1% target)
3. **Cache Hit Rate** (>70% target)
4. **Database Connection Pool** (usage)
5. **Memory Usage** (<80% target)
6. **CPU Usage** (<70% target)
7. **Request Rate** (req/s)
8. **LLM Token Usage** (cost optimization)

### Tools
- Custom: `monitor_performance.py`
- APM: Sentry, New Relic, DataDog
- Database: pg_stat_statements
- System: htop, vmstat

---

## 🎯 Priority Recommendations

### P0 (Critical - Do First)
1. ✅ Add database indexes
2. ✅ Enable GZip compression
3. ✅ Optimize LLM prompts
4. ✅ Add performance logging

### P1 (High Priority)
1. ⏳ Implement Redis cache
2. ⏳ Add connection pooling
3. ⏳ Batch database operations
4. ⏳ Cache warming on startup

### P2 (Nice to Have)
1. ⏭️ Streaming responses
2. ⏭️ CDN for static assets
3. ⏭️ Load balancer setup
4. ⏭️ Multi-instance deployment

---

## 📚 Resources

- **FastAPI Performance**: https://fastapi.tiangolo.com/deployment/concepts/
- **PostgreSQL Optimization**: https://wiki.postgresql.org/wiki/Performance_Optimization
- **Redis Caching**: https://redis.io/docs/manual/patterns/
- **Vector Search**: https://github.com/pgvector/pgvector#performance

---

**Last Updated:** June 8, 2026  
**Version:** 1.0.0
