"""Utility functions for accounts app"""
import random
import string
import secrets
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from .models import UserProfile


def generate_secure_password(length=16):
    """
    Generate a secure random password of specified length.
    Password will contain:
    - Uppercase letters
    - Lowercase letters
    - Digits
    - Special characters
    """
    # Ensure at least one of each character type
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice('!@#$%^&*()_+-=[]{}|;:,.<>?')
    ]
    
    # Fill the rest with random characters
    all_characters = string.ascii_letters + string.digits + '!@#$%^&*()_+-=[]{}|;:,.<>?'
    password.extend(secrets.choice(all_characters) for _ in range(length - 4))
    
    # Shuffle to avoid predictable patterns
    random.shuffle(password)
    
    return ''.join(password)


def generate_custom_email(first_name, last_name, project_name):
    """
    Generate custom Synergy email in format: firstname.lastname.projectname@synergy.in
    If email already exists, append a number
    """
    # Clean and format names
    first = first_name.lower().strip().replace(' ', '')
    last = last_name.lower().strip().replace(' ', '')
    project = project_name.lower().strip().replace(' ', '').replace('-', '')
    
    base_email = f"{first}.{last}.{project}@synergy.in"
    custom_email = base_email
    counter = 1
    
    # Check if email exists and increment if needed
    while UserProfile.objects.filter(custom_email=custom_email).exists():
        custom_email = f"{first}.{last}.{project}{counter}@synergy.in"
        counter += 1
    
    return custom_email


def send_invitation_email(user, custom_email, password, project_name, invited_by):
    """
    Send invitation email to new team member with credentials
    """
    subject = f'Welcome to SynergyOS - You\'ve been invited to {project_name}'
    
    message = f"""
Dear {user.first_name} {user.last_name},

You have been invited to join the project "{project_name}" on SynergyOS by {invited_by.get_full_name() or invited_by.username}.

Here are your login credentials:

Custom Email: {custom_email}
Username: {user.username}
Temporary Password: {password}

Login URL: {settings.FRONTEND_URL or 'http://localhost'}/login

Important:
- Please change your password after your first login
- Your custom Synergy email can be used for project-related communications
- You can view your assigned tasks and upload proof of completion through the dashboard

If you have any questions, please contact your project manager.

Best regards,
The SynergyOS Team
    """.strip()
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@synergy.in',
            recipient_list=[user.email, custom_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send invitation email: {str(e)}")
        return False


def create_invited_user(email, first_name, last_name, role, department, position, project, invited_by):
    """
    Create a new user account for an invited team member
    
    Args:
        email: User's personal email
        first_name: User's first name
        last_name: User's last name
        role: User's role (member or manager)
        department: User's department (optional)
        position: User's position (optional)
        project: Project instance
        invited_by: User who sent the invitation
    
    Returns:
        tuple: (user, password, custom_email) on success
        None on failure
    """
    try:
        # Generate username from email
        base_username = email.split('@')[0].lower()
        username = base_username
        counter = 1
        
        # Ensure username is unique
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Generate secure password
        password = generate_secure_password(16)
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email.lower(),
            first_name=first_name,
            last_name=last_name,
            password=password
        )
        
        # Generate custom Synergy email
        custom_email = generate_custom_email(first_name, last_name, project.name)
        
        # Update user profile
        profile = user.profile
        profile.role = role
        profile.custom_email = custom_email
        profile.department = department or ''
        profile.position = position or ''
        profile.is_invited = True
        profile.invited_by = invited_by
        profile.save()
        
        # Add user to project team
        project.team_members.add(user)
        
        return user, password, custom_email
        
    except Exception as e:
        print(f"Failed to create invited user: {str(e)}")
        return None, None, None
