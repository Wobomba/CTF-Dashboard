#!/bin/bash

# RENU-CERT CyberLab Docker Build Script
# This script builds and runs the containerized application

set -e

echo "Building RENU-CERT CyberLab Docker containers..."

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p uploads logs nginx/ssl

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from example..."
    cp docker.env.example .env
    print_warning "Please edit .env file with your production values before running the application."
fi

# Build the application
print_status "Building Docker images..."
docker-compose build --no-cache

# Start the services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are running
print_status "Checking service status..."
docker-compose ps

# Initialize database
print_status "Initializing database..."
docker-compose exec app python backend/init_database.py

print_success "RENU-CERT CyberLab is now running!"
print_status "Access the application at: http://localhost"
print_status "API endpoint: http://localhost/api"
print_status ""
print_status "To view logs: docker-compose logs -f"
print_status "To stop: docker-compose down"
print_status "To restart: docker-compose restart"
