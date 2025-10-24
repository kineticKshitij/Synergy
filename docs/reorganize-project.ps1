# SynergyOS Project Reorganization Script
# Run this after stopping all servers (Django and React)

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║          SYNERGYOS PROJECT REORGANIZATION                 ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Stop if servers are running
Write-Host "⚠️  IMPORTANT: Make sure both servers are stopped!" -ForegroundColor Yellow
Write-Host "   - Django server (Ctrl+C in PowerShell Extension terminal)" -ForegroundColor Yellow
Write-Host "   - React dev server (Ctrl+C in pwsh terminal)" -ForegroundColor Yellow
Write-Host ""
$continue = Read-Host "Have you stopped both servers? (y/n)"

if ($continue -ne 'y') {
    Write-Host "`n❌ Reorganization cancelled. Stop servers first!" -ForegroundColor Red
    exit
}

Write-Host "`n🔄 Starting reorganization...`n" -ForegroundColor Green

# Create new structure
Write-Host "[1/6] Creating new directory structure..." -ForegroundColor Cyan
New-Item -Path ".\new_structure" -ItemType Directory -Force | Out-Null
New-Item -Path ".\new_structure\frontend" -ItemType Directory -Force | Out-Null
New-Item -Path ".\new_structure\backend" -ItemType Directory -Force | Out-Null
New-Item -Path ".\new_structure\docs" -ItemType Directory -Force | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green

# Copy Frontend (excluding backend folder inside it)
Write-Host "`n[2/6] Copying frontend files..." -ForegroundColor Cyan
Get-ChildItem -Path ".\Synergy" -Exclude "backend" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination ".\new_structure\frontend\" -Recurse -Force
}
Write-Host "✓ Frontend files copied" -ForegroundColor Green

# Copy Backend
Write-Host "`n[3/6] Copying backend files..." -ForegroundColor Cyan
Copy-Item -Path ".\SynergyOS\*" -Destination ".\new_structure\backend\" -Recurse -Force
Write-Host "✓ Backend files copied" -ForegroundColor Green

# Copy Documentation
Write-Host "`n[4/6] Organizing documentation..." -ForegroundColor Cyan
Get-ChildItem -Path "." -Filter "*.md" | Copy-Item -Destination ".\new_structure\docs\" -Force
Get-ChildItem -Path "." -Filter "*.ps1" -Exclude "reorganize-project.ps1" | Copy-Item -Destination ".\new_structure\docs\" -Force
Write-Host "✓ Documentation organized" -ForegroundColor Green

# Create root README
Write-Host "`n[5/6] Creating root README..." -ForegroundColor Cyan
$rootReadme = @"
# SynergyOS - Full Stack Application

A modern full-stack application with Django REST backend and React Router v7 frontend.

## 📁 Project Structure

\`\`\`
SynergyOS/
├── frontend/          # React Router v7 application
│   ├── app/          # Application code
│   ├── public/       # Static assets
│   └── package.json
├── backend/          # Django REST API
│   ├── accounts/     # Authentication app
│   ├── projects/     # Projects management app
│   ├── SynergyOS/    # Django settings
│   └── manage.py
└── docs/             # Documentation and test scripts
\`\`\`

## 🚀 Quick Start

### Backend Setup

\`\`\`bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary python-dotenv django-ratelimit
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
\`\`\`

**Backend runs on:** http://localhost:8000

### Frontend Setup

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

**Frontend runs on:** http://localhost:5174

## 📚 Documentation

See the `docs/` folder for:
- Complete setup guides
- API documentation
- Testing scripts
- Progress reports

## 🔗 Links

- **Repository:** https://github.com/kineticKshitij/Synergy
- **Author:** @kineticKshitij

---

**Built with Django 5.2.7 + React Router v7**
"@

Set-Content -Path ".\new_structure\README.md" -Value $rootReadme
Write-Host "✓ Root README created" -ForegroundColor Green

# Create .gitignore
Write-Host "`n[6/6] Creating root .gitignore..." -ForegroundColor Cyan
$gitignore = @"
# Virtual Environment
SOS/
venv/
env/
ENV/

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
yarn-error.log*

# React Router
.react-router/
/build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Temp
temp_reorganize/
new_structure/
structure.txt
"@

Set-Content -Path ".\new_structure\.gitignore" -Value $gitignore
Write-Host "✓ Root .gitignore created" -ForegroundColor Green

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "║          ✅ REORGANIZATION COMPLETE! ✅                    ║" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Review the new structure in 'new_structure/' folder" -ForegroundColor White
Write-Host "2. If everything looks good, run:" -ForegroundColor White
Write-Host "   Remove-Item -Path 'Synergy' -Recurse -Force" -ForegroundColor Cyan
Write-Host "   Remove-Item -Path 'SynergyOS' -Recurse -Force" -ForegroundColor Cyan
Write-Host "   Remove-Item -Path 'SOS' -Recurse -Force" -ForegroundColor Cyan
Write-Host "   Move-Item -Path 'new_structure\*' -Destination '.' -Force" -ForegroundColor Cyan
Write-Host "   Remove-Item -Path 'new_structure' -Recurse -Force" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test both servers:" -ForegroundColor White
Write-Host "   cd backend; python manage.py runserver" -ForegroundColor Cyan
Write-Host "   cd frontend; npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Commit to GitHub:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'Reorganize project structure: separate frontend and backend'" -ForegroundColor Cyan
Write-Host "   git push origin master" -ForegroundColor Cyan
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
