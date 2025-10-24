from django.db import models
from django.conf import settings


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
