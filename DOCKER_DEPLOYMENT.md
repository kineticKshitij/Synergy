# 🐳 Docker Deployment Guide - SynergyOS

Complete guide for deploying SynergyOS using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- At least 4GB of free RAM
- 10GB of free disk space

## 🚀 Quick Start

### 1. Clone and Navigate
```powershell
cd d:\Synergy
```

### 2. Create Environment File
```powershell
Copy-Item .env.example .env
```

Edit `.env` and update these critical values:
- `SECRET_KEY`: Generate a secure random key
- `DB_PASSWORD`: Set a strong database password

### 3. Build and Run
```powershell
docker-compose up --build
```

Or run in detached mode:
```powershell
docker-compose up -d --build
```

### 4. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Django Admin**: http://localhost/admin

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Nginx (Port 80/443)               │
│  ┌─────────────────────────────────────┐   │
│  │   Reverse Proxy & Load Balancer     │   │
│  └─────────────────────────────────────┘   │
└─────────────┬───────────────┬───────────────┘
              │               │
    ┌─────────▼─────┐   ┌────▼──────────┐
    │   Frontend    │   │    Backend    │
    │  React Router │   │    Django     │
    │   (Port 3000) │   │  (Port 8000)  │
    └───────────────┘   └────┬──────────┘
                             │
                        ┌────▼──────────┐
                        │  PostgreSQL   │
                        │   Database    │
                        └───────────────┘
```

## 📦 Services

### 1. **Database (PostgreSQL 16)**
- Container: `synergyos-db`
- Port: 5432 (internal)
- Volume: `postgres_data`
- Health checks enabled

### 2. **Backend (Django)**
- Container: `synergyos-backend`
- Port: 8000 (internal)
- Workers: 4 Gunicorn workers
- Volumes: static files, media files
- Auto-migration on startup

### 3. **Frontend (React Router v7)**
- Container: `synergyos-frontend`
- Port: 3000 (internal)
- Multi-stage build for optimization
- Production mode enabled

### 4. **Nginx (Reverse Proxy)**
- Container: `synergyos-nginx`
- Ports: 80 (HTTP), 443 (HTTPS)
- Gzip compression enabled
- Security headers configured

## 🔧 Docker Commands

### Build and Start
```powershell
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### Manage Services
```powershell
# Stop all services
docker-compose stop

# Start stopped services
docker-compose start

# Restart services
docker-compose restart

# Stop and remove containers
docker-compose down

# Stop and remove everything (including volumes)
docker-compose down -v
```

### Execute Commands
```powershell
# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Run migrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Access Django shell
docker-compose exec backend python manage.py shell

# Access PostgreSQL
docker-compose exec db psql -U synergyos_user -d synergyos
```

### View Status
```powershell
# List running containers
docker-compose ps

# View resource usage
docker stats

# Inspect a service
docker-compose exec backend env
```

## 🔍 Debugging

### View Logs
```powershell
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Access Container Shell
```powershell
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec db sh
```

### Health Checks
```powershell
# Check service health
docker-compose ps

# Test nginx health endpoint
curl http://localhost/health

# Test backend API
curl http://localhost/api/

# Test database connection
docker-compose exec backend python manage.py check --database default
```

## 🔒 Security Considerations

### Production Deployment

1. **Update Environment Variables**
   - Generate strong `SECRET_KEY`
   - Use secure `DB_PASSWORD`
   - Set `DEBUG=False`
   - Update `ALLOWED_HOSTS`

2. **Enable HTTPS**
   - Add SSL certificates
   - Update nginx configuration
   - Enable HSTS headers

3. **Database Security**
   - Use external managed database (e.g., AWS RDS)
   - Enable SSL for database connections
   - Regular backups

4. **Network Security**
   - Use Docker secrets for sensitive data
   - Implement firewall rules
   - Use private networks

## 🔄 Updates and Maintenance

### Update Application
```powershell
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Run migrations
docker-compose exec backend python manage.py migrate
```

### Backup Database
```powershell
# Create backup
docker-compose exec db pg_dump -U synergyos_user synergyos > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T db psql -U synergyos_user synergyos
```

### Clean Up
```powershell
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Clean everything
docker system prune -a --volumes
```

## 📊 Monitoring

### Resource Usage
```powershell
docker stats
```

### Container Logs
```powershell
docker-compose logs --tail=100 -f
```

### Performance Testing
```powershell
# Test backend response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/api/

# Load testing (using Apache Bench)
ab -n 1000 -c 10 http://localhost/
```

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```powershell
# Find process using port 80
netstat -ano | findstr :80

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**2. Database Connection Failed**
```powershell
# Check database is running
docker-compose ps db

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

**3. Static Files Not Loading**
```powershell
# Collect static files again
docker-compose exec backend python manage.py collectstatic --noinput

# Restart nginx
docker-compose restart nginx
```

**4. Build Failures**
```powershell
# Clean build
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🎯 Next Steps

1. Create Django superuser:
   ```powershell
   docker-compose exec backend python manage.py createsuperuser
   ```

2. Access Django admin:
   http://localhost/admin

3. Test the application:
   http://localhost

4. Configure email settings in `.env` for production

5. Set up SSL certificates for HTTPS

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- [React Router Deployment](https://reactrouter.com/en/main/guides/deploying)

## 🆘 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all ports are available
4. Check Docker Desktop is running
5. Review this guide's troubleshooting section
