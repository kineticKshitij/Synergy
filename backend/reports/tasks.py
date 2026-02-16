"""
Celery tasks for scheduled report generation and delivery
"""
from celery import shared_task
from django.core.mail import EmailMessage
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .utils import TeamReportGenerator, TimeTrackingReportGenerator

User = get_user_model()


@shared_task(name='reports.tasks.send_weekly_team_report')
def send_weekly_team_report():
    """
    Send weekly team activity reports to all managers/team leads
    Runs every Monday at 9 AM
    """
    # Get all users who own projects (managers)
    from projects.models import Project
    managers = User.objects.filter(owned_projects__isnull=False).distinct()
    
    date_to = timezone.now()
    date_from = date_to - timedelta(days=7)
    
    success_count = 0
    
    for manager in managers:
        try:
            generator = TeamReportGenerator(user=manager, date_from=date_from, date_to=date_to)
            pdf_buffer = generator.generate_pdf()
            
            # Send email with PDF attachment
            email = EmailMessage(
                subject=f'Weekly Team Activity Report - {date_from.strftime("%Y-%m-%d")} to {date_to.strftime("%Y-%m-%d")}',
                body=f"""
                Hi {manager.username},
                
                Please find attached your weekly team activity report for the period from {date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}.
                
                This report includes:
                - Team member statistics
                - Task completion rates
                - Overall team performance metrics
                
                Best regards,
                SynergyOS Team
                """,
                to=[manager.email],
            )
            email.attach(f'team_report_{date_from.strftime("%Y%m%d")}.pdf', pdf_buffer.getvalue(), 'application/pdf')
            email.send()
            
            success_count += 1
        except Exception as e:
            print(f"Failed to send report to {manager.email}: {str(e)}")
            continue
    
    return f"Successfully sent {success_count} weekly team reports"


@shared_task(name='reports.tasks.send_monthly_summary')
def send_monthly_summary():
    """
    Send monthly summary reports to all active users
    Runs on the 1st of each month at 9 AM
    """
    # Get all active users
    active_users = User.objects.filter(is_active=True)
    
    date_to = timezone.now()
    date_from = date_to - timedelta(days=30)
    
    success_count = 0
    
    for user in active_users:
        try:
            # Generate time tracking report
            generator = TimeTrackingReportGenerator(user=user, date_from=date_from, date_to=date_to)
            csv_buffer = generator.generate_csv()
            
            # Get summary statistics
            from projects.models import Task
            from django.db.models import Q
            
            user_projects = user.owned_projects.all() | user.project_memberships.all()
            tasks = Task.objects.filter(assigned_to=user, created_at__gte=date_from, created_at__lte=date_to)
            completed_tasks = tasks.filter(status='done').count()
            total_tasks = tasks.count()
            
            # Placeholder for total hours (can be implemented with actual time tracking)
            total_hours = tasks.count() * 4  # Estimate 4 hours per task
            
            # Send email with CSV attachment
            email = EmailMessage(
                subject=f'Monthly Activity Summary - {date_from.strftime("%B %Y")}',
                body=f"""
                Hi {user.username},
                
                Here's your monthly activity summary for {date_from.strftime('%B %Y')}:
                
                📊 Your Statistics:
                - Total Tasks: {total_tasks}
                - Completed Tasks: {completed_tasks}
                - Completion Rate: {(completed_tasks/total_tasks*100):.1f}% if total_tasks > 0 else 0.0%
                - Total Hours Logged: {total_hours:.2f}
                - Projects: {user_projects.count()}
                
                Please find your detailed time tracking report attached.
                
                Keep up the great work!
                
                Best regards,
                SynergyOS Team
                """,
                to=[user.email],
            )
            email.attach(f'time_report_{date_from.strftime("%Y%m")}.csv', csv_buffer.getvalue(), 'text/csv')
            email.send()
            
            success_count += 1
        except Exception as e:
            print(f"Failed to send monthly summary to {user.email}: {str(e)}")
            continue
    
    return f"Successfully sent {success_count} monthly summaries"


@shared_task(name='reports.tasks.generate_project_report')
def generate_project_report(project_id, user_id, export_format='pdf'):
    """
    Generate a project report asynchronously
    Can be triggered on-demand from the API
    """
    from projects.models import Project
    from .utils import ProjectReportGenerator
    
    try:
        project = Project.objects.get(id=project_id)
        user = User.objects.get(id=user_id)
        
        generator = ProjectReportGenerator(project, user=user)
        
        if export_format == 'pdf':
            buffer = generator.generate_pdf()
            content_type = 'application/pdf'
            filename = f'project_{project_id}_report.pdf'
        else:
            buffer = generator.generate_csv()
            content_type = 'text/csv'
            filename = f'project_{project_id}_report.csv'
        
        # Send report via email
        email = EmailMessage(
            subject=f'Project Report: {project.name}',
            body=f"""
            Hi {user.username},
            
            Your requested project report for "{project.name}" is attached.
            
            Best regards,
            SynergyOS Team
            """,
            to=[user.email],
        )
        email.attach(filename, buffer.getvalue(), content_type)
        email.send()
        
        return f"Successfully generated and sent {export_format.upper()} report for project {project_id}"
    except Exception as e:
        return f"Failed to generate project report: {str(e)}"
