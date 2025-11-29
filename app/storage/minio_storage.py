import io
import logging
import os
from urllib.parse import urlparse
from typing import Optional

from minio import Minio
from minio.error import S3Error

logger = logging.getLogger(__name__)


class MinIOStorage:
    def __init__(self):
        self.url = os.getenv('MINIO_URL', 'http://minio:9000')
        self.access_key = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
        self.secret_key = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
        self.bucket = os.getenv('MINIO_BUCKET', 'certificates')

        parsed = urlparse(self.url)
        # Minio client expects endpoint without schema
        endpoint = parsed.netloc or parsed.path
        secure = parsed.scheme == 'https'

        self.client = Minio(
            endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=secure,
        )

        # Ensure bucket exists
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Created MinIO bucket: {self.bucket}")
            else:
                logger.info(f"MinIO bucket exists: {self.bucket}")
        except S3Error as e:
            logger.error(f"Error ensuring MinIO bucket: {e}")
            raise

    def upload_template(self, template_id: str, content: bytes, object_name: Optional[str] = None) -> str:
        """Upload template content bytes to MinIO and return object path.

        Stores under: templates/{template_id}/{object_name}
        If object_name is None, uses 'template.html'.
        Returns the object key (templates/...).
        """
        if object_name is None:
            object_name = 'template.html'

        key = f"templates/{template_id}/{object_name}"
        data = io.BytesIO(content)
        data.seek(0)
        try:
            self.client.put_object(self.bucket, key, data, length=len(content), content_type='text/html')
            logger.info(f"Uploaded template to MinIO: {key}")
            return key
        except S3Error as e:
            logger.error(f"Failed to upload template to MinIO: {e}")
            raise

    def get_object_url(self, object_key: str) -> str:
        # Return a simple HTTP URL to the object; depends on MinIO external access
        # MINIO_URL contains scheme+host; combine with bucket and object
        return f"{self.url}/{self.bucket}/{object_key}"
