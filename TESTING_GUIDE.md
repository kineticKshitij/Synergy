# Authentication Testing Scripts - Usage Guide

This folder contains PowerShell scripts to test the SynergyOS authentication system.

## Scripts Overview

### 1. `test-login.ps1` - Quick Login Test
Tests login functionality with username, email, and custom email credentials.

**Usage:**
```powershell
# Basic usage (will prompt for password)
.\test-login.ps1

# With custom credentials
.\test-login.ps1 -Username "john.doe2024" -Email "john.doe@gmail.com" -CustomEmail "john.doe@synergy.in"

# With password provided
.\test-login.ps1 -Password "YourPassword123!"

# Test against different server
.\test-login.ps1 -BaseUrl "http://192.168.1.100"
```

**What it tests:**
- ✓ Login with username (e.g., `marotkarkshitijli2024`)
- ✓ Login with personal email (e.g., `marotkarkshitijli2024@gmail.com`)
- ✓ Login with custom Synergy email (e.g., `kshitij.marotkar.test12@synergy.in`)
- ✓ JWT token generation
- ✓ Token payload validation

### 2. `test-auth-endpoints.ps1` - Full Authentication Suite
Comprehensive test of all authentication endpoints.

**Usage:**
```powershell
# Basic usage (will prompt for username and password)
.\test-auth-endpoints.ps1

# Test against different server
.\test-auth-endpoints.ps1 -BaseUrl "http://192.168.1.100"
```

**What it tests:**
- ✓ Server health check
- ✓ User login
- ✓ Get user profile
- ✓ Get dashboard stats
- ✓ Token refresh
- ✓ Invalid token handling
- ✓ User logout
- ✓ Token blacklisting

## Example Output

### Successful Login Test
```
==================================================
  SynergyOS Login Authentication Test Script
==================================================

[TEST 1/3] Login with Username
---------------------------------------------------
Testing login with Username
Credential: marotkarkshitijli2024

✓ SUCCESS!
Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl...
Refresh Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tl...
User ID: 42
Username: marotkarkshitijli2024

[TEST 2/3] Login with Personal Email
---------------------------------------------------
Testing login with Personal Email
Credential: marotkarkshitijli2024@gmail.com

✓ SUCCESS!
Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl...
Refresh Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tl...
User ID: 42
Username: marotkarkshitijli2024

[TEST 3/3] Login with Custom Synergy Email
---------------------------------------------------
Testing login with Custom Synergy Email
Credential: kshitij.marotkar.test12@synergy.in

✓ SUCCESS!
Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl...
Refresh Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tl...
User ID: 42
Username: marotkarkshitijli2024

==================================================
  TEST SUMMARY
==================================================

Username Login: ✓ PASS
Personal Email Login: ✓ PASS
Custom Email Login: ✓ PASS

All tests passed! (3/3)
Authentication backend is working correctly.

==================================================
```

## Troubleshooting

### Script Execution Policy Error
If you get an error about script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Server Not Responding
Check if containers are running:
```powershell
docker-compose ps
```

If not running, start them:
```powershell
docker-compose up -d
```

### Login Fails
1. Verify the password is correct
2. Check if the user exists:
```powershell
docker-compose exec backend python manage.py shell -c "from django.contrib.auth.models import User; print(User.objects.filter(username='marotkarkshitijli2024').exists())"
```

3. Check backend logs:
```powershell
docker-compose logs backend --tail=50 | Select-String -Pattern "login|Login|Unauthorized" -Context 3
```

### Check Authentication Backend
Verify the custom authentication backend is loaded:
```powershell
docker-compose exec backend python manage.py shell -c "from django.conf import settings; print(settings.AUTHENTICATION_BACKENDS)"
```

Expected output:
```
['accounts.backends.EmailOrUsernameBackend', 'django.contrib.auth.backends.ModelBackend']
```

## API Endpoints Tested

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login/` | POST | User login with username/email |
| `/api/auth/profile/` | GET | Get user profile (requires auth) |
| `/api/auth/dashboard/` | GET | Get dashboard stats (requires auth) |
| `/api/auth/token/refresh/` | POST | Refresh access token |
| `/api/auth/logout/` | POST | Logout and blacklist token |

## Testing Team Member Credentials

For the invited team member **Kshitij Marotkar**:
- **Username**: `marotkarkshitijli2024`
- **Personal Email**: `marotkarkshitijli2024@gmail.com`
- **Custom Synergy Email**: `kshitij.marotkar.test12@synergy.in`
- **Password**: Check the invitation email

All three credential formats should work for login!

## Additional Debug Commands

### View all users in database
```powershell
docker-compose exec backend python manage.py shell -c "from django.contrib.auth.models import User; [print(f'{u.username} | {u.email}') for u in User.objects.all()]"
```

### Check custom emails
```powershell
docker-compose exec backend python manage.py shell -c "from accounts.models import UserProfile; [print(f'{p.user.username} | {p.custom_email}') for p in UserProfile.objects.filter(custom_email__isnull=False)]"
```

### Test authentication backend directly
```powershell
docker-compose exec backend python manage.py shell
```
Then in Python shell:
```python
from django.contrib.auth import authenticate
from django.http import HttpRequest

request = HttpRequest()

# Test with username
user = authenticate(request, username='marotkarkshitijli2024', password='YOUR_PASSWORD')
print(f"Username auth: {user}")

# Test with email
user = authenticate(request, username='marotkarkshitijli2024@gmail.com', password='YOUR_PASSWORD')
print(f"Email auth: {user}")

# Test with custom email
user = authenticate(request, username='kshitij.marotkar.test12@synergy.in', password='YOUR_PASSWORD')
print(f"Custom email auth: {user}")
```

## Notes

- The scripts use PowerShell's `Invoke-RestMethod` to make HTTP requests
- JWT tokens are automatically decoded to display user information
- All passwords are handled securely using `SecureString`
- Colors indicate success (Green), failure (Red), and warnings (Yellow)
- Scripts work with both HTTP and HTTPS endpoints
