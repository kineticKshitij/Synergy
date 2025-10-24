import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SynergyOS.settings')
django.setup()

from django.contrib.auth.models import User

# Check if user exists
print("=" * 50)
print("Checking users in database...")
print("=" * 50)

users = User.objects.all()
print(f"\nTotal users: {users.count()}\n")

for user in users:
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Is active: {user.is_active}")
    print(f"Is superuser: {user.is_superuser}")
    print(f"Date joined: {user.date_joined}")
    print("-" * 50)

# Test password
if users.count() > 0:
    test_user = users.first()
    test_password = input(f"\nEnter password to test for user '{test_user.username}': ")
    
    if test_user.check_password(test_password):
        print("✅ Password is CORRECT!")
    else:
        print("❌ Password is INCORRECT!")
