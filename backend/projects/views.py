from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import models

from .models import Project, Task, Comment, ProjectActivity, TaskAttachment, ProjectMessage
from .serializers import (
    ProjectSerializer, TaskSerializer, CommentSerializer,
    ProjectActivitySerializer, TaskAttachmentSerializer,
    ProjectMessageSerializer, TeamMemberDashboardSerializer
)


class IsProjectOwner(BasePermission):
    """
    Custom permission to only allow project owners to modify projects.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for team members
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write permissions only for project owner
        if isinstance(obj, Project):
            return obj.owner == request.user
        elif hasattr(obj, 'project'):
            return obj.project.owner == request.user
        return False


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations
    """
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]
    
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
        """Add a team member to the project (owner only)"""
        project = self.get_object()
        
        # Check if user is project owner
        if project.owner != request.user:
            return Response(
                {'error': 'Only the project owner can add team members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
        """Remove a team member from the project (owner only)"""
        project = self.get_object()
        
        # Check if user is project owner
        if project.owner != request.user:
            return Response(
                {'error': 'Only the project owner can remove team members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
    permission_classes = [IsAuthenticated, IsProjectOwner]
    
    def get_queryset(self):
        """Only return tasks from projects user has access to"""
        user = self.request.user
        queryset = Task.objects.filter(
            models.Q(project__owner=user) | models.Q(project__team_members=user)
        ).distinct()
        
        # Filter by project if provided
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Log task creation (owner only)"""
        task = serializer.save()
        
        # Check if user is project owner
        if task.project.owner != self.request.user:
            return Response(
                {'error': 'Only the project owner can create tasks'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ProjectActivity.objects.create(
            project=task.project,
            user=self.request.user,
            action='task_created',
            description=f'Created task: {task.title}'
        )
    
    def perform_update(self, serializer):
        """Log task updates (owner can update all, team members can update status only)"""
        task = serializer.save()
        
        # Allow team members to update status only
        if task.project.owner != self.request.user:
            # Team members can only update certain fields like status
            allowed_fields = {'status', 'actual_hours'}
            updated_fields = set(serializer.validated_data.keys())
            if not updated_fields.issubset(allowed_fields):
                return Response(
                    {'error': 'Team members can only update task status and actual hours'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
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


class TaskAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for uploading and managing task attachments (files)
    Supports images, videos, and documents
    """
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Only return attachments from tasks user has access to"""
        user = self.request.user
        return TaskAttachment.objects.filter(
            models.Q(task__project__owner=user) | models.Q(task__project__team_members=user)
        ).distinct()
    
    def perform_create(self, serializer):
        """Save attachment with current user"""
        attachment = serializer.save(user=self.request.user)
        
        # Log activity
        ProjectActivity.objects.create(
            project=attachment.task.project,
            user=self.request.user,
            action='file_uploaded',
            description=f'Uploaded file "{attachment.file_name}" to task: {attachment.task.title}',
            metadata={
                'file_type': attachment.file_type,
                'file_size': attachment.file_size,
                'is_proof': attachment.is_proof_of_completion
            }
        )
    
    @action(detail=False, methods=['get'])
    def by_task(self, request):
        """Get all attachments for a specific task"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {'error': 'task_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attachments = self.get_queryset().filter(task_id=task_id)
        serializer = self.get_serializer(attachments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def proof_of_completion(self, request):
        """Get all proof of completion files for a specific task"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {'error': 'task_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attachments = self.get_queryset().filter(
            task_id=task_id, 
            is_proof_of_completion=True
        )
        serializer = self.get_serializer(attachments, many=True)
        return Response(serializer.data)


class ProjectMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for project team messages
    """
    serializer_class = ProjectMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return messages from projects user is part of"""
        user = self.request.user
        return ProjectMessage.objects.filter(
            models.Q(project__owner=user) | models.Q(project__team_members=user)
        ).distinct().select_related('sender', 'project').prefetch_related('mentions', 'read_by')
    
    def perform_create(self, serializer):
        """Save message with current user as sender"""
        message = serializer.save(sender=self.request.user)
        
        # Mark as read by sender
        message.read_by.add(self.request.user)
        
        # Log activity
        ProjectActivity.objects.create(
            project=message.project,
            user=self.request.user,
            action='message_sent',
            description=f'{self.request.user.username} sent a message',
            metadata={'message_preview': message.message[:100]}
        )
    
    @action(detail=False, methods=['get'])
    def by_project(self, request):
        """Get all messages for a specific project"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has access to this project
        user = request.user
        try:
            project = Project.objects.get(
                id=project_id,
                **{f'{"owner" if Project.objects.filter(id=project_id, owner=user).exists() else "team_members"}': user}
            )
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        messages = self.get_queryset().filter(project_id=project_id, parent__isnull=True)
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a message as read by current user"""
        message = self.get_object()
        message.read_by.add(request.user)
        return Response({'status': 'marked as read'})
    
    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """Get all replies to a message"""
        message = self.get_object()
        replies = message.replies.all()
        serializer = self.get_serializer(replies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread messages for current user"""
        user = request.user
        messages = self.get_queryset().exclude(read_by=user)
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)


class TeamMemberDashboardView(viewsets.ViewSet):
    """
    Dashboard view specifically for team members
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get dashboard data for current user"""
        serializer = TeamMemberDashboardSerializer(
            request.user,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get all tasks assigned to current user"""
        status_filter = request.query_params.get('status')
        project_id = request.query_params.get('project_id')
        
        tasks = Task.objects.filter(assigned_to=request.user)
        
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        if project_id:
            tasks = tasks.filter(project_id=project_id)
        
        tasks = tasks.select_related('project', 'assigned_to').order_by('-created_at')
        serializer = TaskSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """Get all projects where user is a team member"""
        projects = request.user.projects.all()
        serializer = ProjectSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def upload_proof(self, request):
        """Upload proof of completion for a task (supports multiple files)"""
        task_id = request.data.get('task_id')
        files = request.FILES.getlist('files')
        description = request.data.get('description', '')
        
        if not task_id:
            return Response(
                {'error': 'task_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not files:
            return Response(
                {'error': 'At least one file is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify task is assigned to current user
        try:
            task = Task.objects.get(id=task_id, assigned_to=request.user)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found or not assigned to you'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create attachments for all files
        attachments = []
        for file in files:
            attachment = TaskAttachment.objects.create(
                user=request.user,
                task=task,
                file=file,
                file_name=file.name,
                file_size=file.size,
                description=description,
                is_proof_of_completion=True
            )
            attachments.append(attachment)
        
        # Update task status to review if not already done
        if task.status not in ['review', 'done']:
            task.status = 'review'
            task.save()
        
        # Log activity
        ProjectActivity.objects.create(
            project=task.project,
            user=request.user,
            action='proof_uploaded',
            description=f'Uploaded {len(files)} proof file(s) for task: {task.title}'
        )
        
        serializer = TaskAttachmentSerializer(attachments, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AIViewSet(viewsets.ViewSet):
    """
    ViewSet for AI-powered features
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def task_suggestions(self, request):
        """Generate AI-powered task suggestions for a project"""
        from ai_service import ai_service
        
        project_id = request.data.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = get_object_or_404(Project, id=project_id)
            
            # Check if user has access to this project
            if not (project.owner == request.user or request.user in project.team_members.all()):
                return Response(
                    {'error': 'You do not have access to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prepare project data
            tasks = project.tasks.all()
            project_data = {
                'name': project.name,
                'description': project.description,
                'status': project.status,
                'priority': project.priority,
                'existing_tasks': [
                    {
                        'title': t.title,
                        'status': t.status,
                        'priority': t.priority
                    }
                    for t in tasks
                ]
            }
            
            # Generate suggestions
            suggestions = ai_service.generate_task_suggestions(project_data)
            
            return Response({
                'project_id': project_id,
                'suggestions': suggestions,
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def risk_analysis(self, request):
        """Analyze project risks using AI"""
        from ai_service import ai_service
        from datetime import datetime, timezone
        
        project_id = request.data.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = get_object_or_404(Project, id=project_id)
            
            # Check access
            if not (project.owner == request.user or request.user in project.team_members.all()):
                return Response(
                    {'error': 'You do not have access to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prepare project data with detailed task information
            tasks = project.tasks.all()
            now = datetime.now(timezone.utc)
            
            task_data = []
            overdue_count = 0
            for task in tasks:
                is_overdue = task.due_date and task.due_date < now.date() and task.status != 'completed'
                if is_overdue:
                    overdue_count += 1
                
                task_data.append({
                    'title': task.title,
                    'status': task.status,
                    'priority': task.priority,
                    'is_overdue': is_overdue
                })
            
            days_since_start = (now.date() - project.created_at.date()).days if project.created_at else 0
            
            project_data = {
                'name': project.name,
                'tasks': task_data,
                'team_size': project.team_members.count() + 1,  # +1 for owner
                'priority': project.priority,
                'days_since_start': days_since_start
            }
            
            # Perform risk analysis
            analysis = ai_service.analyze_project_risks(project_data)
            
            return Response({
                'project_id': project_id,
                'analysis': analysis,
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def parse_nl_task(self, request):
        """Parse natural language task description"""
        from ai_service import ai_service
        
        nl_input = request.data.get('description', '').strip()
        project_id = request.data.get('project_id')
        
        if not nl_input:
            return Response(
                {'error': 'description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project_context = {}
        if project_id:
            try:
                project = get_object_or_404(Project, id=project_id)
                if project.owner == request.user or request.user in project.team_members.all():
                    project_context = {
                        'name': project.name,
                        'description': project.description
                    }
            except:
                pass
        
        try:
            # Parse natural language input
            task_data = ai_service.parse_natural_language_task(nl_input, project_context)
            
            return Response({
                'parsed_task': task_data,
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def prioritize_tasks(self, request):
        """Get AI-powered task prioritization suggestions"""
        from ai_service import ai_service
        from datetime import datetime, timezone
        
        project_id = request.data.get('project_id')
        task_ids = request.data.get('task_ids', [])
        
        if not project_id:
            return Response(
                {'error': 'project_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = get_object_or_404(Project, id=project_id)
            
            # Check access
            if not (project.owner == request.user or request.user in project.team_members.all()):
                return Response(
                    {'error': 'You do not have access to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get tasks
            if task_ids:
                tasks = Task.objects.filter(id__in=task_ids, project=project)
            else:
                tasks = project.tasks.filter(status__in=['todo', 'in_progress'])
            
            # Prepare task data
            now = datetime.now(timezone.utc)
            task_data = []
            task_objects = {}
            
            for task in tasks:
                is_overdue = task.due_date and task.due_date < now.date() and task.status != 'completed'
                task_dict = {
                    'id': task.id,
                    'title': task.title,
                    'status': task.status,
                    'priority': task.priority,
                    'is_overdue': is_overdue,
                    'estimated_hours': task.estimated_hours or 0
                }
                task_data.append(task_dict)
                task_objects[task.id] = task
            
            # Get AI prioritization
            prioritized = ai_service.suggest_task_prioritization(task_data)
            
            return Response({
                'project_id': project_id,
                'prioritized_tasks': prioritized,
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate_insights(self, request):
        """Generate personalized AI insights for user"""
        from ai_service import ai_service
        from datetime import datetime, timedelta, timezone
        
        try:
            user = request.user
            
            # Gather user statistics
            projects = Project.objects.filter(
                models.Q(owner=user) | models.Q(team_members=user)
            ).distinct()
            
            active_projects = projects.filter(status='active').count()
            
            # Tasks completed this week
            week_ago = datetime.now(timezone.utc) - timedelta(days=7)
            completed_tasks_week = Task.objects.filter(
                project__in=projects,
                status='completed',
                updated_at__gte=week_ago
            ).count()
            
            # Overdue tasks
            now = datetime.now(timezone.utc)
            overdue_tasks = Task.objects.filter(
                project__in=projects,
                due_date__lt=now.date(),
                status__in=['todo', 'in_progress']
            ).count()
            
            # Team members
            team_members = 0
            for project in projects:
                team_members += project.team_members.count()
            
            user_data = {
                'total_projects': projects.count(),
                'active_projects': active_projects,
                'completed_tasks_week': completed_tasks_week,
                'overdue_tasks': overdue_tasks,
                'team_members': team_members,
                'avg_completion_time': 'N/A'  # Could calculate this from task data
            }
            
            # Generate insights
            insights = ai_service.generate_insights(user_data)
            
            return Response({
                'insights': insights,
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def project_summary(self, request):
        """Generate AI-powered project summary"""
        from ai_service import ai_service
        
        project_id = request.data.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = get_object_or_404(Project, id=project_id)
            
            # Check access
            if not (project.owner == request.user or request.user in project.team_members.all()):
                return Response(
                    {'error': 'You do not have access to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prepare project data
            tasks = project.tasks.all()
            project_data = {
                'name': project.name,
                'description': project.description,
                'status': project.status,
                'tasks': [
                    {
                        'title': t.title,
                        'status': t.status
                    }
                    for t in tasks
                ],
                'team_size': project.team_members.count() + 1
            }
            
            # Generate summary
            summary = ai_service.generate_project_summary(project_data)
            
            return Response({
                'project_id': project_id,
                'summary': summary,
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


