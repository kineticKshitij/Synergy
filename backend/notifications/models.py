from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class NotificationType(models.TextChoices):
    TASK_ASSIGNED = 'task_assigned', 'Task Assigned'
    TASK_UPDATED = 'task_updated', 'Task Updated'
    TASK_COMPLETED = 'task_completed', 'Task Completed'
    TASK_OVERDUE = 'task_overdue', 'Task Overdue'
    MENTION = 'mention', 'Mentioned in Comment'
    MILESTONE_DUE = 'milestone_due', 'Milestone Due Soon'
    MILESTONE_COMPLETED = 'milestone_completed', 'Milestone Completed'
    MILESTONE_OVERDUE = 'milestone_overdue', 'Milestone Overdue'
    PROJECT_CREATED = 'project_created', 'Project Created'
    PROJECT_UPDATED = 'project_updated', 'Project Updated'
    PROJECT_COMPLETED = 'project_completed', 'Project Completed'
    DEADLINE_APPROACHING = 'deadline_approaching', 'Deadline Approaching'
    MEMBER_ADDED = 'member_added', 'Added to Team'
    SYSTEM = 'system', 'System Notification'


class Notification(models.Model):
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    
    # Optional link to related objects
    action_url = models.CharField(max_length=500, blank=True, null=True)
    
    # Generic relation data stored as JSON
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'read']),
        ]
    
    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}"
    
    def mark_as_read(self):
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save(update_fields=['read', 'read_at'])


class NotificationPreference(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # In-app notification toggles
    notify_task_assigned = models.BooleanField(default=True)
    notify_task_updated = models.BooleanField(default=True)
    notify_task_completed = models.BooleanField(default=False)
    notify_mentions = models.BooleanField(default=True)
    notify_milestones = models.BooleanField(default=True)
    notify_deadlines = models.BooleanField(default=True)
    notify_project_updates = models.BooleanField(default=True)
    
    # Email notification toggles
    email_task_assigned = models.BooleanField(default=True)
    email_task_updated = models.BooleanField(default=False)
    email_mentions = models.BooleanField(default=True)
    email_milestones = models.BooleanField(default=True)
    email_deadlines = models.BooleanField(default=True)
    email_daily_digest = models.BooleanField(default=False)
    
    # Digest preferences
    digest_frequency = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('never', 'Never'),
        ],
        default='never'
    )
    digest_time = models.TimeField(default='09:00:00')  # When to send digest
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.username}"
