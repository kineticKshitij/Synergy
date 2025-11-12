"""
Celery tasks for webhook delivery
"""
from celery import shared_task
from django.utils import timezone
from django.conf import settings
import requests
import hmac
import hashlib
import json
import time
from datetime import timedelta


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def deliver_webhook(self, webhook_id, event_type, payload):
    """
    Deliver webhook notification to configured URL
    
    Args:
        webhook_id: UUID of the webhook
        event_type: Type of event (e.g., 'project.created')
        payload: Event data to send
    """
    from .models import Webhook, WebhookDelivery
    
    try:
        webhook = Webhook.objects.get(id=webhook_id, is_active=True)
    except Webhook.DoesNotExist:
        return {'error': 'Webhook not found or inactive'}
    
    # Create delivery record
    delivery = WebhookDelivery.objects.create(
        webhook=webhook,
        event_type=event_type,
        payload=payload,
        status='pending'
    )
    
    try:
        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'SynergyOS-Webhook/1.0',
            'X-Webhook-Event': event_type,
            'X-Webhook-Delivery': str(delivery.id),
            'X-Webhook-Timestamp': str(int(time.time())),
        }
        
        # Add HMAC signature if secret is configured
        if webhook.secret:
            payload_bytes = json.dumps(payload).encode('utf-8')
            signature = hmac.new(
                webhook.secret.encode('utf-8'),
                payload_bytes,
                hashlib.sha256
            ).hexdigest()
            headers['X-Webhook-Signature'] = f'sha256={signature}'
        
        # Send request
        start_time = time.time()
        response = requests.post(
            webhook.url,
            json=payload,
            headers=headers,
            timeout=30  # 30 second timeout
        )
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Update delivery record
        delivery.status = 'success' if response.status_code < 400 else 'failed'
        delivery.response_status_code = response.status_code
        delivery.response_body = response.text[:1000]  # Store first 1000 chars
        delivery.delivered_at = timezone.now()
        delivery.duration_ms = duration_ms
        delivery.save()
        
        # Update webhook statistics
        webhook.increment_delivery_stats(success=(response.status_code < 400))
        
        # Retry if failed
        if response.status_code >= 400:
            raise Exception(f"HTTP {response.status_code}: {response.text[:200]}")
        
        return {
            'success': True,
            'status_code': response.status_code,
            'duration_ms': duration_ms
        }
        
    except Exception as exc:
        # Update delivery record with error
        delivery.status = 'failed'
        delivery.error_message = str(exc)[:1000]
        delivery.retry_count += 1
        delivery.save()
        
        webhook.increment_delivery_stats(success=False)
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            delivery.status = 'retrying'
            delivery.next_retry_at = timezone.now() + timedelta(
                seconds=60 * (2 ** self.request.retries)
            )
            delivery.save()
            
            raise self.retry(exc=exc)
        
        return {
            'success': False,
            'error': str(exc),
            'retries': self.request.retries
        }


@shared_task
def trigger_webhook_event(event_type, payload, user_id=None):
    """
    Trigger all webhooks subscribed to a specific event
    
    Args:
        event_type: Type of event (e.g., 'project.created')
        payload: Event data
        user_id: Optional user ID to filter webhooks (if None, triggers for all users)
    """
    from .models import Webhook
    
    # Find active webhooks subscribed to this event
    webhooks = Webhook.objects.filter(is_active=True)
    
    if user_id:
        webhooks = webhooks.filter(user_id=user_id)
    
    # Filter by event type
    triggered_count = 0
    for webhook in webhooks:
        # Check if webhook is subscribed to this event
        if '*' in webhook.events or event_type in webhook.events:
            deliver_webhook.delay(str(webhook.id), event_type, payload)
            triggered_count += 1
    
    return {
        'event_type': event_type,
        'triggered_webhooks': triggered_count
    }


@shared_task
def cleanup_expired_webhooks():
    """
    Periodic task to clean up old webhook delivery records
    Keeps records for 30 days
    """
    from .models import WebhookDelivery
    
    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count, _ = WebhookDelivery.objects.filter(
        created_at__lt=cutoff_date
    ).delete()
    
    return {
        'deleted_count': deleted_count,
        'cutoff_date': cutoff_date.isoformat()
    }


@shared_task
def test_webhook(webhook_id):
    """
    Send a test webhook delivery
    
    Args:
        webhook_id: UUID of the webhook to test
    """
    test_payload = {
        'event': 'webhook.test',
        'message': 'This is a test webhook from SynergyOS',
        'timestamp': timezone.now().isoformat(),
        'data': {
            'test': True,
            'success': True
        }
    }
    
    return deliver_webhook.delay(webhook_id, 'webhook.test', test_payload)
