"""
API Views for Webhook Management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Webhook, WebhookDelivery, WebhookEvent
from .serializers import (
    WebhookSerializer, WebhookCreateSerializer,
    WebhookDeliverySerializer, WebhookEventSerializer,
    WebhookTestSerializer
)
from .tasks import test_webhook, trigger_webhook_event


class WebhookViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing webhooks
    
    list: Get all webhooks for current user
    create: Create a new webhook
    retrieve: Get webhook details
    update: Update webhook
    destroy: Delete webhook
    test: Send test webhook
    deliveries: Get webhook delivery history
    """
    permission_classes = [IsAuthenticated]
    serializer_class = WebhookSerializer
    
    def get_queryset(self):
        """Return webhooks for current user only"""
        return Webhook.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializer for create"""
        if self.action == 'create':
            return WebhookCreateSerializer
        return WebhookSerializer
    
    def create(self, request, *args, **kwargs):
        """Create webhook with auto-generated secret"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        webhook = serializer.save()
        
        # Return full details including secret (only time it's visible)
        response_data = WebhookSerializer(webhook).data
        response_data['secret'] = webhook.secret  # Include secret in response
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """
        Send a test webhook delivery
        
        POST /api/webhooks/{id}/test/
        """
        webhook = self.get_object()
        
        # Trigger test webhook task
        task = test_webhook.delay(str(webhook.id))
        
        return Response({
            'message': 'Test webhook queued for delivery',
            'webhook_id': webhook.id,
            'webhook_name': webhook.name,
            'task_id': task.id
        })
    
    @action(detail=True, methods=['get'])
    def deliveries(self, request, pk=None):
        """
        Get delivery history for a webhook
        
        GET /api/webhooks/{id}/deliveries/
        """
        webhook = self.get_object()
        deliveries = WebhookDelivery.objects.filter(webhook=webhook)
        
        # Pagination
        page = self.paginate_queryset(deliveries)
        if page is not None:
            serializer = WebhookDeliverySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = WebhookDeliverySerializer(deliveries, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """
        Toggle webhook active status
        
        POST /api/webhooks/{id}/toggle/
        """
        webhook = self.get_object()
        webhook.is_active = not webhook.is_active
        webhook.save()
        
        return Response({
            'id': webhook.id,
            'is_active': webhook.is_active,
            'message': f"Webhook {'activated' if webhook.is_active else 'deactivated'}"
        })
    
    @action(detail=False, methods=['get'])
    def events(self, request):
        """
        List available webhook events
        
        GET /api/webhooks/events/
        """
        events = WebhookEvent.objects.filter(is_active=True)
        serializer = WebhookEventSerializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get webhook statistics for current user
        
        GET /api/webhooks/stats/
        """
        webhooks = self.get_queryset()
        
        total_webhooks = webhooks.count()
        active_webhooks = webhooks.filter(is_active=True).count()
        total_deliveries = sum(w.total_deliveries for w in webhooks)
        successful_deliveries = sum(w.successful_deliveries for w in webhooks)
        failed_deliveries = sum(w.failed_deliveries for w in webhooks)
        
        success_rate = 0
        if total_deliveries > 0:
            success_rate = round((successful_deliveries / total_deliveries) * 100, 2)
        
        return Response({
            'total_webhooks': total_webhooks,
            'active_webhooks': active_webhooks,
            'inactive_webhooks': total_webhooks - active_webhooks,
            'total_deliveries': total_deliveries,
            'successful_deliveries': successful_deliveries,
            'failed_deliveries': failed_deliveries,
            'success_rate': success_rate
        })


class WebhookDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing webhook delivery history
    
    list: Get all deliveries for current user's webhooks
    retrieve: Get delivery details
    """
    permission_classes = [IsAuthenticated]
    serializer_class = WebhookDeliverySerializer
    
    def get_queryset(self):
        """Return deliveries for current user's webhooks only"""
        user_webhooks = Webhook.objects.filter(user=self.request.user)
        return WebhookDelivery.objects.filter(webhook__in=user_webhooks)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent deliveries (last 50)
        
        GET /api/webhook-deliveries/recent/
        """
        deliveries = self.get_queryset()[:50]
        serializer = self.get_serializer(deliveries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def failed(self, request):
        """
        Get failed deliveries
        
        GET /api/webhook-deliveries/failed/
        """
        deliveries = self.get_queryset().filter(status='failed')
        page = self.paginate_queryset(deliveries)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(deliveries, many=True)
        return Response(serializer.data)
