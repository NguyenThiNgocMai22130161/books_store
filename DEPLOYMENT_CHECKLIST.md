# ✅ DEPLOYMENT CHECKLIST

## 📋 Pre-Deployment

### Code & Files
- [ ] `railway.json` created
- [ ] `render.yaml` created
- [ ] `.dockerignore` updated
- [ ] `.env.production` ready
- [ ] `requirements.txt` up to date
- [ ] All tests passing locally
- [ ] No sensitive data in code

### Configuration
- [ ] Google Gemini API key valid
- [ ] PostgreSQL connection working
- [ ] Environment variables documented
- [ ] CORS origins configured
- [ ] Debug mode = false

### Git
- [ ] GitHub repo created
- [ ] All files committed
- [ ] Pushed to `main` branch
- [ ] `.env` in `.gitignore`
- [ ] README updated

---

## 🚀 Deployment (Railway)

### Setup
- [ ] Railway account created
- [ ] GitHub connected
- [ ] New project created
- [ ] Repo selected

### Configuration
- [ ] All env variables added:
  - [ ] `PG_DSN`
  - [ ] `GOOGLE_API_KEY`
  - [ ] `LLM_MODEL`
  - [ ] `EMBED_MODEL`
  - [ ] `EMBED_DIM`
  - [ ] `TOP_K_RESULTS`
  - [ ] `SCORE_THRESHOLD`
  - [ ] `TEMPERATURE`
  - [ ] `DEBUG=false`
  - [ ] `ENVIRONMENT=production`

### Deploy
- [ ] Initial deploy completed
- [ ] Build successful
- [ ] Service running
- [ ] Domain generated

---

## ✅ Post-Deployment

### Testing
- [ ] Health check working
  ```bash
  curl https://YOUR-APP.railway.app/health
  ```
- [ ] Chat endpoint working
  ```bash
  curl -X POST https://YOUR-APP.railway.app/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"xin chào","user_id":"test"}'
  ```
- [ ] Search endpoint working
- [ ] Similar books endpoint working
- [ ] Response time < 3s
- [ ] No errors in logs

### Frontend Integration
- [ ] `aiService.js` updated with production URL
- [ ] Frontend deployed
- [ ] ChatbotWidget connected
- [ ] SmartSearchBar working
- [ ] SimilarBooks displaying
- [ ] CORS working
- [ ] End-to-end test passed

### Monitoring
- [ ] Railway logs checked
- [ ] No errors or warnings
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%
- [ ] Response times acceptable

### Documentation
- [ ] Production URL documented
- [ ] API endpoints listed
- [ ] Environment variables documented
- [ ] Deployment process recorded
- [ ] Team informed

---

## 🔒 Security

- [ ] HTTPS enabled
- [ ] API key not exposed
- [ ] Database SSL enabled
- [ ] CORS properly configured
- [ ] No debug info in logs
- [ ] Error messages sanitized
- [ ] Rate limiting considered

---

## 📊 Performance

- [ ] Response time monitored
- [ ] Error rate < 1%
- [ ] Uptime > 99%
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Cache working (if enabled)

---

## 🎯 Optional

### Custom Domain
- [ ] Domain purchased
- [ ] DNS configured
- [ ] SSL certificate issued
- [ ] Domain verified

### Advanced Monitoring
- [ ] UptimeRobot configured
- [ ] Sentry error tracking
- [ ] Analytics dashboard
- [ ] Alerts configured

### Optimization
- [ ] Redis cache added
- [ ] CDN configured
- [ ] Database indexes optimized
- [ ] Images optimized

---

## 📝 Notes

### Production URL:
```
https://_____________________.up.railway.app
```

### Deploy Date:
```
Date: ___________
Time: ___________
```

### Team Members:
```
- ___________
- ___________
```

### Issues Encountered:
```
1. ___________
2. ___________
```

### Resolution:
```
1. ___________
2. ___________
```

---

## ✅ Sign-off

- [ ] Deployment successful
- [ ] All tests passed
- [ ] Team notified
- [ ] Documentation updated
- [ ] Ready for production use

**Deployed by:** ___________
**Date:** ___________
**Signature:** ___________

---

## 🎉 SUCCESS!

Your AI Chatbot is now live in production! 🚀
