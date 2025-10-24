from django.contrib import admin
from .models import SecurityEvent


@admin.register(SecurityEvent)
class SecurityEventAdmin(admin.ModelAdmin):
	list_display = ("event_type", "username", "user", "ip_address", "created_at")
	list_filter = ("event_type", "created_at")
	search_fields = ("username", "description", "ip_address")
	readonly_fields = ("event_type", "user", "username", "ip_address", "description", "metadata", "created_at")
