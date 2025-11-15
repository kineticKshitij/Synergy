# SynergyOS - AI-Powered Business Management Platform

[![Repository](https://img.shields.io/badge/GitHub-SynergyOS-blue?logo=github)](https://github.com/kineticKshitij/Synergy)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Django](https://img.shields.io/badge/Django-5.2.7-092E20?logo=django)](https://www.djangoproject.com/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?logo=react-router)](https://reactrouter.com/)

Enterprise-grade full-stack application with Django REST backend and React Router v7 frontend, featuring AI-powered project management and team collaboration tools.

## 🚀 Quick Start with Docker

**Get the entire application running in 3 commands:**

```bash
# 1. Build all containers
docker-compose build

# 2. Start all services (PostgreSQL, Redis, Django, Celery, React, Nginx)
docker-compose up -d

# 3. Create admin user
docker-compose exec backend python manage.py createsuperuser
```

**Access your application:**
- 🌐 Frontend: http://localhost
- 🔌 Backend API: http://localhost/api
- 👤 Admin Panel: http://localhost/admin

## ✨ Key Features

### 🎯 Project Management
- **Project Dashboard** - Comprehensive project overview with real-time statistics
- **Task Management** - Create, assign, and track tasks with kanban-style interface
- **Team Collaboration** - Invite team members, assign roles, and manage permissions
- **Progress Tracking** - Visual progress indicators and milestone tracking
- **File Attachments** - Upload and manage proof of completion files
- **Activity Timeline** - Real-time activity feed for project updates

### 👥 Team Features
- **Role-Based Access** - Manager and team member dashboards with appropriate permissions
- **Team Dashboard** - Dedicated workspace for team members to view assigned tasks
- **Task Upload** - Team members can upload proof of completion
- **Real-time Notifications** - Stay updated on project changes and assignments
- **Team Member Invitations** - Email-based team member onboarding

### 🔐 Security & Authentication
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **User Management** - Registration, login, logout, password reset
- **Security Dashboard** - Audit logs and security event tracking
- **Rate Limiting** - Protection against brute force attacks
- **Input Validation** - XSS and SQL injection prevention
- **Session Management** - Token blacklisting and secure logout

### 🎨 Modern UI/UX
- **Custom Loading Screens** - Beautiful branded loading animations
- **Quick View Modal** - Inline preview for images and PDFs
- **Responsive Design** - Mobile-friendly interface
- **Dark Mode** - Eye-friendly dark theme
- **Smooth Animations** - Polished user experience with custom CSS animations
- **Component Library** - Reusable UI components (LoadingSpinner, Toast, Modal, etc.)

### 🤖 AI-Powered Capabilities *(Coming Soon)*
- Smart task prioritization and scheduling
- Automated anomaly detection
- Intelligent feedback analysis
- Predictive analytics for project timelines

## 📁 Project Structure

```
SynergyOS/
├── frontend/              # React Router v7 Application
│   ├── app/
│   │   ├── routes/       # Page components (login, dashboard, projects, etc.)
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API service layer
│   │   ├── contexts/     # React contexts (Auth, etc.)
│   │   └── app.css       # Global styles
│   ├── public/           # Static assets (loading.gif, etc.)
│   └── package.json
├── backend/              # Django REST API
│   ├── accounts/         # User authentication & profiles
│   ├── projects/         # Project management system
│   │   ├── models.py    # Project, Task, Message, Attachment models
│   │   ├── views.py     # API endpoints
│   │   └── serializers.py
│   ├── SynergyOS/       # Django settings
│   └── manage.py
├── nginx/               # Nginx reverse proxy configuration
├── docker-compose.yml   # Multi-service Docker setup
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React Router v7** - Modern routing with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Lucide Icons** - Beautiful, consistent icons

### Backend
- **Django 5.2.7** - Python web framework
- **Django REST Framework** - RESTful API
- **PostgreSQL 16** - Relational database
- **Redis 7** - Caching and session storage
- **Celery** - Asynchronous task processing
- **JWT** - Secure authentication

### DevOps & Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and load balancing
- **Gunicorn** - WSGI HTTP server (4 workers)
- **Multi-stage builds** - Optimized Docker images

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login (JWT tokens)
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/user/` - Get current user profile
- `PUT /api/auth/user/update/` - Update user profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/password-reset/` - Request password reset
- `POST /api/auth/password-reset-confirm/` - Confirm password reset

### Projects
- `GET /api/projects/` - List all projects
- `POST /api/projects/` - Create new project
- `GET /api/projects/{id}/` - Get project details
- `PUT /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Delete project
- `POST /api/projects/{id}/invite/` - Invite team member
- `DELETE /api/projects/{id}/remove-member/` - Remove team member

### Tasks
- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{id}/` - Get task details
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task
- `POST /api/tasks/{id}/upload-proof/` - Upload proof of completion

### Attachments
- `GET /api/attachments/by_task/?task_id={id}` - Get task attachments
- `POST /api/attachments/` - Upload attachment

### Team Dashboard
- `GET /api/team-dashboard/` - Get team member dashboard data
- `GET /api/team-dashboard/my-tasks/` - Get assigned tasks

## 🐳 Docker Services

The application runs as 7 interconnected Docker services:

| Service | Description | Port | Health Check |
|---------|-------------|------|--------------|
| **postgres** | PostgreSQL 16 database | 5432 (internal) | ✅ pg_isready |
| **redis** | Redis 7 cache & queue | 6379 (internal) | ✅ redis-cli ping |
| **backend** | Django API + Gunicorn | 8000 (internal) | - |
| **celery_worker** | Background task processor | - | - |
| **celery_beat** | Task scheduler | - | - |
| **frontend** | React Router v7 app | 3000 (internal) | - |
| **nginx** | Reverse proxy | 80, 443 (public) | - |

### Volume Persistence

Data is persisted across container restarts:
- `postgres-data` - Database storage
- `redis-data` - Redis AOF persistence
- `static-files` - Django static assets
- `media-files` - User uploads

## 🔧 Development Setup

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Git

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/kineticKshitij/Synergy.git
cd Synergy
```

2. **Configure environment:**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set your values:
# - SECRET_KEY (generate with: python generate_secret_key.py)
# - DATABASE_URL
# - DEBUG=True for development
```

3. **Build and start:**
```bash
docker-compose build
docker-compose up -d
```

4. **Create superuser:**
```bash
docker-compose exec backend python manage.py createsuperuser
```

5. **Access the application:**
- Open http://localhost in your browser
- Log in with your superuser credentials

### Useful Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check service status
docker-compose ps

# Run Django management commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py collectstatic

# Access PostgreSQL
docker-compose exec db psql -U postgres -d synergyos

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ destroys data)
docker-compose down -v
```

## 🎨 UI Components

The application includes a custom component library:

- **LoadingScreen** - Branded loading screen with custom GIF
- **LoadingSpinner** - Reusable loading indicators (sm, md, lg)
- **Toast** - Notification system (success, error, warning, info)
- **Modal** - Reusable modal dialogs
- **SearchBar** - Enhanced search with clear button
- **EmptyState** - Beautiful empty states with CTAs
- **NotificationCenter** - Dropdown notifications with badges
- **Navbar** - Role-based navigation menu
- **ProtectedRoute** - Route guards with role checking
- **TaskModal** - Task creation and editing
- **ViewProofModal** - File viewer with quick preview

### Quick View Feature

Preview files without leaving the page:
- **Images** - JPG, PNG, GIF, WebP, SVG
- **PDFs** - Embedded PDF viewer
- **Actions** - Download, Open in new tab
- **UX** - Click outside to close, ESC key support

## 🔒 Security Features

- JWT access tokens (60-minute expiry)
- Refresh tokens (7-day expiry)
- Rate limiting on authentication endpoints
- CSRF protection
- XSS prevention through input sanitization
- SQL injection prevention via ORM
- Secure password hashing (PBKDF2)
- Security event logging and audit trail
- IP address tracking
- Role-based access control

## 📊 Database Models

### Core Models

**User & Profile**
- Extended Django User model with UserProfile
- Roles: manager, member, admin
- Custom Synergy email, department, position
- Avatar support

**Project**
- Owner, team members, status, priority
- Budget tracking, progress percentage
- Start/end dates, task count

**Task**
- Assigned to team member
- Status, priority, progress
- Due dates, proof of completion
- File attachments

**TaskAttachment**
- File uploads with type detection
- Proof of completion flag
- Metadata and descriptions

**ProjectMessage**
- Team communication
- @mentions support
- Read receipts

**SecurityEvent**
- Comprehensive audit logging
- Event types: login, logout, password changes, etc.
- IP tracking and metadata

## 🚀 Deployment

### Production Deployment Checklist

1. **Environment Configuration**
   - [ ] Set `DEBUG=False` in `.env`
   - [ ] Generate secure `SECRET_KEY`
   - [ ] Configure `ALLOWED_HOSTS` with your domain
   - [ ] Set up SSL certificates in nginx config
   - [ ] Configure email backend (SMTP)
   - [ ] Set proper CORS origins

2. **Security**
   - [ ] Enable HTTPS only
   - [ ] Set secure cookie flags
   - [ ] Configure firewall rules
   - [ ] Set up database backups
   - [ ] Enable Django security middleware
   - [ ] Review and update rate limits

3. **Performance**
   - [ ] Configure Redis for caching
   - [ ] Set up CDN for static assets
   - [ ] Enable database connection pooling
   - [ ] Configure Celery workers for background tasks
   - [ ] Set up monitoring and logging

### Deployment Platforms

The containerized app can be deployed to:
- AWS (ECS, Fargate, EC2)
- Google Cloud (Cloud Run, GKE)
- Azure (Container Apps, AKS)
- Digital Ocean (App Platform)
- Railway, Fly.io, Render

## 🐛 Troubleshooting

### Common Issues

**Frontend shows blank page:**
- Check nginx logs: `docker-compose logs nginx`
- Verify frontend built correctly: `docker-compose logs frontend`
- Ensure all services are running: `docker-compose ps`

**API returns 403 CSRF errors:**
- Check CORS settings in backend settings.py
- Verify `CSRF_TRUSTED_ORIGINS` includes your domain
- Ensure cookies are being sent with requests

**Database connection failed:**
- Check database is healthy: `docker-compose ps db`
- Verify credentials in `.env` file
- Check database logs: `docker-compose logs db`

**Port 80 already in use:**
```bash
# Change nginx ports in docker-compose.yml
ports:
  - "8080:80"  # Access via http://localhost:8080
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Kshitij Marotkar**
- GitHub: [@kineticKshitij](https://github.com/kineticKshitij)
- Repository: [Synergy](https://github.com/kineticKshitij/Synergy)

## 🙏 Acknowledgments

- Django & Django REST Framework communities
- React Router v7 team
- PostgreSQL and Redis projects
- Tailwind CSS team
- All open-source contributors

---

**Built with ❤️ using Django REST Framework + React Router v7 + Docker**

For questions or support, please open an issue on GitHub.
