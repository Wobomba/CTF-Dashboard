# RENU-CERT CyberLab

A comprehensive cybersecurity training platform built with React.js frontend and Flask backend, featuring CTF challenges, leaderboards, and secure authentication.

## Features

- 🔐 Secure authentication with JWT tokens
- 🏆 CTF challenges with multiple categories
- 📊 Real-time leaderboards with individual user progress tracking
- 👨‍💼 Admin dashboard with comprehensive statistics
- 🛡️ OWASP Top 10 security compliance
- 🐳 Docker containerization for easy deployment
- 🔒 HTTPS support with SSL certificate integration
- 📱 Responsive design with modern UI/UX

## Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Docker** and **Docker Compose**
- **Git**
- **SSL Certificates** (for production HTTPS)

## Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CERT
   ```

2. **Set up Python virtual environment**
   ```bash
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Install backend dependencies
   cd backend
   pip install -r requirements.txt
   ```

3. **Start the application**
   ```bash
   # Terminal 1: Start backend
   cd backend
   source ../venv/bin/activate
   python3 app.py

   # Terminal 2: Start frontend
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin Setup: http://localhost:3000/admin/setup (IP restricted)

## Deployment Options

### Option 1: Automated HTTPS Production Deployment (Recommended)

Use the automated deployment script for production with HTTPS support:

```bash
# Make the script executable
chmod +x deploy-https-production.sh

# Run the deployment (replace with your domain and SSL paths)
DOMAIN=cyberlab.renu.ac.ug \
SSL_CERT_PATH=/path/to/cert.pem \
SSL_KEY_PATH=/path/to/key.pem \
./deploy-https-production.sh
```

### Option 2: Docker Production Deployment

1. **Prepare SSL certificates**
   ```bash
   # Place your SSL certificates in the nginx directory
   mkdir -p nginx/ssl
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

2. **Configure environment variables**
   ```bash
   # Copy and edit the production environment file
   cp env.prod.example .env.prod
   # Edit .env.prod with your database and Redis settings
   ```

3. **Deploy with Docker Compose**
   ```bash
   # Build and start production services
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

4. **Verify deployment**
   ```bash
   # Check if all services are running
   docker-compose -f docker-compose.prod.yml ps
   
   # Test the application
   curl -k https://localhost/health
   ```

### Option 3: Manual Production Deployment

1. **Build the frontend**
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

2. **Configure production environment**
   ```bash
   # Create production environment file
   echo "VITE_API_URL=https://yourdomain.com/api" > frontend/.env.production
   ```

3. **Set up backend environment**
   ```bash
   # Create backend .env file
   cp env.prod.example backend/.env
   # Edit backend/.env with your settings
   ```

4. **Start production services**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose -f docker-compose.prod.yml up -d postgres redis
   
   # Start Flask backend
   cd backend
   source venv/bin/activate
   python3 app.py
   ```

5. **Configure Nginx**
   ```bash
   # Update nginx/nginx.prod.conf with your domain
   # Start Nginx
   docker-compose -f docker-compose.prod.yml up -d nginx
   ```

## Environment Configuration

### Frontend Environment Variables

Create `frontend/.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api
VITE_NODE_ENV=production
```

### Backend Environment Variables

Create `backend/.env`:
```env
FLASK_ENV=production
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost/cyberlab
REDIS_URL=redis://localhost:6379
REQUIRE_HTTPS=true
```

## Security Features

- **IP Whitelisting**: Admin setup restricted to specific IP addresses
- **Rate Limiting**: Prevents brute force attacks
- **CSRF Protection**: Cross-site request forgery prevention
- **Password Strength**: Enhanced password requirements for admin accounts
- **HTTPS Enforcement**: Secure communication in production
- **Session Security**: Secure session management

## Admin Setup

1. **Access admin setup** (IP restricted to `137.63.184.198`)
   ```
   https://yourdomain.com/admin/setup
   ```

2. **Create admin account** with strong password requirements:
   - Minimum 12 characters
   - Uppercase and lowercase letters
   - Numbers and special characters

## Updating an Existing Deployment

### Quick Update (Recommended)

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Update Docker containers**
   ```bash
   # For development
   docker-compose down
   docker-compose up --build -d
   
   # For production
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Verify update**
   ```bash
   # Check services are running
   docker-compose -f docker-compose.prod.yml ps
   
   # Test application
   curl -k https://localhost/health
   ```

### Manual Update Steps

1. **Stop services**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Pull and build frontend**
   ```bash
   git pull origin main
   cd frontend
   npm ci
   npm run build
   cd ..
   ```

3. **Restart services**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

## Troubleshooting

### Common Issues

1. **Mixed Content Errors**
   - Ensure `VITE_API_URL` uses HTTPS in production
   - Check that Nginx is properly configured for HTTPS

2. **Rate Limiting Errors (429)**
   - Rate limits are configured for production security
   - In development, limits are relaxed to 50 requests/minute

3. **Admin Setup Access Denied**
   - Verify your IP address is whitelisted
   - Check that you're accessing from the correct IP

4. **Frontend Not Loading**
   - Ensure `npm run build` completed successfully
   - Check that the `dist` folder exists and contains built files
   - Verify Nginx is serving static files correctly

### Verification Commands

```bash
# Check Docker services
docker-compose -f docker-compose.prod.yml ps

# Test HTTPS endpoint
curl -k https://localhost/health

# Check frontend build
ls -la dist/

# Verify SSL certificates
openssl x509 -in nginx/ssl/cert.pem -text -noout
```

## Development

### Project Structure

```
CERT/
├── frontend/          # React.js frontend
├── backend/           # Flask backend
├── nginx/            # Nginx configuration
├── docker-compose.yml # Development setup
├── docker-compose.prod.yml # Production setup
└── deploy-https-production.sh # Automated deployment
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `docker-update.sh` - Update Docker containers
- `deploy-https-production.sh` - Automated production deployment
- `fix-https.sh` - Quick fix for HTTPS Mixed Content issues
- `deploy-prod.sh` - Standard production deployment
- `test-prod.sh` - Test production build locally

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For deployment issues or questions, refer to:
- `PRODUCTION_HTTPS_GUIDE.md` - Detailed HTTPS deployment guide
- `PRODUCTION_UPDATE_GUIDE.md` - Production update instructions
- `SECURITY.md` - Security implementation details