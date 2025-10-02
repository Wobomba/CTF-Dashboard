# Docker Setup Troubleshooting Guide

## Issue: Categories Not Displaying in Challenge Creation

### Problem Description
When setting up the project with Docker, the categories dropdown in the challenge creation modal appears empty, even though the API is returning categories correctly.

### Root Cause
The issue is typically caused by one of these problems:

1. **Frontend not properly built** in Docker container
2. **API calls failing** due to CORS or URL configuration
3. **Static file serving** not configured properly
4. **Environment variables** not set correctly

### Solutions

#### Solution 1: Use Simple Docker Setup (Recommended)

Use the simplified Docker setup that serves everything through Flask:

```bash
# 1. Use the simple Docker Compose file
docker-compose -f docker-compose.simple.yml up --build -d

# 2. Access the application
# Frontend: http://localhost
# API: http://localhost/api
```

#### Solution 2: Debug Current Setup

If you want to debug the current setup:

```bash
# 1. Check if containers are running
docker-compose ps

# 2. Check logs
docker-compose logs app
docker-compose logs nginx

# 3. Test API directly
curl http://localhost/api/challenges/categories

# 4. Check if frontend is built
docker-compose exec app ls -la /app/dist

# 5. Rebuild if needed
docker-compose down
docker-compose up --build -d
```

#### Solution 3: Manual Frontend Build

If the frontend isn't building properly:

```bash
# 1. Build frontend manually
npm run build

# 2. Check if dist folder exists
ls -la dist/

# 3. Rebuild Docker image
docker-compose build app
docker-compose up -d
```

### Environment Variables Check

Make sure your `.env` file has the correct settings:

```bash
# Required for Docker setup
FRONTEND_URL=http://localhost
CORS_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173
DATABASE_URL=postgresql://cyberlab:cyberlab_password@db:5432/cyberlab
REDIS_URL=redis://redis:6379/0
```

### Quick Fix Commands

```bash
# Complete reset and rebuild
docker-compose down -v
docker-compose up --build -d

# Check service health
docker-compose ps
curl http://localhost/api/health
curl http://localhost/api/challenges/categories

# View real-time logs
docker-compose logs -f app
```

### Verification Steps

1. **API Health Check**: `curl http://localhost/api/health`
2. **Categories API**: `curl http://localhost/api/challenges/categories`
3. **Frontend Access**: Visit `http://localhost` in browser
4. **Admin Setup**: Should redirect to `/admin/setup`
5. **Challenge Creation**: Categories should appear in dropdown

### Common Issues and Fixes

#### Issue: "Cannot GET /" error
**Fix**: Frontend not built or not served properly
```bash
docker-compose exec app ls -la /app/dist
# If empty, rebuild: docker-compose up --build -d
```

#### Issue: API calls return 404
**Fix**: Nginx not proxying correctly
```bash
# Use simple setup instead
docker-compose -f docker-compose.simple.yml up -d
```

#### Issue: CORS errors in browser console
**Fix**: CORS_ORIGINS not set correctly
```bash
# Update .env file with correct origins
CORS_ORIGINS=http://localhost,http://your-server-ip
```

#### Issue: Database connection errors
**Fix**: Database not ready or credentials wrong
```bash
# Check database logs
docker-compose logs db
# Wait for database to be ready
docker-compose up -d
```

### Production Deployment

For production deployment without SSL:

```bash
# 1. Update environment variables
nano .env
# Set FRONTEND_URL=http://your-server-ip
# Set CORS_ORIGINS=http://your-server-ip

# 2. Deploy
docker-compose -f docker-compose.simple.yml up -d

# 3. Access
# http://your-server-ip
```

### Monitoring and Maintenance

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull
docker-compose up --build -d

# Backup database
docker-compose exec db pg_dump -U cyberlab cyberlab > backup.sql
```

### Support

If you continue to have issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Test API endpoints directly with curl
4. Use the simple Docker setup for easier debugging
5. Ensure all required ports (80, 5432, 6379) are available
