# 🔧 FIX AI CHAT ISSUES

## ❌ VẤN ĐỀ HIỆN TẠI

1. **Chat trả lời: "Xin lỗi, tôi không thể trả lời câu hỏi này."**
2. **Similar Books endpoint trả về 404**

---

## 🔍 NGUYÊN NHÂN

### Issue 1: Chat không trả lời
**Root cause:** `llm_client.generate()` có try-except che lỗi thật

**File:** `app/services/llm_client.py` line 62

```python
except Exception as e:
    logger.error(f"Generation error: {type(e).__name__}: {str(e)}")
    return "Xin lỗi, tôi không thể trả lời câu hỏi này."  # ← Che lỗi thật!
```

**Lỗi có thể là:**
- ❌ Gemini API key hết quota
- ❌ Gemini API key không hợp lệ
- ❌ Model name sai
- ❌ Rate limit exceeded

### Issue 2: Similar Books 404
**Root cause:** Test script gọi sai endpoint

- Endpoint thực tế: `/api/similar` ✅
- Test script gọi: `/similar` ❌ (thiếu `/api`)

---

## ✅ GIẢI PHÁP

### Fix 1: Xem lỗi thật của Gemini API

**Bước 1:** Xem server logs

Mở terminal đang chạy AI service, tìm dòng:
```
Generation error: ...
```

**Bước 2:** Check API key

```bash
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai

# Xem API key hiện tại
cat .env | grep GOOGLE_API_KEY
```

**Bước 3:** Test API key trực tiếp

```bash
# Activate venv
source venv/bin/activate

# Chạy test
python << 'EOF'
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GOOGLE_API_KEY')

print(f"Testing API Key: {api_key[:20]}...")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('models/gemini-2.5-flash')
    response = model.generate_content("Xin chào")
    print("\n✅ SUCCESS!")
    print(f"Response: {response.text[:100]}...")
except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}")
    print(f"Message: {str(e)}")
EOF
```

**Các lỗi thường gặp:**

#### Lỗi: "Quota exceeded" hoặc 429
```
ResourceExhausted: 429 Quota exceeded
```

**Fix:** Đợi hoặc dùng API key mới

#### Lỗi: "API key not valid"
```
InvalidArgument: 400 API key not valid
```

**Fix:** Check API key đúng chưa, tạo key mới tại: https://aistudio.google.com/app/apikey

#### Lỗi: "Model not found"
```
NotFound: 404 models/gemini-2.5-flash not found
```

**Fix:** Đổi model name trong `.env`:
```bash
LLM_MODEL=models/gemini-1.5-flash
# hoặc
LLM_MODEL=gemini-1.5-flash
```

---

### Fix 2: Update similar books test

**File:** `quick_test.py`

Sửa dòng gọi similar books endpoint:

**Sai:**
```python
response = requests.post(f"{BASE_URL}/similar", ...)  # ❌
```

**Đúng:**
```python
response = requests.post(f"{BASE_URL}/api/similar", ...)  # ✅
```

---

## 🚀 HÀNH ĐỘNG NGAY

### Option A: Fix API Key (Nếu lỗi Gemini)

```bash
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai

# 1. Get API key mới từ: https://aistudio.google.com/app/apikey

# 2. Update .env
nano .env

# Thay dòng:
GOOGLE_API_KEY=your_new_key_here

# Save: Ctrl+O, Enter, Ctrl+X

# 3. Restart server
pkill -f "uvicorn"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option B: Đổi Model (Nếu model not found)

```bash
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai

nano .env

# Thay dòng:
LLM_MODEL=models/gemini-1.5-flash
# hoặc
LLM_MODEL=gemini-1.5-flash

# Save và restart
pkill -f "uvicorn"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option C: Debug Mode (Xem lỗi chi tiết)

Temporary fix để xem lỗi thật:

```bash
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai

# Edit llm_client.py
nano app/services/llm_client.py

# Tìm dòng 62, sửa:
except Exception as e:
    logger.error(f"Generation error: {type(e).__name__}: {str(e)}")
    logger.exception("Full traceback:")
    raise  # ← Thêm dòng này để xem lỗi thật
```

Rồi restart và xem lỗi:
```bash
pkill -f "uvicorn"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal khác
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai
source venv/bin/activate
python quick_test.py
```

---

## 📊 CHECKLIST

Làm theo thứ tự:

- [ ] **Bước 1:** Xem server logs, tìm dòng "Generation error"
- [ ] **Bước 2:** Chạy test API key trực tiếp (script ở trên)
- [ ] **Bước 3:** Nếu lỗi quota/key → Get API key mới
- [ ] **Bước 4:** Nếu lỗi model → Đổi model name
- [ ] **Bước 5:** Update .env với key/model mới
- [ ] **Bước 6:** Restart AI service
- [ ] **Bước 7:** Test lại với quick_test.py

---

## 🎯 QUICK TEST COMMANDS

```bash
# Terminal 1: Server logs
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Test
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai
source venv/bin/activate

# Test health
curl http://localhost:8000/health

# Test chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"xin chào","user_id":"test"}'

# Test search
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"sách lập trình","top_k":5}'

# Test similar books (FIX ENDPOINT)
curl -X POST http://localhost:8000/api/similar \
  -H "Content-Type: application/json" \
  -d '{"book_id":1,"top_k":5}'
```

---

## 💡 LƯU Ý

1. **API Key Gemini:**
   - Free tier: 60 requests/minute
   - Nếu hết quota → đợi 1 phút hoặc dùng key mới
   - Get key: https://aistudio.google.com/app/apikey

2. **Model Names:**
   - ✅ `models/gemini-1.5-flash` (stable)
   - ✅ `gemini-1.5-flash` (shorter)
   - ❓ `models/gemini-2.5-flash` (có thể chưa available)

3. **Server Logs:**
   - Luôn xem logs để biết lỗi thật
   - Lỗi bị che bởi try-except
   - Thêm `raise` để debug

---

**Làm theo checklist và báo tôi kết quả nhé!** 🚀
