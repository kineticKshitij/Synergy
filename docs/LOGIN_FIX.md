# Login Authentication Fix

## Problem
Team members invited via email couldn't log in to the system. The login page would refresh without showing an error, and backend logs showed "Unauthorized: /api/auth/login/" errors.

## Root Cause
Django's default `TokenObtainPairView` requires authentication using the exact `username` field. However:
- Invited team members receive usernames like: `marotkarkshitijli2024`
- They also receive custom emails like: `kshitij.marotkar.test12@synergy.in`
- Their personal email is: `marotkarkshitijli2024@gmail.com`

Users naturally try to log in with their email address rather than the generated username, causing authentication to fail silently.

## Solution Implemented

### 1. Custom Authentication Backend
Created a new authentication backend at `backend/accounts/backends.py`:

```python
class EmailOrUsernameBackend(ModelBackend):
    """
    Custom authentication backend that allows users to log in with either:
    - Username
    - Personal email
    - Custom Synergy email (from UserProfile)
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        try:
            # Try to find user by username, email, or custom email
            user = User.objects.filter(
                Q(username=username) | 
                Q(email=username) |
                Q(profile__custom_email=username)
            ).first()
            
            if user and user.check_password(password):
                return user
        except Exception:
            return None
        
        return None
```

### 2. Settings Configuration
Added the custom authentication backend to `backend/SynergyOS/settings.py`:

```python
# Authentication backends
# Custom backend allows login with username, email, or custom_email
AUTHENTICATION_BACKENDS = [
    'accounts.backends.EmailOrUsernameBackend',
    'django.contrib.auth.backends.ModelBackend',
]
```

### 3. Frontend Label Update
Updated the login form in `frontend/app/routes/login.tsx` to clarify that users can enter either:
- Changed label from "Username" to "Username or Email"
- Updated placeholder from "Enter your username" to "Enter your username or email"

## How It Works

1. User enters their username OR email (personal or Synergy custom email) in the login form
2. Frontend sends this value as the `username` field to `/api/auth/login/`
3. The custom `EmailOrUsernameBackend` checks if the input matches:
   - `User.username` (e.g., `marotkarkshitijli2024`)
   - `User.email` (e.g., `marotkarkshitijli2024@gmail.com`)
   - `UserProfile.custom_email` (e.g., `kshitij.marotkar.test12@synergy.in`)
4. If a match is found and the password is correct, authentication succeeds
5. JWT tokens are returned and the user is logged in

## Testing

Team members can now log in using any of these credentials with their password:
- Username: `marotkarkshitijli2024`
- Personal Email: `marotkarkshitijli2024@gmail.com`
- Custom Synergy Email: `kshitij.marotkar.test12@synergy.in`

## Files Modified

1. **New File**: `backend/accounts/backends.py` - Custom authentication backend
2. **Modified**: `backend/SynergyOS/settings.py` - Added AUTHENTICATION_BACKENDS configuration
3. **Modified**: `frontend/app/routes/login.tsx` - Updated label and placeholder text

## Deployment

Backend container was restarted to apply the changes:
```powershell
docker-compose restart backend
```

All services are running normally. The fix is live and ready for testing.
