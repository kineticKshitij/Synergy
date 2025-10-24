from django.contrib.auth import user_logged_in, user_login_failed, user_logged_out
from django.dispatch import receiver
from django.utils import timezone
from .models import SecurityEvent


@receiver(user_logged_in)
def log_user_logged_in(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    SecurityEvent.objects.create(
        event_type="login_success",
        user=user,
        username=user.username,
        ip_address=ip,
        description="User logged in successfully",
        metadata={"path": request.path}
    )


@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs):
    ip = get_client_ip(request) if request is not None else None
    username = credentials.get('username') if isinstance(credentials, dict) else ''
    SecurityEvent.objects.create(
        event_type="login_failed",
        user=None,
        username=username or '',
        ip_address=ip,
        description="Failed login attempt",
        metadata={"credentials_keys": list(credentials.keys()) if isinstance(credentials, dict) else None}
    )


@receiver(user_logged_out)
def log_user_logged_out(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    SecurityEvent.objects.create(
        event_type="logout",
        user=user,
        username=user.username if user else '',
        ip_address=ip,
        description="User logged out",
        metadata={"path": request.path}
    )


def get_client_ip(request):
    if not request:
        return None
    # X-Forwarded-For may contain a list of IPs
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
