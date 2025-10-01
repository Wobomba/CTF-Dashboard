# RENU-CERT CyberLab 🛡️

A comprehensive cybersecurity training platform by RENU-CERT, inspired by TryHackMe and Blue Team Labs Online. Train your defensive security skills through hands-on challenges, investigations, and real-world scenarios with interactive line graphs and competitive leaderboards.

![Platform Preview](https://via.placeholder.com/800x400/1e293b/3b82f6?text=RENU-CERT+CyberLab)

## ✨ Features

### 🎯 **Interactive Challenges**
- **Investigation Challenges**: Analyze logs, network traffic, and security incidents
- **CTF-Style Challenges**: Capture-the-flag format with various difficulty levels
- **Simulation Environments**: Real-world scenario practice
- **File Analysis**: Malware analysis, forensics, and threat intelligence

### 🏆 **Competitive Learning**
- Global leaderboard system with real-time updates
- Challenge-specific leaderboards with TryHackMe-style line graphs
- User progress tracking and achievements
- Points-based scoring system with speed bonuses
- Difficulty-based challenge progression
- Interactive progression visualization showing points accumulation

### 📚 **Comprehensive Domains**
- **Incident Response**: Learn to respond to and investigate security incidents
- **Threat Hunting**: Proactive threat detection and analysis
- **Digital Forensics**: Investigate digital evidence and artifacts
- **Threat Intelligence**: Analyze and understand cyber threats
- **Network Security**: Secure and monitor network infrastructure
- **Malware Analysis**: Reverse engineering and malware investigation
- **OSINT**: Open Source Intelligence gathering
- **CTF Challenges**: Competitive cybersecurity challenges

### 🎨 **Modern Interface**
- Dark theme optimized for security professionals
- Responsive design for all devices
- Real-time progress tracking with interactive charts
- Multi-question challenge system with individual submission
- Hint system for each question
- File upload support for challenge resources
- Series-based challenge organization
- RENU branding and custom logo integration

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- SQLite (default) or PostgreSQL
- **OR Docker & Docker Compose** (recommended for easy setup)

### 🐳 Docker Quick Start (Recommended)
```bash
# Clone the repository
git clone https://github.com/Wobomba/CTF-Dashboard.git
cd CTF-Dashboard

# Run with Docker (includes database)
./docker-build.sh

# Access the application
# Frontend: http://localhost
# API: http://localhost/api
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CERT
   ```

2. **Set up the backend**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp env.example .env
   # Edit .env with your configuration
   
   # Initialize the database with sample data
   cd backend
   python init_database.py
   ```

3. **Set up the frontend**
   ```bash
   # Install Node.js dependencies
   npm install
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Start the backend server
   cd backend
   python app.py
   
   # Terminal 2: Start the frontend development server
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Demo Account
- **Email**: admin@renu-cert.local
- **Password**: admin123

## 🏗️ Architecture

### Backend (Flask)
```
backend/
├── app.py                 # Main Flask application
├── models/                # Database models
│   ├── user.py           # User model and authentication
│   ├── challenge.py      # Challenge and submission models
│   └── progress.py       # Progress tracking and achievements
├── routes/               # API endpoints
│   ├── auth.py          # Authentication routes
│   ├── challenges.py    # Challenge management
│   ├── admin.py         # Admin functionality
│   └── progress.py      # Progress and leaderboard
└── init_database.py     # Database initialization script
```

### Frontend (React + Vite)
```
frontend/src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and API client
└── main.jsx           # Application entry point
```

## 🎮 Challenge Types

### 1. Investigation Challenges
Analyze security incidents using provided logs, network captures, and forensic artifacts.

**Example**: *Suspicious Login Investigation*
- Analyze login logs to determine if activity is legitimate or malicious
- Look for indicators of compromise
- Provide incident response recommendations

### 2. Analysis Challenges
Deep-dive technical analysis of security artifacts.

**Example**: *Network Traffic Analysis*
- Examine packet captures for data exfiltration
- Identify attack techniques and protocols used
- Determine impact and scope of incidents

### 3. CTF Challenges
Competitive format challenges with flags to capture.

**Example**: *YARA Rule Creation*
- Create detection rules for specific malware families
- Test understanding of malware signatures
- Apply threat intelligence concepts

### 4. Simulation Challenges
Interactive environments that simulate real-world scenarios.

**Example**: *Incident Response Simulation*
- Multi-step incident response scenario
- Make decisions that affect the outcome
- Learn proper IR procedures and best practices

## 🏆 Scoring System

### Points Calculation
- **Base Points**: Determined by challenge difficulty
  - Beginner: 100-200 points
  - Intermediate: 200-350 points
  - Advanced: 350-500 points
  - Expert: 500+ points

### Bonus/Penalty System
- **Speed Bonus**: +20% for completing within 50% of time limit
- **First Attempt Bonus**: +10% for correct answer on first try
- **Hint Penalty**: -10 points per hint used (max 30% penalty)

### Achievements
- **Category Master**: Complete all challenges in a category
- **Speed Demon**: Complete 10 challenges within time limit
- **Persistent**: Complete 5 challenges after using hints
- **Rising Star**: Reach top 100 on leaderboard

## 🔧 Configuration

### Environment Variables
```bash
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database Configuration
DATABASE_URL=sqlite:///cyberlab.db
# For production, use PostgreSQL:
# DATABASE_URL=postgresql://username:password@localhost/cyberlab_academy

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379/0

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Database Schema
The platform uses SQLAlchemy ORM with the following main models:
- **Users**: Authentication and profile management
- **Challenges**: Challenge content and metadata
- **Categories**: Challenge organization
- **Submissions**: User answers and scoring
- **Progress**: User progress tracking
- **Achievements**: Gamification elements

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Challenges
- `GET /api/challenges` - List challenges (with filtering)
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges/:id/start` - Start a challenge
- `POST /api/challenges/:id/submit` - Submit answer
- `POST /api/challenges/:id/hint` - Get hint

### Progress & Leaderboard
- `GET /api/progress/leaderboard` - Global leaderboard
- `GET /api/progress/user-stats` - User statistics
- `GET /api/challenges/my-progress` - User's challenge progress

### Admin (Admin only)
- `GET /api/admin/dashboard` - Admin dashboard stats
- `POST /api/admin/challenges` - Create challenge
- `PUT /api/admin/challenges/:id` - Update challenge
- `GET /api/admin/users` - List all users

## 🎨 UI Components

### Design System
- **Colors**: Blue primary (#3B82F6), with green success and red danger variants
- **Typography**: Inter font family with Fira Code for code elements
- **Dark Theme**: Optimized for long study sessions
- **Responsive**: Mobile-first design approach

### Key Components
- **Challenge Cards**: Preview challenges with difficulty and stats
- **Progress Indicators**: Visual progress bars and completion status
- **Code Editor**: Monaco editor for code challenges
- **Leaderboard**: Ranking display with user highlighting

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (User/Admin)
- Session management

### Input Validation
- Server-side validation for all inputs
- SQL injection prevention
- XSS protection
- CSRF protection with Flask-WTF

### Data Protection
- Environment variable configuration
- Secure cookie settings
- HTTPS enforcement (production)
- Rate limiting on API endpoints

## 📊 Analytics & Monitoring

### User Analytics
- Challenge completion rates
- Time-to-completion tracking
- Hint usage statistics
- User engagement metrics

### Platform Health
- API response times
- Error tracking and logging
- Database performance monitoring
- User activity tracking

## 🚀 Production Deployment

### Prerequisites for Production
- **Server**: Ubuntu 20.04+ or CentOS 8+ (2GB RAM minimum, 4GB+ recommended)
- **Domain**: Configured DNS pointing to your server
- **SSL Certificate**: Let's Encrypt or commercial certificate
- **Database**: PostgreSQL 12+ (recommended) or MySQL 8+
- **Web Server**: Nginx or Apache
- **Process Manager**: PM2 (Node.js) and Gunicorn (Python)

### 🐧 Ubuntu Server Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx postgresql postgresql-contrib git

# Install PM2 globally
sudo npm install -g pm2

# Create application user
sudo adduser --system --group --home /opt/cyberlab cyberlab
sudo usermod -aG sudo cyberlab
```

#### 2. Clone and Setup Application
```bash
# Switch to application user
sudo su - cyberlab

# Clone repository
git clone https://github.com/Wobomba/CTF-Dashboard.git /opt/cyberlab/app
cd /opt/cyberlab/app

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Install Node.js dependencies
npm install
npm run build
```

#### 3. Database Configuration
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE cyberlab_prod;
CREATE USER cyberlab_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cyberlab_prod TO cyberlab_user;
\q

# Initialize database
cd /opt/cyberlab/app/backend
source ../venv/bin/activate
python init_database.py
```

#### 4. Environment Configuration
```bash
# Create production environment file
sudo nano /opt/cyberlab/app/.env
```

Add the following content:
```bash
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database Configuration
DATABASE_URL=postgresql://cyberlab_user:your_secure_password@localhost/cyberlab_prod

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Security
CORS_ORIGINS=https://yourdomain.com
```

#### 5. Gunicorn Configuration
```bash
# Create Gunicorn configuration
sudo nano /opt/cyberlab/app/gunicorn.conf.py
```

Add the following content:
```python
bind = "127.0.0.1:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

#### 6. PM2 Configuration
```bash
# Create PM2 ecosystem file
sudo nano /opt/cyberlab/app/ecosystem.config.js
```

Add the following content:
```javascript
module.exports = {
  apps: [
    {
      name: 'cyberlab-backend',
      cwd: '/opt/cyberlab/app/backend',
      script: 'gunicorn',
      args: '--config ../gunicorn.conf.py app:app',
      interpreter: '/opt/cyberlab/app/venv/bin/python',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        FLASK_ENV: 'production'
      },
      error_file: '/opt/cyberlab/logs/backend-error.log',
      out_file: '/opt/cyberlab/logs/backend-out.log',
      log_file: '/opt/cyberlab/logs/backend-combined.log',
      time: true
    },
    {
      name: 'cyberlab-frontend',
      cwd: '/opt/cyberlab/app',
      script: 'npm',
      args: 'run preview',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/opt/cyberlab/logs/frontend-error.log',
      out_file: '/opt/cyberlab/logs/frontend-out.log',
      log_file: '/opt/cyberlab/logs/frontend-combined.log',
      time: true
    }
  ]
};
```

#### 7. Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cyberlab
```

Add the following content:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (React app)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static/ {
        alias /opt/cyberlab/app/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File uploads
    client_max_body_size 50M;
}
```

#### 8. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 9. System Service Setup
```bash
# Create systemd service for PM2
sudo nano /etc/systemd/system/cyberlab.service
```

Add the following content:
```ini
[Unit]
Description=CyberLab Application
After=network.target

[Service]
Type=forking
User=cyberlab
Group=cyberlab
WorkingDirectory=/opt/cyberlab/app
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 10. Final Setup and Start
```bash
# Enable and start services
sudo systemctl enable cyberlab
sudo systemctl start cyberlab

# Enable Nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status cyberlab
sudo systemctl status nginx

# View logs
pm2 logs
```

### 🐳 Docker Deployment

#### 1. Create Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM python:3.9-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/dist ./dist

# Create non-root user
RUN useradd -m -u 1000 cyberlab
USER cyberlab

EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.app:app"]
```

#### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://cyberlab:password@db:5432/cyberlab
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=cyberlab
      - POSTGRES_USER=cyberlab
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
```

#### 3. Deploy with Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Scale if needed
docker-compose up -d --scale app=3
```

### ☁️ Cloud Platform Deployment

#### Heroku Deployment
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create app
heroku create your-cyberlab-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=your-secret-key
heroku config:set JWT_SECRET_KEY=your-jwt-secret

# Deploy
git push heroku main

# Run database migrations
heroku run python backend/init_database.py
```

#### AWS EC2 Deployment
```bash
# Launch EC2 instance (t3.medium recommended)
# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip

# Follow Ubuntu Server Deployment steps above
# Configure Security Groups:
# - Port 22 (SSH)
# - Port 80 (HTTP)
# - Port 443 (HTTPS)
```

#### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: cyberlab
services:
- name: web
  source_dir: /
  github:
    repo: Wobomba/CTF-Dashboard
    branch: main
  run_command: gunicorn --bind 0.0.0.0:8080 backend.app:app
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: FLASK_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
databases:
- name: db
  engine: PG
  version: "13"
```

### 🔧 Production Optimization

#### Performance Tuning
```bash
# Install Redis for caching
sudo apt install redis-server

# Configure PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf
# Add:
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Monitoring Setup
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Set up log rotation
sudo nano /etc/logrotate.d/cyberlab
```

Add:
```
/opt/cyberlab/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 cyberlab cyberlab
}
```

#### Backup Strategy
```bash
# Create backup script
sudo nano /opt/cyberlab/backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/cyberlab/backups"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump cyberlab_prod > $BACKUP_DIR/db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/cyberlab/app

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

```bash
# Make executable and add to crontab
chmod +x /opt/cyberlab/backup.sh
crontab -e
# Add: 0 2 * * * /opt/cyberlab/backup.sh
```

### 🚨 Troubleshooting

#### Common Issues
1. **Port already in use**: `sudo lsof -i :5000` and kill process
2. **Permission denied**: Check file ownership with `ls -la`
3. **Database connection failed**: Verify PostgreSQL is running and credentials
4. **SSL certificate issues**: Check certificate validity and Nginx configuration

#### Log Locations
- **Application logs**: `/opt/cyberlab/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `/var/log/syslog`
- **PM2 logs**: `pm2 logs`

#### Health Checks
```bash
# Check application status
curl -f http://localhost:5000/api/health || echo "Backend down"

# Check database
sudo -u postgres psql -c "SELECT 1;" cyberlab_prod

# Check disk space
df -h

# Check memory usage
free -h
```

### 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (UFW)
- [ ] Configure fail2ban
- [ ] Set up SSL/TLS
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs
- [ ] Use environment variables for secrets
- [ ] Disable unnecessary services
- [ ] Configure proper file permissions

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ESLint configuration
- **Comments**: Document complex logic
- **Commits**: Use conventional commit messages

### Adding New Challenges
1. Create challenge content in admin panel
2. Test challenge thoroughly
3. Add appropriate hints and validation
4. Set difficulty and point values
5. Review with maintainers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Blue Team Labs Online](https://blueteamlabs.online)
- Built with Flask, React, and modern web technologies
- Icons from Lucide React
- UI components styled with Tailwind CSS

## 📞 Support

For support, questions, or suggestions:
- Create an issue on GitHub
- Join our Discord community
- Email: support@cyberlabacademy.com

---

**Happy Learning! 🛡️🎯**

*Master cybersecurity through hands-on practice and become a skilled cyber defender.*
