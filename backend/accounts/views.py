from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.db import models
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django_ratelimit.exceptions import Ratelimited
from .serializers import (
    RegisterSerializer, UserSerializer, SecurityEventSerializer,
    UserProfileSerializer, TeamMemberInvitationSerializer, UserDetailSerializer
)
from .models import SecurityEvent, UserProfile
from .utils import create_invited_user, send_invitation_email
from rest_framework import generics


# Custom login view with rate limiting
@method_decorator(ratelimit(key='ip', rate='5/5m', method='POST', block=True), name='dispatch')
class CustomLoginView(TokenObtainPairView):
    """
    Custom login view with rate limiting to prevent brute force attacks.
    Limits: 5 attempts per 5 minutes per IP address
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Log successful login
        if response.status_code == 200:
            username = request.data.get('username', '')
            try:
                user = User.objects.get(username=username)
                SecurityEvent.objects.create(
                    event_type='login_success',
                    user=user,
                    username=user.username,
                    ip_address=get_client_ip(request),
                    description='User logged in successfully'
                )
            except (User.DoesNotExist, Exception):
                pass
        else:
            # Log failed login
            try:
                SecurityEvent.objects.create(
                    event_type='login_failed',
                    user=None,
                    username=request.data.get('username', ''),
                    ip_address=get_client_ip(request),
                    description='Failed login attempt',
                    metadata={'status_code': response.status_code}
                )
            except Exception:
                pass
        
        return response


@method_decorator(ratelimit(key='ip', rate='5/h', method='POST'), name='dispatch')
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        # Log registration event
        try:
            SecurityEvent.objects.create(
                event_type='registration',
                user=user,
                username=user.username,
                ip_address=get_client_ip(request),
                description='New user registered'
            )
        except Exception:
            pass

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


@method_decorator(ratelimit(key='user', rate='10/m', method='POST'), name='dispatch')
class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            # Log logout
            try:
                SecurityEvent.objects.create(
                    event_type='logout',
                    user=request.user if request.user.is_authenticated else None,
                    username=request.user.username if request.user and request.user.is_authenticated else '',
                    ip_address=get_client_ip(request),
                    description='User logged out'
                )
            except Exception:
                pass

            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password', '').strip()
        new_password = request.data.get('new_password', '').strip()

        if not old_password or not new_password:
            return Response(
                {'error': 'Both old and new passwords are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check password length
        if len(new_password) < 8:
            return Response(
                {'new_password': ['Password must be at least 8 characters long']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) > 128:
            return Response(
                {'new_password': ['Password is too long (maximum 128 characters)']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify old password
        if not user.check_password(old_password):
            return Response(
                {'old_password': ['Current password is incorrect']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if new password is same as old password
        if old_password == new_password:
            return Response(
                {'new_password': ['New password must be different from current password']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'new_password': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        # Log password change
        try:
            SecurityEvent.objects.create(
                event_type='password_change',
                user=user,
                username=user.username,
                ip_address=get_client_ip(request),
                description='User changed password'
            )
        except Exception:
            pass

        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )


class DashboardStatsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        # Mock dashboard statistics (replace with real data later)
        stats = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': f"{user.first_name} {user.last_name}",
                'member_since': user.date_joined,
            },
            'stats': {
                'total_projects': 0,
                'active_tasks': 0,
                'completed_tasks': 0,
                'team_members': 0,
                'pending_approvals': 0,
            },
            'recent_activity': [],
            'ai_insights': {
                'enabled': True,
                'predictions_today': 0,
                'automation_runs': 0,
            },
            'security': {
                'mfa_enabled': False,
                'last_login': user.last_login,
                'failed_login_attempts': 0,
            }
        }
        
        return Response(stats, status=status.HTTP_200_OK)


@method_decorator(ratelimit(key='ip', rate='3/h', method='POST'), name='dispatch')
class PasswordResetRequestView(APIView):
    """
    Request a password reset email.
    Rate limited to 3 requests per hour per IP.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate email format
        if len(email) > 254:
            return Response(
                {'error': 'Email address is too long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Basic email format validation
        if not '@' in email or not '.' in email.split('@')[1]:
            return Response(
                {'error': 'Invalid email format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
            
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset URL (frontend URL)
            frontend_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else 'http://localhost:5173'
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}"
            
            # Send email
            subject = 'Password Reset Request - SynergyOS'
            message = f"""
Hello {user.first_name or user.username},

You requested to reset your password for your SynergyOS account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The SynergyOS Team
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            # Log password reset request for existing user
            try:
                SecurityEvent.objects.create(
                    event_type='password_reset_request',
                    user=user,
                    username=user.username,
                    ip_address=get_client_ip(request),
                    description='Password reset requested',
                    metadata={'frontend_url': frontend_url}
                )
            except Exception:
                pass
            
        except User.DoesNotExist:
            # Don't reveal if user exists or not (security)
            # Still log an anonymized password reset attempt to detect abuse
            try:
                SecurityEvent.objects.create(
                    event_type='password_reset_request',
                    user=None,
                    username='',
                    ip_address=get_client_ip(request),
                    description='Password reset requested for unknown email',
                    metadata={'email': email}
                )
            except Exception:
                pass
        
        # Always return success to prevent email enumeration
        return Response(
            {'message': 'If an account with that email exists, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )


@method_decorator(ratelimit(key='ip', rate='5/h', method='POST'), name='dispatch')
class PasswordResetConfirmView(APIView):
    """
    Reset password with token.
    Rate limited to 5 attempts per hour per IP.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        uidb64 = request.data.get('uid', '').strip()
        token = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '').strip()
        
        if not all([uidb64, token, new_password]):
            return Response(
                {'error': 'UID, token, and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password length
        if len(new_password) < 8:
            return Response(
                {'new_password': ['Password must be at least 8 characters long']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) > 128:
            return Response(
                {'new_password': ['Password is too long (maximum 128 characters)']},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decode user ID
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            
            # Verify token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {'error': 'Invalid or expired reset link'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate new password
            try:
                validate_password(new_password, user)
            except ValidationError as e:
                return Response(
                    {'new_password': list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(new_password)
            user.save()

            # Log successful password reset
            try:
                SecurityEvent.objects.create(
                    event_type='password_reset',
                    user=user,
                    username=user.username,
                    ip_address=get_client_ip(request),
                    description='Password has been reset',
                )
            except Exception:
                pass
            
            return Response(
                {'message': 'Password has been reset successfully'},
                status=status.HTTP_200_OK
            )
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link'},
                status=status.HTTP_400_BAD_REQUEST
            )


def get_client_ip(request):
    """Extract client IP address from request, considering proxies."""
    if not request:
        return None
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class SecurityEventListView(generics.ListAPIView):
    """List security events. Staff can view all, users see their own events."""
    permission_classes = (IsAuthenticated,)
    serializer_class = SecurityEventSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return SecurityEvent.objects.all()
        return SecurityEvent.objects.filter(user=user)


class InviteTeamMemberView(APIView):
    """
    Invite a new team member to a project.
    Creates user account, generates custom Synergy email and password,
    sends invitation email with credentials.
    """
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        serializer = TeamMemberInvitationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        
        # Import Project model here to avoid circular imports
        from projects.models import Project
        
        # Verify project exists and user has permission
        try:
            project = Project.objects.get(id=data['project_id'])
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is project owner or manager
        user_profile = request.user.profile
        if project.owner != request.user and user_profile.role not in ['manager', 'admin']:
            return Response(
                {'error': 'You do not have permission to invite team members to this project'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create invited user
        user, password, custom_email = create_invited_user(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data.get('role', 'member'),
            department=data.get('department', ''),
            position=data.get('position', ''),
            project=project,
            invited_by=request.user
        )
        
        if not user:
            return Response(
                {'error': 'Failed to create user account'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Send invitation email
        email_sent = send_invitation_email(
            user=user,
            custom_email=custom_email,
            password=password,
            project_name=project.name,
            invited_by=request.user
        )
        
        # Log invitation event
        try:
            SecurityEvent.objects.create(
                event_type='other',
                user=request.user,
                username=request.user.username,
                ip_address=get_client_ip(request),
                description=f'Invited {user.email} to project {project.name}',
                metadata={
                    'invited_user_id': user.id,
                    'project_id': project.id,
                    'custom_email': custom_email
                }
            )
        except Exception:
            pass
        
        return Response({
            'message': 'Team member invited successfully',
            'user': UserDetailSerializer(user).data,
            'custom_email': custom_email,
            'email_sent': email_sent,
            'credentials_info': 'Temporary password has been sent to the user\'s email'
        }, status=status.HTTP_201_CREATED)


class MyUserProfileDetailView(generics.RetrieveUpdateAPIView):
    """View and update extended user profile with UserProfile model"""
    permission_classes = (IsAuthenticated,)
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        return self.request.user.profile


class TeamMemberListView(generics.ListAPIView):
    """List all team members for projects where the user is a member"""
    permission_classes = (IsAuthenticated,)
    serializer_class = UserDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Get all projects where user is owner or team member
        from projects.models import Project
        user_projects = Project.objects.filter(
            models.Q(owner=user) | models.Q(team_members=user)
        ).distinct()
        
        # Get all team members from these projects
        team_member_ids = set()
        for project in user_projects:
            team_member_ids.update(project.team_members.values_list('id', flat=True))
            team_member_ids.add(project.owner.id)
        
        return User.objects.filter(id__in=team_member_ids).distinct()
