# 🚀 QUICK START - DEPLOY LÊN RAILWAY (5 PHÚT)

## ✅ Cách nhanh nhất để deploy AI Chatbot lên production!

---

## BƯỚC 1: Chuẩn bị GitHub Repo (2 phút)

### 1.1. Tạo repo mới trên GitHub:
1. Vào https://github.com/new
2. Repository name: `books-store-ai`
3. Chọn **Public** (bắt buộc cho free tier)
4. Click "Create repository"

### 1.2. Push code lên GitHub:

```bash
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai

# Init git nếu chưa có
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - AI Chatbot ready for deployment"

# Add remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/books-store-ai.git

# Push
git branch -M main
git push -u origin main
```

---

## BƯỚC 2: Deploy lên Railway (3 phút)

### 2.1. Sign up Railway:
1. Vào https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway

### 2.2. Create New Project:
1. Click "New Project"
2. Chọn "Deploy from GitHub repo"
3. Chọn repo `books-store-ai`
4. Railway tự động detect và deploy!

### 2.3. Thêm Environment Variables:

Trong Railway dashboard:
1. Click vào service name
2. Click tab "Variables"
3. Add từng biến sau:

```bash
# Database (Neon Cloud - đã có)
PG_DSN
postgresql://neondb_owner:npg_N9hKEuY1iBsv@ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Google AI API Key (copy từ .env hiện tại)
GOOGLE_API_KEY
[PASTE_YOUR_KEY_HERE]

# Model Configuration
LLM_MODEL
models/gemini-2.5-flash

EMBED_MODEL
models/gemini-embedding-001

EMBED_DIM
3072

# RAG Settings
TOP_K_RESULTS
8

SCORE_THRESHOLD
0.3

TEMPERATURE
0.3

# Production Settings
DEBUG
false

ENVIRONMENT
production
```

### 2.4. Deploy lại:
1. Sau khi thêm variables
2. Click "Redeploy" (hoặc Railway tự deploy)
3. Đợi ~1-2 phút

---

## BƯỚC 3: Lấy Production URL

### 3.1. Get URL:
1. Trong Railway dashboard
2. Click tab "Settings"
3. Trong "Networking" section → "Generate Domain"
4. Copy URL (dạng: `books-store-ai-production.up.railway.app`)

### 3.2. Test API:

```bash
# Thay YOUR-APP bằng domain của bạn
curl https://YOUR-APP.up.railway.app/health

# Test chat
curl -X POST https://YOUR-APP.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"xin chào","user_id":"test"}'
```

---

## BƯỚC 4: Cập nhật Frontend

### 4.1. Sửa file aiService.js:

```bash
cd ../frontend/src/services
```

Mở `aiService.js` và sửa:

```javascript
// Trước:
const API_URL = 'http://localhost:8000';

// Sau:
const API_URL = 'https://YOUR-APP.up.railway.app';
// Thay YOUR-APP bằng domain Railway của bạn
```

### 4.2. Test trên frontend:

```bash
cd ../..
npm run dev
```

Mở browser → Test chatbot → Sẽ kết nối với API production! 🎉

---

## ✅ XONG RỒI! 

### 🎊 Bây giờ bạn có:
- ✅ AI Service chạy trên Railway (free)
- ✅ HTTPS/SSL tự động
- ✅ Auto deploy khi push GitHub
- ✅ Monitoring dashboard
- ✅ Production-ready!

---

## 📊 Monitoring & Logs

### Xem logs:
1. Railway dashboard → Service → "Logs" tab
2. Real-time logs streaming

### Xem metrics:
1. Railway dashboard → "Metrics" tab
2. CPU, Memory, Network usage

---

## 🔧 Troubleshooting

### Issue: Deploy failed
**Check:**
1. Railway logs → xem error message
2. Verify tất cả env variables đã điền
3. Check `requirements.txt` có đầy đủ

**Fix:**
```bash
# Re-deploy
git add .
git commit -m "Fix deployment"
git push
```

### Issue: 500 Error khi call API
**Check:**
1. Logs Railway → tìm Python error
2. Verify `GOOGLE_API_KEY` đúng
3. Verify `PG_DSN` kết nối được

**Fix:**
- Double check env variables
- Test API key locally trước

### Issue: Out of memory
**Solution:**
- Railway free tier: 512MB RAM
- Nếu vượt quá → Upgrade plan ($5/month = 1GB RAM)

---

## 💰 Cost

### Free Tier:
- **$5 credit/month** (enough cho hobby project)
- ~500-700 hours runtime
- Auto sleep after inactivity

### Để always-on:
- Upgrade to $10/month plan
- Unlimited runtime
- 1GB RAM, 1vCPU

---

## 🎯 Next Steps

### 1. Custom Domain (Optional):
1. Railway Settings → Networking
2. Add custom domain: `api.yourdomain.com`
3. Update DNS records

### 2. Deploy Frontend:
- Deploy React lên Vercel/Netlify
- Update `API_URL` to Railway domain

### 3. Setup Monitoring:
- Add UptimeRobot for uptime monitoring
- Add Sentry for error tracking

---

## 📞 Need Help?

### Common Issues:
- **Build fails**: Check `requirements.txt`
- **API errors**: Check env variables
- **Slow response**: Upgrade plan or optimize code

### Resources:
- Railway docs: https://docs.railway.app
- Discord support: https://discord.gg/railway
- Deployment guide: `PRODUCTION_DEPLOYMENT.md`

---

## 🎉 CHÚC MỪNG!

Bạn đã deploy thành công AI Chatbot lên production! 🚀

**Total time: ~5 phút**
**Cost: FREE** ($5 credit/month)
**Status: Production-ready!** ✅
