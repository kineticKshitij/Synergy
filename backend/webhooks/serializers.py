"""
Serializers for Webhook API
"""
from rest_framework import serializers
from .models import Webhook, WebhookDelivery, WebhookEvent
import secrets


class WebhookSerializer(serializers.ModelSerializer):
    """Serializer for Webhook model"""
    
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Webhook
        fields = [
            'id', 'name', 'url', 'events', 'secret', 'is_active',
            'created_at', 'updated_at', 'last_triggered_at',
            'total_deliveries', 'successful_deliveries', 'failed_deliveries',
            'success_rate'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'last_triggered_at',
            'total_deliveries', 'successful_deliveries', 'failed_deliveries'
        ]
        extra_kwargs = {
            'secret': {'write_only': True}
        }
    
    def get_success_rate(self, obj):
        """Calculate webhook success rate"""
        if obj.total_deliveries == 0:
            return 0
        return round((obj.successful_deliveries / obj.total_deliveries) * 100, 2)
    
    def create(self, validated_data):
        """Auto-generate secret if not provided"""
        if not validated_data.get('secret'):
            validated_data['secret'] = secrets.token_urlsafe(32)
        
        # Set user from request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class WebhookCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating webhooks with auto-generated secret"""
    
    class Meta:
        model = Webhook
        fields = ['id', 'name', 'url', 'events', 'is_active', 'secret']
        read_only_fields = ['id', 'secret']
    
    def create(self, validated_data):
        """Auto-generate secret"""
        validated_data['secret'] = secrets.token_urlsafe(32)
        validated_data['user'] = self.context['request'].user
        webhook = super().create(validated_data)
        
        # Return secret in response (only time it's visible)
        return webhook


class WebhookDeliverySerializer(serializers.ModelSerializer):
    """Serializer for WebhookDelivery model"""
    
    webhook_name = serializers.CharField(source='webhook.name', read_only=True)
    webhook_url = serializers.CharField(source='webhook.url', read_only=True)
    
    class Meta:
        model = WebhookDelivery
        fields = [
            'id', 'webhook', 'webhook_name', 'webhook_url',
            'event_type', 'payload', 'status',
            'response_status_code', 'response_body', 'error_message',
            'created_at', 'delivered_at', 'duration_ms',
            'retry_count', 'next_retry_at'
        ]
        read_only_fields = fields


class WebhookEventSerializer(serializers.ModelSerializer):
    """Serializer for WebhookEvent model"""
    
    class Meta:
        model = WebhookEvent
        fields = [
            'event_type', 'display_name', 'description',
            'payload_example', 'is_active'
        ]
        read_only_fields = fields


class WebhookTestSerializer(serializers.Serializer):
    """Serializer for testing webhook"""
    
    webhook_id = serializers.UUIDField()
    
    def validate_webhook_id(self, value):
        """Validate webhook exists and belongs to user"""
        user = self.context['request'].user
        try:
            webhook = Webhook.objects.get(id=value, user=user)
            return value
        except Webhook.DoesNotExist:
            raise serializers.ValidationError("Webhook not found or access denied")
