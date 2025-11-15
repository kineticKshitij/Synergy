# 🚀 Quick Start - Docker Deployment

## Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- At least 4GB RAM and 10GB disk space

## One-Command Deployment

### Windows (PowerShell)
```powershell
.\docker-deploy.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

### Manual Deployment
```bash
# 1. Create .env file (if not exists)
cp .env.example .env

# 2. Edit .env and update:
#    - SECRET_KEY (generate a secure key)
#    - DB_PASSWORD (set a strong password)

# 3. Build and start
docker compose up -d --build

# 4. Create superuser
docker compose exec backend python manage.py createsuperuser
```

## Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Django Admin**: http://localhost/admin

## Common Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# View service status
docker compose ps

# Access backend shell
docker compose exec backend python manage.py shell

# Run migrations
docker compose exec backend python manage.py migrate

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput
```

## Troubleshooting

### Port 80 already in use
```powershell
# Windows - Find process using port 80
netstat -ano | findstr :80

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Services not starting
```bash
# Check logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild without cache
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Database connection issues
```bash
# Check database is running
docker compose ps db

# Restart database
docker compose restart db
```

## Production Deployment

Before deploying to production:

1. **Update .env file:**
   - Set `DEBUG=False`
   - Generate strong `SECRET_KEY`
   - Set secure `DB_PASSWORD`
   - Update `ALLOWED_HOSTS` with your domain
   - Configure email settings

2. **Enable HTTPS:**
   - Add SSL certificates to nginx
   - Update nginx configuration for HTTPS

3. **Security:**
   - Use Docker secrets for sensitive data
   - Enable firewall rules
   - Regular database backups

For detailed information, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
