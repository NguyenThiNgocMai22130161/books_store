# 🚀 QUICK REFERENCE - FULL STACK DEPLOYMENT

## 📝 TL;DR - Deploy trong 30 phút

### Services & URLs:
```
Frontend:   Vercel      → https://[your-app].vercel.app
Backend:    Railway     → https://[your-app].up.railway.app  
AI Service: Railway     → https://[your-app].up.railway.app
Database:   Neon Cloud  → Already configured ✅
```

---

## ⚡ PHASE 1: AI Service (5 min)

```bash
# 1. Push code
cd books-store-ai
git init && git add . && git commit -m "AI ready"
git remote add origin https://github.com/YOU/books-store-ai.git
git push -u origin main

# 2. Deploy Railway
# → https://railway.app → New Project → GitHub → books-store-ai

# 3. Add env vars:
PG_DSN=postgresql://...
GOOGLE_API_KEY=your_key
LLM_MODEL=models/gemini-2.5-flash
EMBED_MODEL=models/gemini-embedding-001
DEBUG=false

# 4. Get URL: Settings → Generate Domain
```

**AI URL:** `https://books-ai-[random].up.railway.app`

---

## ⚡ PHASE 2: Spring Boot Backend (10 min)

```bash
# 1. Build JAR (IntelliJ recommended)
# IntelliJ → Build → Build Project
# Maven → Lifecycle → package
# JAR ở: target/*.jar

# 2. Push code
cd /path/to/books_store
git init && git add . && git commit -m "Backend ready"
git remote add origin https://github.com/YOU/books-store-backend.git
git push -u origin main

# 3. Deploy Railway
# → New Project → GitHub → books-store-backend

# 4. Add env vars:
AI_SERVICE_URL=https://books-ai-[...].up.railway.app
CORS_ORIGINS=http://localhost:5173
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=npg_...

# 5. Get URL: Settings → Generate Domain
```

**Backend URL:** `https://books-backend-[random].up.railway.app`

---

## ⚡ PHASE 3: React Frontend (5 min)

```bash
# 1. Create .env.production
cd frontend
echo 'VITE_API_BASE_URL=https://books-backend-[...].up.railway.app' > .env.production
echo 'VITE_AI_API_URL=https://books-ai-[...].up.railway.app' >> .env.production

# 2. Build
npm run build

# 3. Deploy Vercel
npm install -g vercel
vercel login
vercel --prod

# OR: Push to GitHub → Vercel dashboard → Import

# 4. Add env vars in Vercel:
VITE_API_BASE_URL=https://books-backend-[...].up.railway.app
VITE_AI_API_URL=https://books-ai-[...].up.railway.app
```

**Frontend URL:** `https://[your-app].vercel.app`

---

## ⚡ PHASE 4: Final Config (5 min)

```bash
# 1. Update Backend CORS
# Railway → books-store-backend → Variables
CORS_ORIGINS=https://[your-app].vercel.app,http://localhost:5173

# 2. Redeploy Backend
# Railway → books-store-backend → Deploy

# 3. Test everything
curl https://books-ai-[...].up.railway.app/health
curl https://books-backend-[...].up.railway.app/api/books
curl https://[your-app].vercel.app
```

---

## ✅ VERIFICATION CHECKLIST

### AI Service:
- [ ] Health check: `https://[AI-URL]/health`
- [ ] Chat test: `curl -X POST [AI-URL]/api/chat -d '{"message":"hi"}'`

### Backend:
- [ ] Health check: `https://[BACKEND-URL]/actuator/health`
- [ ] Books API: `https://[BACKEND-URL]/api/books`

### Frontend:
- [ ] Homepage loads
- [ ] Login works
- [ ] Books display
- [ ] AI Chat works
- [ ] Search works

---

## 🔧 COMMON ISSUES

### Issue: Backend won't compile (Lombok)
**Fix:** Build với IntelliJ IDEA
1. Open project in IntelliJ
2. Install Lombok plugin (Settings → Plugins)
3. Enable annotation processing (Settings → Build → Compiler → Annotation Processors)
4. Build → Build Project
5. Maven → package
6. Use JAR from target/

### Issue: CORS error
**Fix:** Add Frontend URL to Backend CORS_ORIGINS
```
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Issue: AI timeout
**Fix:** Check Railway logs, verify Google API key, check quota

### Issue: Database connection failed
**Fix:** Verify Neon connection string, check database not sleeping

---

## 📊 COST

| Service | Platform | Cost/Month |
|---------|----------|------------|
| Frontend | Vercel | FREE |
| AI Service | Railway | FREE ($5 credit) |
| Backend | Railway | $10 |
| Database | Neon | FREE (0.5GB) |
| **TOTAL** | | **$10** |

---

## 🎯 ENVIRONMENT VARIABLES REFERENCE

### AI Service (Railway):
```bash
PG_DSN=postgresql://neondb_owner:npg_...@ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
GOOGLE_API_KEY=AIza...
LLM_MODEL=models/gemini-2.5-flash
EMBED_MODEL=models/gemini-embedding-001
EMBED_DIM=3072
TOP_K_RESULTS=8
SCORE_THRESHOLD=0.3
TEMPERATURE=0.3
DEBUG=false
ENVIRONMENT=production
```

### Backend (Railway):
```bash
AI_SERVICE_URL=https://books-ai-production.up.railway.app
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=npg_N9hKEuY1iBsv
SPRING_JPA_HIBERNATE_DDL_AUTO=update
```

### Frontend (Vercel):
```bash
VITE_API_BASE_URL=https://books-backend-production.up.railway.app
VITE_AI_API_URL=https://books-ai-production.up.railway.app
```

---

## 📞 SUPPORT

**Detailed Guides:**
- Full guide: `FULL_STACK_DEPLOYMENT.md`
- AI only: `books-store-ai/DEPLOY_QUICK_START.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`

**Platform Docs:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Neon: https://neon.tech/docs

---

## 🎉 SUCCESS!

When all done:
```
✅ Frontend live at: https://[your-app].vercel.app
✅ Backend live at: https://[backend].up.railway.app
✅ AI Service live at: https://[ai].up.railway.app
✅ Database: Neon Cloud connected
✅ Full stack deployed! 🚀
```

**Total time:** ~30 minutes
**Cost:** ~$10/month
**Status:** Production-ready! ✅
