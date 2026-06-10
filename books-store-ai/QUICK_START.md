# 🚀 QUICK START GUIDE

## Bước 1: Lấy Google Gemini API Key (5 phút)

1. Truy cập: https://aistudio.google.com/
2. Đăng nhập bằng Google account
3. Click "Get API Key" → "Create API Key"
4. Copy API key

5. Mở file `.env` và thay thế:
```env
GOOGLE_API_KEY=YOUR_API_KEY_HERE
```
→ Paste API key vừa copy vào

## Bước 2: Test Server (1 phút)

```bash
# Mở terminal tại thư mục books-store-ai
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai

# Activate virtual environment
source venv/bin/activate

# Chạy server
uvicorn app.main:app --reload --port 8000
```

Bạn sẽ thấy:
```
INFO:     Will watch for changes in these directories: ['/Users/...']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx]
🚀 Starting Books Store AI Chatbot v1.0.0
📊 Database: ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech
🤖 LLM Model: models/gemini-1.5-flash
📝 Embedding Model: models/text-embedding-004
🔧 Debug Mode: True
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Bước 3: Test Endpoints

### Mở browser:

1. **API Docs:** http://localhost:8000/docs
   - Interactive Swagger UI
   - Test API trực tiếp

2. **Root endpoint:** http://localhost:8000
   ```json
   {
     "name": "Books Store AI Chatbot",
     "version": "1.0.0",
     "status": "running",
     "docs": "/docs"
   }
   ```

3. **Health check:** http://localhost:8000/health
   ```json
   {
     "status": "healthy",
     "service": "Books Store AI Chatbot",
     "version": "1.0.0"
   }
   ```

### Hoặc dùng curl:

```bash
# Root
curl http://localhost:8000/

# Health
curl http://localhost:8000/health
```

## ✅ Nếu thấy kết quả trên → Phase 1 HOÀN THÀNH!

---

## Bước 4: Setup Database (Optional - cho Phase 2)

Nếu muốn tiếp tục Phase 2, cần setup database:

```bash
# Connect to PostgreSQL
psql "postgresql://neondb_owner:npg_N9hKEuY1iBsv@ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Run setup script
\i database_setup.sql
```

hoặc copy-paste từ file `SETUP_COMPLETE.md` section Database Setup.

---

## Troubleshooting

### Lỗi: "GOOGLE_API_KEY not found"
→ Kiểm tra file `.env` có đúng API key chưa

### Lỗi: "Address already in use"
→ Port 8000 đang được dùng, đổi port:
```bash
uvicorn app.main:app --reload --port 8001
```

### Lỗi khi import modules
→ Đảm bảo đang trong virtual environment:
```bash
source venv/bin/activate
which python  # Should point to venv/bin/python
```

### Server không tự reload khi sửa code
→ Đảm bảo chạy với flag `--reload`

---

## 🎉 Congratulations!

Bạn đã hoàn thành Phase 1: Setup & Foundation!

**Next:** Xem file `AI_IMPLEMENTATION_CHECKLIST.md` để tiếp tục Phase 2: Embedding Service.
