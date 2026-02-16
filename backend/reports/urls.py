"""
URL Configuration for Reports API
"""
from django.urls import path
from django.http import HttpResponse
from . import views

def test_simple_view(request):
    return HttpResponse("Simple view works!", status=200)

urlpatterns = [
    path('summary/', views.ReportSummaryView.as_view(), name='report-summary'),
    path('team/', views.ReportTeamView.as_view(), name='report-team'),
    path('time_tracking/', views.ReportTimeTrackingView.as_view(), name='report-time-tracking'),
    path('project/<int:project_id>/', views.ReportProjectView.as_view(), name='report-project'),
    path('test/', test_simple_view, name='test-simple'),  # Debug endpoint
]
