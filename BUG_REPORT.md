# 🐛 Synergy Project - Bug Report & Issues

**Generated:** November 12, 2025  
**Status:** Active Issues Identified

---

## 🔴 CRITICAL ISSUES

### 1. **Exposed API Key in .env File** (SECURITY)
**Severity:** CRITICAL  
**Location:** `d:\Synergy\.env` line 31

**Issue:**
```properties
GEMINI_API_KEY=AIzaSyBp_i33uI9cP7cWf8GT8nRQ98iW4LjNxiI
```

**Problem:** While the `.env` file is in `.gitignore`, this API key was previously exposed in documentation files and committed to GitHub.

**Status:** ⚠️ **API KEY NEEDS TO BE REVOKED AND REGENERATED**

**Action Required:**
1. Go to https://makersuite.google.com/app/apikey
2. Revoke key: `AIzaSyBp_i33uI9cP7cWf8GT8nRQ98iW4LjNxiI`
3. Generate new key
4. Update `.env` file with new key
5. Restart backend: `docker-compose restart backend`

**References:**
- See `SECURITY_INCIDENT.md` for full details
- See `API_KEY_ROTATION_STEPS.md` for instructions

---

### 2. **Missing GEMINI_API_KEY in docker-compose.yml**
**Severity:** HIGH  
**Location:** `docker-compose.yml` lines 35-54

**Issue:** The `GEMINI_API_KEY` environment variable is not passed to the backend container.

**Current Code:**
```yaml
environment:
  - SECRET_KEY=${SECRET_KEY:-...}
  - DEBUG=${DEBUG:-True}
  # ... other env vars ...
  # GEMINI_API_KEY is MISSING here
```

**Impact:** AI features won't work even if the key is in `.env` file because Docker container doesn't receive it.

**Fix Required:**
Add to `docker-compose.yml` under `backend.environment`:
```yaml
- GEMINI_API_KEY=${GEMINI_API_KEY}
```

**Workaround:** Currently using fallback mode for AI features.

---

### 3. **Exposed Email Credentials in .env**
**Severity:** HIGH (SECURITY)  
**Location:** `d:\Synergy\.env` lines 26-27

**Issue:**
```properties
EMAIL_HOST_USER=moti.tabela.ka.editor099@gmail.com
EMAIL_HOST_PASSWORD=dvgxjaojisncdbsw
```

**Problem:** Gmail account credentials exposed in `.env` file. While `.env` is ignored by git, this is still a security risk.

**Recommendation:**
- Rotate the Gmail App Password
- Use environment-specific credentials
- Consider using a dedicated service email account
- Document that these should be changed in production

---

### 4. **DEBUG Mode Enabled**
**Severity:** MEDIUM (SECURITY)  
**Location:** `.env` line 6

**Issue:**
```properties
DEBUG=True
```

**Problem:** Debug mode should NEVER be enabled in production. It exposes:
- Detailed error pages with stack traces
- Django settings and environment variables
- Database query details
- Internal file paths

**Action:** Change to `DEBUG=False` before deploying to production.

---

## ⚠️ HIGH PRIORITY ISSUES

### 5. **Insecure SECRET_KEY**
**Severity:** HIGH (SECURITY)  
**Location:** `.env` line 5

**Issue:**
```properties
SECRET_KEY=django-insecure-CHANGE-THIS-TO-RANDOM-SECRET-KEY-IN-PRODUCTION
```

**Problem:** The SECRET_KEY is the default insecure key and should be changed.

**Fix:**
Generate a new secure key using:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Or use PowerShell:
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

### 6. **Frontend Missing React Types** 
**Severity:** MEDIUM  
**Location:** `frontend/app/components/InviteTeamMemberModal.tsx`

**Issue:** 1521 TypeScript errors related to missing React type definitions.

**Example Errors:**
```
Cannot find module 'react' or its corresponding type declarations.
Cannot find namespace 'React'.
JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
```

**Root Cause:** The `node_modules` folder doesn't exist in the frontend directory. Dependencies haven't been installed.

**Fix:**
```powershell
cd frontend
npm install
```

**Status:** NOT a code bug - just missing dependencies installation.

**Note:** Once dependencies are installed, all 1521 errors should disappear.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 7. **Hardcoded Database Credentials**
**Severity:** MEDIUM  
**Location:** `docker-compose.yml`, `.env`

**Issue:** Database credentials are set to default values:
```
POSTGRES_USER: synergyos_user
POSTGRES_PASSWORD: synergyos_pass_2024
```

**Recommendation:** 
- Use stronger passwords in production
- Rotate credentials periodically
- Use secrets management for production deployments

---

### 8. **Missing Environment Variables Documentation**
**Severity:** LOW-MEDIUM  
**Location:** N/A

**Issue:** No comprehensive `.env.example` file documenting all required environment variables.

**Fix:** Create `.env.example` with:
```properties
# Copy this file to .env and fill in your values

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com

# Database
DB_PASSWORD=your-db-password-here

# AI Settings
GEMINI_API_KEY=your-gemini-api-key-here

# Email Settings
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password-here

# etc...
```

---

### 9. **CORS Origins Too Permissive**
**Severity:** LOW-MEDIUM  
**Location:** `.env` line 13

**Issue:**
```properties
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:3000,http://localhost:80,http://127.0.0.1
```

**Problem:** Multiple localhost origins allowed. In production, this should be restricted to specific domains.

**Production Fix:**
```properties
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

### 10. **No API Rate Limiting for AI Endpoints**
**Severity:** MEDIUM  
**Location:** `backend/projects/views.py` - AIViewSet

**Issue:** AI endpoints don't have rate limiting decorators, which could lead to:
- API quota exhaustion
- High costs with Gemini API
- Potential abuse

**Current Code:**
```python
@action(detail=False, methods=['post'])
def task_suggestions(self, request):
    # No rate limiting
```

**Fix Required:**
Add rate limiting:
```python
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

@method_decorator(ratelimit(key='user', rate='10/h', method='POST'), name='dispatch')
@action(detail=False, methods=['post'])
def task_suggestions(self, request):
    # ...
```

---

## 🔵 LOW PRIORITY ISSUES

### 11. **Frontend Dependencies Not Installed**
**Severity:** LOW  
**Location:** `frontend/node_modules` (missing)

**Issue:** Frontend dependencies haven't been installed, causing TypeScript errors.

**Fix:** 
```powershell
cd frontend
npm install
```

**Impact:** Development experience only - doesn't affect Docker deployment since frontend container builds with dependencies.

---

### 12. **Missing Error Monitoring**
**Severity:** LOW  
**Location:** Global

**Issue:** No error monitoring/logging service integrated (e.g., Sentry, LogRocket).

**Recommendation:** Add error tracking for production:
- Sentry for backend errors
- LogRocket or similar for frontend errors
- Centralized logging

---

### 13. **No Health Check Endpoint**
**Severity:** LOW  
**Location:** Backend API

**Issue:** No `/health` or `/status` endpoint for monitoring.

**Fix:** Add health check endpoint:
```python
# In accounts/views.py or create health/views.py
class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'database': check_db_connection(),
                'ai': bool(GEMINI_API_KEY),
            }
        })
```

---

### 14. **No Database Backups Configuration**
**Severity:** LOW (but important for production)  
**Location:** `docker-compose.yml`

**Issue:** No automated backup strategy for PostgreSQL data.

**Recommendation:**
- Add backup volume
- Set up automated backup scripts
- Configure backup retention policy

---

## 🟢 MINOR ISSUES / CODE QUALITY

### 15. **Console Logs in Production Code**
**Severity:** VERY LOW  
**Locations:** Multiple frontend files

**Issue:** `console.log()` and `console.error()` statements throughout code.

**Examples:**
- `frontend/app/routes/dashboard.tsx`: `console.error('Failed to fetch dashboard:', error);`
- `frontend/app/contexts/AuthContext.tsx`: `console.error('Failed to fetch user:', error);`

**Recommendation:** 
- Remove or wrap in environment checks
- Use proper logging library for production

---

### 16. **Commented Out Code**
**Severity:** VERY LOW  
**Location:** Various files

**Issue:** Some commented-out code blocks found.

**Recommendation:** Clean up before production release.

---

## 📊 Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 **CRITICAL** | 4 | **ACTION REQUIRED** |
| ⚠️ **HIGH** | 2 | Needs Attention |
| 🟡 **MEDIUM** | 5 | Should Fix |
| 🔵 **LOW** | 4 | Nice to Have |
| 🟢 **MINOR** | 2 | Code Quality |
| **TOTAL** | **17** | |

---

## 🎯 Immediate Action Items (Priority Order)

1. **[CRITICAL]** Revoke and regenerate exposed Gemini API key
2. **[CRITICAL]** Add `GEMINI_API_KEY` to docker-compose.yml
3. **[HIGH]** Rotate Gmail App Password
4. **[HIGH]** Generate new Django SECRET_KEY
5. **[HIGH]** Install frontend dependencies: `cd frontend && npm install`
6. **[MEDIUM]** Add rate limiting to AI endpoints
7. **[MEDIUM]** Change DEBUG=False for production
8. **[LOW]** Add health check endpoint

---

## 🔧 Quick Fixes Script

```powershell
# 1. Add GEMINI_API_KEY to docker-compose.yml
# Manual edit required

# 2. Generate new SECRET_KEY
docker-compose exec backend python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# 3. Restart services after .env changes
docker-compose restart

# 4. Check for errors
docker-compose logs --tail=50 backend
```

---

## 📚 Related Documentation

- `SECURITY_INCIDENT.md` - API key exposure incident
- `API_KEY_ROTATION_STEPS.md` - How to rotate API keys
- `README.md` - General project documentation
- `TESTING_GUIDE.md` - Testing procedures

---

**Next Review:** After implementing critical fixes  
**Reviewed By:** AI Code Analysis  
**Status:** 🔴 **CRITICAL ISSUES PENDING**
