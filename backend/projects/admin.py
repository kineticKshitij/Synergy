from django.contrib import admin
from .models import (
    Project, Task, Comment, ProjectActivity, TaskAttachment, ProjectMessage,
    Milestone, ProjectTemplate, TaskTemplate, MilestoneTemplate
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'priority', 'owner', 'progress', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['team_members']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'assigned_to', 'due_date']
    list_filter = ['status', 'priority', 'project', 'created_at']
    search_fields = ['title', 'description']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(ProjectActivity)
class ProjectActivityAdmin(admin.ModelAdmin):
    list_display = ['project', 'action', 'user', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['description']


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'task', 'user', 'file_type', 'is_proof_of_completion', 'created_at']
    list_filter = ['file_type', 'is_proof_of_completion', 'created_at']
    search_fields = ['file_name', 'description']


@admin.register(ProjectMessage)
class ProjectMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'project', 'message_preview', 'created_at', 'is_edited']
    list_filter = ['project', 'created_at', 'is_edited']
    search_fields = ['message', 'sender__username']
    filter_horizontal = ['mentions', 'read_by']
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'status', 'due_date', 'progress', 'created_at']
    list_filter = ['status', 'due_date', 'project']
    search_fields = ['name', 'description']
    filter_horizontal = ['tasks']


@admin.register(ProjectTemplate)
class ProjectTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'created_by', 'is_public', 'estimated_duration_days', 'created_at']
    list_filter = ['category', 'is_public', 'created_at']
    search_fields = ['name', 'description']


@admin.register(TaskTemplate)
class TaskTemplateAdmin(admin.ModelAdmin):
    list_display = ['title', 'project_template', 'priority', 'order', 'estimated_hours']
    list_filter = ['project_template', 'priority']
    search_fields = ['title', 'description']


@admin.register(MilestoneTemplate)
class MilestoneTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'project_template', 'due_offset_days', 'order']
    list_filter = ['project_template']
    search_fields = ['name', 'description']


