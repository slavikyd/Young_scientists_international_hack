import os
import uuid
from typing import Optional, List
from datetime import datetime, timedelta
import logging
import zipfile
import io
from minio import Minio
from minio.error import S3Error
import redis.asyncio as aioredis


from app.schemas.certificate import CertificateGenerateRequest, CertificateResponse
from app.storage.redis_storage import RedisStorage
from app.utils.exceptions import NotFoundError, PDFGenerationError
from app.utils.pdf_generator import generate_pdf_from_html


logger = logging.getLogger(__name__)


# MinIO configuration
MINIO_URL = os.getenv('MINIO_URL', 'http://minio:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
MINIO_BUCKET = os.getenv('MINIO_BUCKET', 'certificates')

# Redis key for storing current batch ID
REDIS_BATCH_KEY = "certificate:current_batch_id"


class CertificateService:
    """Service for certificate generation with MinIO storage."""

    def __init__(self):
        self.storage = RedisStorage()
        self.minio_client = Minio(
            MINIO_URL.replace('http://', '').replace('https://', ''),
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False
        )
        self._ensure_bucket()

    def _ensure_bucket(self):
        """Create bucket if it doesn't exist."""
        try:
            if not self.minio_client.bucket_exists(MINIO_BUCKET):
                self.minio_client.make_bucket(MINIO_BUCKET)
                logger.info(f"Created MinIO bucket: {MINIO_BUCKET}")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            raise

    async def _get_redis(self):
        from app.storage.redis_storage import get_redis
        return await get_redis()  # ← CORRECT


    async def _store_batch_id(self, batch_id: str):
        """Store batch ID in Redis."""
        redis = await self._get_redis()
        await redis.set(REDIS_BATCH_KEY, batch_id, ex=3600)  # Expires in 1 hour
        logger.info(f"Stored batch ID in Redis: {batch_id}")

    async def _get_batch_id(self) -> Optional[str]:
        """Retrieve batch ID from Redis."""
        redis = await self._get_redis()
        batch_id = await redis.get(REDIS_BATCH_KEY)
        # Redis client with decode_responses=True returns str, not bytes
        return batch_id if batch_id else None

    async def _clear_batch_id(self):
        """Clear batch ID from Redis."""
        redis = await self._get_redis()
        await redis.delete(REDIS_BATCH_KEY)
        logger.info("Cleared batch ID from Redis")

    async def generate_certificates(self, template_id: str, event_name: str, event_location: str, issue_date: str) -> dict:
        """
        Generate certificates for all participants using template.
        
        Stores PDFs in MinIO bucket, organized by batch ID.
        Batch ID is stored in Redis for access across requests.
        
        Args:
            template_id: Template ID to use
            event_name: Name of event
            event_location: Location of event
            issue_date: Date to issue certificates
            
        Returns:
            Dict with generation result
        """
        try:
            logger.info(f"Starting certificate generation with template: {template_id}")
            
            # Get template
            template = await self.storage.get_template(template_id)
            logger.info(f"Template lookup result: {template}")
            
            if not template:
                logger.error(f"Template not found in storage: {template_id}")
                raise NotFoundError(f"Template {template_id} not found")

            # Load template content from file
            template_path = template.get('content_path')
            logger.info(f"Template path: {template_path}")
            
            if not template_path or not os.path.exists(template_path):
                logger.error(f"Template file not accessible: {template_path}")
                raise NotFoundError(f"Template file not found: {template_path}")

            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()

            logger.info(f"Loaded template: {template_id} ({len(template_content)} bytes)")

            # Get all participants
            participants = await self.storage.get_all_participants()
            logger.info(f"Found {len(participants)} participants")
            
            if not participants:
                logger.warning("No participants found")
                return {
                    "status": "warning",
                    "message": "No participants found",
                    "count": 0,
                    "errors": []
                }

            # ✅ CREATE UNIQUE BATCH ID FOR THIS GENERATION
            batch_id = str(uuid.uuid4())[:8]
            logger.info(f"Created batch ID: {batch_id}")

            # Generate PDFs and upload to MinIO
            uploaded_count = 0
            errors = []

            for participant in participants:
                try:
                    # Prepare variables for template rendering
                    variables = {
                        'name': participant.get('full_name', 'Unknown'),
                        'email': participant.get('email', ''),
                        'role': participant.get('role', 'participant'),
                        'place': participant.get('place'),
                        'event_name': event_name,
                        'event_location': event_location,
                        'issue_date': issue_date,
                    }

                    # Generate PDF in memory
                    pdf_content = generate_pdf_from_html(template_content, variables)

                    # Create object name in MinIO
                    safe_name = participant.get('full_name', 'certificate').replace(' ', '_')
                    object_name = f"{batch_id}/{safe_name}_{participant['id'][:8]}.pdf"

                    # Upload to MinIO
                    self.minio_client.put_object(
                        MINIO_BUCKET,
                        object_name,
                        io.BytesIO(pdf_content),
                        length=len(pdf_content),
                        content_type='application/pdf'
                    )

                    uploaded_count += 1
                    logger.info(f"Uploaded certificate to MinIO: {object_name}")

                except Exception as e:
                    logger.error(f"Error generating certificate for {participant.get('full_name')}: {e}")
                    errors.append(f"{participant.get('full_name')}: {str(e)}")
                    continue

            if uploaded_count == 0:
                logger.error(f"Failed to generate any certificates. Errors: {errors}")
                raise PDFGenerationError(f"Failed to generate any certificates. Errors: {errors}")

            # ✅ STORE BATCH ID IN REDIS SO DOWNLOAD REQUEST CAN ACCESS IT
            await self._store_batch_id(batch_id)

            logger.info(f"Successfully generated {uploaded_count} certificates in batch {batch_id}")

            return {
                "status": "success",
                "count": uploaded_count,
                "message": f"Generated {uploaded_count} certificates",
                "errors": errors if errors else None
            }

        except Exception as e:
            logger.error(f"Error generating certificates: {e}", exc_info=True)
            raise

    async def get_certificates_zip(self) -> bytes:
        """
        Get all generated certificates from current batch as ZIP file.
        
        Downloads PDFs from MinIO using batch ID from Redis,
        creates ZIP in memory, then deletes from MinIO.
        
        Returns:
            ZIP file content as bytes
        """
        try:
            # ✅ RETRIEVE BATCH ID FROM REDIS
            batch_id = await self._get_batch_id()
            if not batch_id:
                raise NotFoundError("No certificates generated in current session")

            logger.info(f"Creating ZIP for batch: {batch_id}")

            # Create ZIP in memory
            zip_buffer = io.BytesIO()
            files_added = 0

            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # List all objects in batch
                objects = self.minio_client.list_objects(
                    MINIO_BUCKET,
                    prefix=f"{batch_id}/",
                    recursive=True
                )

                for obj in objects:
                    try:
                        # Download PDF from MinIO
                        response = self.minio_client.get_object(MINIO_BUCKET, obj.object_name)
                        pdf_content = response.read()
                        
                        # Add to ZIP with just filename (not full path)
                        filename = obj.object_name.split('/')[-1]
                        zip_file.writestr(filename, pdf_content)
                        files_added += 1
                        
                        logger.debug(f"Added to ZIP: {filename}")
                    except S3Error as e:
                        logger.error(f"Error downloading {obj.object_name}: {e}")
                        continue

            if files_added == 0:
                raise NotFoundError("No certificates found in batch")

            zip_buffer.seek(0)
            zip_bytes = zip_buffer.getvalue()
            
            logger.info(f"ZIP created with {files_added} files: {len(zip_bytes)} bytes")
            
            # ✅ CLEANUP: Delete batch from MinIO after creating ZIP
            await self._cleanup_batch(batch_id)
            
            return zip_bytes

        except Exception as e:
            logger.error(f"Error creating certificates ZIP: {e}")
            raise

    async def _cleanup_batch(self, batch_id: str):
        """Delete all PDFs in batch from MinIO."""
        try:
            if not batch_id:
                return

            logger.info(f"Cleaning up batch {batch_id} from MinIO")

            # List and delete all objects in batch
            objects = self.minio_client.list_objects(
                MINIO_BUCKET,
                prefix=f"{batch_id}/",
                recursive=True
            )

            delete_object_list = [obj.object_name for obj in objects]
            
            if delete_object_list:
                errors = self.minio_client.remove_objects(MINIO_BUCKET, delete_object_list)
                for error in errors:
                    logger.warning(f"Error deleting {error.object_name}: {error}")
                
                logger.info(f"Deleted {len(delete_object_list)} objects from MinIO")
            
            # ✅ CLEAR BATCH ID FROM REDIS
            await self._clear_batch_id()

        except Exception as e:
            logger.warning(f"Failed to cleanup batch from MinIO: {e}")

    async def cleanup_certificates(self) -> int:
        """Delete all certificates from MinIO (emergency cleanup)."""
        try:
            logger.info("Starting emergency cleanup of all certificates from MinIO")

            objects = self.minio_client.list_objects(MINIO_BUCKET, recursive=True)
            delete_list = [obj.object_name for obj in objects]

            if delete_list:
                errors = self.minio_client.remove_objects(MINIO_BUCKET, delete_list)
                for error in errors:
                    logger.warning(f"Error deleting {error.object_name}: {error}")
                
                logger.info(f"Deleted {len(delete_list)} objects from MinIO")
                return len(delete_list)

            return 0

        except Exception as e:
            logger.error(f"Error cleaning up certificates: {e}")
            raise