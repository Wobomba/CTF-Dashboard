# Production Update Guide

This guide covers updating your already-deployed RENU-CERT CyberLab application in production.

## 🚀 Quick Update Steps

### 1. **Pull Latest Changes**
```bash
# Navigate to your production server
cd /path/to/your/production/app

# Pull latest changes from GitHub
git pull origin Development
```

### 2. **Rebuild Frontend**
```bash
# Build the frontend for production
cd frontend
npm ci
npm run build
cd ..
```

### 3. **Update Docker Containers**
```bash
# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Pull latest images and rebuild
docker-compose -f docker-compose.prod.yml up --build -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 4. **Verify Update**
```bash
# Check if services are running
curl http://localhost/health
curl http://localhost:5000/api/health

# Check logs if needed
docker-compose -f docker-compose.prod.yml logs
```

## 🔧 Detailed Update Process

### **Step 1: Backup Current State**
```bash
# Create backup of current state
cp .env .env.backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U renu_cert_user renu_cert_cyberlab > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Step 2: Update Code**
```bash
# Pull latest changes
git pull origin Development

# Verify the changes
git log --oneline -5
```

### **Step 3: Update Frontend**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if package.json changed)
npm ci

# Build for production
npm run build

# Verify build
ls -la ../dist/
cd ..
```

### **Step 4: Update Environment (if needed)**
```bash
# Check if new environment variables were added
diff .env env.prod.example

# If new variables exist, add them to .env
# Example: If REQUIRE_HTTPS was added
echo "REQUIRE_HTTPS=false" >> .env
```

### **Step 5: Update Docker Services**
```bash
# Stop services gracefully
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional, saves space)
docker image prune -f

# Rebuild and start services
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to start
sleep 30
```

### **Step 6: Verify Update**
```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Test frontend
curl -I http://localhost/

# Test backend API
curl http://localhost:5000/api/health

# Test database
docker-compose -f docker-compose.prod.yml exec db pg_isready -U renu_cert_user
```

## 🔍 Troubleshooting Updates

### **If Frontend Not Loading:**
```bash
# Check if dist folder exists and has content
ls -la dist/
ls -la dist/assets/

# Rebuild frontend if needed
cd frontend && npm run build && cd ..
```

### **If Backend API Fails:**
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if database is accessible
docker-compose -f docker-compose.prod.yml exec backend python -c "
from database import db
from app import app
with app.app_context():
    print('Database connection OK')
"
```

### **If Database Issues:**
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Test database connection
docker-compose -f docker-compose.prod.yml exec db psql -U renu_cert_user -d renu_cert_cyberlab -c "SELECT 1;"
```

### **If Nginx Issues:**
```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Test nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

## 📋 Update Checklist

### **Before Update:**
- [ ] Backup current `.env` file
- [ ] Backup database
- [ ] Note current version/commit
- [ ] Check for breaking changes in release notes

### **During Update:**
- [ ] Pull latest code
- [ ] Update environment variables if needed
- [ ] Rebuild frontend
- [ ] Update Docker containers
- [ ] Test all services

### **After Update:**
- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] Admin login works
- [ ] User registration works
- [ ] Challenge creation works

## 🚨 Rollback Plan

### **If Update Fails:**
```bash
# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Restore previous version
git checkout <previous-commit-hash>

# Restore environment
cp .env.backup .env

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d
```

### **If Database Issues:**
```bash
# Restore database from backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U renu_cert_user -d renu_cert_cyberlab < backup_YYYYMMDD_HHMMSS.sql
```

## 🔄 Automated Update Script

Create `update-prod.sh` for easier updates:

```bash
#!/bin/bash
set -e

echo "🔄 Starting production update..."

# Backup
echo "📦 Creating backup..."
cp .env .env.backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U renu_cert_user renu_cert_cyberlab > backup_$(date +%Y%m%d_%H%M%S).sql

# Update code
echo "📥 Pulling latest changes..."
git pull origin Development

# Update frontend
echo "🏗️ Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Update containers
echo "🐳 Updating Docker containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d

# Wait and verify
echo "⏳ Waiting for services to start..."
sleep 30

echo "✅ Testing services..."
curl -f http://localhost/health || echo "❌ Frontend test failed"
curl -f http://localhost:5000/api/health || echo "❌ Backend test failed"

echo "🎉 Update completed!"
```

## 📞 Support

If you encounter issues during update:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify all services: `docker-compose -f docker-compose.prod.yml ps`
3. Test individual components
4. Check environment variables
5. Consider rollback if critical issues

## 🔐 Security Notes

- Always backup before updates
- Test updates in staging environment first
- Monitor logs for security events
- Keep dependencies updated
- Verify SSL certificates if using HTTPS
