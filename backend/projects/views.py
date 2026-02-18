from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import models

from .models import Project, Task, Comment, ProjectActivity, TaskAttachment, ProjectMessage, Subtask, Sprint
from .serializers import (
    ProjectSerializer, TaskSerializer, CommentSerializer,
    ProjectActivitySerializer, TaskAttachmentSerializer,
    ProjectMessageSerializer, TeamMemberDashboardSerializer,
    MilestoneSerializer, ProjectTemplateSerializer, TaskTemplateSerializer,
    MilestoneTemplateSerializer, SubtaskSerializer, SprintSerializer
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
    
    @action(detail=True, methods=['get'])
    def get_comments(self, request, pk=None):
        """Get all comments for a task"""
        task = self.get_object()
        comments = task.comments.all().order_by('created_at')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
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
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update multiple tasks at once"""
        task_ids = request.data.get('task_ids', [])
        updates = request.data.get('updates', {})
        
        if not task_ids:
            return Response(
                {'error': 'task_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not updates:
            return Response(
                {'error': 'updates is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get tasks user has access to
        user = request.user
        tasks = Task.objects.filter(
            id__in=task_ids
        ).filter(
            models.Q(project__owner=user) | models.Q(project__team_members=user)
        ).distinct()
        
        if not tasks.exists():
            return Response(
                {'error': 'No accessible tasks found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate permissions
        allowed_fields = {'status', 'priority', 'assigned_to_id', 'due_date'}
        update_fields = set(updates.keys())
        
        if not update_fields.issubset(allowed_fields):
            return Response(
                {'error': f'Can only bulk update: {", ".join(allowed_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check ownership for non-status fields
        if update_fields - {'status'} and not all(task.project.owner == user for task in tasks):
            return Response(
                {'error': 'Only project owner can update fields other than status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Perform bulk update
        updated_count = 0
        for task in tasks:
            for field, value in updates.items():
                setattr(task, field, value)
            task.save()
            updated_count += 1
            
            # Log activity
            ProjectActivity.objects.create(
                project=task.project,
                user=user,
                action='task_updated',
                description=f'Bulk updated task: {task.title}'
            )
        
        return Response({
            'success': True,
            'updated_count': updated_count,
            'message': f'Successfully updated {updated_count} task(s)'
        })
    
    @action(detail=False, methods=['post'])
    def ai_breakdown_task(self, request):
        """AI-powered task breakdown into subtasks"""
        from ai_service import ai_service
        
        task_id = request.data.get('task_id')
        
        if not task_id:
            return Response(
                {'error': 'task_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = get_object_or_404(Task, id=task_id)
            
            # Check access
            if not (task.project.owner == request.user or request.user in task.project.team_members.all()):
                return Response(
                    {'error': 'You do not have access to this task'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prepare task data for AI
            task_data = {
                'title': task.title,
                'description': task.description,
                'project_context': f"{task.project.name} - {task.project.description}",
                'estimated_hours': task.estimated_hours or 8,
                'priority': task.priority
            }
            
            # Get AI breakdown
            breakdown = ai_service.breakdown_task_into_subtasks(task_data)
            
            return Response({
                'success': True,
                'breakdown': breakdown,
                'original_task': {
                    'id': task.id,
                    'title': task.title
                },
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def ai_suggest_due_date(self, request):
        """AI-powered due date suggestion based on workload"""
        from ai_service import ai_service
        
        # Task data can be from an existing task or new task being created
        task_data = {
            'title': request.data.get('title', ''),
            'description': request.data.get('description', ''),
            'priority': request.data.get('priority', 'medium'),
            'estimated_hours': request.data.get('estimated_hours', 4)
        }
        
        if not task_data['title']:
            return Response(
                {'error': 'title is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Calculate user's current workload
            user = request.user
            user_tasks = Task.objects.filter(
                models.Q(project__owner=user) | models.Q(project__team_members=user),
                status__in=['todo', 'in_progress']
            ).distinct()
            
            # Calculate committed hours in next 7 days
            from datetime import datetime, timedelta
            week_from_now = datetime.now() + timedelta(days=7)
            upcoming_tasks = user_tasks.filter(
                due_date__lte=week_from_now,
                due_date__gte=datetime.now()
            )
            
            committed_hours = sum(t.estimated_hours or 4 for t in upcoming_tasks)
            
            user_workload = {
                'active_task_count': user_tasks.count(),
                'committed_hours_week': committed_hours,
                'available_hours_per_day': 6,  # Configurable
                'upcoming_deadline_count': upcoming_tasks.count()
            }
            
            # Get AI suggestion
            suggestion = ai_service.suggest_due_date(task_data, user_workload)
            
            return Response({
                'success': True,
                'suggestion': suggestion,
                'current_workload': user_workload,
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def ai_extract_meeting_tasks(self, request):
        """Extract action items from meeting notes"""
        from ai_service import ai_service
        
        meeting_notes = request.data.get('meeting_notes', '')
        project_id = request.data.get('project_id')
        
        if not meeting_notes:
            return Response(
                {'error': 'meeting_notes is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project_context = ""
            
            # If project specified, get context and verify access
            if project_id:
                project = get_object_or_404(Project, id=project_id)
                
                if not (project.owner == request.user or request.user in project.team_members.all()):
                    return Response(
                        {'error': 'You do not have access to this project'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                project_context = f"{project.name} - {project.description}"
            
            # Extract tasks using AI
            extraction = ai_service.extract_tasks_from_meeting_notes(meeting_notes, project_context)
            
            return Response({
                'success': True,
                'extraction': extraction,
                'project_id': project_id,
                'enabled': ai_service.enabled
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubtaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subtask/Checklist CRUD operations
    """
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]
    
    def get_queryset(self):
        """Only return subtasks from tasks user has access to"""
        user = self.request.user
        queryset = Subtask.objects.filter(
            models.Q(task__project__owner=user) | models.Q(task__project__team_members=user)
        ).distinct().select_related('task', 'assigned_to', 'completed_by')
        
        # Filter by task if provided
        task_id = self.request.query_params.get('task', None)
        if task_id is not None:
            queryset = queryset.filter(task_id=task_id)
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context for completed_by tracking"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['post'])
    def toggle_complete(self, request, pk=None):
        """Toggle subtask completion status"""
        subtask = self.get_object()
        subtask.is_completed = not subtask.is_completed
        
        if subtask.is_completed:
            subtask.completed_by = request.user
        else:
            subtask.completed_by = None
        
        subtask.save()
        serializer = self.get_serializer(subtask)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple subtasks at once"""
        task_id = request.data.get('task_id')
        subtask_titles = request.data.get('subtasks', [])
        
        if not task_id or not subtask_titles:
            return Response(
                {'error': 'task_id and subtasks are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has access to the task
        try:
            task = Task.objects.get(
                id=task_id,
                project__in=Project.objects.filter(
                    models.Q(owner=request.user) | models.Q(team_members=request.user)
                )
            )
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create subtasks
        subtasks = []
        for idx, title in enumerate(subtask_titles):
            if isinstance(title, str) and title.strip():
                subtask = Subtask.objects.create(
                    task=task,
                    title=title.strip(),
                    order=idx
                )
                subtasks.append(subtask)
        
        serializer = self.get_serializer(subtasks, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder subtasks"""
        subtask_orders = request.data.get('orders', [])  # [{id: 1, order: 0}, ...]
        
        if not subtask_orders:
            return Response(
                {'error': 'orders array is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subtasks = []
        for item in subtask_orders:
            try:
                subtask = Subtask.objects.get(id=item['id'])
                # Verify access
                if not (subtask.task.project.owner == request.user or 
                        request.user in subtask.task.project.team_members.all()):
                    continue
                subtask.order = item['order']
                subtask.save(update_fields=['order'])
                subtasks.append(subtask)
            except (Subtask.DoesNotExist, KeyError):
                continue
        
        serializer = self.get_serializer(subtasks, many=True)
        return Response(serializer.data)


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
        """Get all projects where user is owner or team member"""
        from django.db.models import Q
        projects = Project.objects.filter(
            Q(owner=request.user) | Q(team_members=request.user)
        ).distinct()
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
    
    @action(detail=False, methods=['post'])
    def generate_tasks(self, request):
        """Generate multiple tasks for a project using AI"""
        from ai_service import ai_service
        
        project_id = request.data.get('project_id')
        custom_description = request.data.get('description', '').strip()
        auto_create = request.data.get('auto_create', False)
        
        if not project_id:
            return Response(
                {'error': 'project_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = get_object_or_404(Project, id=project_id)
            
            # Check if user is project owner (only owner can create tasks)
            if project.owner != request.user:
                return Response(
                    {'error': 'Only project owner can generate tasks'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prepare existing tasks context
            existing_tasks = project.tasks.all()
            existing_tasks_data = [
                {
                    'title': t.title,
                    'status': t.status,
                    'priority': t.priority
                }
                for t in existing_tasks
            ]
            
            # Prepare project data
            project_data = {
                'name': project.name,
                'description': project.description,
                'status': project.status,
                'priority': project.priority
            }
            
            # Generate tasks using AI
            generated_tasks = ai_service.generate_tasks_for_project(
                project_data,
                existing_tasks_data,
                custom_description if custom_description else None
            )
            
            created_tasks = []
            
            # If auto_create is True, create the tasks in the database
            if auto_create and generated_tasks:
                for task_data in generated_tasks:
                    task = Task.objects.create(
                        project=project,
                        title=task_data['title'],
                        description=task_data['description'],
                        priority=task_data['priority'],
                        estimated_hours=task_data['estimated_hours'],
                        status='todo',
                        assigned_to=None  # No default assignment
                    )
                    
                    # Log activity
                    ProjectActivity.objects.create(
                        project=project,
                        user=request.user,
                        action='ai_task_created',
                        description=f'AI created task: {task.title}',
                        metadata={
                            'ai_generated': True,
                            'rationale': task_data.get('rationale', ''),
                            'custom_description': custom_description if custom_description else None
                        }
                    )
                    
                    # Serialize the created task
                    serializer = TaskSerializer(task)
                    created_tasks.append(serializer.data)
            
            response_data = {
                'success': True,
                'project_id': project_id,
                'suggestions': generated_tasks,
                'enabled': ai_service.enabled
            }
            
            if auto_create:
                response_data['created_tasks'] = created_tasks
                response_data['created_count'] = len(created_tasks)
            
            return Response(response_data, status=status.HTTP_201_CREATED if auto_create else status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing project milestones
    """
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]
    
    def get_queryset(self):
        """Only return milestones from projects user has access to"""
        user = self.request.user
        from .models import Milestone
        queryset = Milestone.objects.filter(
            models.Q(project__owner=user) | models.Q(project__team_members=user)
        ).distinct().select_related('project').prefetch_related('tasks')
        
        # Filter by project if provided
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create milestone and log activity"""
        milestone = serializer.save()
        
        ProjectActivity.objects.create(
            project=milestone.project,
            user=self.request.user,
            action='milestone_created',
            description=f'Created milestone: {milestone.name}'
        )
    
    def perform_update(self, serializer):
        """Update milestone and log activity"""
        milestone = serializer.save()
        milestone.update_progress()
        
        ProjectActivity.objects.create(
            project=milestone.project,
            user=self.request.user,
            action='milestone_updated',
            description=f'Updated milestone: {milestone.name}'
        )
    
    @action(detail=True, methods=['post'])
    def refresh_progress(self, request, pk=None):
        """Manually refresh milestone progress"""
        milestone = self.get_object()
        milestone.update_progress()
        
        serializer = self.get_serializer(milestone)
        return Response(serializer.data)


class TimeTrackingViewSet(viewsets.ViewSet):
    """
    ViewSet for time tracking on tasks
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def start_timer(self, request):
        """Start timer for a task"""
        task_id = request.data.get('task_id')
        
        if not task_id:
            return Response(
                {'error': 'task_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = Task.objects.get(id=task_id)
            
            # Check if user has access to this task
            user = request.user
            if not (task.project.owner == user or user in task.project.team_members.all()):
                return Response(
                    {'error': 'You do not have access to this task'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if timer is already running
            if task.active_timer:
                return Response(
                    {'error': 'Timer is already running for this task'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Start timer
            task.active_timer = {
                'user_id': user.id,
                'start_time': timezone.now().isoformat()
            }
            task.save(update_fields=['active_timer'])
            
            return Response({
                'status': 'timer_started',
                'task_id': task.id,
                'start_time': task.active_timer['start_time']
            })
            
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def stop_timer(self, request):
        """Stop timer for a task and log the time"""
        task_id = request.data.get('task_id')
        note = request.data.get('note', '')
        
        if not task_id:
            return Response(
                {'error': 'task_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = Task.objects.get(id=task_id)
            user = request.user
            
            # Check access
            if not (task.project.owner == user or user in task.project.team_members.all()):
                return Response(
                    {'error': 'You do not have access to this task'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if timer is running
            if not task.active_timer:
                return Response(
                    {'error': 'No active timer for this task'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate duration
            start_time = timezone.datetime.fromisoformat(task.active_timer['start_time'])
            end_time = timezone.now()
            duration_minutes = int((end_time - start_time).total_seconds() / 60)
            
            # Create time log entry
            time_entry = {
                'user_id': user.id,
                'username': user.username,
                'start_time': task.active_timer['start_time'],
                'end_time': end_time.isoformat(),
                'duration_minutes': duration_minutes,
                'note': note,
                'logged_at': timezone.now().isoformat()
            }
            
            # Add to time logs
            if not task.time_logs:
                task.time_logs = []
            task.time_logs.append(time_entry)
            
            # Clear active timer
            task.active_timer = None
            
            # Update actual hours
            total_hours = task.get_total_time_logged()
            task.actual_hours = total_hours
            
            task.save(update_fields=['time_logs', 'active_timer', 'actual_hours'])
            
            # Log activity
            ProjectActivity.objects.create(
                project=task.project,
                user=user,
                action='time_logged',
                description=f'Logged {duration_minutes} minutes on task: {task.title}',
                metadata={'duration_minutes': duration_minutes, 'task_id': task.id}
            )
            
            return Response({
                'status': 'timer_stopped',
                'task_id': task.id,
                'duration_minutes': duration_minutes,
                'total_time_logged': total_hours
            })
            
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def log_time(self, request):
        """Manually log time for a task (without timer)"""
        task_id = request.data.get('task_id')
        hours = request.data.get('hours')
        note = request.data.get('note', '')
        date = request.data.get('date')  # Optional specific date
        
        if not task_id or hours is None:
            return Response(
                {'error': 'task_id and hours are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            hours = float(hours)
            if hours <= 0:
                raise ValueError()
        except ValueError:
            return Response(
                {'error': 'hours must be a positive number'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = Task.objects.get(id=task_id)
            user = request.user
            
            # Check access
            if not (task.project.owner == user or user in task.project.team_members.all()):
                return Response(
                    {'error': 'You do not have access to this task'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create time log entry
            duration_minutes = int(hours * 60)
            log_time = timezone.now() if not date else timezone.datetime.fromisoformat(date)
            
            time_entry = {
                'user_id': user.id,
                'username': user.username,
                'start_time': None,
                'end_time': None,
                'duration_minutes': duration_minutes,
                'note': note,
                'logged_at': log_time.isoformat(),
                'manual_entry': True
            }
            
            # Add to time logs
            if not task.time_logs:
                task.time_logs = []
            task.time_logs.append(time_entry)
            
            # Update actual hours
            total_hours = task.get_total_time_logged()
            task.actual_hours = total_hours
            
            task.save(update_fields=['time_logs', 'actual_hours'])
            
            # Log activity
            ProjectActivity.objects.create(
                project=task.project,
                user=user,
                action='time_logged',
                description=f'Logged {hours} hours on task: {task.title}',
                metadata={'duration_minutes': duration_minutes, 'task_id': task.id}
            )
            
            return Response({
                'status': 'time_logged',
                'task_id': task.id,
                'duration_minutes': duration_minutes,
                'total_time_logged': total_hours
            })
            
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def get_logs(self, request):
        """Get time logs for a task or project"""
        task_id = request.query_params.get('task_id')
        project_id = request.query_params.get('project_id')
        
        if task_id:
            try:
                task = Task.objects.get(id=task_id)
                user = request.user
                
                # Check access
                if not (task.project.owner == user or user in task.project.team_members.all()):
                    return Response(
                        {'error': 'You do not have access to this task'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                return Response({
                    'task_id': task.id,
                    'time_logs': task.time_logs or [],
                    'total_time_logged': task.get_total_time_logged(),
                    'active_timer': task.active_timer
                })
                
            except Task.DoesNotExist:
                return Response(
                    {'error': 'Task not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        elif project_id:
            try:
                project = Project.objects.get(id=project_id)
                user = request.user
                
                # Check access
                if not (project.owner == user or user in project.team_members.all()):
                    return Response(
                        {'error': 'You do not have access to this project'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Aggregate time logs from all tasks
                tasks = project.tasks.all()
                all_logs = []
                total_time = 0
                
                for task in tasks:
                    if task.time_logs:
                        for log in task.time_logs:
                            log_copy = log.copy()
                            log_copy['task_id'] = task.id
                            log_copy['task_title'] = task.title
                            all_logs.append(log_copy)
                            total_time += log.get('duration_minutes', 0)
                
                return Response({
                    'project_id': project.id,
                    'time_logs': all_logs,
                    'total_time_minutes': total_time,
                    'total_time_hours': round(total_time / 60, 2)
                })
                
            except Project.DoesNotExist:
                return Response(
                    {'error': 'Project not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        else:
            return Response(
                {'error': 'Either task_id or project_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProjectTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for project templates
    """
    serializer_class = ProjectTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return public templates and user's own templates"""
        user = self.request.user
        from .models import ProjectTemplate
        return ProjectTemplate.objects.filter(
            models.Q(is_public=True) | models.Q(created_by=user)
        ).distinct().prefetch_related('task_templates', 'milestone_templates')
    
    def perform_create(self, serializer):
        """Set creator to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def create_project(self, request, pk=None):
        """Create a new project from this template"""
        from datetime import timedelta
        template = self.get_object()
        
        # Get project details from request
        project_name = request.data.get('name')
        project_description = request.data.get('description', '')
        start_date = request.data.get('start_date')
        
        if not project_name:
            return Response(
                {'error': 'Project name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse start date
        if start_date:
            try:
                start_date = timezone.datetime.fromisoformat(start_date).date()
            except:
                return Response(
                    {'error': 'Invalid start_date format. Use ISO format (YYYY-MM-DD)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            start_date = timezone.now().date()
        
        # Calculate end date
        end_date = None
        if template.estimated_duration_days:
            end_date = start_date + timedelta(days=template.estimated_duration_days)
        
        # Create project
        project = Project.objects.create(
            name=project_name,
            description=project_description or template.description,
            owner=request.user,
            status='planning',
            priority=template.default_priority,
            start_date=start_date,
            end_date=end_date
        )
        
        # Create tasks from template
        task_templates = template.task_templates.all().order_by('order')
        task_mapping = {}  # Map template order to actual task
        
        for task_template in task_templates:
            # Calculate due date
            due_date = None
            if task_template.duration_days:
                task_start = start_date + timedelta(days=task_template.start_offset_days)
                due_date = task_start + timedelta(days=task_template.duration_days)
            
            task = Task.objects.create(
                project=project,
                title=task_template.title,
                description=task_template.description,
                priority=task_template.priority,
                estimated_hours=task_template.estimated_hours,
                impact=task_template.impact,
                due_date=due_date,
                status='todo'
            )
            
            task_mapping[task_template.order] = task
        
        # Set up dependencies
        for task_template in task_templates:
            if task_template.depends_on_order:
                task = task_mapping[task_template.order]
                dependencies = [
                    task_mapping[dep_order]
                    for dep_order in task_template.depends_on_order
                    if dep_order in task_mapping
                ]
                task.depends_on.set(dependencies)
        
        # Create milestones from template
        milestone_templates = template.milestone_templates.all().order_by('order')
        
        for milestone_template in milestone_templates:
            due_date = start_date + timedelta(days=milestone_template.due_offset_days)
            
            from .models import Milestone
            milestone = Milestone.objects.create(
                project=project,
                name=milestone_template.name,
                description=milestone_template.description,
                due_date=due_date,
                status='pending'
            )
            
            # Associate tasks with milestone
            if milestone_template.task_orders:
                milestone_tasks = [
                    task_mapping[task_order]
                    for task_order in milestone_template.task_orders
                    if task_order in task_mapping
                ]
                milestone.tasks.set(milestone_tasks)
                milestone.update_progress()
        
        # Log activity
        ProjectActivity.objects.create(
            project=project,
            user=request.user,
            action='created_from_template',
            description=f'Created project from template: {template.name}',
            metadata={'template_id': template.id}
        )
        
        # Return created project
        serializer = ProjectSerializer(project, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for task templates (part of project templates)
    """
    serializer_class = TaskTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return task templates from accessible project templates"""
        user = self.request.user
        from .models import TaskTemplate
        return TaskTemplate.objects.filter(
            models.Q(project_template__is_public=True) | 
            models.Q(project_template__created_by=user)
        ).distinct().select_related('project_template')


class MilestoneTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for milestone templates (part of project templates)
    """
    serializer_class = MilestoneTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return milestone templates from accessible project templates"""
        user = self.request.user
        from .models import MilestoneTemplate
        return MilestoneTemplate.objects.filter(
            models.Q(project_template__is_public=True) | 
            models.Q(project_template__created_by=user)
        ).distinct().select_related('project_template')


class SprintViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Sprint CRUD operations and sprint management
    """
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]
    
    def get_queryset(self):
        """Only return sprints from projects user has access to"""
        user = self.request.user
        queryset = Sprint.objects.filter(
            models.Q(project__owner=user) | models.Q(project__team_members=user)
        ).distinct().select_related('project')
        
        # Filter by project if provided
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter is not None:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Log sprint creation (owner only)"""
        sprint = serializer.save()
        
        # Check if user is project owner
        if sprint.project.owner != self.request.user:
            return Response(
                {'error': 'Only the project owner can create sprints'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ProjectActivity.objects.create(
            project=sprint.project,
            user=self.request.user,
            action='sprint_created',
            description=f'Created sprint: {sprint.name}'
        )
    
    @action(detail=True, methods=['post'])
    def start_sprint(self, request, pk=None):
        """Start a sprint (change status to active)"""
        sprint = self.get_object()
        
        # Check if user is project owner
        if sprint.project.owner != request.user:
            return Response(
                {'error': 'Only the project owner can start sprints'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if there's already an active sprint
        active_sprints = Sprint.objects.filter(
            project=sprint.project,
            status='active'
        ).exclude(id=sprint.id)
        
        if active_sprints.exists():
            return Response(
                {'error': 'Another sprint is already active. Complete it first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sprint.status = 'active'
        sprint.save()
        
        ProjectActivity.objects.create(
            project=sprint.project,
            user=request.user,
            action='sprint_started',
            description=f'Started sprint: {sprint.name}'
        )
        
        serializer = self.get_serializer(sprint)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete_sprint(self, request, pk=None):
        """Complete a sprint (change status to completed)"""
        sprint = self.get_object()
        
        # Check if user is project owner
        if sprint.project.owner != request.user:
            return Response(
                {'error': 'Only the project owner can complete sprints'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        sprint.status = 'completed'
        sprint.save()
        
        # Move incomplete tasks back to backlog (remove sprint assignment)
        incomplete_tasks = sprint.tasks.exclude(status='done')
        incomplete_tasks.update(sprint=None)
        
        ProjectActivity.objects.create(
            project=sprint.project,
            user=request.user,
            action='sprint_completed',
            description=f'Completed sprint: {sprint.name}',
            metadata={
                'total_points': sprint.get_total_points(),
                'completed_points': sprint.get_completed_points(),
                'completion_percentage': sprint.get_completion_percentage(),
                'incomplete_tasks_count': incomplete_tasks.count()
            }
        )
        
        serializer = self.get_serializer(sprint)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get all tasks in this sprint"""
        sprint = self.get_object()
        tasks = sprint.tasks.all()
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_task(self, request, pk=None):
        """Add a task to this sprint"""
        sprint = self.get_object()
        task_id = request.data.get('task_id')
        
        if not task_id:
            return Response(
                {'error': 'task_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = Task.objects.get(id=task_id, project=sprint.project)
            
            # Check if task is already in another active sprint
            if task.sprint and task.sprint.status == 'active' and task.sprint.id != sprint.id:
                return Response(
                    {'error': f'Task is already in active sprint: {task.sprint.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            task.sprint = sprint
            task.save()
            
            return Response(
                {'message': f'Task added to sprint: {sprint.name}'},
                status=status.HTTP_200_OK
            )
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_task(self, request, pk=None):
        """Remove a task from this sprint"""
        sprint = self.get_object()
        task_id = request.data.get('task_id')
        
        if not task_id:
            return Response(
                {'error': 'task_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = Task.objects.get(id=task_id, sprint=sprint)
            task.sprint = None
            task.save()
            
            return Response(
                {'message': 'Task removed from sprint'},
                status=status.HTTP_200_OK
            )
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found in this sprint'},
                status=status.HTTP_404_NOT_FOUND
            )


