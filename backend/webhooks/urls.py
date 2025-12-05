"""
URL Configuration for Webhooks API
"""
from django.urls import path
from .views import WebhookViewSet, WebhookDeliveryViewSet

urlpatterns = [
    path('webhooks/', WebhookViewSet.as_view({'get': 'list', 'post': 'create'}), name='webhook-list'),
    path('webhooks/<int:pk>/', WebhookViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='webhook-detail'),
    path('webhook-deliveries/', WebhookDeliveryViewSet.as_view({'get': 'list'}), name='webhook-delivery-list'),
    path('webhook-deliveries/<int:pk>/', WebhookDeliveryViewSet.as_view({'get': 'retrieve'}), name='webhook-delivery-detail'),
]
