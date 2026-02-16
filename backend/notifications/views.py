from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(recipient=user)
        
        # Filter by read/unread
        read_filter = self.request.query_params.get('read', None)
        if read_filter is not None:
            if read_filter.lower() == 'true':
                queryset = queryset.filter(read=True)
            elif read_filter.lower() == 'false':
                queryset = queryset.filter(read=False)
        
        # Filter by notification type
        notification_type = self.request.query_params.get('type', None)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        updated = Notification.objects.filter(
            recipient=request.user,
            read=False
        ).update(read=True)
        
        return Response({
            'message': f'Marked {updated} notifications as read',
            'count': updated
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marked as read',
            'notification': NotificationSerializer(notification).data
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            recipient=request.user,
            read=False
        ).count()
        
        return Response({'count': count})
    
    @action(detail=False, methods=['delete'])
    def delete_all_read(self, request):
        """Delete all read notifications for the current user"""
        deleted_count, _ = Notification.objects.filter(
            recipient=request.user,
            read=True
        ).delete()
        
        return Response({
            'message': f'Deleted {deleted_count} read notifications',
            'count': deleted_count
        })


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch']
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        # Get or create preferences for the current user
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences
    
    def list(self, request):
        # Return the user's preferences (always just one object)
        preferences = self.get_object()
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        # Update user's preferences
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
