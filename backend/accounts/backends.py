from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.db.models import Q


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
