from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from projects.models import Task, Project, ProjectMessage, Comment
from .models import Notification, NotificationPreference, NotificationType
from .utils import create_notification

User = get_user_model()


# Create default notification preferences for new users
@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    if created:
        NotificationPreference.objects.get_or_create(user=instance)


# Task-related notifications
@receiver(post_save, sender=Task)
def handle_task_notifications(sender, instance, created, **kwargs):
    """Generate notifications for task events"""
    
    if created:
        # Notify assigned user (single assignee via ForeignKey)
        if instance.assigned_to and instance.assigned_to != getattr(instance, 'created_by', None):
            create_notification(
                recipient=instance.assigned_to,
                notification_type=NotificationType.TASK_ASSIGNED,
                title='New Task Assigned',
                message=f'You were assigned to task "{instance.title}"',
                action_url=f'/tasks/{instance.id}',
                metadata={
                    'task_id': instance.id,
                    'project_id': instance.project.id,
                    'task_title': instance.title,
                }
            )
        
        # Notify multiple assigned users (ManyToMany field)
        for assignee in instance.assigned_to_multiple.all():
            if assignee != getattr(instance, 'created_by', None):
                create_notification(
                    recipient=assignee,
                    notification_type=NotificationType.TASK_ASSIGNED,
                    title='New Task Assigned',
                    message=f'You were assigned to task "{instance.title}"',
                    action_url=f'/tasks/{instance.id}',
                    metadata={
                        'task_id': instance.id,
                        'project_id': instance.project.id,
                        'task_title': instance.title,
                    }
                )
    else:
        # TODO: Implement change tracking for task updates
        # For now, only handle task completion
        if instance.status == 'done':
            # Notify project owner
            if instance.project.owner:
                create_notification(
                    recipient=instance.project.owner,
                    notification_type=NotificationType.TASK_COMPLETED,
                    title='Task Completed',
                    message=f'Task "{instance.title}" was completed',
                    action_url=f'/tasks/{instance.id}',
                    metadata={
                        'task_id': instance.id,
                        'project_id': instance.project.id,
                    }
                )


# Project-related notifications
@receiver(post_save, sender=Project)
def handle_project_notifications(sender, instance, created, **kwargs):
    """Generate notifications for project events"""
    
    if created:
        # Notify team members they were added to a new project
        for member in instance.team_members.all():
            if member != instance.owner:
                create_notification(
                    recipient=member,
                    notification_type=NotificationType.PROJECT_CREATED,
                    title='Added to New Project',
                    message=f'You were added to project "{instance.name}"',
                    action_url=f'/projects/{instance.id}',
                    metadata={
                        'project_id': instance.id,
                        'project_name': instance.name,
                    }
                )
    else:
        # Check if project was just completed
        if instance.status == 'completed' and instance.tracker.has_changed('status'):
            # Notify all team members
            for member in instance.team_members.all():
                create_notification(
                    recipient=member,
                    notification_type=NotificationType.PROJECT_COMPLETED,
                    title='Project Completed',
                    message=f'Project "{instance.name}" was marked as completed',
                    action_url=f'/projects/{instance.id}',
                    metadata={'project_id': instance.id}
                )


# Message/Mention notifications
@receiver(post_save, sender=ProjectMessage)
def handle_message_notifications(sender, instance, created, **kwargs):
    """Generate notifications for mentions in messages"""
    
    if created and instance.content:
        # Look for @mentions in the message content
        import re
        mentions = re.findall(r'@(\w+)', instance.content)
        
        for username in mentions:
            try:
                mentioned_user = User.objects.get(username=username)
                if mentioned_user != instance.user:
                    create_notification(
                        recipient=mentioned_user,
                        notification_type=NotificationType.MENTION,
                        title='You Were Mentioned',
                        message=f'{instance.user.username} mentioned you in {instance.project.name}',
                        action_url=f'/projects/{instance.project.id}',
                        metadata={
                            'message_id': instance.id,
                            'project_id': instance.project.id,
                            'mentioned_by': instance.user.username,
                        }
                    )
            except User.DoesNotExist:
                pass  # Invalid username in mention
