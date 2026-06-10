# 🚀 PRODUCTION DEPLOYMENT GUIDE

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Option 1: Railway.app (Free - Recommended)](#option-1-railwayapp)
3. [Option 2: Render.com (Free)](#option-2-rendercom)
4. [Option 3: Docker VPS](#option-3-docker-vps)
5. [Option 4: AWS/GCP/Azure](#option-4-cloud-platforms)
6. [Post-Deployment](#post-deployment)

---

## ✅ Yêu Cầu Hệ Thống

### Minimum Requirements:
- **CPU**: 1 vCore
- **RAM**: 512MB (recommended 1GB)
- **Storage**: 2GB
- **Python**: 3.10+
- **PostgreSQL**: 14+ (đã có Neon Cloud)

### Dependencies:
- Docker & Docker Compose (nếu dùng Docker)
- Git
- Google Gemini API Key (đã có)
- Domain name (optional)

---

## 🎯 OPTION 1: Railway.app (RECOMMENDED)

### ✨ Ưu điểm:
- ✅ **FREE** $5/month credit
- ✅ Auto deploy từ GitHub
- ✅ SSL miễn phí
- ✅ Dễ setup (5 phút)
- ✅ Logs real-time
- ✅ Auto scaling

### 📝 Các bước:

#### 1. Chuẩn bị code

```bash
cd books-store-ai

# Tạo file railway.json
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Tạo nixpacks.toml
cat > nixpacks.toml << 'EOF'
[phases.setup]
nixPkgs = ["python311", "postgresql"]

[phases.install]
cmds = ["pip install -r requirements.txt"]

[start]
cmd = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
EOF
```

#### 2. Push lên GitHub

```bash
# Init git nếu chưa có
git init
git add .
git commit -m "Prepare for Railway deployment"

# Tạo repo mới trên GitHub: books-store-ai
# Rồi push:
git remote add origin https://github.com/YOUR_USERNAME/books-store-ai.git
git branch -M main
git push -u origin main
```

#### 3. Deploy trên Railway

1. Vào https://railway.app
2. Sign up/Login với GitHub
3. Click "New Project"
4. Chọn "Deploy from GitHub repo"
5. Chọn repo `books-store-ai`
6. Railway sẽ tự động detect Python và deploy

#### 4. Cấu hình Environment Variables

Trong Railway dashboard:
- Click vào service → Variables
- Add các biến sau:

```bash
PG_DSN=postgresql://neondb_owner:npg_N9hKEuY1iBsv@ep-holy-rain-aokglcju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
GOOGLE_API_KEY=YOUR_API_KEY
LLM_MODEL=models/gemini-2.5-flash
EMBED_MODEL=models/gemini-embedding-001
EMBED_DIM=3072
TOP_K_RESULTS=8
SCORE_THRESHOLD=0.3
TEMPERATURE=0.3
DEBUG=false
ENVIRONMENT=production
BACKEND_BASE_URL=https://your-backend.railway.app
```

#### 5. Xem logs và test

```bash
# Sau khi deploy xong, Railway sẽ cho bạn URL:
# https://books-store-ai-production.up.railway.app

# Test:
curl https://YOUR-APP.railway.app/health
```

### 🎉 XONG! Deploy trong 5 phút!

---

## 🌐 OPTION 2: Render.com

### ✨ Ưu điểm:
- ✅ FREE tier (750 giờ/tháng)
- ✅ Auto deploy
- ✅ SSL miễn phí
- ✅ Easy setup

### 📝 Các bước:

#### 1. Tạo render.yaml

```bash
cd books-store-ai

cat > render.yaml << 'EOF'
services:
  - type: web
    name: books-store-ai
    runtime: python
    region: singapore
    plan: free
    branch: main
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: PG_DSN
        sync: false
      - key: GOOGLE_API_KEY
        sync: false
      - key: LLM_MODEL
        value: models/gemini-2.5-flash
      - key: EMBED_MODEL
        value: models/gemini-embedding-001
      - key: EMBED_DIM
        value: 3072
      - key: DEBUG
        value: false
      - key: ENVIRONMENT
        value: production
EOF
```

#### 2. Push lên GitHub (giống Railway)

#### 3. Deploy trên Render

1. Vào https://render.com
2. Sign up/Login
3. New → Web Service
4. Connect GitHub repo
5. Render tự động detect `render.yaml`
6. Add environment variables
7. Click "Create Web Service"

### ⏰ Note: Free tier "spins down" sau 15 phút không dùng

---

## 🐳 OPTION 3: Docker trên VPS

### Yêu cầu:
- VPS/Server với Docker installed
- Ubuntu 20.04+ hoặc tương đương

### 📝 Các bước:

#### 1. Setup VPS

```bash
# SSH vào VPS
ssh root@your-server-ip

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Clone code

```bash
git clone https://github.com/YOUR_USERNAME/books-store-ai.git
cd books-store-ai
```

#### 3. Cấu hình .env

```bash
cp .env.production .env
nano .env  # Điền các giá trị
```

#### 4. Build và Run

```bash
# Build image
docker-compose build

# Run
docker-compose up -d

# Check logs
docker-compose logs -f ai-service

# Test
curl http://localhost:8000/health
```

#### 5. Setup Nginx + SSL (optional)

```bash
# Cài Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Tạo Nginx config
sudo nano /etc/nginx/sites-available/books-ai

# Paste config:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/books-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL
sudo certbot --nginx -d your-domain.com
```

### ✅ XONG! AI service chạy trên VPS với SSL!

---

## ☁️ OPTION 4: Cloud Platforms

### AWS (Elastic Beanstalk)

```bash
# Cài EB CLI
pip install awsebcli

# Init
eb init -p python-3.11 books-store-ai --region ap-southeast-1

# Create environment
eb create books-store-ai-prod

# Deploy
eb deploy

# Set env vars
eb setenv PG_DSN=xxx GOOGLE_API_KEY=xxx

# Open
eb open
```

### Google Cloud (Cloud Run)

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/books-ai

# Deploy
gcloud run deploy books-ai \
  --image gcr.io/PROJECT_ID/books-ai \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars="PG_DSN=xxx,GOOGLE_API_KEY=xxx"
```

---

## ✅ POST-DEPLOYMENT

### 1. Kiểm tra Health

```bash
curl https://your-app-url.com/health

# Response:
{
  "status": "healthy",
  "service": "Books Store AI Chatbot",
  "version": "1.0.0"
}
```

### 2. Test Chat Endpoint

```bash
curl -X POST https://your-app-url.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"xin chào","user_id":"test"}'
```

### 3. Cập nhật Frontend

Sửa file `frontend/src/services/aiService.js`:

```javascript
// Trước (development):
const API_URL = 'http://localhost:8000';

// Sau (production):
const API_URL = 'https://your-app-url.com';
```

### 4. Setup Monitoring

- Railway/Render: Built-in monitoring
- VPS: Cài Prometheus + Grafana
- Cloud: CloudWatch/StackDriver

### 5. Setup Alerts

- Uptime monitoring: UptimeRobot, Pingdom
- Error tracking: Sentry
- Performance: New Relic, DataDog

---

## 🔒 SECURITY CHECKLIST

- [ ] HTTPS/SSL enabled
- [ ] Environment variables secure
- [ ] API key không commit vào Git
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Health check working
- [ ] Logs không chứa sensitive data
- [ ] Database connection encrypted (SSL)
- [ ] Firewall rules configured
- [ ] Regular backups enabled

---

## 📊 MONITORING

### Key Metrics:
- Response time: < 3s
- Error rate: < 1%
- Uptime: > 99%
- Memory usage: < 500MB
- CPU usage: < 70%

### Logs:
```bash
# Railway/Render: Web dashboard
# Docker: docker-compose logs -f
# Cloud: gcloud logs / aws logs
```

---

## 🚨 TROUBLESHOOTING

### Issue: Service không start
```bash
# Check logs
docker-compose logs ai-service

# Common fixes:
# 1. Check .env file
# 2. Verify database connection
# 3. Check API key
# 4. Check port 8000 available
```

### Issue: Slow response
```bash
# Check resources
docker stats

# Solutions:
# 1. Increase workers
# 2. Add Redis cache
# 3. Optimize queries
# 4. Enable CDN
```

### Issue: Out of memory
```bash
# Reduce workers in Dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

---

## 💰 COST ESTIMATES

### Free Tier:
- **Railway**: $5 credit/month (enough for hobby project)
- **Render**: 750 hours/month (auto sleep after 15min)
- **Fly.io**: 3 VMs free

### Paid Tier:
- **Railway**: ~$10/month (always on)
- **Render**: ~$7/month (Starter)
- **Digital Ocean**: $6/month (1GB RAM)
- **AWS/GCP**: ~$20-50/month

---

## 🎯 RECOMMENDED SETUP

**Cho học tập/demo:**
→ Railway.app FREE tier

**Cho production nhỏ:**
→ Railway.app $10/month

**Cho production lớn:**
→ AWS/GCP với auto-scaling

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Check logs đầu tiên
2. Verify environment variables
3. Test local trước
4. Check deployment guide từng platform

---

**CHÚC BẠN DEPLOY THÀNH CÔNG!** 🚀
