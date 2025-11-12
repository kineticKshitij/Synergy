from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Task, Comment, ProjectActivity


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
