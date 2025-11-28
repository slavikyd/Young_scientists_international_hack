from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query
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
from app.config import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/certificates")


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
    Generate PDF certificates for participants.
    
    Returns a ZIP file containing all generated certificates.
    Failed generations are tracked and returned separately.
    """
    try:
        # Generate certificates
        zip_bytes, generated, failed = await service.generate_certificates(
            template_id=request.template_id,
            metadata=request.metadata.dict() if request.metadata else None,
            include_ids=request.include_ids
        )
        
        # TODO: If send_email is True, queue Celery tasks for each participant
        if request.send_email:
            logger.info(f"Email sending queued for {len(generated)} certificates")
        
        # Generate filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"certificates_{timestamp}.zip"
        
        # Store in session/temp for download
        # In production, you'd store this in a database or cache
        
        return GenerateResponse(
            success=True,
            certificates_generated=len(generated),
            failed_count=len(failed),
            download_url=f"/downloads/{filename}",
            message=f"Generated {len(generated)} certificates"
        )
    
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating certificates: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate certificates"
        )


@router.get(
    "/{participant_id}/preview",
    response_model=PreviewResponse,
    summary="Preview certificate for participant"
)
async def preview_certificate(
    participant_id: str,
    template_id: str = Query(...),
    service: CertificateService = Depends(get_certificate_service),
    event_name: str = Query(None),
    issue_date: str = Query(None),
):
    """
    Get HTML preview of certificate for a participant.
    
    Returns rendered HTML that can be displayed in an iframe.
    """
    try:
        # Build metadata from query params
        metadata = {}
        if event_name:
            metadata['event_name'] = event_name
        if issue_date:
            metadata['issue_date'] = issue_date
        
        html_content = await service.get_certificate_preview(
            participant_id=participant_id,
            template_id=template_id,
            metadata=metadata if metadata else None
        )
        
        return PreviewResponse(
            html_content=html_content,
            participant_id=participant_id,
            template_id=template_id
        )
    
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating preview: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate preview"
        )


@router.get(
    "/download/{filename}",
    summary="Download certificate ZIP file"
)
async def download_certificates(filename: str):
    """
    Download generated certificates ZIP file.
    
    Note: In production, implement proper file storage and cleanup.
    """
    try:
        # TODO: Implement proper file retrieval from storage
        # For now, this is a placeholder
        
        raise HTTPException(
            status_code=501,
            detail="Download endpoint not yet implemented. Store file from generation response."
        )
    
    except Exception as e:
        logger.error(f"Error downloading file: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to download file"
        )


# Health check for certificate service
@router.get(
    "/health",
    summary="Check certificate service health"
)
async def certificate_health(
    service: CertificateService = Depends(get_certificate_service)
):
    """Check if certificate generation service is working."""
    try:
        # Try to access template service
        templates = await service.template_service.get_all_templates()
        participants = await service.participant_service.get_all_participants()
        
        return {
            "status": "ok",
            "templates_count": len(templates),
            "participants_count": len(participants)
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Certificate service unhealthy"
        )
