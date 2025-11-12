from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Task, Comment, ProjectActivity, TaskAttachment


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
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'status', 'priority',
            'assigned_to', 'assigned_to_id', 'due_date', 'estimated_hours',
            'actual_hours', 'impact', 'created_at', 'updated_at', 'completed_at',
            'comment_count'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_impact(self, value):
        """Validate that impact is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Impact must be between 0 and 100.")
        return value
    
    def get_comment_count(self, obj):
        return obj.comments.count()


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
