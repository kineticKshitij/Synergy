# 🚀 Automated SynergyOS Reorganization Script
# This script will reorganize your project and prepare it for GitHub upload

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║        SYNERGYOS AUTOMATED REORGANIZATION SCRIPT             ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Safety check
Write-Host "⚠️  IMPORTANT CHECKS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Before proceeding, make sure:" -ForegroundColor White
Write-Host "  1. Both Django and React servers are STOPPED" -ForegroundColor White
Write-Host "  2. All files are saved" -ForegroundColor White
Write-Host "  3. You have committed any critical changes" -ForegroundColor White
Write-Host ""

$proceed = Read-Host "Do you want to proceed? (yes/no)"
if ($proceed -ne "yes") {
    Write-Host "`n❌ Reorganization cancelled!" -ForegroundColor Red
    exit
}

Write-Host "`n🔄 Starting reorganization...`n" -ForegroundColor Green

try {
    # Step 1: Create new structure
    Write-Host "[1/8] Creating new directory structure..." -ForegroundColor Cyan
    $newRoot = "SynergyOS_Clean"
    New-Item -Path $newRoot -ItemType Directory -Force | Out-Null
    New-Item -Path "$newRoot\frontend" -ItemType Directory -Force | Out-Null
    New-Item -Path "$newRoot\backend" -ItemType Directory -Force | Out-Null
    New-Item -Path "$newRoot\docs" -ItemType Directory -Force | Out-Null
    Write-Host "✓ Directory structure created" -ForegroundColor Green

    # Step 2: Copy Frontend files
    Write-Host "`n[2/8] Copying frontend files..." -ForegroundColor Cyan
    $frontendFiles = @(
        "app",
        "public",
        "package.json",
        "package-lock.json",
        "tsconfig.json",
        "vite.config.ts",
        "react-router.config.ts"
    )
    
    foreach ($item in $frontendFiles) {
        $source = "Synergy\$item"
        if (Test-Path $source) {
            Copy-Item -Path $source -Destination "$newRoot\frontend\" -Recurse -Force
            Write-Host "  ✓ Copied $item" -ForegroundColor Gray
        }
    }
    Write-Host "✓ Frontend files copied" -ForegroundColor Green

    # Step 3: Copy Backend files
    Write-Host "`n[3/8] Copying backend files..." -ForegroundColor Cyan
    Copy-Item -Path "SynergyOS\*" -Destination "$newRoot\backend\" -Recurse -Force
    Write-Host "✓ Backend files copied" -ForegroundColor Green

    # Step 4: Copy Documentation
    Write-Host "`n[4/8] Organizing documentation..." -ForegroundColor Cyan
    Get-ChildItem -Filter "*.md" | Where-Object { $_.Name -ne "README.md" } | Copy-Item -Destination "$newRoot\docs\" -Force
    Get-ChildItem -Filter "*.ps1" | Where-Object { $_.Name -ne "reorganize-automated.ps1" } | Copy-Item -Destination "$newRoot\docs\" -Force
    Write-Host "✓ Documentation organized" -ForegroundColor Green

    # Step 5: Create README
    Write-Host "`n[5/8] Creating root README.md..." -ForegroundColor Cyan
    $readme = @"
# SynergyOS - Full Stack Application

Enterprise-grade application with Django REST backend and React Router v7 frontend.

## 📁 Project Structure

\`\`\`
SynergyOS/
├── frontend/          # React Router v7
├── backend/           # Django REST API
└── docs/              # Documentation
\`\`\`

## 🚀 Quick Start

### Backend
\`\`\`bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary python-dotenv django-ratelimit
python manage.py migrate
python manage.py runserver
\`\`\`
**Runs on:** http://localhost:8000

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
**Runs on:** http://localhost:5174

## ✨ Features
- JWT Authentication
- Projects & Tasks Management
- Security Logging
- User Profiles
- Rate Limiting

## 🛠️ Tech Stack
- Django 5.2.7 + DRF
- React Router v7 + TypeScript
- PostgreSQL 18

## 👤 Author
[@kineticKshitij](https://github.com/kineticKshitij)

---
**Built with Django + React Router**
"@
    Set-Content -Path "$newRoot\README.md" -Value $readme
    Write-Host "✓ README.md created" -ForegroundColor Green

    # Step 6: Create .gitignore
    Write-Host "`n[6/8] Creating root .gitignore..." -ForegroundColor Cyan
    $gitignore = @"
# Virtual Environment
venv/
env/
SOS/

# Python
__pycache__/
*.py[cod]
*.log
db.sqlite3

# Node
node_modules/
npm-debug.log*

# Build
.react-router/
/build/
staticfiles/

# IDE & OS
.vscode/
.idea/
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Temp
temp*/
*_Clean/
structure.txt
"@
    Set-Content -Path "$newRoot\.gitignore" -Value $gitignore
    Write-Host "✓ .gitignore created" -ForegroundColor Green

    # Step 7: Initialize Git
    Write-Host "`n[7/8] Initializing Git repository..." -ForegroundColor Cyan
    Set-Location $newRoot
    git init | Out-Null
    git add . | Out-Null
    git commit -m "Reorganize project: clean frontend/backend separation

- Moved frontend to /frontend directory
- Moved backend to /backend directory
- Organized documentation in /docs
- Created root README and .gitignore
- Projects module with full CRUD operations
- Enhanced authentication with security logging" | Out-Null
    Write-Host "✓ Git repository initialized" -ForegroundColor Green

    # Step 8: Add remote and push
    Write-Host "`n[8/8] Setting up GitHub remote..." -ForegroundColor Cyan
    git remote add origin https://github.com/kineticKshitij/Synergy.git 2>$null
    Write-Host "✓ Remote added" -ForegroundColor Green

    Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                              ║" -ForegroundColor Green
    Write-Host "║              ✅ REORGANIZATION SUCCESSFUL! ✅                 ║" -ForegroundColor Green
    Write-Host "║                                                              ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

    Write-Host "`n📁 NEW STRUCTURE LOCATION:" -ForegroundColor Yellow
    Write-Host "   D:\SynergyOS\$newRoot" -ForegroundColor White

    Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Review the new structure:" -ForegroundColor White
    Write-Host "   cd $newRoot" -ForegroundColor Cyan
    Write-Host "   tree /F" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Push to GitHub (FORCE PUSH - will replace repo):" -ForegroundColor White
    Write-Host "   git push -u origin master --force" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Test backend:" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Cyan
    Write-Host "   python -m venv venv" -ForegroundColor Cyan
    Write-Host "   .\venv\Scripts\activate" -ForegroundColor Cyan
    Write-Host "   python manage.py runserver" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. Test frontend (new terminal):" -ForegroundColor White
    Write-Host "   cd frontend" -ForegroundColor Cyan
    Write-Host "   npm install" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. After verification, clean up:" -ForegroundColor White
    Write-Host "   cd .." -ForegroundColor Cyan
    Write-Host "   Remove-Item Synergy, SynergyOS, SOS -Recurse -Force" -ForegroundColor Cyan
    Write-Host "   Rename-Item $newRoot SynergyOS" -ForegroundColor Cyan
    Write-Host ""

    Set-Location ..

    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

}
catch {
    Write-Host "`n❌ ERROR: $_" -ForegroundColor Red
    Write-Host "Reorganization failed. Please check the error and try again." -ForegroundColor Yellow
    Set-Location ..
}
