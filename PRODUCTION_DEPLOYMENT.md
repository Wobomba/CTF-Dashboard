# Production Deployment Guide

This guide covers deploying the RENU-CERT CyberLab application to production using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB RAM available
- Ports 80, 443, 5000, 5432, 6379 available

### 1. Environment Setup

```bash
# Copy environment template
cp env.prod.example .env

# Edit production values
nano .env
```

**Important**: Change these values in `.env`:
- `DB_PASSWORD`: Use a strong database password
- `JWT_SECRET_KEY`: Generate a secure JWT secret
- `SECRET_KEY`: Generate a secure Flask secret key
- `ADMIN_SETUP_IP_WHITELIST`: Add your production server IP

### 2. Build Frontend

```bash
# Install dependencies and build
cd frontend
npm ci
npm run build
cd ..
```

### 3. Deploy with Docker

```bash
# Run the deployment script
./deploy-prod.sh
```

Or manually:

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up --build -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 📋 Production Architecture

### Services
- **Nginx**: Reverse proxy and static file serving (Port 80/443)
- **Backend**: Flask API server (Port 5000)
- **Database**: PostgreSQL (Port 5432)
- **Redis**: Caching and sessions (Port 6379)

### Security Features
- Rate limiting on API endpoints
- IP whitelisting for admin setup
- CSRF protection
- Security headers
- Input validation
- Password strength requirements

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | Database username | `renu_cert_user` |
| `DB_PASSWORD` | Database password | **Required** |
| `JWT_SECRET_KEY` | JWT signing key | **Required** |
| `SECRET_KEY` | Flask secret key | **Required** |
| `ADMIN_SETUP_IP_WHITELIST` | Allowed IPs for admin setup | `137.63.184.198,127.0.0.1,::1` |
| `REQUIRE_HTTPS` | Force HTTPS | `false` |
| `ENABLE_RATE_LIMITING` | Enable rate limiting | `true` |

### Nginx Configuration

The production setup includes:
- Gzip compression
- Static file caching
- Rate limiting
- Security headers
- SSL/TLS support (configure certificates)

## 🛡️ Security Checklist

### Before Deployment
- [ ] Change all default passwords
- [ ] Generate secure secret keys
- [ ] Configure IP whitelist for admin setup
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Enable HTTPS in production

### After Deployment
- [ ] Test admin setup from whitelisted IP
- [ ] Verify rate limiting works
- [ ] Check security headers
- [ ] Test user registration/login
- [ ] Verify file upload restrictions

## 📊 Monitoring

### Health Checks
- Database: `pg_isready`
- Backend: `curl http://localhost:5000/api/health`
- Nginx: `curl http://localhost/health`

### Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs nginx
```

## 🔄 Maintenance

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d
```

### Backups
```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U renu_cert_user renu_cert_cyberlab > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T db psql -U renu_cert_user renu_cert_cyberlab < backup.sql
```

### Scaling
For high-traffic deployments:
- Use external PostgreSQL database
- Implement Redis clustering
- Add load balancer
- Use CDN for static files

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :5000

# Stop conflicting services
sudo systemctl stop nginx
sudo systemctl stop apache2
```

#### Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready

# Reset database
docker-compose -f docker-compose.prod.yml down
docker volume rm cert_postgres_data
docker-compose -f docker-compose.prod.yml up -d
```

#### Frontend Not Loading
```bash
# Check if dist folder exists
ls -la dist/

# Rebuild frontend
cd frontend && npm run build && cd ..
```

### Performance Optimization

#### Frontend
- Enable gzip compression (already configured)
- Use CDN for static assets
- Implement code splitting
- Optimize images

#### Backend
- Use production WSGI server (Gunicorn)
- Enable database connection pooling
- Implement caching strategies
- Monitor memory usage

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables
3. Test individual services
4. Check network connectivity

## 🔐 Security Recommendations

1. **Use HTTPS in production**
2. **Regular security updates**
3. **Monitor access logs**
4. **Implement backup strategies**
5. **Use strong passwords**
6. **Regular security audits**
7. **Keep dependencies updated**
