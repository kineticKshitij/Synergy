import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SynergyOS.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@synergyos.com',
        password='admin123',
        first_name='Admin',
        last_name='User'
    )
    print('✅ Admin user created successfully!')
    print('Username: admin')
    print('Password: admin123')
else:
    print('ℹ️ Admin user already exists')
