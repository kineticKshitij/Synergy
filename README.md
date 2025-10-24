````markdown
# SynergyOS - Full Stack Authentication System

A modern full-stack application with Django REST backend and React Router v7 frontend, featuring comprehensive authentication and security features.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/kineticKshitij/Synergy)

## ✨ Features

### 🏗️ Project Structure
```
Synergy/
├── app/                    # React Router v7 Frontend
│   ├── routes/            # Route components (login, register, dashboard, security, etc.)
│   ├── components/        # Reusable components
│   └── root.tsx          # Root layout
├── backend/               # Django REST Backend
│   ├── accounts/         # Authentication app
│   ├── SynergyOS/        # Django project settings
│   └── manage.py         # Django management
├── public/               # Static assets
└── package.json          # Frontend dependencies
```

### 🔐 Authentication & Security
- ✅ **JWT Authentication** - Secure token-based auth with refresh tokens
- ✅ **User Registration** - Email validation, password strength requirements
- ✅ **Login/Logout** - Session management with token blacklisting
- ✅ **Password Reset Flow** - Email-based password recovery with secure tokens
- ✅ **User Profile Management** - Edit profile, change password, security settings
- ✅ **Rate Limiting** - Protection against brute force attacks
  - Login: 5 attempts/5 minutes
  - Registration: 5 attempts/hour
  - Password Reset: 3 attempts/hour
- ✅ **Input Validation & Sanitization** - XSS and SQL injection prevention
- ✅ **Security Logging** - Comprehensive audit trail for all auth events
  - Login success/failure tracking
  - Password changes and resets
  - IP address logging
  - Security dashboard UI (`/security`)

### Frontend Features

### Frontend Features
- 🚀 **React Router v7** - Modern routing with server-side rendering
- ⚡️ **Hot Module Replacement** - Fast development workflow
- 🎨 **Responsive Design** - Mobile-friendly authentication UI
- � **Protected Routes** - Role-based access control
- 📊 **Security Dashboard** - Real-time audit log viewer
- 🎉 **TypeScript** - Type-safe development

### Backend Features
- 📦 **Django 5.2.7** - Robust Python web framework
- 🔄 **RESTful API** - Clean API design with DRF
- 🗄️ **PostgreSQL 18** - Enterprise-grade database
- 🔐 **JWT Tokens** - Secure authentication
- 📧 **Email Integration** - Password reset notifications
- 🛡️ **Security Events** - Comprehensive logging system
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Prerequisites
- **Python 3.11+** (for Django backend)
- **Node.js 18+** (for React frontend)
- **PostgreSQL 18** (database)

### Backend Setup (Django)

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create and activate virtual environment:**
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. **Install Python dependencies:**
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary python-dotenv django-ratelimit
```

4. **Configure PostgreSQL:**
- Create a database: `synergyos_db`
- Update credentials in `backend/SynergyOS/settings.py`

5. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser (admin):**
```bash
python manage.py createsuperuser
```

7. **Start Django server:**
```bash
python manage.py runserver
```

**Backend runs on:** `http://localhost:8000`  
**Admin panel:** `http://localhost:8000/admin`

### Frontend Setup (React Router)

1. **Install dependencies:**

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**

2. **Start development server:**
```bash
npm run dev
```

**Frontend runs on:** `http://localhost:5174`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login (returns JWT tokens)
- `POST /api/auth/logout/` - User logout (blacklists token)
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/user/` - Get current user info
- `PUT /api/auth/user/update/` - Update user profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/password-reset/` - Request password reset
- `POST /api/auth/password-reset-confirm/` - Confirm password reset
- `GET /api/auth/security-events/` - List security events (role-based)

### Security Features
- All endpoints protected with rate limiting
- JWT access tokens: 60-minute expiry
- Refresh tokens: 7-day expiry
- Comprehensive input validation
- Security event logging for all actions
- IP address tracking

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
python manage.py test accounts
```

### Test Security Logging
```powershell
# From root directory
.\test-security-complete.ps1
```

Tests all security event types:
1. ✅ User registration
2. ✅ Successful login
3. ✅ Failed login attempt
4. ✅ Password change
5. ✅ Password reset request
6. ✅ Security event retrieval

## 📊 Security Dashboard

Access at: **`http://localhost:5174/security`**

Features:
- 📈 Total security events counter
- ❌ Failed login attempts
- ✅ Successful logins
- 🔑 Password changes
- 📋 Full audit log with:
  - Event type and description
  - IP addresses
  - Timestamps
  - Expandable metadata
  - Color-coded event types

## 🗄️ Database Schema

### SecurityEvent Model
```python
event_type: CharField (9 choices)
user: ForeignKey (nullable)
username: CharField
ip_address: GenericIPAddressField
description: TextField
metadata: JSONField
created_at: DateTimeField (indexed)
```

Event Types: `login_success`, `login_failed`, `logout`, `password_change`, `password_reset_request`, `password_reset`, `rate_limit`, `registration`, `other`

## 🛠️ Tech Stack

**Frontend:**
- React Router v7
- TypeScript
- Vite
- CSS3

**Backend:**
- Django 5.2.7
- Django REST Framework
- SimpleJWT
- PostgreSQL 18
- Django CORS Headers
- Django Ratelimit

**Security:**
- JWT Authentication
- Rate Limiting
- Input Validation & Sanitization
- XSS Prevention
- SQL Injection Prevention
- Comprehensive Security Event Logging

## 📝 Development Roadmap

### ✅ Completed (Week 1-2)
- [x] Django + React Router setup
- [x] PostgreSQL integration
- [x] JWT authentication system
- [x] User registration and login
- [x] Password reset flow with email
- [x] Rate limiting (brute force protection)
- [x] User profile management (3 tabs)
- [x] Input validation and sanitization
- [x] Security event logging system
- [x] Security dashboard UI

### 🚧 In Progress (Week 3)
- [ ] Two-Factor Authentication (MFA/TOTP)
- [ ] Role-Based Access Control (RBAC)
- [ ] OAuth Integration (Google/GitHub)

### 📅 Planned (Phase 2)
- [ ] AI Infrastructure Setup
- [ ] Machine Learning Features
- [ ] Advanced Analytics Dashboard
- [ ] Real-time Notifications

## 🚀 Building for Production

### Frontend Build

Create a production build:

```bash
npm run build
```

### Backend Production Settings
- Set `DEBUG = False` in `backend/SynergyOS/settings.py`
- Configure allowed hosts
- Use environment variables for secrets
- Set up proper email backend (SMTP)
- Configure HTTPS/SSL
- Use Gunicorn or uWSGI server

## 🐳 Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Kshitij**
- GitHub: [@kineticKshitij](https://github.com/kineticKshitij)
- Repository: [Synergy](https://github.com/kineticKshitij/Synergy)

## 🙏 Acknowledgments

- Django & Django REST Framework communities
- React Router team
- PostgreSQL project
- All contributors and testers

---

**Built with ❤️ using Django REST Framework + React Router v7**

**Note:** This is a production-ready authentication system with enterprise-grade security features. Ensure proper environment configuration, HTTPS, and security hardening for production deployment.

````
