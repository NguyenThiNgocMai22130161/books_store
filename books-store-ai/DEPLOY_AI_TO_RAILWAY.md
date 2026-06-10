# 🚀 DEPLOY AI SERVICE LÊN RAILWAY

## ❌ VẤN ĐỀ
Railway đang build sai Dockerfile (Dockerfile của Spring Boot thay vì AI service)

## ✅ GIẢI PHÁP: Tạo repo GitHub riêng cho AI Service

---

## BƯỚC 1: Tạo repo mới trên GitHub (2 phút)

1. Mở trình duyệt, vào: https://github.com/new

2. Điền thông tin:
   - **Repository name**: `books-store-ai`
   - **Description**: `AI Chatbot Service for Books Store - FastAPI + Gemini`
   - **Public** ✓
   - ❌ KHÔNG chọn "Add a README file"
   - ❌ KHÔNG chọn ".gitignore"
   - ❌ KHÔNG chọn "license"

3. Click **Create repository**

4. **Để màn hình này mở**, copy URL repo: 
   ```
   https://github.com/NguyenThiNgocMai22130161/books-store-ai.git
   ```

---

## BƯỚC 2: Push code AI lên repo mới (3 phút)

Mở Terminal, chạy từng lệnh sau:

```bash
# 1. Vào thư mục AI
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai

# 2. Kiểm tra có git chưa
ls -la .git

# Nếu có .git folder, xóa đi (vì nó là embedded git)
rm -rf .git

# 3. Init git mới
git init

# 4. Tạo .gitignore (đã có sẵn rồi)
cat .gitignore

# 5. Add tất cả files
git add .

# 6. Commit
git commit -m "AI Service ready for Railway deployment"

# 7. Add remote (thay YOUR_URL bằng URL vừa copy)
git remote add origin https://github.com/NguyenThiNgocMai22130161/books-store-ai.git

# 8. Push lên GitHub
git branch -M main
git push -u origin main
```

**Kết quả mong đợi:**
```
Enumerating objects: 50, done.
Counting objects: 100% (50/50), done.
...
To https://github.com/NguyenThiNgocMai22130161/books-store-ai.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ **Reload trang GitHub, bạn sẽ thấy code đã lên!**

---

## BƯỚC 3: Deploy lên Railway (5 phút)

### 3.1. Xóa project cũ (nếu có)

1. Vào Railway dashboard: https://railway.app
2. Nếu có project AI đang failed → Click vào
3. Settings (bánh răng) → **Delete Project**

### 3.2. Tạo project mới

1. Click **New Project**
2. Chọn **Deploy from GitHub repo**
3. Nếu hỏi quyền: Click **Configure GitHub App** → Cho Railway quyền access repo `books-store-ai`
4. Chọn repo: **books-store-ai** (repo mới vừa tạo)
5. Click **Deploy Now**

Railway sẽ:
- ✓ Phát hiện Python project
- ✓ Dùng Nixpacks auto build
- ✓ Đọc `railway.json` 
- ✓ Tìm `requirements.txt`
- ✓ Build và deploy

### 3.3. Xem logs

Click vào **Deployments** → **View Logs**

Đợi khoảng 2-3 phút. Bạn sẽ thấy:
```
Building...
Installing Python dependencies...
Starting server...
✓ Deployment successful
```

---

## BƯỚC 4: Add Environment Variables (2 phút)

1. Click vào project AI trong Railway
2. Click tab **Variables**
3. Click **+ New Variable**
4. Add từng biến sau:

```bash
PG_DSN=postgresql://neondb_owner:npg_N9hKEuY1iBsv@ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

GOOGLE_API_KEY=AIzaSyAV9D7pKjI5qC0HL0c8xd8Cc1_zy5gVD6Q

LLM_MODEL=models/gemini-2.5-flash

EMBED_MODEL=models/gemini-embedding-001

EMBED_DIM=3072

TOP_K_RESULTS=8

SCORE_THRESHOLD=0.3

TEMPERATURE=0.3

DEBUG=false

ENVIRONMENT=production
```

**Lưu ý:** Mỗi biến nhập riêng, không paste hết vào một lần.

5. Railway sẽ tự động redeploy sau khi add variables

---

## BƯỚC 5: Generate Domain và Test (2 phút)

### 5.1. Generate Domain

1. Trong Railway project → Tab **Settings**
2. Scroll xuống mục **Networking**
3. Click **Generate Domain**
4. Railway sẽ tạo URL kiểu: `https://books-store-ai-production.up.railway.app`

**Copy URL này!**

### 5.2. Test Health Endpoint

Mở Terminal:

```bash
# Thay YOUR_URL bằng URL vừa copy
curl https://books-store-ai-production.up.railway.app/health
```

**Kết quả mong đợi:**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-09T14:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "llm": "ready",
    "embeddings": "ready"
  }
}
```

✅ **Nếu thấy kết quả này = THÀNH CÔNG!**

### 5.3. Test Chat Endpoint

```bash
curl -X POST https://books-store-ai-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"xin chào","user_id":"test"}'
```

**Kết quả mong đợi:**
```json
{
  "answer": "Xin chào! Tôi là trợ lý AI của hiệu sách...",
  "sources": [...],
  "intent": "greeting",
  "session_id": "..."
}
```

✅ **AI Service đã LIVE!**

---

## BƯỚC 6: Copy URL để dùng cho Frontend/Backend

**Railway URL của bạn:**
```
https://books-store-ai-production.up.railway.app
```

**Dùng URL này để:**
- Cấu hình Frontend (.env.production)
- Cấu hình Backend (application.properties)

---

## 📊 CHECKLIST

- [ ] Tạo repo GitHub mới: books-store-ai
- [ ] Xóa embedded .git trong books-store-ai/
- [ ] Init git mới và push lên GitHub
- [ ] Xóa project Railway cũ (nếu có)
- [ ] Tạo project Railway mới từ repo books-store-ai
- [ ] Add environment variables (10 biến)
- [ ] Generate domain
- [ ] Test /health endpoint
- [ ] Test /api/chat endpoint
- [ ] Copy Railway URL

---

## ❓ TROUBLESHOOTING

### Issue: git push bị rejected

**Lý do:** Remote đã có commits

**Fix:**
```bash
git push -f origin main
```

### Issue: Railway build failed

**Lý do:** Thiếu dependencies

**Fix:**
- Kiểm tra `requirements.txt` có đầy đủ
- Xem logs Railway để biết thiếu gì

### Issue: Health check failed

**Lý do:** Thiếu environment variables

**Fix:**
- Kiểm tra đã add đủ 10 biến chưa
- Đặc biệt: PG_DSN, GOOGLE_API_KEY

### Issue: API 500 error

**Lý do:** Database connection failed

**Fix:**
- Test Neon DB còn hoạt động không
- Kiểm tra PG_DSN đúng format

---

## 🎉 HOÀN THÀNH!

AI Service của bạn đã live tại:
```
https://books-store-ai-production.up.railway.app
```

**Next steps:**
1. Deploy Frontend lên Vercel
2. Deploy Backend lên Railway (hoặc dùng IntelliJ local)
3. Connect tất cả services với nhau

---

**Thời gian tổng:** ~15 phút
**Status:** Production Ready ✅
