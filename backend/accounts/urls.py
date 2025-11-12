from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    CustomLoginView, 
    LogoutView, 
    UserProfileView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    DashboardStatsView,
    SecurityEventListView,
    InviteTeamMemberView,
    MyUserProfileDetailView,
    TeamMemberListView
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password Reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # User
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/extended/', MyUserProfileDetailView.as_view(), name='profile_extended'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
    
    # Team Members
    path('invite/', InviteTeamMemberView.as_view(), name='invite_team_member'),
    path('team-members/', TeamMemberListView.as_view(), name='team_members'),
    
    # Security
    path('security-events/', SecurityEventListView.as_view(), name='security_events'),
]
