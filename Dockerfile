# Multi-stage build for RENU-CERT CyberLab
# Stage 1: Frontend Build
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy frontend source
COPY . .

# Set production environment variables for HTTP API (no mixed content issues)
ENV VITE_API_URL=http://cyberlab.renu.ac.ug/api
ENV VITE_NODE_ENV=production
ENV VITE_FORCE_HTTP=true

# Build the frontend
RUN npm run build

# Stage 2: Backend Production Image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    FLASK_APP=backend/app.py

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash cyberlab

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Copy static files and uploads directory
RUN mkdir -p uploads logs

# Set ownership
RUN chown -R cyberlab:cyberlab /app

# Switch to non-root user
USER cyberlab

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "backend.app:app"]
