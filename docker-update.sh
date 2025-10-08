#!/bin/bash

# CTF Dashboard Docker Update Script
echo "🔄 Updating CTF Dashboard Docker Setup..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Please run this script from the CTF-Dashboard root directory"
    exit 1
fi

# Pull latest changes
echo "Pulling latest changes from GitHub..."
git pull origin master

if [ $? -ne 0 ]; then
    echo "Error: Failed to pull changes from GitHub"
    exit 1
fi

# Ask which setup to update
echo "Which Docker setup do you want to update?"
echo "1) Development (docker-compose.yml)"
echo "2) Production (docker-compose.prod.yml)"
echo "3) Simple (docker-compose.simple.yml)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        COMPOSE_FILE="docker-compose.yml"
        echo "Updating development setup..."
        ;;
    2)
        COMPOSE_FILE="docker-compose.prod.yml"
        echo "Updating production setup..."
        ;;
    3)
        COMPOSE_FILE="docker-compose.simple.yml"
        echo "Updating simple setup..."
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Stop containers
echo "Stopping containers..."
docker-compose -f $COMPOSE_FILE down

# Rebuild containers
echo "Rebuilding containers with latest changes..."
docker-compose -f $COMPOSE_FILE build --no-cache

if [ $? -ne 0 ]; then
    echo "Error: Failed to build containers"
    exit 1
fi

# Start containers
echo "Starting updated containers..."
docker-compose -f $COMPOSE_FILE up -d

if [ $? -eq 0 ]; then
    echo "Update completed successfully!"
    echo "Your application should be running with the latest changes"
    
    # Show running containers
    echo "Running containers:"
    docker-compose -f $COMPOSE_FILE ps
else
    echo "Error: Failed to start containers"
    exit 1
fi

