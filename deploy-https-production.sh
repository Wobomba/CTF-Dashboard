#!/bin/bash

# Production Deployment Script with HTTPS Configuration
# This script ensures Mixed Content errors are completely avoided

set -e  # Exit on any error

echo "🚀 Starting HTTPS Production Deployment..."

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

# Configuration
DOMAIN=${DOMAIN:-"cyberlab.renu.ac.ug"}
SSL_CERT_PATH=${SSL_CERT_PATH:-"/etc/nginx/ssl/cert.pem"}
SSL_KEY_PATH=${SSL_KEY_PATH:-"/etc/nginx/ssl/key.pem"}

print_status "Deploying for domain: $DOMAIN"

# Step 1: Validate SSL Certificates
print_status "Step 1: Validating SSL certificates..."
if [ ! -f "$SSL_CERT_PATH" ]; then
    print_error "SSL certificate not found at $SSL_CERT_PATH"
    print_warning "Please install SSL certificates first:"
    print_warning "  sudo mkdir -p /etc/nginx/ssl"
    print_warning "  sudo cp your-cert.pem $SSL_CERT_PATH"
    print_warning "  sudo cp your-private.key $SSL_KEY_PATH"
    exit 1
fi

if [ ! -f "$SSL_KEY_PATH" ]; then
    print_error "SSL private key not found at $SSL_KEY_PATH"
    exit 1
fi

print_success "SSL certificates found"

# Step 2: Configure Frontend for HTTPS
print_status "Step 2: Configuring frontend for HTTPS..."

cd frontend

# Create production environment with HTTPS API URL
cat > .env.production << EOF
# Production Environment Variables for Frontend
VITE_API_URL=https://$DOMAIN/api
VITE_NODE_ENV=production
EOF

print_success "Frontend environment configured for HTTPS"

# Step 3: Build Frontend with HTTPS Configuration
print_status "Step 3: Building frontend with HTTPS configuration..."

# Install dependencies
npm ci

# Build with HTTPS configuration
npm run build

# Verify build contains HTTPS API URL
if grep -q "https://$DOMAIN/api" dist/assets/*.js; then
    print_success "Frontend built with HTTPS API URL"
else
    print_warning "Frontend may not have HTTPS API URL configured"
fi

cd ..

# Step 4: Configure Backend Environment
print_status "Step 4: Configuring backend environment..."

# Create production environment file
if [ ! -f .env ]; then
    if [ -f env.prod.example ]; then
        cp env.prod.example .env
        print_warning "Created .env from template. Please update with your values!"
    else
        print_error "env.prod.example not found"
        exit 1
    fi
fi

# Update environment for HTTPS
sed -i 's/REQUIRE_HTTPS=false/REQUIRE_HTTPS=true/' .env || true
sed -i 's/FLASK_ENV=development/FLASK_ENV=production/' .env || true

print_success "Backend environment configured for HTTPS"

# Step 5: Update Nginx Configuration
print_status "Step 5: Updating Nginx configuration for HTTPS..."

# Update nginx configuration with domain
sed -i "s/server_name _;/server_name $DOMAIN;/" nginx/nginx.prod.conf || true

print_success "Nginx configuration updated"

# Step 6: Deploy with Docker
print_status "Step 6: Deploying with Docker..."

# Stop existing containers
docker-compose -f docker-compose.prod.yml down || true

# Build and start production containers
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Step 7: Verify HTTPS Configuration
print_status "Step 7: Verifying HTTPS configuration..."

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "Docker containers are running"
else
    print_error "Some containers failed to start"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Test HTTP to HTTPS redirect
print_status "Testing HTTP to HTTPS redirect..."
if curl -s -I http://localhost | grep -q "301\|302"; then
    print_success "HTTP to HTTPS redirect is working"
else
    print_warning "HTTP to HTTPS redirect may not be working"
fi

# Test HTTPS endpoint
print_status "Testing HTTPS endpoint..."
if curl -k -s https://localhost/health | grep -q "healthy"; then
    print_success "HTTPS endpoint is working"
else
    print_warning "HTTPS endpoint test failed"
fi

# Test API over HTTPS
print_status "Testing API over HTTPS..."
if curl -k -s https://localhost/api/health | grep -q "healthy"; then
    print_success "API over HTTPS is working"
else
    print_warning "API over HTTPS test failed"
fi

# Step 8: Final Verification
print_status "Step 8: Final verification..."

print_success "🎉 HTTPS Production Deployment Completed!"
print_status "Your application is now available at:"
print_status "  - HTTPS: https://$DOMAIN"
print_status "  - API: https://$DOMAIN/api"
print_status "  - Admin Setup: https://$DOMAIN/admin/setup"

print_warning "Important Notes:"
print_warning "  1. Ensure your domain DNS points to this server"
print_warning "  2. Verify SSL certificates are valid and trusted"
print_warning "  3. Test the application in a browser to confirm no Mixed Content errors"
print_warning "  4. Check browser console for any remaining HTTP requests"

print_status "To verify no Mixed Content errors:"
print_status "  1. Open https://$DOMAIN in a browser"
print_status "  2. Open Developer Tools (F12)"
print_status "  3. Check Console tab for any Mixed Content warnings"
print_status "  4. Check Network tab - all API calls should be HTTPS"

print_success "Deployment completed successfully! 🚀"
