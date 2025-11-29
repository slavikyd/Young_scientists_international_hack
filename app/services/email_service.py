import io
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional

from minio import Minio
from minio.error import S3Error

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    """Service to fetch files from MinIO and send them via SMTP.

    Uses the project's MinIO client and SMTP settings from `app.config.get_settings()`.
    """

    def __init__(self):
        parsed_url = settings.MINIO_URL
        # Minio client expects endpoint without scheme
        endpoint = parsed_url.replace("http://", "").replace("https://", "")
        secure = parsed_url.startswith("https://")

        self.client = Minio(
            endpoint,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=secure,
        )

    def _get_file_from_minio(self, object_name: str) -> Optional[bytes]:
        """Download object bytes from MinIO. Returns bytes or None on error."""
        try:
            resp = self.client.get_object(settings.MINIO_BUCKET, object_name)
            data = resp.read()
            # Ensure we close the response
            try:
                resp.close()
                resp.release_conn()
            except Exception:
                pass
            return data
        except S3Error as e:
            logger.error(f"MinIO error getting object {object_name}: {e}")
            return None
        except Exception as e:
            logger.exception(f"Unexpected error getting object {object_name} from MinIO: {e}")
            return None

    def send_email_with_certificate(
        self,
        to_email: str,
        subject: str,
        body_text: str,
        minio_object_name: str,
        filename_for_user: str = "certificate.pdf",
    ) -> bool:
        """Fetch a file from MinIO and send it as an attachment via SMTP.

        Returns True on success, False on failure.
        """
        file_data = self._get_file_from_minio(minio_object_name)
        if not file_data:
            logger.error(f"Cannot send email to {to_email}: file not found in MinIO: {minio_object_name}")
            return False

        # Build MIME message
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body_text, 'plain'))

        attachment = MIMEApplication(file_data, Name=filename_for_user)
        attachment['Content-Disposition'] = f'attachment; filename="{filename_for_user}"'
        msg.attach(attachment)

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()

                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

                server.send_message(msg)
                logger.info(f"Email sent successfully to {to_email}")
                return True
        except Exception as e:
            logger.exception(f"Failed to send email to {to_email}: {e}")
            return False
