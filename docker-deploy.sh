#!/bin/bash

# SynergyOS Docker Deployment Script
# This script helps deploy the SynergyOS application using Docker Compose

echo "🐳 SynergyOS Docker Deployment"
echo "================================"
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "✗ Docker is not running. Please start Docker."
    exit 1
fi
echo "✓ Docker is running"

# Check if Docker Compose is available
echo "Checking Docker Compose..."
if ! docker compose version > /dev/null 2>&1; then
    echo "✗ Docker Compose is not available."
    exit 1
fi
echo "✓ Docker Compose is available"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ .env file created. Please update it with your configuration."
        echo "⚠  IMPORTANT: Update SECRET_KEY and DB_PASSWORD in .env file!"
    else
        echo "✗ .env.example not found. Creating basic .env file..."
        cat > .env << EOF
SECRET_KEY=django-insecure-change-this-in-production-$(uuidgen)
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend,nginx
DB_PASSWORD=synergyos_pass_2024
EOF
        echo "✓ Basic .env file created. Please update it with your configuration."
    fi
else
    echo "✓ .env file exists"
fi

# Stop existing containers if running
echo ""
echo "Stopping existing containers..."
docker compose down > /dev/null 2>&1

# Build and start containers
echo ""
echo "Building and starting containers..."
echo "This may take several minutes on first run..."

if docker compose up -d --build; then
    echo ""
    echo "✓ Containers built and started successfully!"
    echo ""
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Check service status
    echo ""
    echo "Service Status:"
    docker compose ps
    
    echo ""
    echo "📊 Deployment Complete!"
    echo "================================"
    echo ""
    echo "Access the application:"
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost/api"
    echo "  Admin:     http://localhost/admin"
    echo ""
    echo "Next steps:"
    echo "  1. Create a superuser: docker compose exec backend python manage.py createsuperuser"
    echo "  2. View logs: docker compose logs -f"
    echo "  3. Stop services: docker compose down"
    echo ""
else
    echo ""
    echo "✗ Deployment failed. Check the errors above."
    echo "View logs: docker compose logs"
    exit 1
fi

