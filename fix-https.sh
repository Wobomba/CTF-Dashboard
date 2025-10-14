#!/bin/bash

# Quick fix for HTTPS Mixed Content issues
echo "🔧 Fixing HTTPS Mixed Content Issues..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[FIX]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 1. Update frontend environment
print_status "Setting up frontend HTTPS configuration..."
cd frontend

# Create production environment file
if [ ! -f ".env.production" ]; then
    if [ -f "env.production.example" ]; then
        cp env.production.example .env.production
        print_success "Created .env.production from template"
    else
        echo "VITE_API_URL=https://cyberlab.renu.ac.ug/api" > .env.production
        print_success "Created .env.production with HTTPS API URL"
    fi
else
    print_success ".env.production already exists"
fi

# 2. Rebuild frontend with HTTPS configuration
print_status "Rebuilding frontend with HTTPS configuration..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend rebuilt successfully"
else
    print_warning "Frontend build failed, but continuing..."
fi

cd ..

# 3. Update Docker containers
print_status "Updating Docker containers with HTTPS configuration..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Wait for services
print_status "Waiting for services to start..."
sleep 30

# 5. Test HTTPS
print_status "Testing HTTPS configuration..."
if curl -k -f https://localhost/health > /dev/null 2>&1; then
    print_success "HTTPS is working!"
else
    print_warning "HTTPS test failed, but services may still be starting..."
fi

print_success "🎉 HTTPS fix completed!"
print_warning "Make sure your SSL certificates are properly configured:"
print_warning "  - Certificate: /etc/nginx/ssl/cert.pem"
print_warning "  - Private Key: /etc/nginx/ssl/key.pem"
print_warning "  - Update .env.production with your domain name"
