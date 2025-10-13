#!/bin/bash

# RENU-CERT CyberLab Production Deployment Script
# This script deploys the containerized application to production

set -e

echo "Deploying RENU-CERT CyberLab to Production..."

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

# Check if production environment file exists
if [ ! -f .env.prod ]; then
    print_error "Production environment file .env.prod not found!"
    print_status "Please create .env.prod with your production configuration:"
    print_status "  - SECRET_KEY"
    print_status "  - JWT_SECRET_KEY"
    print_status "  - POSTGRES_PASSWORD"
    print_status "  - FRONTEND_URL"
    print_status "  - CORS_ORIGINS"
    exit 1
fi

# Load production environment
export $(cat .env.prod | grep -v '^#' | xargs)

# Create necessary directories
print_status "Creating production directories..."
mkdir -p uploads logs nginx/ssl

# Generate self-signed SSL certificates if they don't exist
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    print_warning "SSL certificates not found. Generating self-signed certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    print_warning "For production, replace these with real SSL certificates!"
fi

# Build production images
print_status "Building production Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Start production services
print_status "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 15

# Check if services are running
print_status "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Initialize database
print_status "Initializing production database..."
docker-compose -f docker-compose.prod.yml exec app python backend/init_database.py

# Run health checks
print_status "Running health checks..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Application is healthy!"
else
    print_warning "Health check failed. Check logs with: docker-compose -f docker-compose.prod.yml logs"
fi

print_success "RENU-CERT CyberLab production deployment completed!"
print_status "Access the application at: https://localhost"
print_status "API endpoint: https://localhost/api"
print_status ""
print_status "Management commands:"
print_status "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "  Stop: docker-compose -f docker-compose.prod.yml down"
print_status "  Restart: docker-compose -f docker-compose.prod.yml restart"
print_status "  Update: ./docker-deploy-prod.sh"
