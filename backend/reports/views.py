"""
REST API views for report generation and export
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import HttpResponse, FileResponse, StreamingHttpResponse
from django.utils import timezone
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from projects.models import Project
from .utils import ProjectReportGenerator, TeamReportGenerator, TimeTrackingReportGenerator


# Helper function for date parsing
def parse_dates_from_request(request):
    """Parse date_from and date_to from request parameters"""
    date_from_str = request.query_params.get('date_from') if hasattr(request, 'query_params') else request.GET.get('date_from')
    date_to_str = request.query_params.get('date_to') if hasattr(request, 'query_params') else request.GET.get('date_to')
    
    try:
        date_from = datetime.strptime(date_from_str, '%Y-%m-%d') if date_from_str else timezone.now() - timedelta(days=30)
        date_to = datetime.strptime(date_to_str, '%Y-%m-%d') if date_to_str else timezone.now()
        
        # Make timezone aware
        if timezone.is_naive(date_from):
            date_from = timezone.make_aware(date_from)
        if timezone.is_naive(date_to):
            date_to = timezone.make_aware(date_to)
            
        return date_from, date_to, None
    except (ValueError, TypeError) as e:
        return None, None, str(e)


class ReportBaseView(APIView):
    """Base view for report endpoints"""
    permission_classes = [IsAuthenticated]
    
    def _parse_dates(self, request):
        """Parse date_from and date_to from request parameters"""
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')
        
        try:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d') if date_from_str else timezone.now() - timedelta(days=30)
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d') if date_to_str else timezone.now()
            
            # Make timezone aware
            if timezone.is_naive(date_from):
                date_from = timezone.make_aware(date_from)
            if timezone.is_naive(date_to):
                date_to = timezone.make_aware(date_to)
                
            return date_from, date_to
        except ValueError:
            return None, None


class ReportProjectView(ReportBaseView):
    """Generate a report for a specific project"""
    
    def get(self, request, project_id=None):
        """
        GET /api/reports/project/{project_id}/?format=pdf&date_from=2024-01-01&date_to=2024-12-31
        """
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission
        if not (project.owner == request.user or request.user in project.team_members.all()):
            return Response(
                {'error': 'You do not have permission to view this project report'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        date_from, date_to = self._parse_dates(request)
        if date_from is None:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        export_format = request.query_params.get('format', 'pdf').lower()
        generator = ProjectReportGenerator(project, user=request.user, date_from=date_from, date_to=date_to)
        
        if export_format == 'pdf':
            buffer = generator.generate_pdf()
            from django.http import FileResponse
            response = FileResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="project_{project.id}_report.pdf"'
            return response
        elif export_format == 'csv':
            buffer = generator.generate_csv()
            from django.http import FileResponse
            response = FileResponse(buffer, content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="project_{project.id}_report.csv"'
            return response
        else:
            return Response(
                {'error': 'Invalid format. Use "pdf" or "csv"'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ReportTeamView(View):
    """Generate a team activity report - uses plain Django View for file download"""
    
    def get(self, request):
        # Manual JWT authentication
        jwt_auth = JWTAuthentication()
        try:
            auth_result = jwt_auth.authenticate(request)
            if auth_result is None:
                return HttpResponse('{"detail":"Authentication credentials were not provided."}', 
                                  status=401, content_type='application/json')
            user, token = auth_result
        except Exception as e:
            return HttpResponse('{"detail":"Invalid authentication."}', 
                              status=401, content_type='application/json')
        
        # Parse dates
        date_from_str = request.GET.get('date_from')
        date_to_str = request.GET.get('date_to')
        
        try:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d') if date_from_str else timezone.now() - timedelta(days=30)
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d') if date_to_str else timezone.now()
            
            if timezone.is_naive(date_from):
                date_from = timezone.make_aware(date_from)
            if timezone.is_naive(date_to):
                date_to = timezone.make_aware(date_to)
        except (ValueError, TypeError):
            return HttpResponse('{"error":"Invalid date format. Use YYYY-MM-DD"}', 
                              status=400, content_type='application/json')
        
        export_format = request.GET.get('format', 'pdf').lower()
        generator = TeamReportGenerator(user=user, date_from=date_from, date_to=date_to)
        
        if export_format == 'pdf':
            buffer = generator.generate_pdf()
            response = FileResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="team_activity_report.pdf"'
            return response
        elif export_format == 'csv':
            buffer = generator.generate_csv()
            response = FileResponse(buffer, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="team_activity_report.csv"'
            return response
        else:
            return HttpResponse('{"error":"Invalid format. Use pdf or csv"}', 
                              status=400, content_type='application/json')


class ReportTimeTrackingView(View):
    """Generate a time tracking report - uses plain Django View for file download"""
    
    def get(self, request):
        # Manual JWT authentication
        jwt_auth = JWTAuthentication()
        try:
            auth_result = jwt_auth.authenticate(request)
            if auth_result is None:
                return HttpResponse('{"detail":"Authentication credentials were not provided."}', 
                                  status=401, content_type='application/json')
            user, token = auth_result
        except Exception as e:
            return HttpResponse('{"detail":"Invalid authentication."}', 
                              status=401, content_type='application/json')
        
        # Parse dates
        date_from_str = request.GET.get('date_from')
        date_to_str = request.GET.get('date_to')
        
        try:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d') if date_from_str else timezone.now() - timedelta(days=30)
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d') if date_to_str else timezone.now()
            
            if timezone.is_naive(date_from):
                date_from = timezone.make_aware(date_from)
            if timezone.is_naive(date_to):
                date_to = timezone.make_aware(date_to)
        except (ValueError, TypeError):
            return HttpResponse('{"error":"Invalid date format. Use YYYY-MM-DD"}', 
                              status=400, content_type='application/json')
        
        export_format = request.GET.get('format', 'csv').lower()
        generator = TimeTrackingReportGenerator(user=user, date_from=date_from, date_to=date_to)
        
        if export_format == 'csv':
            buffer = generator.generate_csv()
            response = FileResponse(buffer, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="time_tracking_report.csv"'
            return response
        else:
            return HttpResponse('{"error":"Time tracking reports only support CSV format"}', 
                              status=400, content_type='application/json')


class ReportSummaryView(ReportBaseView):
    """Get a summary of report statistics"""
    
    def get(self, request):
        """
        GET /api/reports/summary/?date_from=2024-01-01&date_to=2024-12-31
        """
        date_from, date_to = self._parse_dates(request)
        if date_from is None:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from projects.models import Task
        from django.db.models import Sum, Count, Q
        
        # Get user's projects
        user_projects = Project.objects.filter(
            Q(owner=request.user) | Q(team_members=request.user)
        ).distinct()
        
        # Get tasks in date range
        tasks = Task.objects.filter(
            project__in=user_projects,
            created_at__gte=date_from,
            created_at__lte=date_to
        )
        
        # Calculate statistics
        total_projects = user_projects.count()
        completed_projects = user_projects.filter(status='completed').count()
        
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='done').count()
        in_progress_tasks = tasks.filter(status='in_progress').count()
        
        # For now, set total_hours to 0 (time tracking can be added later)
        total_hours = 0
        
        # Team size
        team_members = set()
        for project in user_projects:
            team_members.update(project.team_members.values_list('id', flat=True))
        
        return Response({
            'date_range': {
                'from': date_from.strftime('%Y-%m-%d'),
                'to': date_to.strftime('%Y-%m-%d'),
            },
            'projects': {
                'total': total_projects,
                'completed': completed_projects,
                'completion_rate': f"{(completed_projects/total_projects*100):.1f}%" if total_projects > 0 else '0%'
            },
            'tasks': {
                'total': total_tasks,
                'completed': completed_tasks,
                'in_progress': in_progress_tasks,
                'todo': total_tasks - completed_tasks - in_progress_tasks,
                'completion_rate': f"{(completed_tasks/total_tasks*100):.1f}%" if total_tasks > 0 else '0%'
            },
            'time': {
                'total_hours': round(total_hours, 2),
                'average_per_day': round(total_hours / max((date_to - date_from).days, 1), 2),
            },
            'team': {
                'size': len(team_members),
            }
        })
