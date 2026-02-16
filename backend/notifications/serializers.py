from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'read',
            'action_url',
            'metadata',
            'created_at',
            'read_at',
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'id',
            'notify_task_assigned',
            'notify_task_updated',
            'notify_task_completed',
            'notify_mentions',
            'notify_milestones',
            'notify_deadlines',
            'notify_project_updates',
            'email_task_assigned',
            'email_task_updated',
            'email_mentions',
            'email_milestones',
            'email_deadlines',
            'email_daily_digest',
            'digest_frequency',
            'digest_time',
        ]
        read_only_fields = ['id']
