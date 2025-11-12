from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator, MinLengthValidator, MaxLengthValidator
import re
import html
from .models import SecurityEvent, UserProfile


def sanitize_string(value):
    """
    Sanitize string input to prevent XSS attacks.
    - Strips leading/trailing whitespace
    - Escapes HTML special characters
    - Removes null bytes
    """
    if not value:
        return value
    
    # Remove null bytes
    value = value.replace('\x00', '')
    
    # Strip whitespace
    value = value.strip()
    
    # Escape HTML to prevent XSS
    value = html.escape(value)
    
    return value


def validate_username_format(value):
    """
    Validate username format:
    - 3-30 characters
    - Alphanumeric, underscore, hyphen only
    - Must start with letter or number
    """
    if not value:
        raise serializers.ValidationError("Username is required.")
    
    if len(value) < 3:
        raise serializers.ValidationError("Username must be at least 3 characters long.")
    
    if len(value) > 30:
        raise serializers.ValidationError("Username must be no more than 30 characters long.")
    
    if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9_-]*$', value):
        raise serializers.ValidationError(
            "Username must start with a letter or number and contain only letters, numbers, underscores, and hyphens."
        )
    
    # Check for SQL injection patterns
    dangerous_patterns = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'drop', 'select', 'insert', 'update', 'delete', 'union']
    for pattern in dangerous_patterns:
        if pattern in value.lower():
            raise serializers.ValidationError("Username contains invalid characters.")
    
    return value


def validate_name_format(value, field_name="Name"):
    """
    Validate name fields (first_name, last_name):
    - 1-50 characters
    - Letters, spaces, hyphens, apostrophes only
    - No numbers or special characters
    """
    if not value:
        raise serializers.ValidationError(f"{field_name} is required.")
    
    value = sanitize_string(value)
    
    if len(value) < 1:
        raise serializers.ValidationError(f"{field_name} must be at least 1 character long.")
    
    if len(value) > 50:
        raise serializers.ValidationError(f"{field_name} must be no more than 50 characters long.")
    
    if not re.match(r"^[a-zA-Z\s'-]+$", value):
        raise serializers.ValidationError(
            f"{field_name} can only contain letters, spaces, hyphens, and apostrophes."
        )
    
    return value


def validate_email_format(value):
    """
    Enhanced email validation:
    - Standard email format
    - No dangerous characters
    - Maximum length check
    """
    if not value:
        raise serializers.ValidationError("Email is required.")
    
    value = value.strip().lower()
    
    if len(value) > 254:  # RFC 5321
        raise serializers.ValidationError("Email address is too long.")
    
    # Check for dangerous patterns
    if any(char in value for char in ['<', '>', '"', "'"]):
        raise serializers.ValidationError("Email contains invalid characters.")
    
    # Django's built-in email validator
    validator = EmailValidator()
    validator(value)
    
    return value


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all()), validate_email_format]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        min_length=8,
        max_length=128
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        min_length=8,
        max_length=128
    )
    username = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(queryset=User.objects.all()),
            validate_username_format,
            MinLengthValidator(3),
            MaxLengthValidator(30)
        ]
    )
    first_name = serializers.CharField(
        required=True,
        max_length=50
    )
    last_name = serializers.CharField(
        required=True,
        max_length=50
    )

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')

    def validate_username(self, value):
        """Additional username validation"""
        return validate_username_format(value)
    
    def validate_first_name(self, value):
        """Validate and sanitize first name"""
        return validate_name_format(value, "First name")
    
    def validate_last_name(self, value):
        """Validate and sanitize last name"""
        return validate_name_format(value, "Last name")
    
    def validate_email(self, value):
        """Additional email validation"""
        return validate_email_format(value)

    def validate(self, attrs):
        """Cross-field validation"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "Password fields didn't match."})
        
        # Check if username and email are different
        if attrs['username'].lower() == attrs['email'].split('@')[0].lower():
            raise serializers.ValidationError({
                "username": "Username should not be the same as your email address."
            })
        
        return attrs

    def create(self, validated_data):
        """Create user with sanitized data"""
        # Remove password2 as it's not needed for creation
        validated_data.pop('password2', None)
        
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'].lower(),
            first_name=sanitize_string(validated_data['first_name']),
            last_name=sanitize_string(validated_data['last_name'])
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        validators=[
            validate_username_format,
            MinLengthValidator(3),
            MaxLengthValidator(30)
        ],
        required=False
    )
    email = serializers.EmailField(
        validators=[validate_email_format],
        required=False
    )
    first_name = serializers.CharField(
        max_length=50,
        required=False
    )
    last_name = serializers.CharField(
        max_length=50,
        required=False
    )
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login')
    
    def validate_username(self, value):
        """Validate username on update"""
        if value:
            # Check uniqueness (excluding current user)
            if self.instance and User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
                raise serializers.ValidationError("This username is already taken.")
            return validate_username_format(value)
        return value
    
    def validate_first_name(self, value):
        """Validate and sanitize first name on update"""
        if value:
            return validate_name_format(value, "First name")
        return value
    
    def validate_last_name(self, value):
        """Validate and sanitize last name on update"""
        if value:
            return validate_name_format(value, "Last name")
        return value
    
    def validate_email(self, value):
        """Validate email on update"""
        if value:
            # Check uniqueness (excluding current user)
            if self.instance and User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
                raise serializers.ValidationError("This email is already registered.")
            return validate_email_format(value)
        return value
    
    def update(self, instance, validated_data):
        """Update user with sanitized data"""
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email).lower() if validated_data.get('email') else instance.email
        instance.first_name = sanitize_string(validated_data.get('first_name', instance.first_name))
        instance.last_name = sanitize_string(validated_data.get('last_name', instance.last_name))
        instance.save()
        return instance


class SecurityEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityEvent
        fields = ('id', 'event_type', 'user', 'username', 'ip_address', 'description', 'metadata', 'created_at')
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = (
            'id', 'user', 'username', 'user_email', 'full_name',
            'role', 'custom_email', 'phone', 'department', 'position',
            'bio', 'avatar', 'is_invited', 'invited_by', 
            'invitation_sent_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'username', 'user_email', 'full_name', 
                           'is_invited', 'invited_by', 'invitation_sent_at', 
                           'created_at', 'updated_at')


class TeamMemberInvitationSerializer(serializers.Serializer):
    """Serializer for inviting team members"""
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True, max_length=50)
    last_name = serializers.CharField(required=True, max_length=50)
    role = serializers.ChoiceField(
        choices=['member', 'manager'],
        default='member',
        help_text="Role: member or manager"
    )
    department = serializers.CharField(required=False, max_length=100, allow_blank=True)
    position = serializers.CharField(required=False, max_length=100, allow_blank=True)
    project_id = serializers.IntegerField(
        required=True,
        help_text="Project ID to associate the team member with"
    )
    
    def validate_email(self, value):
        """Validate email format but allow existing users for re-invitation"""
        return validate_email_format(value)
    
    def validate_first_name(self, value):
        return validate_name_format(value, "First name")
    
    def validate_last_name(self, value):
        return validate_name_format(value, "Last name")


class UserDetailSerializer(serializers.ModelSerializer):
    """Extended user serializer with profile information"""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'date_joined', 'last_login', 'profile')
        read_only_fields = ('id', 'date_joined', 'last_login')
