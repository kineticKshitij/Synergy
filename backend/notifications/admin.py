from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'notification_type', 'title', 'read', 'created_at']
    list_filter = ['notification_type', 'read', 'created_at']
    search_fields = ['recipient__username', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('recipient')


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'notify_task_assigned', 'notify_mentions', 'email_daily_digest', 'digest_frequency']
    search_fields = ['user__username', 'user__email']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
