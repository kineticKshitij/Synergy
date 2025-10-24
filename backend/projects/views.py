from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from .models import Project, Task, Comment, ProjectActivity
from .serializers import (
    ProjectSerializer, TaskSerializer, CommentSerializer,
    ProjectActivitySerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations
    """
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return projects where user is owner or team member"""
        user = self.request.user
        return Project.objects.filter(
            models.Q(owner=user) | models.Q(team_members=user)
        ).distinct()
    
    def perform_create(self, serializer):
        """Set the owner to the current user"""
        project = serializer.save(owner=self.request.user)
        
        # Log activity
        ProjectActivity.objects.create(
            project=project,
            user=self.request.user,
            action='created',
            description=f'Created project: {project.name}'
        )
    
    def perform_update(self, serializer):
        """Log project updates"""
        project = serializer.save()
        
        ProjectActivity.objects.create(
            project=project,
            user=self.request.user,
            action='updated',
            description=f'Updated project: {project.name}'
        )
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a team member to the project"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            user = User.objects.get(id=user_id)
            project.team_members.add(user)
            
            ProjectActivity.objects.create(
                project=project,
                user=request.user,
                action='member_added',
                description=f'Added {user.username} to the team'
            )
            
            return Response({'status': 'member added'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a team member from the project"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            user = User.objects.get(id=user_id)
            project.team_members.remove(user)
            
            ProjectActivity.objects.create(
                project=project,
                user=request.user,
                action='member_removed',
                description=f'Removed {user.username} from the team'
            )
            
            return Response({'status': 'member removed'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get project statistics"""
        project = self.get_object()
        tasks = project.tasks.all()
        
        stats = {
            'total_tasks': tasks.count(),
            'completed_tasks': tasks.filter(status='done').count(),
            'in_progress_tasks': tasks.filter(status='in_progress').count(),
            'todo_tasks': tasks.filter(status='todo').count(),
            'team_size': project.team_members.count() + 1,  # +1 for owner
        }
        
        return Response(stats)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return tasks from projects user has access to"""
        user = self.request.user
        return Task.objects.filter(
            models.Q(project__owner=user) | models.Q(project__team_members=user)
        ).distinct()
    
    def perform_create(self, serializer):
        """Log task creation"""
        task = serializer.save()
        
        ProjectActivity.objects.create(
            project=task.project,
            user=self.request.user,
            action='task_created',
            description=f'Created task: {task.title}'
        )
    
    def perform_update(self, serializer):
        """Log task updates"""
        task = serializer.save()
        
        ProjectActivity.objects.create(
            project=task.project,
            user=self.request.user,
            action='task_updated',
            description=f'Updated task: {task.title}'
        )
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a task"""
        task = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response(
                {'error': 'Content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = Comment.objects.create(
            task=task,
            user=request.user,
            content=content
        )
        
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing project activities (read-only)
    """
    serializer_class = ProjectActivitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return activities from projects user has access to"""
        user = self.request.user
        return ProjectActivity.objects.filter(
            models.Q(project__owner=user) | models.Q(project__team_members=user)
        ).distinct()


# Fix the import for Q
from django.db import models
