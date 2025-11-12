from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """Extended user profile with additional information"""
    
    ROLE_CHOICES = [
        ('manager', 'Project Manager'),
        ('member', 'Team Member'),
        ('admin', 'Admin'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    custom_email = models.EmailField(max_length=255, unique=True, null=True, blank=True, 
                                     help_text="Custom Synergy email (e.g., john.project@synergy.in)")
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True, help_text="User's department")
    position = models.CharField(max_length=100, blank=True, help_text="User's job position")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    is_invited = models.BooleanField(default=False, help_text="User was invited to a project")
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                    related_name='invited_users')
    invitation_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create UserProfile when User is created"""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save UserProfile when User is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()


class SecurityEvent(models.Model):
    """Audit log for security-sensitive events."""

    EVENT_TYPES = [
        ("login_success", "Login Success"),
        ("login_failed", "Login Failed"),
        ("logout", "Logout"),
        ("password_change", "Password Change"),
        ("password_reset_request", "Password Reset Request"),
        ("password_reset", "Password Reset"),
        ("rate_limit", "Rate Limit Triggered"),
        ("registration", "User Registration"),
        ("other", "Other"),
    ]

    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    username = models.CharField(max_length=150, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    description = models.TextField(blank=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        who = self.user.username if self.user else (self.username or "anonymous")
        return f"{self.get_event_type_display()} - {who} @ {self.created_at.isoformat()}"
from django.db import models

# Create your models here.
