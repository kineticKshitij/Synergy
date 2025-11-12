"""
Utility functions for triggering webhooks
"""
from .tasks import trigger_webhook_event


def trigger_project_webhook(event_type, project, user=None):
    """
    Trigger webhook for project events
    
    Args:
        event_type: Type of event ('project.created', 'project.updated', etc.)
        project: Project instance
        user: Optional user to limit webhooks
    """
    payload = {
        'event': event_type,
        'timestamp': project.updated_at.isoformat() if hasattr(project, 'updated_at') else None,
        'project': {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'status': project.status,
            'priority': project.priority,
            'owner': {
                'id': project.owner.id,
                'username': project.owner.username,
                'email': project.owner.email
            }
        }
    }
    
    trigger_webhook_event.delay(
        event_type=event_type,
        payload=payload,
        user_id=user.id if user else project.owner.id
    )


def trigger_task_webhook(event_type, task, user=None):
    """
    Trigger webhook for task events
    
    Args:
        event_type: Type of event ('task.created', 'task.updated', etc.)
        task: Task instance
        user: Optional user to limit webhooks
    """
    payload = {
        'event': event_type,
        'timestamp': task.updated_at.isoformat() if hasattr(task, 'updated_at') else None,
        'task': {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'priority': task.priority,
            'project': {
                'id': task.project.id,
                'name': task.project.name
            }
        }
    }
    
    if hasattr(task, 'assigned_to') and task.assigned_to:
        payload['task']['assigned_to'] = {
            'id': task.assigned_to.id,
            'username': task.assigned_to.username,
            'email': task.assigned_to.email
        }
    
    trigger_webhook_event.delay(
        event_type=event_type,
        payload=payload,
        user_id=user.id if user else task.project.owner.id
    )


def trigger_member_webhook(event_type, user, project=None, data=None):
    """
    Trigger webhook for member events
    
    Args:
        event_type: Type of event ('member.invited', 'member.joined')
        user: User instance
        project: Optional project instance
        data: Optional additional data
    """
    payload = {
        'event': event_type,
        'timestamp': None,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
    }
    
    if project:
        payload['project'] = {
            'id': project.id,
            'name': project.name
        }
    
    if data:
        payload['data'] = data
    
    trigger_webhook_event.delay(
        event_type=event_type,
        payload=payload,
        user_id=project.owner.id if project else None
    )


def trigger_message_webhook(event_type, message, user=None):
    """
    Trigger webhook for message events
    
    Args:
        event_type: Type of event ('message.created')
        message: ProjectMessage instance
        user: Optional user to limit webhooks
    """
    payload = {
        'event': event_type,
        'timestamp': message.created_at.isoformat() if hasattr(message, 'created_at') else None,
        'message': {
            'id': message.id,
            'content': message.content[:200],  # First 200 chars
            'author': {
                'id': message.author.id,
                'username': message.author.username
            },
            'project': {
                'id': message.project.id,
                'name': message.project.name
            }
        }
    }
    
    trigger_webhook_event.delay(
        event_type=event_type,
        payload=payload,
        user_id=user.id if user else message.project.owner.id
    )
