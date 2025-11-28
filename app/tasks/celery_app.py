from celery import Celery
from app.config import get_settings

settings = get_settings()

# Configure Celery
celery_app = Celery(
    "certificate_service",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Configuration
celery_app.conf.update(
    task_serializer=settings.CELERY_TASK_SERIALIZER,
    accept_content=settings.CELERY_ACCEPT_CONTENT,
    result_serializer=settings.CELERY_RESULT_SERIALIZER,
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    worker_max_tasks_per_child=1000,
)


# Example task for future use
@celery_app.task(bind=True, name='send_certificate_email')
def send_certificate_email_task(self, participant_email: str, certificate_pdf: bytes):
    """
    Send certificate via email.
    
    This is for future implementation with async email sending.
    For now, synchronous email sending is used directly in routes.
    """
    try:
        # TODO: Implement email sending logic
        return {
            "status": "sent",
            "email": participant_email
        }
    except Exception as e:
        # Retry up to 3 times with exponential backoff
        raise self.retry(exc=e, countdown=60, max_retries=3)