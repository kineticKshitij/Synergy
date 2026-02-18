from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'subtasks', views.SubtaskViewSet, basename='subtask')
router.register(r'sprints', views.SprintViewSet, basename='sprint')
router.register(r'activities', views.ProjectActivityViewSet, basename='activity')
router.register(r'attachments', views.TaskAttachmentViewSet, basename='attachment')
router.register(r'messages', views.ProjectMessageViewSet, basename='message')
router.register(r'team-dashboard', views.TeamMemberDashboardView, basename='team-dashboard')
router.register(r'ai', views.AIViewSet, basename='ai')
router.register(r'milestones', views.MilestoneViewSet, basename='milestone')
router.register(r'time-tracking', views.TimeTrackingViewSet, basename='time-tracking')
router.register(r'project-templates', views.ProjectTemplateViewSet, basename='project-template')
router.register(r'task-templates', views.TaskTemplateViewSet, basename='task-template')
router.register(r'milestone-templates', views.MilestoneTemplateViewSet, basename='milestone-template')

urlpatterns = [
    path('', include(router.urls)),
]
