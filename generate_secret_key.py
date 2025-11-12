# Generate Django SECRET_KEY
# Run this script to generate a secure SECRET_KEY for your .env file

import secrets
import string

def generate_secret_key(length=50):
    """Generate a secure SECRET_KEY for Django"""
    chars = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(chars) for _ in range(length))

if __name__ == "__main__":
    secret_key = generate_secret_key()
    print("=" * 60)
    print("Generated Django SECRET_KEY:")
    print("=" * 60)
    print(secret_key)
    print("=" * 60)
    print("\nAdd this to your .env file:")
    print(f"SECRET_KEY={secret_key}")
    print("=" * 60)
