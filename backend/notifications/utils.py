from .models import Notification, NotificationPreference, NotificationType
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


def create_notification(recipient, notification_type, title, message, action_url=None, metadata=None):
    """
    Create a notification for a user
    
    Args:
        recipient: User object
        notification_type: NotificationType choice
        title: Notification title
        message: Notification message
        action_url: Optional URL for action
        metadata: Optional dict of additional data
    
    Returns:
        Notification object
    """
    # Check user's preferences
    try:
        prefs = recipient.notification_preferences
    except NotificationPreference.DoesNotExist:
        # Create default preferences
        prefs = NotificationPreference.objects.create(user=recipient)
    
    # Check if user wants this type of notification
    notification_enabled = _check_notification_enabled(prefs, notification_type)
    if not notification_enabled:
        return None
    
    # Create the notification
    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
        metadata=metadata or {}
    )
    
    # Check if email should be sent
    email_enabled = _check_email_enabled(prefs, notification_type)
    if email_enabled and recipient.email:
        _send_notification_email(recipient, notification)
    
    return notification


def _check_notification_enabled(prefs, notification_type):
    """Check if in-app notification is enabled for this type"""
    mapping = {
        NotificationType.TASK_ASSIGNED: prefs.notify_task_assigned,
        NotificationType.TASK_UPDATED: prefs.notify_task_updated,
        NotificationType.TASK_COMPLETED: prefs.notify_task_completed,
        NotificationType.MENTION: prefs.notify_mentions,
        NotificationType.MILESTONE_DUE: prefs.notify_milestones,
        NotificationType.MILESTONE_COMPLETED: prefs.notify_milestones,
        NotificationType.DEADLINE_APPROACHING: prefs.notify_deadlines,
        NotificationType.PROJECT_CREATED: prefs.notify_project_updates,
        NotificationType.PROJECT_UPDATED: prefs.notify_project_updates,
        NotificationType.PROJECT_COMPLETED: prefs.notify_project_updates,
    }
    return mapping.get(notification_type, True)


def _check_email_enabled(prefs, notification_type):
    """Check if email notification is enabled for this type"""
    mapping = {
        NotificationType.TASK_ASSIGNED: prefs.email_task_assigned,
        NotificationType.TASK_UPDATED: prefs.email_task_updated,
        NotificationType.MENTION: prefs.email_mentions,
        NotificationType.MILESTONE_DUE: prefs.email_milestones,
        NotificationType.MILESTONE_COMPLETED: prefs.email_milestones,
        NotificationType.DEADLINE_APPROACHING: prefs.email_deadlines,
    }
    return mapping.get(notification_type, False)


def _send_notification_email(recipient, notification):
    """Send email notification to user"""
    subject = f"[SynergyOS] {notification.title}"
    
    # Create plain text message
    message = f"""
{notification.title}

{notification.message}

{f"View: {settings.FRONTEND_URL}{notification.action_url}" if notification.action_url else ""}

---
You're receiving this because you have email notifications enabled.
To change your preferences, visit {settings.FRONTEND_URL}/settings
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Failed to send notification email: {e}")


def bulk_create_notifications(notifications_data):
    """
    Bulk create multiple notifications efficiently
    
    Args:
        notifications_data: List of dicts with notification data
    
    Returns:
        List of created Notification objects
    """
    notifications = [
        Notification(**data)
        for data in notifications_data
    ]
    return Notification.objects.bulk_create(notifications)
