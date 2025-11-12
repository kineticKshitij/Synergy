"""
Admin interface for Webhooks
"""
from django.contrib import admin
from .models import Webhook, WebhookDelivery, WebhookEvent


@admin.register(Webhook)
class WebhookAdmin(admin.ModelAdmin):
    """Admin interface for Webhook model"""
    
    list_display = [
        'name', 'user', 'url', 'is_active',
        'total_deliveries', 'successful_deliveries', 'failed_deliveries',
        'last_triggered_at', 'created_at'
    ]
    list_filter = ['is_active', 'created_at', 'last_triggered_at']
    search_fields = ['name', 'url', 'user__username']
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'last_triggered_at',
        'total_deliveries', 'successful_deliveries', 'failed_deliveries'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'name', 'url', 'is_active')
        }),
        ('Configuration', {
            'fields': ('events', 'secret')
        }),
        ('Statistics', {
            'fields': (
                'total_deliveries', 'successful_deliveries', 'failed_deliveries',
                'last_triggered_at'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(WebhookDelivery)
class WebhookDeliveryAdmin(admin.ModelAdmin):
    """Admin interface for WebhookDelivery model"""
    
    list_display = [
        'webhook', 'event_type', 'status',
        'response_status_code', 'duration_ms',
        'retry_count', 'created_at', 'delivered_at'
    ]
    list_filter = ['status', 'event_type', 'created_at']
    search_fields = ['webhook__name', 'event_type', 'error_message']
    readonly_fields = [
        'id', 'webhook', 'event_type', 'payload',
        'status', 'response_status_code', 'response_body', 'error_message',
        'created_at', 'delivered_at', 'duration_ms',
        'retry_count', 'next_retry_at'
    ]
    
    def has_add_permission(self, request):
        """Deliveries are created automatically"""
        return False


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    """Admin interface for WebhookEvent model"""
    
    list_display = ['event_type', 'display_name', 'is_active']
    list_filter = ['is_active']
    search_fields = ['event_type', 'display_name', 'description']
