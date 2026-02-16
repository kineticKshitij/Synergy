from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Notification, NotificationType
from .utils import create_notification
from projects.models import Task, Project


@shared_task
def check_upcoming_deadlines():
    """Check for tasks due in the next 24 hours and send notifications"""
    tomorrow = timezone.now() + timedelta(days=1)
    today = timezone.now()
    
    # Get tasks due in the next 24 hours that aren't completed
    upcoming_tasks = Task.objects.filter(
        due_date__gte=today,
        due_date__lte=tomorrow,
        status__in=['todo', 'in_progress']
    ).select_related('project').prefetch_related('assigned_to')
    
    for task in upcoming_tasks:
        # Check if we already sent a notification for this deadline
        hours_until_due = (task.due_date - timezone.now()).total_seconds() / 3600
        
        # Send notification if within 24 hours and we haven't notified yet
        for assignee in task.assigned_to.all():
            # Check if notification was already sent
            existing = Notification.objects.filter(
                recipient=assignee,
                notification_type=NotificationType.DEADLINE_APPROACHING,
                metadata__task_id=task.id,
                created_at__gte=timezone.now() - timedelta(days=1)
            ).exists()
            
            if not existing:
                create_notification(
                    recipient=assignee,
                    notification_type=NotificationType.DEADLINE_APPROACHING,
                    title='Task Deadline Approaching',
                    message=f'Task "{task.title}" is due in {int(hours_until_due)} hours',
                    action_url=f'/tasks/{task.id}',
                    metadata={
                        'task_id': task.id,
                        'project_id': task.project.id,
                        'due_date': task.due_date.isoformat(),
                    }
                )
    
    return f"Checked {upcoming_tasks.count()} upcoming deadlines"


@shared_task
def check_overdue_tasks():
    """Check for overdue tasks and send notifications"""
    yesterday = timezone.now() - timedelta(days=1)
    
    # Get tasks that became overdue in the last day
    overdue_tasks = Task.objects.filter(
        due_date__lt=timezone.now(),
        due_date__gte=yesterday,
        status__in=['todo', 'in_progress']
    ).select_related('project').prefetch_related('assigned_to')
    
    for task in overdue_tasks:
        for assignee in task.assigned_to.all():
            # Check if we already sent overdue notification
            existing = Notification.objects.filter(
                recipient=assignee,
                notification_type=NotificationType.TASK_OVERDUE,
                metadata__task_id=task.id,
                created_at__gte=yesterday
            ).exists()
            
            if not existing:
                create_notification(
                    recipient=assignee,
                    notification_type=NotificationType.TASK_OVERDUE,
                    title='Task Overdue',
                    message=f'Task "{task.title}" is now overdue',
                    action_url=f'/tasks/{task.id}',
                    metadata={
                        'task_id': task.id,
                        'project_id': task.project.id,
                    }
                )
    
    return f"Checked {overdue_tasks.count()} overdue tasks"


@shared_task
def check_milestone_deadlines():
    """Check for milestones due soon"""
    from projects.models import Milestone
    
    week_from_now = timezone.now() + timedelta(days=7)
    today = timezone.now()
    
    # Get milestones due within the next week
    upcoming_milestones = Milestone.objects.filter(
        due_date__gte=today,
        due_date__lte=week_from_now,
        status__in=['pending', 'in_progress']
    ).select_related('project').prefetch_related('project__team_members')
    
    for milestone in upcoming_milestones:
        days_until_due = (milestone.due_date - timezone.now()).days
        
        # Notify project owner and team members
        recipients = list(milestone.project.team_members.all())
        if milestone.project.owner and milestone.project.owner not in recipients:
            recipients.append(milestone.project.owner)
        
        for member in recipients:
            # Check if already notified
            existing = Notification.objects.filter(
                recipient=member,
                notification_type=NotificationType.MILESTONE_DUE,
                metadata__milestone_id=milestone.id,
                created_at__gte=timezone.now() - timedelta(days=1)
            ).exists()
            
            if not existing:
                create_notification(
                    recipient=member,
                    notification_type=NotificationType.MILESTONE_DUE,
                    title='Milestone Due Soon',
                    message=f'Milestone "{milestone.name}" is due in {days_until_due} days',
                    action_url=f'/projects/{milestone.project.id}',
                    metadata={
                        'milestone_id': milestone.id,
                        'project_id': milestone.project.id,
                        'days_until_due': days_until_due,
                    }
                )
    
    return f"Checked {upcoming_milestones.count()} upcoming milestones"


@shared_task
def clean_old_notifications():
    """Delete notifications older than 90 days"""
    cutoff_date = timezone.now() - timedelta(days=90)
    
    deleted_count, _ = Notification.objects.filter(
        read=True,
        created_at__lt=cutoff_date
    ).delete()
    
    return f"Deleted {deleted_count} old notifications"


@shared_task
def send_daily_digest():
    """Send daily digest emails to users who have it enabled"""
    from django.contrib.auth import get_user_model
    from .models import NotificationPreference
    
    User = get_user_model()
    
    # Get users who want daily digest
    users_with_digest = NotificationPreference.objects.filter(
        digest_frequency='daily',
        email_daily_digest=True,
        user__email__isnull=False
    ).select_related('user')
    
    for pref in users_with_digest:
        user = pref.user
        
        # Get unread notifications from the last 24 hours
        yesterday = timezone.now() - timedelta(days=1)
        recent_notifications = Notification.objects.filter(
            recipient=user,
            read=False,
            created_at__gte=yesterday
        ).order_by('-created_at')
        
        if recent_notifications.exists():
            # TODO: Send digest email with all notifications
            # This would use an email template to format all notifications nicely
            pass
    
    return f"Sent daily digest to {users_with_digest.count()} users"
