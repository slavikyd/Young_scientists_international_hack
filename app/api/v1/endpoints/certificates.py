from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
import logging
import io
from datetime import datetime


from app.services.certificate_service import CertificateService
from app.schemas.certificate import (
    GenerateRequest,
    GenerateResponse,
    PreviewResponse,
    CertificateMetadata
)

import zipfile
import io
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/certificates")
# Then add this NEW route:
@router.get("/download/{batch_id}")
async def download_certificates(batch_id: str):
    """Download certificates as ZIP file."""
    try:
        logger.info(f"📦 Download requested for batch: {batch_id}")
        
        from app.storage.minio_storage import MinIOStorage
        minio = MinIOStorage()
        
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            objects = minio.client.list_objects(
                'certificates',
                prefix=f'{batch_id}/',
                recursive=True
            )
            
            for obj in objects:
                response = minio.client.get_object('certificates', obj.object_name)
                file_data = response.read()
                filename = obj.object_name.split('/')[-1]
                zf.writestr(filename, file_data)
        
        zip_buffer.seek(0)
        logger.info(f"✅ ZIP ready: {zip_buffer.getbuffer().nbytes} bytes")
        
        return StreamingResponse(
    iter([zip_buffer.getvalue()]),
    media_type="application/zip",
    headers={"Content-Disposition": f"attachment; filename=certificates_{batch_id}.zip"}
)

        
    except Exception as e:
        logger.error(f"❌ Download error: {e}", exc_info=True)
        raise





def get_certificate_service() -> CertificateService:
    """Dependency for certificate service."""
    return CertificateService()



@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Generate certificates for participants"
)
async def generate_certificates(
    request: GenerateRequest,
    service: CertificateService = Depends(get_certificate_service)
):
    """
    Generate PDF certificates for all participants using template.
    
    Args:
        request: Certificate generation request with:
            - template_id: Template to use
            - event_name: Event name
            - event_location: Event location
            - issue_date: Certificate issue date
            - send_email: Whether to email certificates
    """
    try:
        logger.info(f"📨 Certificate generation request received: {request.dict()}")
        
        # Generate certificates for all participants
        result = await service.generate_certificates(
            template_id=request.template_id,
            event_name=request.event_name,
            event_location=request.event_location,
            issue_date=request.issue_date
        )
        
        # TODO: If send_email is True, queue Celery tasks for each participant
        if request.send_email:
            logger.info("Email sending queued for certificates")
        
        return GenerateResponse(
    status="success",
    count=result.get('count', 0),
    batch_id=result.get('batch_id'),  # ✅ ADD THIS LINE
    message=result.get('message'),
    errors=result.get('errors')
)

    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating certificates: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate certificates"
        )



@router.get(
    "/download",
    summary="Download all certificates as ZIP"
)
async def download_certificates(
    service: CertificateService = Depends(get_certificate_service)
):
    """
    Download all generated certificates as ZIP file.
    
    Returns a ZIP file containing all PDFs from the last generation.
    """
    try:
        # Get ZIP of all certificates
        zip_bytes = await service.get_certificates_zip()
        
        # Return as downloadable ZIP
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=certificates.zip"}
        )
    
    except Exception as e:
        logger.error(f"Error downloading certificates: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to download certificates"
        )



@router.delete(
    "/cleanup",
    summary="Delete all generated certificates"
)
async def cleanup_certificates(
    service: CertificateService = Depends(get_certificate_service)
):
    """Delete all generated certificate files."""
    try:
        count = await service.cleanup_certificates()
        
        return {
            "success": True,
            "deleted_count": count,
            "message": f"Deleted {count} certificate files"
        }
    except Exception as e:
        logger.error(f"Error cleaning up certificates: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to cleanup certificates"
        )