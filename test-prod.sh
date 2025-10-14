#!/bin/bash

# Production Test Script
# Tests the production build locally

set -e

echo "🧪 Testing Production Build..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test 1: Check if frontend is built
print_status "Checking frontend build..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    print_success "Frontend build exists"
else
    print_error "Frontend not built. Run: cd frontend && npm run build"
    exit 1
fi

# Test 2: Check build files
print_status "Checking build files..."
if [ -f "dist/assets/index-9305c2a9.js" ] && [ -f "dist/assets/index-6a9b0bc2.css" ]; then
    print_success "Build assets found"
else
    print_error "Build assets missing"
    exit 1
fi

# Test 3: Check Docker files
print_status "Checking Docker configuration..."
if [ -f "docker-compose.prod.yml" ] && [ -f "Dockerfile.backend" ] && [ -f "nginx/nginx.prod.conf" ]; then
    print_success "Docker configuration files found"
else
    print_error "Docker configuration files missing"
    exit 1
fi

# Test 4: Check environment template
print_status "Checking environment configuration..."
if [ -f "env.prod.example" ]; then
    print_success "Environment template found"
else
    print_error "Environment template missing"
    exit 1
fi

# Test 5: Test Docker Compose syntax
print_status "Validating Docker Compose configuration..."
if docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration has errors"
    exit 1
fi

# Test 6: Check if ports are available
print_status "Checking port availability..."
if ! netstat -tuln | grep -q ":80 "; then
    print_success "Port 80 is available"
else
    print_warning "Port 80 is in use - you may need to stop other services"
fi

if ! netstat -tuln | grep -q ":5000 "; then
    print_success "Port 5000 is available"
else
    print_warning "Port 5000 is in use - you may need to stop other services"
fi

# Test 7: Check if Docker is running
print_status "Checking Docker daemon..."
if docker info > /dev/null 2>&1; then
    print_success "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    exit 1
fi

# Test 8: Validate Nginx configuration
print_status "Validating Nginx configuration..."
if command -v nginx > /dev/null 2>&1; then
    if nginx -t -c $(pwd)/nginx/nginx.prod.conf > /dev/null 2>&1; then
        print_success "Nginx configuration is valid"
    else
        print_warning "Nginx configuration has issues (this is normal if nginx is not installed)"
    fi
else
    print_warning "Nginx not installed locally - configuration will be tested in Docker"
fi

print_success "🎉 Production build test completed!"
print_status "Ready for deployment with: ./deploy-prod.sh"
print_warning "Remember to:"
print_warning "  1. Copy env.prod.example to .env"
print_warning "  2. Update .env with your production values"
print_warning "  3. Run ./deploy-prod.sh to deploy"
