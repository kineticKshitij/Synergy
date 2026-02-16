"""
Celery configuration for SynergyOS
"""
import os
from celery import Celery

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SynergyOS.settings')

app = Celery('SynergyOS')

# Load configuration from Django settings with 'CELERY_' prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# Configure Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'check-upcoming-deadlines': {
        'task': 'notifications.tasks.check_upcoming_deadlines',
        'schedule': 3600.0,  # Every hour
    },
    'check-overdue-tasks': {
        'task': 'notifications.tasks.check_overdue_tasks',
        'schedule': 86400.0,  # Every day
        'options': {'expires': 3600}
    },
    'check-milestone-deadlines': {
        'task': 'notifications.tasks.check_milestone_deadlines',
        'schedule': 86400.0,  # Every day
        'options': {'expires': 3600}
    },
    'clean-old-notifications': {
        'task': 'notifications.tasks.clean_old_notifications',
        'schedule': 604800.0,  # Every week
    },
    'send-daily-digest': {
        'task': 'notifications.tasks.send_daily_digest',
        'schedule': 86400.0,  # Every day
        'options': {'expires': 3600}
    },
    'send-weekly-team-report': {
        'task': 'reports.tasks.send_weekly_team_report',
        'schedule': 604800.0,  # Every week (7 days)
        'options': {'expires': 3600}
    },
    'send-monthly-summary': {
        'task': 'reports.tasks.send_monthly_summary',
        'schedule': 2592000.0,  # Every 30 days
        'options': {'expires': 3600}
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task for testing Celery"""
    print(f'Request: {self.request!r}')
