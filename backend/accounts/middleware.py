"""
Custom middleware for handling rate limiting and security features
"""
from django.http import JsonResponse
from django_ratelimit.exceptions import Ratelimited


class RateLimitMiddleware:
    """
    Middleware to handle rate limit exceptions and return proper JSON responses
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if isinstance(exception, Ratelimited):
            return JsonResponse({
                'error': 'Too many requests',
                'detail': 'You have exceeded the rate limit. Please try again later.',
                'retry_after': '5 minutes'
            }, status=429)
        return None
