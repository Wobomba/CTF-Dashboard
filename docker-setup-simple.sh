#!/bin/bash

# Simple Docker setup script for CTF Dashboard
# This script sets up the application without SSL for easy testing

echo "Setting up CTF Dashboard with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating environment file..."
    cat > .env << EOF
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key-change-this

# Database Configuration
POSTGRES_DB=cyberlab
POSTGRES_USER=cyberlab
POSTGRES_PASSWORD=cyberlab_password

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# Frontend URL (replace with your server IP)
FRONTEND_URL=http://localhost
CORS_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173

# File Upload Configuration
MAX_CONTENT_LENGTH=50MB
UPLOAD_FOLDER=uploads
EOF
    echo "Environment file created. Please edit .env with your settings."
fi

# Build the application
echo "Building application..."
docker-compose build

# Start the services
echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service status..."
docker-compose ps

# Test API endpoint
echo "Testing API endpoint..."
if curl -s http://localhost/api/health > /dev/null; then
    echo "API is responding"
else
    echo "API is not responding. Check logs with: docker-compose logs app"
fi

# Test categories endpoint
echo "Testing categories endpoint..."
if curl -s http://localhost/api/challenges/categories > /dev/null; then
    echo "Categories API is responding"
else
    echo "Categories API is not responding"
fi

echo ""
echo "Setup complete!"
echo "Access your application at: http://localhost"
echo "View logs with: docker-compose logs -f"
echo "Stop services with: docker-compose down"
echo ""
echo "First-time setup:"
echo "1. Visit http://localhost"
echo "2. You'll be redirected to admin setup"
echo "3. Create your admin account"
echo "4. Start using the platform!"
