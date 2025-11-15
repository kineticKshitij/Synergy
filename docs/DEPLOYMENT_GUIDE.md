# SynergyOS Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 4GB of free RAM
- At least 10GB of free disk space

### Deployment Steps

#### Windows (PowerShell)
```powershell
.\deploy.ps1
```

#### Linux/Mac
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Manual Deployment

If you prefer to deploy manually or the scripts don't work:

### 1. Create Environment File
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `SECRET_KEY` - Generate a random secret key
- `DB_PASSWORD` - Set a secure database password
- `GEMINI_API_KEY` - (Optional) For AI features
- Other settings as needed

### 2. Build Images
```bash
docker-compose build
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Run Migrations
```bash
docker-compose exec backend python manage.py migrate
```

### 5. Create Superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

### 6. Access Application
- Frontend: http://localhost
- Backend API: http://localhost/api
- Admin Panel: http://localhost/admin

---

## Services Overview

### Running Containers

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| PostgreSQL | synergyos-db | 5432 | Database |
| Redis | synergyos-redis | 6379 | Cache & Message Broker |
| Django | synergyos-backend | 8000 | REST API Backend |
| Celery Worker | synergyos-celery-worker | - | Async Tasks |
| Celery Beat | synergyos-celery-beat | - | Scheduled Tasks |
| React | synergyos-frontend | 3000 | Frontend UI |
| Nginx | synergyos-nginx | 80, 443 | Reverse Proxy |

### Docker Volumes

- `postgres_data` - Database data (persistent)
- `redis_data` - Redis data (persistent)
- `static_volume` - Django static files
- `media_volume` - User uploaded files

---

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery_worker
```

### Container Management
```bash
# Start all containers
docker-compose start

# Stop all containers
docker-compose stop

# Restart all containers
docker-compose restart

# Restart specific service
docker-compose restart backend

# Remove all containers (keeps volumes)
docker-compose down

# Remove containers and volumes (DELETES DATA!)
docker-compose down -v
```

### Database Operations
```bash
# Access PostgreSQL shell
docker-compose exec db psql -U synergyos_user synergyos

# Create database backup
docker-compose exec db pg_dump -U synergyos_user synergyos > backup_$(date +%Y%m%d).sql

# Restore database backup
cat backup_20251115.sql | docker-compose exec -T db psql -U synergyos_user synergyos

# Run migrations
docker-compose exec backend python manage.py migrate

# Create migrations
docker-compose exec backend python manage.py makemigrations
```

### Django Management
```bash
# Django shell
docker-compose exec backend python manage.py shell

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Run tests
docker-compose exec backend python manage.py test
```

### Redis Operations
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis commands
docker-compose exec redis redis-cli MONITOR

# Flush Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

### Celery Operations
```bash
# Check Celery worker status
docker-compose exec celery_worker celery -A SynergyOS inspect active

# Purge all tasks
docker-compose exec celery_worker celery -A SynergyOS purge

# View scheduled tasks
docker-compose exec celery_beat celery -A SynergyOS inspect scheduled
```

---

## Environment Variables

### Django Settings
```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
```

### Database
```env
DB_PASSWORD=your-db-password
```

### CORS (for API access)
```env
CORS_ALLOWED_ORIGINS=http://localhost,https://yourdomain.com
CSRF_TRUSTED_ORIGINS=http://localhost,https://yourdomain.com
```

### Email (Production)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### AI Features
```env
GEMINI_API_KEY=your-gemini-api-key
```

Get your Gemini API key: https://makersuite.google.com/app/apikey

---

## Troubleshooting

### Containers won't start
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

### Database connection errors
```bash
# Check if database is healthy
docker-compose ps db

# Wait for database to be ready (10 seconds)
docker-compose up -d db
sleep 10
docker-compose up -d backend
```

### Port already in use
```bash
# Find what's using port 80
# Windows:
netstat -ano | findstr :80

# Linux/Mac:
lsof -i :80

# Change port in docker-compose.yml
# ports:
#   - "8080:80"  # Change 80 to 8080
```

### Static files not loading
```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Restart nginx
docker-compose restart nginx
```

### Celery tasks not running
```bash
# Check worker logs
docker-compose logs celery_worker

# Restart worker
docker-compose restart celery_worker

# Check Redis connection
docker-compose exec backend python manage.py shell
>>> from django_redis import get_redis_connection
>>> get_redis_connection("default").ping()
```

### Out of memory
```bash
# Check resource usage
docker stats

# Increase Docker Desktop memory allocation
# Settings > Resources > Memory (set to 4GB minimum)
```

---

## Production Deployment

### Security Checklist

- [ ] Set strong `SECRET_KEY`
- [ ] Set `DEBUG=False`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use strong database password
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up email backend for notifications
- [ ] Configure firewall rules
- [ ] Regular database backups
- [ ] Monitor logs for security events

### SSL/HTTPS Setup

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update `nginx/conf.d/default.conf` with SSL configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of configuration
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

3. Mount SSL certificates in docker-compose.yml:
```yaml
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
```

### Performance Tuning

#### Increase Gunicorn workers
```yaml
backend:
  command: gunicorn SynergyOS.wsgi:application --bind 0.0.0.0:8000 --workers 8
```

#### Increase Celery concurrency
```yaml
celery_worker:
  command: celery -A SynergyOS worker -l info --concurrency=8
```

#### PostgreSQL optimization
Add to docker-compose.yml:
```yaml
db:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_MAX_CONNECTIONS: 200
```

---

## Monitoring

### Health Checks

- Application: http://localhost/health
- Database: `docker-compose exec db pg_isready`
- Redis: `docker-compose exec redis redis-cli ping`

### Resource Monitoring
```bash
# Real-time stats
docker stats

# Container resource usage
docker-compose ps --all
```

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# Add to docker-compose.yml for each service:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Backup & Restore

### Full Backup Script
```bash
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T db pg_dump -U synergyos_user synergyos > $BACKUP_DIR/database.sql

# Media files backup
docker cp synergyos-backend:/app/media $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
```

### Restore Script
```bash
#!/bin/bash
BACKUP_DIR=$1

# Restore database
cat $BACKUP_DIR/database.sql | docker-compose exec -T db psql -U synergyos_user synergyos

# Restore media files
docker cp $BACKUP_DIR/media/. synergyos-backend:/app/media/

echo "Restore completed from: $BACKUP_DIR"
```

---

## Scaling

### Horizontal Scaling (Multiple Backend Instances)
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale celery workers
docker-compose up -d --scale celery_worker=5
```

Update Nginx upstream configuration for load balancing:
```nginx
upstream backend {
    least_conn;
    server backend_1:8000;
    server backend_2:8000;
    server backend_3:8000;
}
```

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/kineticKshitij/Synergy/issues
- Documentation: /docs folder
- Email: support@synergyos.com

---

**Deployment Guide Version**: 1.0  
**Last Updated**: November 15, 2025  
**SynergyOS Version**: 1.0.0
