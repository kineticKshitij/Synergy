from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Project, Task, Comment, ProjectActivity, TaskAttachment, ProjectMessage,
    Milestone, ProjectTemplate, TaskTemplate, MilestoneTemplate
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    team_members = UserSerializer(many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'priority', 'owner',
            'team_members', 'start_date', 'end_date', 'budget', 'progress',
            'created_at', 'updated_at', 'task_count'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_task_count(self, obj):
        return obj.tasks.count()


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    assigned_to_multiple = UserSerializer(many=True, read_only=True)
    assigned_to_multiple_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    depends_on = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Task.objects.all(),
        required=False
    )
    blocking_tasks = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    blocked_by = serializers.SerializerMethodField()
    can_start = serializers.SerializerMethodField()
    total_time_logged = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    has_attachments = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'status', 'priority',
            'assigned_to', 'assigned_to_id', 'assigned_to_multiple', 'assigned_to_multiple_ids',
            'depends_on', 'blocking_tasks', 'blocked_by', 'can_start',
            'due_date', 'estimated_hours', 'actual_hours', 'impact', 
            'time_logs', 'active_timer', 'total_time_logged',
            'created_at', 'updated_at', 'completed_at', 'comment_count', 'has_attachments'
        ]
        read_only_fields = ['created_at', 'updated_at', 'time_logs', 'active_timer']
    
    def get_blocked_by(self, obj):
        """Get incomplete dependencies"""
        blocked = obj.get_blocked_by()
        return [{'id': t.id, 'title': t.title, 'status': t.status} for t in blocked]
    
    def get_can_start(self, obj):
        """Check if task can be started"""
        return obj.can_start()
    
    def get_total_time_logged(self, obj):
        """Get total time logged in hours"""
        return obj.get_total_time_logged()
    
    def create(self, validated_data):
        """Handle creation with multiple assignments and dependencies"""
        assigned_to_multiple_ids = validated_data.pop('assigned_to_multiple_ids', [])
        depends_on = validated_data.pop('depends_on', [])
        task = super().create(validated_data)
        
        if assigned_to_multiple_ids:
            task.assigned_to_multiple.set(assigned_to_multiple_ids)
        
        if depends_on:
            task.depends_on.set(depends_on)
        
        return task
    
    def update(self, instance, validated_data):
        """Handle update with multiple assignments and dependencies"""
        assigned_to_multiple_ids = validated_data.pop('assigned_to_multiple_ids', None)
        depends_on = validated_data.pop('depends_on', None)
        task = super().update(instance, validated_data)
        
        if assigned_to_multiple_ids is not None:
            task.assigned_to_multiple.set(assigned_to_multiple_ids)
        
        if depends_on is not None:
            # Validate no circular dependencies
            self.validate_dependencies(task, depends_on)
            task.depends_on.set(depends_on)
        
        return task
    
    def validate_dependencies(self, task, depends_on):
        """Validate no circular dependencies"""
        for dep_task in depends_on:
            if dep_task.id == task.id:
                raise serializers.ValidationError("Task cannot depend on itself")
            
            # Check if dep_task depends on current task (circular dependency)
            if task in dep_task.depends_on.all():
                raise serializers.ValidationError(
                    f"Circular dependency detected: {dep_task.title} already depends on this task"
                )
    
    def validate_impact(self, value):
        """Validate that impact is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Impact must be between 0 and 100.")
        return value
    
    def get_comment_count(self, obj):
        return obj.comments.count()
    
    def get_has_attachments(self, obj):
        return obj.attachments.filter(is_proof_of_completion=True).exists()


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'task', 'user', 'content', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProjectActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectActivity
        fields = ['id', 'project', 'user', 'action', 'description', 'metadata', 'created_at']
        read_only_fields = ['created_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for task file attachments"""
    user = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskAttachment
        fields = [
            'id', 'task', 'user', 'file', 'file_url', 'file_type', 
            'file_name', 'file_size', 'file_size_mb', 'description',
            'is_proof_of_completion', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'file_type', 'file_size', 'created_at']
    
    def get_file_url(self, obj):
        """Get full URL for the file"""
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_size_mb(self, obj):
        """Convert file size to MB for display"""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0
    
    def validate_file(self, value):
        """Validate file size and type"""
        # Max file size: 50MB
        max_size = 50 * 1024 * 1024  # 50MB in bytes
        
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size must not exceed 50MB. Your file is {round(value.size / (1024 * 1024), 2)}MB."
            )
        
        # Allowed extensions
        allowed_extensions = [
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',  # Images
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',  # Videos
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'  # Documents
        ]
        
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type '.{ext}' is not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value
    
    def create(self, validated_data):
        """Create attachment with auto-filled fields"""
        file = validated_data.get('file')
        validated_data['file_name'] = file.name
        validated_data['file_size'] = file.size
        return super().create(validated_data)


class ProjectMessageSerializer(serializers.ModelSerializer):
    """Serializer for project team messages"""
    sender = UserSerializer(read_only=True)
    mentions = UserSerializer(many=True, read_only=True)
    mention_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    replies_count = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectMessage
        fields = [
            'id', 'project', 'sender', 'message', 'parent', 'mentions', 
            'mention_ids', 'replies_count', 'is_read', 'created_at', 
            'updated_at', 'is_edited'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_edited']
    
    def get_replies_count(self, obj):
        """Get count of replies to this message"""
        return obj.replies.count()
    
    def get_is_read(self, obj):
        """Check if current user has read this message"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.read_by.filter(id=request.user.id).exists()
        return False
    
    def create(self, validated_data):
        """Create message and handle mentions"""
        mention_ids = validated_data.pop('mention_ids', [])
        message = super().create(validated_data)
        
        # Add mentioned users
        if mention_ids:
            message.mentions.set(mention_ids)
        
        return message


class TeamMemberDashboardSerializer(serializers.Serializer):
    """Serializer for team member dashboard data"""
    projects = serializers.SerializerMethodField()
    assigned_tasks = serializers.SerializerMethodField()
    recent_messages = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    
    def get_projects(self, user):
        """Get projects where user is owner or team member"""
        from django.db.models import Q
        projects = Project.objects.filter(
            Q(owner=user) | Q(team_members=user)
        ).distinct()
        return ProjectSerializer(projects, many=True, context=self.context).data
    
    def get_assigned_tasks(self, user):
        """Get tasks assigned to the user"""
        tasks = Task.objects.filter(assigned_to=user).select_related(
            'project', 'assigned_to'
        ).order_by('-created_at')[:10]
        return TaskSerializer(tasks, many=True, context=self.context).data
    
    def get_recent_messages(self, user):
        """Get recent messages from projects user is part of"""
        from django.db.models import Q
        user_projects = Project.objects.filter(
            Q(owner=user) | Q(team_members=user)
        ).distinct()
        messages = ProjectMessage.objects.filter(
            project__in=user_projects
        ).select_related('sender', 'project').prefetch_related(
            'mentions', 'read_by'
        ).order_by('-created_at')[:20]
        return ProjectMessageSerializer(messages, many=True, context=self.context).data
    
    def get_stats(self, user):
        """Get user statistics"""
        from django.db.models import Q
        total_projects = Project.objects.filter(
            Q(owner=user) | Q(team_members=user)
        ).distinct().count()
        total_tasks = Task.objects.filter(assigned_to=user).count()
        completed_tasks = Task.objects.filter(assigned_to=user, status='done').count()
        pending_tasks = Task.objects.filter(
            assigned_to=user
        ).exclude(status='done').count()
        
        # Unread messages count
        user_projects = Project.objects.filter(
            Q(owner=user) | Q(team_members=user)
        ).distinct()
        unread_messages = ProjectMessage.objects.filter(
            project__in=user_projects
        ).exclude(read_by=user).count()
        
        return {
            'total_projects': total_projects,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'unread_messages': unread_messages,
            'completion_rate': round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
        }


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for project milestones"""
    tasks = TaskSerializer(many=True, read_only=True)
    task_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'project', 'name', 'description', 'due_date', 'status',
            'tasks', 'task_ids', 'progress', 'completed_at', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['progress', 'created_at', 'updated_at', 'completed_at']
    
    def get_is_overdue(self, obj):
        """Check if milestone is overdue"""
        from django.utils import timezone
        return obj.due_date < timezone.now().date() and obj.status != 'completed'
    
    def create(self, validated_data):
        """Create milestone and associate tasks"""
        task_ids = validated_data.pop('task_ids', [])
        milestone = super().create(validated_data)
        
        if task_ids:
            milestone.tasks.set(task_ids)
            milestone.update_progress()
        
        return milestone
    
    def update(self, instance, validated_data):
        """Update milestone and tasks"""
        task_ids = validated_data.pop('task_ids', None)
        milestone = super().update(instance, validated_data)
        
        if task_ids is not None:
            milestone.tasks.set(task_ids)
            milestone.update_progress()
        
        return milestone


class TaskTemplateSerializer(serializers.ModelSerializer):
    """Serializer for task templates"""
    
    class Meta:
        model = TaskTemplate
        fields = [
            'id', 'project_template', 'title', 'description', 'priority',
            'estimated_hours', 'impact', 'order', 'depends_on_order',
            'start_offset_days', 'duration_days', 'created_at'
        ]
        read_only_fields = ['created_at']


class MilestoneTemplateSerializer(serializers.ModelSerializer):
    """Serializer for milestone templates"""
    
    class Meta:
        model = MilestoneTemplate
        fields = [
            'id', 'project_template', 'name', 'description',
            'due_offset_days', 'task_orders', 'order', 'created_at'
        ]
        read_only_fields = ['created_at']


class ProjectTemplateSerializer(serializers.ModelSerializer):
    """Serializer for project templates"""
    created_by = UserSerializer(read_only=True)
    task_templates = TaskTemplateSerializer(many=True, read_only=True)
    milestone_templates = MilestoneTemplateSerializer(many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectTemplate
        fields = [
            'id', 'name', 'description', 'category', 'default_priority',
            'estimated_duration_days', 'created_by', 'is_public',
            'task_templates', 'milestone_templates', 'task_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_task_count(self, obj):
        """Get count of task templates"""
        return obj.task_templates.count()


