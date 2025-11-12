"""
Webhook Models for SynergyOS
Allows external services to receive real-time notifications about project events
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class Webhook(models.Model):
    """
    Webhook configuration for receiving event notifications
    """
    EVENT_CHOICES = [
        ('project.created', 'Project Created'),
        ('project.updated', 'Project Updated'),
        ('project.deleted', 'Project Deleted'),
        ('task.created', 'Task Created'),
        ('task.updated', 'Task Updated'),
        ('task.deleted', 'Task Deleted'),
        ('task.completed', 'Task Completed'),
        ('member.invited', 'Member Invited'),
        ('member.joined', 'Member Joined'),
        ('message.created', 'Message Created'),
        ('activity.created', 'Activity Created'),
        ('*', 'All Events'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='webhooks')
    name = models.CharField(max_length=255, help_text="Friendly name for the webhook")
    url = models.URLField(max_length=500, help_text="URL to receive webhook POST requests")
    events = models.JSONField(
        default=list,
        help_text="List of events to trigger this webhook"
    )
    secret = models.CharField(
        max_length=255,
        blank=True,
        help_text="Secret key for HMAC signature verification"
    )
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    total_deliveries = models.IntegerField(default=0)
    successful_deliveries = models.IntegerField(default=0)
    failed_deliveries = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.url})"
    
    def increment_delivery_stats(self, success=True):
        """Update delivery statistics"""
        self.total_deliveries += 1
        if success:
            self.successful_deliveries += 1
        else:
            self.failed_deliveries += 1
        self.last_triggered_at = timezone.now()
        self.save(update_fields=[
            'total_deliveries',
            'successful_deliveries',
            'failed_deliveries',
            'last_triggered_at'
        ])


class WebhookDelivery(models.Model):
    """
    Record of webhook delivery attempts
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('retrying', 'Retrying'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name='deliveries')
    event_type = models.CharField(max_length=50)
    payload = models.JSONField()
    
    # Delivery details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response_status_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True, help_text="Delivery duration in milliseconds")
    
    # Retry tracking
    retry_count = models.IntegerField(default=0)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['webhook', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['event_type']),
        ]
        verbose_name_plural = 'Webhook deliveries'
    
    def __str__(self):
        return f"{self.webhook.name} - {self.event_type} ({self.status})"


class WebhookEvent(models.Model):
    """
    Template/definition of available webhook events
    """
    event_type = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField()
    payload_example = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['event_type']
    
    def __str__(self):
        return f"{self.display_name} ({self.event_type})"
