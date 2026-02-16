"""
Report generation utilities for PDF and CSV exports
"""
import io
from datetime import datetime, timedelta
from typing import List, Dict, Any
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import pandas as pd

User = get_user_model()


class ReportGenerator:
    """Base class for generating reports"""
    
    def __init__(self, user=None, date_from=None, date_to=None):
        self.user = user
        self.date_from = date_from or timezone.now() - timedelta(days=30)
        self.date_to = date_to or timezone.now()
    
    def _get_date_range_str(self):
        """Get formatted date range string"""
        return f"{self.date_from.strftime('%Y-%m-%d')} to {self.date_to.strftime('%Y-%m-%d')}"


class ProjectReportGenerator(ReportGenerator):
    """Generate project-related reports"""
    
    def __init__(self, project, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.project = project
    
    def generate_pdf(self):
        """Generate PDF report for a project"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # Title
        story.append(Paragraph(f"Project Report: {self.project.name}", title_style))
        story.append(Paragraph(f"Report Period: {self._get_date_range_str()}", styles['Normal']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Project Overview
        story.append(Paragraph("Project Overview", heading_style))
        overview_data = [
            ['Field', 'Value'],
            ['Project Name', self.project.name],
            ['Status', self.project.status.upper()],
            ['Owner', self.project.owner.username if self.project.owner else 'N/A'],
            ['Created', self.project.created_at.strftime('%Y-%m-%d')],
            ['Progress', f"{self.project.progress}%"],
        ]
        
        if self.project.start_date:
            overview_data.append(['Start Date', self.project.start_date.strftime('%Y-%m-%d')])
        if self.project.end_date:
            overview_data.append(['Due Date', self.project.end_date.strftime('%Y-%m-%d')])
        
        overview_table = Table(overview_data, colWidths=[2*inch, 4*inch])
        overview_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(overview_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Tasks Summary
        from projects.models import Task
        tasks = Task.objects.filter(project=self.project)
        
        story.append(Paragraph("Tasks Summary", heading_style))
        task_stats = [
            ['Status', 'Count'],
            ['Total Tasks', tasks.count()],
            ['To Do', tasks.filter(status='todo').count()],
            ['In Progress', tasks.filter(status='in_progress').count()],
            ['Done', tasks.filter(status='done').count()],
        ]
        
        task_table = Table(task_stats, colWidths=[3*inch, 3*inch])
        task_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(task_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Task Details
        if tasks.exists():
            story.append(Paragraph("Task Details", heading_style))
            task_data = [['Task Title', 'Status', 'Priority', 'Assigned To']]
            
            for task in tasks[:20]:  # Limit to first 20 tasks
                task_data.append([
                    task.title[:40],
                    task.status,
                    task.priority or 'N/A',
                    task.assigned_to.username if task.assigned_to else 'Unassigned'
                ])
            
            task_detail_table = Table(task_data, colWidths=[2.5*inch, 1.5*inch, 1*inch, 1.5*inch])
            task_detail_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
            ]))
            story.append(task_detail_table)
        
        # Generate PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_csv(self):
        """Generate CSV report for a project"""
        from projects.models import Task
        tasks = Task.objects.filter(project=self.project).select_related('assigned_to')
        
        data = []
        for task in tasks:
            data.append({
                'Task ID': task.id,
                'Title': task.title,
                'Description': task.description or '',
                'Status': task.status,
                'Priority': task.priority or 'N/A',
                'Assigned To': task.assigned_to.username if task.assigned_to else 'Unassigned',
                'Created At': task.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'Due Date': task.due_date.strftime('%Y-%m-%d') if task.due_date else 'N/A',
            })
        
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        return buffer


class TeamReportGenerator(ReportGenerator):
    """Generate team-related reports"""
    
    def generate_pdf(self):
        """Generate PDF report for team activity"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # Title
        story.append(Paragraph("Team Activity Report", title_style))
        story.append(Paragraph(f"Report Period: {self._get_date_range_str()}", styles['Normal']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Get team members
        from projects.models import Project, Task
        
        if self.user:
            # Filter by user's projects
            projects = Project.objects.filter(
                Q(owner=self.user) | Q(team_members=self.user)
            ).distinct()
            team_members = User.objects.filter(
                Q(owned_projects__in=projects) | 
                Q(projects__in=projects)
            ).distinct()
        else:
            team_members = User.objects.all()[:20]  # Limit to 20 users
        
        # Team member statistics
        story.append(Paragraph("Team Member Statistics", heading_style))
        member_data = [['Member', 'Tasks Assigned', 'Tasks Completed', 'Completion Rate']]
        
        for member in team_members:
            tasks = Task.objects.filter(assigned_to=member)
            completed = tasks.filter(status='done').count()
            total = tasks.count()
            rate = f"{(completed/total*100):.1f}%" if total > 0 else 'N/A'
            
            member_data.append([
                member.username,
                str(total),
                str(completed),
                rate
            ])
        
        member_table = Table(member_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        member_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        story.append(member_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_csv(self):
        """Generate CSV report for team activity"""
        from projects.models import Project, Task
        
        if self.user:
            projects = Project.objects.filter(
                Q(owner=self.user) | Q(team_members=self.user)
            ).distinct()
            team_members = User.objects.filter(
                Q(owned_projects__in=projects) | 
                Q(projects__in=projects)
            ).distinct()
        else:
            team_members = User.objects.all()
        
        data = []
        for member in team_members:
            tasks = Task.objects.filter(assigned_to=member)
            completed = tasks.filter(status='done').count()
            in_progress = tasks.filter(status='in_progress').count()
            todo = tasks.filter(status='todo').count()
            total = tasks.count()
            
            data.append({
                'Username': member.username,
                'Email': member.email,
                'Total Tasks': total,
                'To Do': todo,
                'In Progress': in_progress,
                'Completed': completed,
                'Completion Rate': f"{(completed/total*100):.1f}%" if total > 0 else '0%',
                'Date Joined': member.date_joined.strftime('%Y-%m-%d'),
            })
        
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        return buffer


class TimeTrackingReportGenerator(ReportGenerator):
    """Generate time tracking reports"""
    
    def generate_csv(self):
        """Generate CSV report for time tracking"""
        from projects.models import Task
        
        # Get tasks with time estimates and completion data
        tasks = Task.objects.filter(
            created_at__gte=self.date_from,
            created_at__lte=self.date_to
        ).select_related('assigned_to', 'project')
        
        if self.user:
            tasks = tasks.filter(assigned_to=self.user)
        
        data = []
        for task in tasks:
            # Calculate estimated hours (placeholder data)
            estimated_hours = 8 if task.priority == 'high' else 4 if task.priority == 'medium' else 2
            
            data.append({
                'Date': task.created_at.strftime('%Y-%m-%d'),
                'User': task.assigned_to.username if task.assigned_to else 'Unassigned',
                'Project': task.project.name if task.project else 'N/A',
                'Task': task.title,
                'Status': task.status,
                'Priority': task.priority or 'N/A',
                'Due Date': task.due_date.strftime('%Y-%m-%d') if task.due_date else 'N/A',
                'Estimated Hours': estimated_hours,
                'Description': task.description or '',
            })
        
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        return buffer
