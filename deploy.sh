#!/bin/bash

# SynergyOS - Docker Deployment Script (Linux/Mac)
# This script builds and starts all Docker containers

echo "============================================"
echo "  SynergyOS Docker Deployment"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}Checking Docker...${NC}"
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker or Docker Compose is not installed${NC}"
    echo -e "${YELLOW}Please install Docker from https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if .env file exists
echo -e "\n${YELLOW}Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file and set your configuration${NC}"
    echo -e "${YELLOW}   - Set SECRET_KEY to a random string${NC}"
    echo -e "${YELLOW}   - Set DB_PASSWORD to a secure password${NC}"
    echo -e "${YELLOW}   - Configure email settings (optional)${NC}"
    echo -e "${YELLOW}   - Set GEMINI_API_KEY for AI features (optional)${NC}"
    echo ""
    read -p "Continue with default settings? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled. Please configure .env and run again.${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✓ .env file found${NC}"
fi

# Stop and remove existing containers
echo -e "\n${YELLOW}Stopping existing containers...${NC}"
docker-compose down 2>/dev/null
echo -e "${GREEN}✓ Stopped existing containers${NC}"

# Build images
echo -e "\n${YELLOW}Building Docker images...${NC}"
if ! docker-compose build --no-cache; then
    echo -e "${RED}✗ Failed to build images${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Images built successfully${NC}"

# Start containers
echo -e "\n${YELLOW}Starting containers...${NC}"
if ! docker-compose up -d; then
    echo -e "${RED}✗ Failed to start containers${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Containers started successfully${NC}"

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check container status
echo -e "\n${CYAN}Container Status:${NC}"
docker-compose ps

# Run migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
if ! docker-compose exec -T backend python manage.py migrate; then
    echo -e "${YELLOW}⚠️  Migrations may have failed, but continuing...${NC}"
else
    echo -e "${GREEN}✓ Migrations completed${NC}"
fi

# Deployment complete
echo -e "\n============================================"
echo -e "  ${GREEN}Deployment Complete!${NC}"
echo -e "============================================"
echo ""
echo -e "${CYAN}🌐 Application URLs:${NC}"
echo -e "   Frontend:    http://localhost"
echo -e "   Backend API: http://localhost/api"
echo -e "   Admin Panel: http://localhost/admin"
echo ""
echo -e "${CYAN}📊 Service Status:${NC}"
echo -e "   Database:    PostgreSQL 16"
echo -e "   Cache:       Redis 7"
echo -e "   Backend:     Django 5.2.7 (Gunicorn)"
echo -e "   Worker:      Celery"
echo -e "   Frontend:    React Router v7"
echo -e "   Proxy:       Nginx"
echo ""

# Create superuser
read -p "Would you like to create a superuser account? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Creating superuser...${NC}"
    docker-compose exec backend python manage.py createsuperuser
fi

echo -e "\n${CYAN}📝 Useful Commands:${NC}"
echo -e "   View logs:           docker-compose logs -f"
echo -e "   Stop containers:     docker-compose stop"
echo -e "   Start containers:    docker-compose start"
echo -e "   Restart containers:  docker-compose restart"
echo -e "   Remove containers:   docker-compose down"
echo -e "   Shell (backend):     docker-compose exec backend python manage.py shell"
echo -e "   Shell (database):    docker-compose exec db psql -U synergyos_user synergyos"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
