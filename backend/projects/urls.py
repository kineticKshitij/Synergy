from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'activities', views.ProjectActivityViewSet, basename='activity')
router.register(r'attachments', views.TaskAttachmentViewSet, basename='attachment')
router.register(r'messages', views.ProjectMessageViewSet, basename='message')
router.register(r'team-dashboard', views.TeamMemberDashboardView, basename='team-dashboard')
router.register(r'ai', views.AIViewSet, basename='ai')

urlpatterns = [
    path('', include(router.urls)),
]
