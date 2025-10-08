#!/bin/bash

# CyberLab Academy Startup Script

echo "Starting CyberLab Academy..."

# Check if required dependencies are installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Node.js and npm are required but not installed."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "Please edit .env file with your configuration before running again."
    exit 1
fi

# Install backend dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install frontend dependencies
echo "Installing Node.js dependencies..."
npm install

# Initialize database
echo "Initializing database with sample data..."
cd backend
python init_database.py
cd ..

# Build frontend
echo "Building frontend..."
npm run build

echo "Setup complete!"
echo ""
echo "To start the platform:"
echo "   Backend:  cd backend && python app.py"
echo "   Frontend: npm run dev"
echo ""
echo "Access the platform at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Demo account:"
echo "   Email:    admin@cyberlab.local"
echo "   Password: admin123"
echo ""
echo "Happy learning!"
