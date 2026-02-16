from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import NotificationViewSet, NotificationPreferenceViewSet

router = SimpleRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'notification-preferences', NotificationPreferenceViewSet, basename='notification-preference')

urlpatterns = [
    path('', include(router.urls)),
]
