from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
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
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django_ratelimit.exceptions import Ratelimited
from datetime import timedelta
import random
from .serializers import (
    RegisterSerializer, UserSerializer, SecurityEventSerializer,
    UserProfileSerializer, TeamMemberInvitationSerializer, UserDetailSerializer
)
from .models import SecurityEvent, UserProfile
from .utils import create_invited_user, send_invitation_email
from rest_framework import generics


REFRESH_COOKIE_NAME = getattr(settings, 'REFRESH_TOKEN_COOKIE_NAME', 'synergy_refresh_token')
REFRESH_COOKIE_PATH = getattr(settings, 'REFRESH_TOKEN_COOKIE_PATH', '/api/auth/')
REFRESH_COOKIE_SECURE = getattr(settings, 'REFRESH_TOKEN_COOKIE_SECURE', not settings.DEBUG)
REFRESH_COOKIE_SAMESITE = getattr(settings, 'REFRESH_TOKEN_COOKIE_SAMESITE', 'Lax')
REFRESH_COOKIE_DOMAIN = getattr(settings, 'REFRESH_TOKEN_COOKIE_DOMAIN', '') or None


def set_refresh_cookie(response, refresh_token: str):
    """Attach the refresh token as an httpOnly cookie."""
    max_age = int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME').total_seconds())
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=max_age,
        httponly=True,
        secure=REFRESH_COOKIE_SECURE,
        samesite=REFRESH_COOKIE_SAMESITE,
        path=REFRESH_COOKIE_PATH,
        domain=REFRESH_COOKIE_DOMAIN,
    )


def clear_refresh_cookie(response):
    """Remove the refresh token cookie from the client."""
    response.delete_cookie(
        REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        domain=REFRESH_COOKIE_DOMAIN,
    )


def get_refresh_token_from_request(request):
    """Fetch refresh token from request body payload or fallback cookie."""
    token = None
    try:
        token = request.data.get('refresh')
    except Exception:
        token = None
    return token or request.COOKIES.get(REFRESH_COOKIE_NAME)


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
        
        if response.status_code == status.HTTP_200_OK:
            refresh_token = response.data.get('refresh') if isinstance(response.data, dict) else None
            if refresh_token:
                set_refresh_cookie(response, refresh_token)
                response.data.pop('refresh', None)
        
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

        response = Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)

        tokens = response.data.get('tokens', {})
        refresh_token = tokens.pop('refresh', None)
        if refresh_token:
            set_refresh_cookie(response, refresh_token)

        return response


@method_decorator(ratelimit(key='user', rate='10/m', method='POST'), name='dispatch')
class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        refresh_token = get_refresh_token_from_request(request)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                response = Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                clear_refresh_cookie(response)
                return response

        # Log logout event regardless of refresh token state
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

        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        clear_refresh_cookie(response)
        return response


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
        from projects.models import Project, Task
        from datetime import datetime, timedelta, timezone
        from ai_service import ai_service
        
        user = request.user
        
        # Get real project and task statistics
        projects = Project.objects.filter(
            models.Q(owner=user) | models.Q(team_members=user)
        ).distinct()
        
        total_projects = projects.count()
        active_projects = projects.filter(status='active').count()
        
        # Get tasks
        all_tasks = Task.objects.filter(project__in=projects)
        active_tasks = all_tasks.exclude(status='completed').count()
        completed_tasks = all_tasks.filter(status='completed').count()
        
        # Recent tasks (this week)
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        completed_tasks_week = all_tasks.filter(
            status='completed',
            updated_at__gte=week_ago
        ).count()
        
        # Overdue tasks
        now = datetime.now(timezone.utc)
        overdue_tasks = all_tasks.filter(
            due_date__lt=now.date(),
            status__in=['todo', 'in_progress']
        ).count()
        
        # Team members count
        team_members_count = 0
        for project in projects:
            team_members_count += project.team_members.count()
        
        # Generate AI insights
        user_data = {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_tasks_week': completed_tasks_week,
            'overdue_tasks': overdue_tasks,
            'team_members': team_members_count,
            'avg_completion_time': 'N/A'
        }
        
        ai_insights_data = ai_service.generate_insights(user_data) if ai_service.enabled else {}
        
        stats = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'member_since': user.date_joined,
            },
            'stats': {
                'total_projects': total_projects,
                'active_tasks': active_tasks,
                'completed_tasks': completed_tasks,
                'team_members': team_members_count,
                'overdue_tasks': overdue_tasks,
            },
            'recent_activity': [],  # Could be populated from ProjectActivity
            'ai_insights': {
                'enabled': ai_service.enabled,
                'productivity_score': ai_insights_data.get('productivity_score', 0),
                'trend': ai_insights_data.get('trend', 'stable'),
                'key_insights': ai_insights_data.get('key_insights', []),
                'predictions': ai_insights_data.get('predictions', []),
                'automation_suggestions': ai_insights_data.get('automation_suggestions', []),
                'focus_areas': ai_insights_data.get('focus_areas', []),
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
            # Log the validation errors for debugging
            print(f"Invitation validation failed: {serializer.errors}")
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
        # Get or create profile for the requesting user
        try:
            user_profile = request.user.profile
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            user_profile = UserProfile.objects.create(
                user=request.user,
                role='admin'  # Default to admin for users without profile
            )
        
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
                    'custom_email': custom_email,
                    'is_new_user': bool(password)
                }
            )
        except Exception:
            pass
        
        # Determine message based on whether it's a new user or existing user
        if password:
            message = 'Team member invited successfully. New account created and credentials sent via email.'
            credentials_info = 'Temporary password has been sent to the user\'s email'
        else:
            message = 'Existing team member added to project successfully. Notification sent via email.'
            credentials_info = 'User will use their existing account credentials'
        
        return Response({
            'message': message,
            'user': UserDetailSerializer(user).data,
            'custom_email': custom_email,
            'email_sent': email_sent,
            'credentials_info': credentials_info
        }, status=status.HTTP_201_CREATED)


class RemoveTeamMemberView(APIView):
    """Remove a team member from a project"""
    permission_classes = (IsAuthenticated,)
    
    def delete(self, request):
        """Remove a team member from a project"""
        project_id = request.data.get('project_id')
        user_id = request.data.get('user_id')
        
        if not project_id or not user_id:
            return Response(
                {'error': 'project_id and user_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get project
        from projects.models import Project
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is project owner or manager
        try:
            user_profile = request.user.profile
        except UserProfile.DoesNotExist:
            user_profile = UserProfile.objects.create(
                user=request.user,
                role='admin'
            )
        
        if project.owner != request.user and user_profile.role not in ['manager', 'admin']:
            return Response(
                {'error': 'You do not have permission to remove team members from this project'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get user to remove
        try:
            user_to_remove = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Cannot remove project owner
        if user_to_remove == project.owner:
            return Response(
                {'error': 'Cannot remove project owner'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove user from project
        if user_to_remove in project.team_members.all():
            project.team_members.remove(user_to_remove)
            
            # Log removal event
            try:
                SecurityEvent.objects.create(
                    event_type='other',
                    user=request.user,
                    username=request.user.username,
                    ip_address=get_client_ip(request),
                    description=f'Removed {user_to_remove.email} from project {project.name}',
                    metadata={
                        'removed_user_id': user_to_remove.id,
                        'project_id': project.id
                    }
                )
            except Exception:
                pass
            
            return Response({
                'message': 'Team member removed successfully',
                'removed_user': UserDetailSerializer(user_to_remove).data
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'User is not a member of this project'},
                status=status.HTTP_400_BAD_REQUEST
            )


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
        
        # Managers and admins can see all users
        if hasattr(user, 'profile') and user.profile.role in ['manager', 'admin']:
            return User.objects.all().select_related('profile').distinct()
        
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
        
        return User.objects.filter(id__in=team_member_ids).select_related('profile').distinct()


@method_decorator(ratelimit(key='ip', rate='3/5m', method='POST', block=True), name='dispatch')
class SendOTPView(APIView):
    """
    Send OTP to user's email for 2FA login.
    Rate limited to 3 requests per 5 minutes per IP.
    """
    permission_classes = (AllowAny,)
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify credentials first
            user = User.objects.get(username=username)
            
            if not user.check_password(password):
                # Log failed login
                try:
                    SecurityEvent.objects.create(
                        event_type='login_failed',
                        user=None,
                        username=username,
                        ip_address=get_client_ip(request),
                        description='Failed OTP login - invalid password',
                    )
                except Exception:
                    pass
                
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Generate 6-digit OTP
            otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            
            # Get or create user profile
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(user=user)
            
            # Store OTP in profile
            profile.otp_code = otp_code
            profile.otp_created_at = timezone.now()
            profile.otp_attempts = 0
            profile.save()
            
            # Send OTP via email
            subject = 'Your SynergyOS Login OTP'
            message = f"""
Hello {user.first_name or user.username},

Your one-time password (OTP) for SynergyOS login is:

{otp_code}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email and ensure your account is secure.

Best regards,
The SynergyOS Team
            """
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                
                # Log OTP sent
                try:
                    SecurityEvent.objects.create(
                        event_type='other',
                        user=user,
                        username=user.username,
                        ip_address=get_client_ip(request),
                        description='OTP sent for 2FA login',
                    )
                except Exception:
                    pass
                
                return Response({
                    'message': 'OTP sent successfully to your email',
                    'email': user.email
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response(
                    {'error': 'Failed to send OTP email'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except User.DoesNotExist:
            # Log failed login
            try:
                SecurityEvent.objects.create(
                    event_type='login_failed',
                    user=None,
                    username=username,
                    ip_address=get_client_ip(request),
                    description='Failed OTP login - user not found',
                )
            except Exception:
                pass
            
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )


@method_decorator(ratelimit(key='ip', rate='5/5m', method='POST', block=True), name='dispatch')
class VerifyOTPView(APIView):
    """
    Verify OTP and complete 2FA login.
    Rate limited to 5 requests per 5 minutes per IP.
    """
    permission_classes = (AllowAny,)
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        otp_code = request.data.get('otp', '').strip()
        
        if not username or not otp_code:
            return Response(
                {'error': 'Username and OTP are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(username=username)
            
            # Get user profile
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                return Response(
                    {'error': 'Invalid OTP'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if OTP exists
            if not profile.otp_code or not profile.otp_created_at:
                return Response(
                    {'error': 'No OTP found. Please request a new OTP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check OTP expiration (10 minutes)
            otp_age = timezone.now() - profile.otp_created_at
            if otp_age > timedelta(minutes=10):
                # Clear expired OTP
                profile.otp_code = None
                profile.otp_created_at = None
                profile.otp_attempts = 0
                profile.save()
                
                return Response(
                    {'error': 'OTP has expired. Please request a new OTP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check attempt limit (max 5 attempts)
            if profile.otp_attempts >= 5:
                # Clear OTP after too many failed attempts
                profile.otp_code = None
                profile.otp_created_at = None
                profile.otp_attempts = 0
                profile.save()
                
                # Log security event
                try:
                    SecurityEvent.objects.create(
                        event_type='login_failed',
                        user=user,
                        username=user.username,
                        ip_address=get_client_ip(request),
                        description='OTP verification failed - too many attempts',
                    )
                except Exception:
                    pass
                
                return Response(
                    {'error': 'Too many failed attempts. Please request a new OTP.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Verify OTP
            if profile.otp_code == otp_code:
                # Clear OTP
                profile.otp_code = None
                profile.otp_created_at = None
                profile.otp_attempts = 0
                profile.save()
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                
                # Log successful login
                try:
                    SecurityEvent.objects.create(
                        event_type='login_success',
                        user=user,
                        username=user.username,
                        ip_address=get_client_ip(request),
                        description='User logged in successfully with 2FA',
                    )
                except Exception:
                    pass
                
                response = Response({
                    'message': 'Login successful',
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_200_OK)

                tokens = response.data.get('tokens', {})
                refresh_token = tokens.pop('refresh', None)
                if refresh_token:
                    set_refresh_cookie(response, refresh_token)

                return response
            else:
                # Increment failed attempts
                profile.otp_attempts += 1
                profile.save()
                
                # Log failed attempt
                try:
                    SecurityEvent.objects.create(
                        event_type='login_failed',
                        user=user,
                        username=user.username,
                        ip_address=get_client_ip(request),
                        description=f'OTP verification failed - attempt {profile.otp_attempts}/5',
                    )
                except Exception:
                    pass
                
                remaining_attempts = 5 - profile.otp_attempts
                return Response(
                    {'error': f'Invalid OTP. {remaining_attempts} attempts remaining.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh_token = get_refresh_token_from_request(request)
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token missing'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        response = Response(data, status=status.HTTP_200_OK)
        new_refresh = data.pop('refresh', None)
        if new_refresh:
            set_refresh_cookie(response, new_refresh)

        return response
