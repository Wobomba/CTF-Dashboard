#!/bin/bash

# Production Deployment Script for RENU-CERT CyberLab
# This script builds and deploys the application for production

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f env.prod.example ]; then
        cp env.prod.example .env
        print_warning "Please edit .env file with your production values before continuing!"
        print_warning "Especially change the database password and secret keys!"
        exit 1
    else
        print_error "env.prod.example file not found. Cannot create .env file."
        exit 1
    fi
fi

# Check if frontend is built
if [ ! -d "dist" ]; then
    print_status "Building frontend for production..."
    cd frontend
    npm ci
    npm run build
    cd ..
    print_success "Frontend built successfully"
else
    print_success "Frontend already built"
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Remove old images (optional)
print_status "Cleaning up old images..."
docker image prune -f || true

# Build and start production containers
print_status "Building and starting production containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
print_status "Checking service health..."

# Check database
if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U ${DB_USER:-renu_cert_user} -d renu_cert_cyberlab > /dev/null 2>&1; then
    print_success "Database is ready"
else
    print_error "Database is not ready"
    exit 1
fi

# Check backend
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_success "Backend API is ready"
else
    print_warning "Backend API health check failed, but continuing..."
fi

# Check nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx is ready"
else
    print_warning "Nginx health check failed, but continuing..."
fi

# Initialize database if needed
print_status "Checking if database needs initialization..."
if docker-compose -f docker-compose.prod.yml exec -T backend python -c "
import sys
sys.path.append('/app')
from models import db, User
from app import app
with app.app_context():
    admin_count = User.query.filter_by(role='admin').count()
    print(f'Admin users: {admin_count}')
" | grep -q "Admin users: 0"; then
    print_status "No admin users found. You can now access /admin/setup to create the first admin account."
else
    print_success "Database appears to be initialized"
fi

print_success "🎉 Production deployment completed!"
print_status "Application is available at:"
print_status "  - Frontend: http://localhost"
print_status "  - Backend API: http://localhost:5000"
print_status "  - Admin Setup: http://localhost/admin/setup"
print_warning "Remember to:"
print_warning "  1. Change default passwords in .env file"
print_warning "  2. Configure SSL certificates for HTTPS"
print_warning "  3. Set up proper firewall rules"
print_warning "  4. Configure backup strategies"
