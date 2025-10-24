# 🔄 Complete Project Reorganization & GitHub Upload Guide

## Current Problem
- Backend files are nested inside frontend folder (`Synergy/backend/`)
- Confusing structure with `Synergy/` and `SynergyOS/` folders
- Git repository might have been removed

## Solution: Clean Reorganization

### Step 1: Stop All Servers ⚠️

**IMPORTANT:** Stop both servers before proceeding!

1. **Stop Django** (in PowerShell Extension terminal): Press `Ctrl+C`
2. **Stop React** (in pwsh terminal): Press `Ctrl+C`

### Step 2: Create New Clean Structure

Run these commands in PowerShell:

```powershell
cd D:\SynergyOS

# Create new clean directories
mkdir Synergy_New -Force
mkdir Synergy_New\frontend -Force
mkdir Synergy_New\backend -Force
mkdir Synergy_New\docs -Force

# Copy Frontend (from Synergy, excluding backend folder)
Copy-Item -Path "Synergy\app" -Destination "Synergy_New\frontend\app" -Recurse -Force
Copy-Item -Path "Synergy\public" -Destination "Synergy_New\frontend\public" -Recurse -Force
Copy-Item -Path "Synergy\package.json" -Destination "Synergy_New\frontend\" -Force
Copy-Item -Path "Synergy\package-lock.json" -Destination "Synergy_New\frontend\" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "Synergy\tsconfig.json" -Destination "Synergy_New\frontend\" -Force
Copy-Item -Path "Synergy\vite.config.ts" -Destination "Synergy_New\frontend\" -Force
Copy-Item -Path "Synergy\react-router.config.ts" -Destination "Synergy_New\frontend\" -Force
Copy-Item -Path "Synergy\Dockerfile" -Destination "Synergy_New\frontend\" -Force -ErrorAction SilentlyContinue

# Copy Backend (from SynergyOS)
Copy-Item -Path "SynergyOS\*" -Destination "Synergy_New\backend\" -Recurse -Force

# Copy Documentation
Copy-Item -Path "*.md" -Destination "Synergy_New\docs\" -Force
Copy-Item -Path "*.ps1" -Destination "Synergy_New\docs\" -Force

Write-Host "✅ New structure created in Synergy_New folder!" -ForegroundColor Green
```

### Step 3: Create Configuration Files

#### Create Root README.md

```powershell
$readme = @"
# SynergyOS - Full Stack Application

Enterprise-grade full-stack application with Django REST backend and React Router v7 frontend.

## 📁 Project Structure

\`\`\`
SynergyOS/
├── frontend/          # React Router v7 application
│   ├── app/          # Application routes and components
│   ├── public/       # Static assets
│   └── package.json  # Node dependencies
├── backend/          # Django REST API
│   ├── accounts/     # Authentication & user management
│   ├── projects/     # Project management system
│   ├── SynergyOS/    # Django settings
│   ├── manage.py     # Django management script
│   └── requirements.txt
└── docs/             # Documentation and scripts
\`\`\`

## ✨ Features

### Authentication & Security
- JWT token-based authentication
- Password reset with email
- Rate limiting (brute force protection)
- Security event logging
- User profile management
- Input validation & sanitization

### Projects Module
- Full CRUD operations for projects
- Task management with status tracking
- Team collaboration
- Project activities log
- Progress tracking
- Priority & status management

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 18

### Backend Setup

\`\`\`bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary python-dotenv django-ratelimit

# Setup database
python manage.py migrate
python manage.py createsuperuser

# Run server
python manage.py runserver
\`\`\`

**Backend:** http://localhost:8000  
**Admin:** http://localhost:8000/admin

### Frontend Setup

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

**Frontend:** http://localhost:5174

## 📡 API Endpoints

### Authentication
- \`POST /api/auth/register/\` - User registration
- \`POST /api/auth/login/\` - Login (JWT tokens)
- \`POST /api/auth/logout/\` - Logout
- \`POST /api/auth/token/refresh/\` - Refresh token
- \`GET /api/auth/user/\` - Get user info
- \`PUT /api/auth/user/update/\` - Update profile
- \`POST /api/auth/change-password/\` - Change password
- \`POST /api/auth/password-reset/\` - Request reset
- \`GET /api/auth/security-events/\` - Security logs

### Projects
- \`GET/POST /api/projects/\` - List/Create projects
- \`GET/PATCH/DELETE /api/projects/{id}/\` - Project details
- \`GET /api/projects/{id}/stats/\` - Project statistics
- \`GET/POST /api/tasks/\` - List/Create tasks
- \`POST /api/tasks/{id}/add_comment/\` - Add comment
- \`GET /api/activities/\` - Project activities

## 🛠️ Tech Stack

**Frontend:**
- React Router v7
- TypeScript
- Vite
- CSS3
- Lucide Icons

**Backend:**
- Django 5.2.7
- Django REST Framework
- SimpleJWT
- PostgreSQL 18
- CORS Headers
- Django Ratelimit

## 📚 Documentation

See \`docs/\` folder for:
- Setup guides
- API documentation
- Testing scripts
- Progress reports
- Roadmap

## 👤 Author

**Kshitij**
- GitHub: [@kineticKshitij](https://github.com/kineticKshitij)

## 📄 License

MIT License

---

**Built with ❤️ using Django + React Router**
"@

Set-Content -Path "Synergy_New\README.md" -Value $readme
```

#### Create Root .gitignore

```powershell
$gitignore = @"
# Virtual Environment
venv/
env/
ENV/
SOS/

# Python
__pycache__/
*.py[cod]
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/

# Django
*.log
db.sqlite3
db.sqlite3-journal
staticfiles/
media/
local_settings.py

# Node
node_modules/
npm-debug.log*
yarn-debug.log*

# React Router
.react-router/
/build/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Temp
temp*/
new_*/
structure.txt
"@

Set-Content -Path "Synergy_New\.gitignore" -Value $gitignore
```

### Step 4: Initialize Git & Push to GitHub

```powershell
cd Synergy_New

# Initialize git
git init
git add .
git commit -m "Reorganize project structure with clean frontend/backend separation"

# Add remote (use your existing repo)
git remote add origin https://github.com/kineticKshitij/Synergy.git

# Force push (this will replace the existing repo)
git push -u origin master --force

Write-Host "✅ Project uploaded to GitHub with new structure!" -ForegroundColor Green
```

### Step 5: Clean Up Old Structure (Optional)

After verifying everything works:

```powershell
cd D:\SynergyOS

# Remove old folders
Remove-Item -Path "Synergy" -Recurse -Force
Remove-Item -Path "SynergyOS" -Recurse -Force  
Remove-Item -Path "SOS" -Recurse -Force

# Rename new structure
Rename-Item -Path "Synergy_New" -NewName "SynergyOS"

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
```

### Step 6: Test Everything

```powershell
# Test Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt  # You need to create this
python manage.py runserver

# Test Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 🎯 Final Structure on GitHub

```
Synergy/ (GitHub Repository)
├── frontend/
│   ├── app/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/
│   ├── accounts/
│   ├── projects/
│   ├── SynergyOS/
│   ├── manage.py
│   └── ...
├── docs/
│   ├── SECURITY_LOGGING_COMPLETE.md
│   ├── ROADMAP_AI_SECURITY.md
│   └── ...
├── README.md
└── .gitignore
```

## ✅ Benefits

1. **Clean Separation**: Frontend and backend at root level
2. **Easy Navigation**: Clear folder structure
3. **Professional**: Industry-standard organization
4. **Scalable**: Easy to add more services (AI, mobile app, etc.)
5. **CI/CD Ready**: Simple to set up deployment pipelines

---

**Need Help?** Run this script step-by-step and verify each stage before proceeding!
