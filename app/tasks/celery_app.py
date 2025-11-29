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


# New task: send email with file fetched from MinIO
@celery_app.task(bind=True, name='send_certificate_email_from_minio')
def send_certificate_email_from_minio(self, recipient_email: str, minio_object_key: str, filename: str = 'certificate.pdf'):
    """Background task to fetch a certificate from MinIO and send it via SMTP.

    Args:
        recipient_email: email address to send to
        minio_object_key: object key in MinIO (e.g., 'batchid/John_123.pdf' or 'templates/..')
        filename: filename for attachment
    """
    try:
        from app.services.email_service import EmailService

        email_service = EmailService()

        subject = "Your certificate"
        body = "Hello,\n\nPlease find your certificate attached.\n\nBest regards"

        ok = email_service.send_email_with_certificate(
            to_email=recipient_email,
            subject=subject,
            body_text=body,
            minio_object_name=minio_object_key,
            filename_for_user=filename,
        )

        if not ok:
            raise Exception("Failed to send email via EmailService")

        return {"status": "sent", "email": recipient_email}
    except Exception as exc:
        # retry with exponential backoff
        raise self.retry(exc=exc, countdown=60, max_retries=3)