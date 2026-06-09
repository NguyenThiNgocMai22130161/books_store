# 🚀 DEPLOYMENT GUIDE - AI SERVICE

## 📋 Overview

Hướng dẫn deploy AI Service lên production environment.

**Deployment Methods:**
1. ✅ **Docker** (Recommended)
2. ⏭️ Manual (Development only)
3. ⏭️ Cloud (AWS, GCP, Azure)

---

## 🎯 Prerequisites

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Git
- PostgreSQL (Neon Cloud hoặc self-hosted)
- Google Gemini API Key

### System Requirements
- **CPU:** 2+ cores
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 10GB+
- **Network:** Stable internet connection

---

## 🐳 Method 1: Docker Deployment (Recommended)

### Step 1: Prepare Environment

```bash
cd books-store-ai

# Copy environment template
cp .env.production .env

# Edit .env with production values
nano .env
```

**Required Environment Variables:**
```env
PG_DSN=postgresql://user:password@host:5432/db?sslmode=require
GOOGLE_API_KEY=your_api_key_here
BACKEND_BASE_URL=https://api.yourdomain.com
JWT_TOKEN=your_jwt_token_here
```

### Step 2: Build Docker Image

```bash
# Build the image
docker build -t books-ai:latest .

# Or use docker-compose
docker-compose build
```

### Step 3: Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f ai-service
```

### Step 4: Verify Deployment

```bash
# Run health check
./healthcheck.sh

# Test API
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

### Step 5: Run Setup Scripts

```bash
# Setup advanced features (Phase 8)
docker-compose exec ai-service python setup_advanced_features.py

# Optional: Warm up cache
docker-compose exec ai-service python -c "
from app.services.cache_service import cache_service
print('Cache warming...')
"
```

---

## 📦 Method 2: Manual Deployment

### Step 1: Setup Python Environment

```bash
# Install Python 3.11
python3 --version

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
# Copy and edit .env
cp .env.example .env
nano .env
```

### Step 3: Setup Database

```bash
# Run database setup
python setup_database.py

# Setup advanced features
python setup_advanced_features.py

# Verify setup
python verify_database.py
```

### Step 4: Start Service

```bash
# Development mode
uvicorn app.main:app --reload --port 8000

# Production mode (with multiple workers)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Step 5: Setup Process Manager (Production)

```bash
# Install supervisor
sudo apt-get install supervisor

# Create supervisor config
sudo nano /etc/supervisor/conf.d/books-ai.conf
```

**Supervisor Config:**
```ini
[program:books-ai]
directory=/path/to/books-store-ai
command=/path/to/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
user=appuser
autostart=true
autorestart=true
stderr_logfile=/var/log/books-ai.err.log
stdout_logfile=/var/log/books-ai.out.log
environment=PATH="/path/to/venv/bin"
```

```bash
# Start service
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start books-ai
```

---

## ☁️ Method 3: Cloud Deployment

### AWS Deployment

#### Using EC2

```bash
# 1. Launch EC2 instance (Ubuntu 22.04, t3.medium)
# 2. SSH into instance
ssh -i key.pem ubuntu@your-ec2-ip

# 3. Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# 4. Clone repository
git clone https://github.com/yourrepo/books-store-ai.git
cd books-store-ai

# 5. Configure and deploy
cp .env.production .env
nano .env
./deploy.sh production
```

#### Using ECS (Elastic Container Service)

```bash
# 1. Push image to ECR
aws ecr create-repository --repository-name books-ai
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

docker tag books-ai:latest <account-id>.dkr.ecr.<region>.amazonaws.com/books-ai:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/books-ai:latest

# 2. Create ECS task definition
# 3. Create ECS service
# 4. Configure Load Balancer
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# 1. Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/books-ai

# 2. Deploy to Cloud Run
gcloud run deploy books-ai \
  --image gcr.io/PROJECT_ID/books-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="PG_DSN=...,GOOGLE_API_KEY=..."
```

### Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add environment variables
railway variables set PG_DSN="..."
railway variables set GOOGLE_API_KEY="..."

# 5. Deploy
railway up
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| PG_DSN | ✅ | PostgreSQL connection string | postgresql://... |
| GOOGLE_API_KEY | ✅ | Google Gemini API key | AIza... |
| BACKEND_BASE_URL | ✅ | Spring Boot backend URL | http://localhost:8080 |
| JWT_TOKEN | ✅ | JWT for backend auth | eyJhbGc... |
| LLM_MODEL | ⏭️ | LLM model name | models/gemini-2.5-flash |
| EMBED_MODEL | ⏭️ | Embedding model | models/text-embedding-004 |
| ENVIRONMENT | ⏭️ | Environment name | production |
| LOG_LEVEL | ⏭️ | Logging level | INFO |
| WORKERS | ⏭️ | Number of workers | 4 |

### Nginx Configuration

**For production with HTTPS:**

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🧪 Testing Deployment

### Automated Tests

```bash
# Run comprehensive tests
python test_comprehensive.py

# Run load test
python load_test.py --users 10 --requests 5

# Monitor performance
python monitor_performance.py --interval 5
```

### Manual Tests

```bash
# 1. Health check
curl http://localhost:8000/health

# 2. Chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","session_id":"test"}'

# 3. Search endpoint
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Python programming","top_k":5}'

# 4. Similar books
curl -X POST http://localhost:8000/api/similar \
  -H "Content-Type: application/json" \
  -d '{"book_id":33,"top_k":5}'
```

---

## 📊 Monitoring

### Health Checks

```bash
# Automated health check
./healthcheck.sh

# Docker health status
docker-compose ps
docker inspect books-ai-service | grep Health

# Application logs
docker-compose logs -f --tail=100 ai-service
```

### Metrics to Monitor

1. **Response Times:**
   - Chat: <2s
   - Search: <1s
   - Similar books: <0.5s

2. **Success Rate:** >99%

3. **Cache Hit Rate:** >70%

4. **Resource Usage:**
   - CPU: <70%
   - Memory: <80%
   - Disk: <80%

5. **Error Rate:** <1%

### Monitoring Tools

- **Built-in:** `monitor_performance.py`
- **Docker:** `docker stats`
- **APM:** Sentry, New Relic, DataDog
- **Logs:** ELK Stack, Splunk

---

## 🔒 Security Checklist

### Pre-Deployment

- [ ] Remove all `.env` files from git
- [ ] Use strong passwords
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Use non-root user in Docker
- [ ] Scan for vulnerabilities

### Post-Deployment

- [ ] Change default credentials
- [ ] Enable monitoring/alerting
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Test disaster recovery
- [ ] Review access logs
- [ ] Update dependencies regularly

---

## 🔄 Maintenance

### Daily Tasks

```bash
# Check service health
./healthcheck.sh

# Check logs for errors
docker-compose logs --tail=1000 ai-service | grep ERROR

# Monitor resource usage
docker stats books-ai-service
```

### Weekly Tasks

```bash
# Update dependencies (if needed)
pip list --outdated

# Clean up old logs
find logs/ -name "*.log" -mtime +7 -delete

# Review performance metrics
python monitor_performance.py

# Check database performance
# Review slow queries
```

### Monthly Tasks

```bash
# Update Docker images
docker-compose pull
docker-compose up -d

# Backup database
pg_dump $PG_DSN > backup_$(date +%Y%m%d).sql

# Security audit
docker scan books-ai:latest

# Review and rotate logs
```

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs ai-service

# Common issues:
# 1. Missing environment variables
cat .env

# 2. Database connection failed
docker-compose exec ai-service python -c "
import psycopg2
conn = psycopg2.connect('$PG_DSN')
print('Connected!')
"

# 3. Port already in use
sudo lsof -i :8000
```

### Slow Performance

```bash
# 1. Check resource usage
docker stats

# 2. Monitor performance
python monitor_performance.py

# 3. Check database queries
# Enable slow query log in PostgreSQL

# 4. Review cache hit rate
curl http://localhost:8000/api/cache/stats
```

### High Memory Usage

```bash
# 1. Check memory usage
docker stats books-ai-service

# 2. Reduce workers
# Edit docker-compose.yml: --workers 2

# 3. Clear cache
curl -X POST http://localhost:8000/api/cache/clear

# 4. Restart service
docker-compose restart ai-service
```

---

## 📝 Rollback Procedure

```bash
# 1. Stop current deployment
docker-compose down

# 2. Revert to previous version
git checkout <previous-commit>

# 3. Rebuild and deploy
docker-compose build
docker-compose up -d

# 4. Verify
./healthcheck.sh
```

---

## 📞 Support

### Getting Help

1. Check logs: `docker-compose logs ai-service`
2. Run health check: `./healthcheck.sh`
3. Review documentation
4. Contact DevOps team

### Useful Commands

```bash
# View all running containers
docker-compose ps

# Restart service
docker-compose restart ai-service

# View logs (last 100 lines)
docker-compose logs --tail=100 -f ai-service

# Execute command in container
docker-compose exec ai-service python -c "print('Hello')"

# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and tested
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup current production
- [ ] Security audit passed
- [ ] Load testing completed

### Deployment
- [ ] Build Docker image
- [ ] Push to registry (if using)
- [ ] Run deployment script
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Monitor logs

### Post-Deployment
- [ ] Verify all endpoints working
- [ ] Check monitoring dashboards
- [ ] Test from frontend
- [ ] Notify team
- [ ] Document any issues
- [ ] Update deployment logs

---

**Last Updated:** June 8, 2026  
**Version:** 1.0.0  
**Status:** ✅ PRODUCTION READY
