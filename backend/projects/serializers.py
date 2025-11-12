from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Task, Comment, ProjectActivity, TaskAttachment, ProjectMessage


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
    comment_count = serializers.SerializerMethodField()
    has_attachments = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'status', 'priority',
            'assigned_to', 'assigned_to_id', 'assigned_to_multiple', 'assigned_to_multiple_ids',
            'due_date', 'estimated_hours', 'actual_hours', 'impact', 
            'created_at', 'updated_at', 'completed_at', 'comment_count', 'has_attachments'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        """Handle creation with multiple assignments"""
        assigned_to_multiple_ids = validated_data.pop('assigned_to_multiple_ids', [])
        task = super().create(validated_data)
        
        if assigned_to_multiple_ids:
            task.assigned_to_multiple.set(assigned_to_multiple_ids)
        
        return task
    
    def update(self, instance, validated_data):
        """Handle update with multiple assignments"""
        assigned_to_multiple_ids = validated_data.pop('assigned_to_multiple_ids', None)
        task = super().update(instance, validated_data)
        
        if assigned_to_multiple_ids is not None:
            task.assigned_to_multiple.set(assigned_to_multiple_ids)
        
        return task
    
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
        """Get projects where user is a team member"""
        projects = user.projects.all()
        return ProjectSerializer(projects, many=True, context=self.context).data
    
    def get_assigned_tasks(self, user):
        """Get tasks assigned to the user"""
        tasks = Task.objects.filter(assigned_to=user).select_related(
            'project', 'assigned_to'
        ).order_by('-created_at')[:10]
        return TaskSerializer(tasks, many=True, context=self.context).data
    
    def get_recent_messages(self, user):
        """Get recent messages from projects user is part of"""
        user_projects = user.projects.all()
        messages = ProjectMessage.objects.filter(
            project__in=user_projects
        ).select_related('sender', 'project').prefetch_related(
            'mentions', 'read_by'
        ).order_by('-created_at')[:20]
        return ProjectMessageSerializer(messages, many=True, context=self.context).data
    
    def get_stats(self, user):
        """Get user statistics"""
        total_projects = user.projects.count()
        total_tasks = Task.objects.filter(assigned_to=user).count()
        completed_tasks = Task.objects.filter(assigned_to=user, status='done').count()
        pending_tasks = Task.objects.filter(
            assigned_to=user
        ).exclude(status='done').count()
        
        # Unread messages count
        user_projects = user.projects.all()
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

