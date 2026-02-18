from django.http import HttpResponseForbidden
from django.conf import settings


class AdminIPRestrictionMiddleware:
    """
    Middleware to restrict Django admin access to localhost only (127.0.0.1)
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if request is for admin panel
        if request.path.startswith('/admin/'):
            # Get client IP address
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                # If behind proxy, get the first IP
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')
            
            # Allow only localhost (127.0.0.1 or ::1 for IPv6)
            allowed_ips = ['127.0.0.1', '::1', 'localhost']
            
            if ip not in allowed_ips:
                return HttpResponseForbidden(
                    '<h1>403 Forbidden</h1>'
                    '<p>Admin access is restricted to localhost only.</p>'
                )
        
        response = self.get_response(request)
        return response
