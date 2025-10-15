#!/bin/bash

# Fix HTTPS Mixed Content Issues
# This script ensures the frontend is built with HTTPS API URLs

set -e

echo "🔧 Fixing HTTPS Mixed Content Issues..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Step 1: Create production environment file for frontend
print_status "Creating frontend production environment file..."

cat > frontend/.env.production << EOF
# Production Environment Variables for Frontend
# This ensures all API calls use HTTPS to avoid Mixed Content errors

# API Base URL - Use HTTPS in production
VITE_API_URL=https://cyberlab.renu.ac.ug/api

# Enable production optimizations
VITE_NODE_ENV=production
EOF

print_success "Frontend environment file created"

# Step 2: Rebuild frontend with HTTPS configuration
print_status "Rebuilding frontend with HTTPS configuration..."

cd frontend
npm ci
npm run build
cd ..

print_success "Frontend rebuilt with HTTPS configuration"

# Step 3: Rebuild Docker containers
print_status "Rebuilding Docker containers..."

docker-compose down
docker-compose up --build -d

print_success "Docker containers rebuilt"

# Step 4: Verify the fix
print_status "Verifying HTTPS configuration..."

# Check if the built frontend contains HTTPS API URLs
if grep -q "https://cyberlab.renu.ac.ug/api" frontend/dist/assets/*.js 2>/dev/null; then
    print_success "✅ Frontend built with HTTPS API URLs"
else
    echo "⚠️  Warning: Frontend may not have HTTPS API URLs embedded"
fi

echo ""
print_success "🎉 HTTPS Mixed Content fix completed!"
echo ""
echo "Next steps:"
echo "1. Access your application at: https://cyberlab.renu.ac.ug"
echo "2. Check browser console for any remaining errors"
echo "3. Verify that challenges load properly"
echo ""
echo "If you still see Mixed Content errors:"
echo "1. Clear your browser cache"
echo "2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)"
echo "3. Check that SSL certificates are properly configured"