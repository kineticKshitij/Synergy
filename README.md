# SynergyOS - Full Stack Application

Enterprise-grade full-stack application with Django REST backend and React Router v7 frontend.

[![Repository](https://img.shields.io/badge/GitHub-SynergyOS-blue?logo=github)](https://github.com/kineticKshitij/Synergy)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Django](https://img.shields.io/badge/Django-5.2.7-092E20?logo=django)](https://www.djangoproject.com/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?logo=react-router)](https://reactrouter.com/)

## 🚀 Quick Start

**Get the entire application running in 3 commands:**

```powershell
# 1. Build containers
docker-compose build

# 2. Start all services
docker-compose up -d

# 3. Create admin user
docker-compose exec backend python manage.py createsuperuser
```

**Access your application:**
- Frontend: http://localhost
- Backend API: http://localhost/api/
- Admin Panel: http://localhost/admin/

## 📁 Project Structure

```
SynergyOS/
├── frontend/          # React Router v7 Application
│   ├── app/          # Application routes & components
│   ├── public/       # Static assets
│   └── package.json  # Node dependencies
├── backend/          # Django REST API
│   ├── accounts/     # Authentication & user management
│   ├── projects/     # Project management system
│   ├── SynergyOS/    # Django settings
│   └── manage.py     # Django management script
└── docs/             # Documentation & test scripts
```

[![Repository](https://img.shields.io/badge/GitHub-SynergyOS-blue?logo=github)](https://github.com/kineticKshitij/Synergy)

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
- 🤖 **AI Feedback System** - Intelligent feedback analysis and suggestions
- � **AI Irregularity Detection** - Automated anomaly detection and management
- �📖 [React Router docs](https://reactrouter.com/)

### 🤖 AI-Powered Features

#### AI Feedback System
- **Intelligent Feedback Analysis** - AI-powered sentiment analysis and categorization
- **Smart Suggestions** - Context-aware recommendations based on user feedback
- **Trend Detection** - Identify patterns and recurring issues automatically
- **Priority Scoring** - AI-driven priority assignment for feedback items
- **Auto-categorization** - Automatic classification of feedback types
- **Response Generation** - AI-assisted response suggestions
- **Feedback Analytics** - Deep insights and visualization of user sentiment

#### AI-Based Irregularity Management System
- **Anomaly Detection** - Machine learning models detect unusual patterns and behaviors
- **Real-time Monitoring** - Continuous scanning for security and operational irregularities
- **Predictive Alerts** - Early warning system for potential issues
- **Smart Classification** - Automatic categorization of irregularity types:
  - Security threats (unauthorized access, suspicious activities)
  - Performance anomalies (slow response times, resource spikes)
  - Data inconsistencies (duplicate entries, missing fields)
  - Business rule violations (invalid transactions, policy breaches)
- **Auto-remediation** - Automated response to common irregularities
- **Root Cause Analysis** - AI-powered investigation of underlying issues
- **Pattern Recognition** - Identify correlations between different irregularities
- **Compliance Monitoring** - Ensure adherence to policies and regulations
- **Custom Rule Engine** - Define and train models for specific business rules
- **Incident Management** - Track, prioritize, and resolve detected irregularities

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

### AI Feedback System
- `POST /api/ai/feedback/` - Submit user feedback for AI analysis
- `GET /api/ai/feedback/` - Retrieve feedback with AI insights
- `GET /api/ai/feedback/{id}/` - Get detailed feedback analysis
- `POST /api/ai/feedback/{id}/analyze/` - Trigger AI analysis
- `GET /api/ai/feedback/trends/` - Get AI-generated trend reports
- `GET /api/ai/feedback/sentiment/` - Overall sentiment analysis
- `POST /api/ai/feedback/{id}/suggest-response/` - Get AI-suggested responses

### AI Irregularity Management
- `GET /api/ai/irregularities/` - List all detected irregularities
- `GET /api/ai/irregularities/{id}/` - Get irregularity details
- `POST /api/ai/irregularities/scan/` - Trigger manual irregularity scan
- `GET /api/ai/irregularities/stats/` - Get irregularity statistics
- `POST /api/ai/irregularities/{id}/resolve/` - Mark irregularity as resolved
- `GET /api/ai/irregularities/types/` - Get irregularity type breakdown
- `GET /api/ai/irregularities/predictions/` - Get predictive alerts
- `POST /api/ai/irregularities/rules/` - Create custom detection rules
- `GET /api/ai/irregularities/root-cause/{id}/` - AI root cause analysis
- `POST /api/ai/irregularities/{id}/remediate/` - Auto-remediation action

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

### AIFeedback Model
```python
user: ForeignKey (User)
feedback_type: CharField (choices: bug, feature_request, complaint, praise, suggestion, other)
content: TextField
sentiment_score: FloatField (-1.0 to 1.0, AI-generated)
priority: CharField (low, medium, high, critical - AI-assigned)
category: CharField (AI-categorized)
status: CharField (pending, analyzing, reviewed, resolved)
ai_analysis: JSONField (AI insights and metadata)
trends: ManyToManyField (associated trends)
created_at: DateTimeField (indexed)
updated_at: DateTimeField
```

### Irregularity Model
```python
irregularity_type: CharField (security, performance, data, business_rule, compliance, other)
severity: CharField (low, medium, high, critical - AI-assigned)
title: CharField
description: TextField
affected_entity: CharField (resource/table/user affected)
detection_method: CharField (rule_based, ml_model, anomaly_detection)
confidence_score: FloatField (0.0 to 1.0 - AI confidence)
status: CharField (detected, investigating, resolved, false_positive)
root_cause: TextField (AI-generated analysis)
suggested_action: TextField (AI recommendations)
auto_remediated: BooleanField
metadata: JSONField (detection details)
detected_at: DateTimeField (indexed)
resolved_at: DateTimeField (nullable)
resolved_by: ForeignKey (User, nullable)
```

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

**AI/ML Stack:**
- TensorFlow / PyTorch - Deep learning models
- Scikit-learn - Machine learning algorithms
- NLTK / spaCy - Natural language processing
- TextBlob - Sentiment analysis
- Pandas / NumPy - Data processing
- Celery - Asynchronous task processing
- Redis - Caching and queue management

**DevOps & Deployment:**
- Docker & Docker Compose - Containerization
- Nginx - Reverse proxy and load balancing
- Gunicorn - WSGI HTTP server
- PostgreSQL 16 - Production database

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
- [x] AI Feedback System - Intelligent feedback analysis
- [x] AI Irregularity Management - Automated anomaly detection

### 🚧 In Progress (Week 3)
- [x] AI Sentiment Analysis - Real-time feedback sentiment scoring
- [x] AI Anomaly Detection Models - Custom ML models for irregularity detection
- [ ] Two-Factor Authentication (MFA/TOTP)
- [ ] Role-Based Access Control (RBAC)
- [ ] OAuth Integration (Google/GitHub)
- [ ] AI Response Generation - Automated feedback responses

### 📅 Planned (Phase 2)
- [ ] Advanced AI Features
  - [ ] Predictive Analytics Dashboard
  - [ ] Custom ML Model Training Interface
  - [ ] AI-Powered Chatbot Support
  - [ ] Automated Report Generation
- [ ] Enhanced Irregularity Management
  - [ ] Real-time Stream Processing
  - [ ] Advanced Pattern Recognition
  - [ ] Multi-tenant Isolation Detection
  - [ ] Compliance Automation
- [ ] Real-time Notifications (WebSocket)
- [ ] Advanced Analytics Dashboard
- [ ] GraphQL API Support

## 🤖 AI Features Implementation

### AI Feedback System Architecture

The AI Feedback System uses machine learning to analyze user feedback and provide actionable insights:

```
User Feedback → NLP Processing → Sentiment Analysis → Category Classification
                                        ↓
                                  Priority Scoring
                                        ↓
                            Trend Detection & Analytics
                                        ↓
                            Response Suggestion Generation
```

**Key Components:**
1. **Sentiment Analysis Engine**
   - Analyzes emotional tone of feedback (-1.0 to 1.0 scale)
   - Uses TextBlob and custom-trained models
   - Real-time sentiment scoring

2. **Auto-categorization System**
   - Categories: Bug, Feature Request, Complaint, Praise, Suggestion
   - Multi-label classification using TF-IDF and ML classifiers
   - Continuous learning from labeled data

3. **Priority Assignment**
   - AI-driven priority scoring (Low, Medium, High, Critical)
   - Based on sentiment, keywords, user history
   - Urgency detection algorithm

4. **Trend Detection**
   - Identifies recurring patterns across feedback
   - Time-series analysis for emerging issues
   - Correlation detection between feedback items

### AI Irregularity Management Architecture

The Irregularity Management System employs multiple AI techniques for comprehensive anomaly detection:

```
Data Sources → Feature Extraction → ML Models → Anomaly Detection
                                         ↓
                               Confidence Scoring
                                         ↓
                              Classification & Prioritization
                                         ↓
                              Root Cause Analysis (AI)
                                         ↓
                        Auto-remediation / Alert Generation
```

**Detection Methods:**

1. **Rule-Based Detection**
   - Predefined business rules and thresholds
   - Compliance policy violations
   - Security rule violations

2. **Statistical Anomaly Detection**
   - Z-score and IQR-based outlier detection
   - Time-series forecasting (ARIMA, Prophet)
   - Deviation from baseline patterns

3. **Machine Learning Models**
   - Isolation Forest for unsupervised anomaly detection
   - Random Forest for classification
   - LSTM networks for sequential anomalies
   - Autoencoders for complex pattern recognition

4. **Hybrid Approach**
   - Combines multiple detection methods
   - Ensemble voting for higher accuracy
   - Context-aware detection

**Irregularity Types Detected:**

| Type | Description | Examples |
|------|-------------|----------|
| **Security** | Unauthorized access, suspicious activities | Failed login spikes, privilege escalation attempts |
| **Performance** | System performance degradation | Slow queries, memory leaks, API timeouts |
| **Data** | Data quality and consistency issues | Duplicates, missing required fields, format violations |
| **Business Rule** | Violations of business logic | Invalid transactions, workflow violations |
| **Compliance** | Regulatory and policy violations | GDPR breaches, audit trail gaps |

**Auto-Remediation Actions:**
- Automatic user account suspension (security threats)
- Cache clearing (performance issues)
- Data deduplication (data irregularities)
- Notification escalation (critical issues)
- Workflow rollback (business rule violations)

**AI Root Cause Analysis:**
- Traces irregularity to source event
- Analyzes correlation with system changes
- Identifies contributing factors
- Suggests preventive measures

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

## 🐳 Docker Deployment

### Quick Start with Docker

**Complete Docker setup with multi-service architecture!**

The project includes a production-ready Docker Compose configuration with:
- **PostgreSQL 16** - Production database
- **Django Backend** - REST API with Gunicorn (4 workers)
- **React Frontend** - SSR with React Router v7
- **Nginx** - Reverse proxy with security headers
- **Persistent Volumes** - Data persistence for database, static files, and media

#### 1. Build and Start All Services

```powershell
# Build all containers
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

#### 2. Create Django Superuser

```powershell
# Create admin user
docker-compose exec backend python manage.py createsuperuser

# Or set password for existing admin user
docker-compose exec backend python manage.py changepassword admin
```

#### 3. Access Your Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api/
- **Django Admin**: http://localhost/admin/
- **Health Check**: http://localhost/health

#### 4. Common Commands

```powershell
# View service status
docker-compose ps

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Run Django management commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py collectstatic

# Access database
docker-compose exec db psql -U synergyos_user -d synergyos

# Stop and remove all containers
docker-compose down

# Stop and remove including volumes
docker-compose down -v
```

### Important Configuration Notes

**Environment Variables:**
- Edit `.env` file before first run
- Set `DEBUG=True` for local development
- Set `DEBUG=False` for production (requires SSL certificates)
- Generate secure `SECRET_KEY` using `python generate_secret_key.py`

**API Configuration:**
- Frontend uses **relative URLs** (`/api/`) to route through nginx
- All requests go through nginx reverse proxy on port 80
- Backend is not directly exposed (internal port 8000)
- CORS configured for http://localhost

**For Detailed Deployment:**
- **DOCKER_QUICKSTART.md** - Quick reference guide
- **DOCKER_DEPLOYMENT.md** - Comprehensive deployment guide
- **DEPLOYMENT_STATUS.md** - Current deployment status

### Production Deployment Platforms

The containerized application can be deployed to:

- **AWS** - ECS, Fargate, EC2
- **Google Cloud** - Cloud Run, GKE
- **Azure** - Container Apps, AKS
- **Digital Ocean** - App Platform, Droplets
- **Heroku** - Container Registry
- **Fly.io** - Docker deployment
- **Railway** - Direct Docker support

### 🐛 Docker Troubleshooting

#### Issue: Website shows ERR_EMPTY_RESPONSE or ERR_CONNECTION_REFUSED

**Problem**: Django's `SECURE_SSL_REDIRECT` redirects HTTP to HTTPS when `DEBUG=False`, but SSL certificates are not configured.

**Solution**:
```powershell
# Edit .env file and set:
DEBUG=True  # For local development without SSL

# Restart backend
docker-compose restart backend
```

#### Issue: Frontend can't connect to API (net::ERR_CONNECTION_REFUSED)

**Problem**: Frontend trying to connect directly to backend container instead of going through nginx.

**Solution**: Frontend API URLs must use **relative paths**:
```typescript
// ✅ Correct - routes through nginx
const API_URL = '/api/auth/';

// ❌ Wrong - bypasses nginx
const API_URL = 'http://localhost:8000/api/auth/';
```

#### Issue: Docker build fails with "no such host" error

**Problem**: Cannot reach Docker Hub registry.

**Solution**:
```powershell
# Pre-pull base images manually
docker pull node:20-alpine
docker pull python:3.11-slim
docker pull postgres:16-alpine
docker pull nginx:alpine

# Then build
docker-compose build
```

#### Issue: Port 80 already in use

**Solution**:
```powershell
# Find process using port 80
netstat -ano | findstr :80

# Kill the process or change docker-compose.yml ports
# Edit docker-compose.yml nginx ports to 8080:80
```

#### Issue: Database connection failed

**Solution**:
```powershell
# Check database is running and healthy
docker-compose ps db

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

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