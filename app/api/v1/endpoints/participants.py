from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import logging


from app.services.participant_service import ParticipantService
from app.schemas.participant import (
    ParticipantResponse,
    ParticipantListResponse,
    UploadResponse
)
from app.utils.exceptions import ValidationError



logger = logging.getLogger(__name__)
router = APIRouter(prefix="/participants")



def get_participant_service() -> ParticipantService:
    """Dependency for participant service."""
    return ParticipantService()



@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload participant CSV/XLSX file"
)
async def upload_participants(
    file: UploadFile = File(...),
    service: ParticipantService = Depends(get_participant_service)
):
    """
    Upload and parse CSV or XLSX file with participants.
    
    Required columns: full_name, email, role
    Optional columns: place
    """
    try:
        # Validate file extension
        if not file.filename.endswith(('.csv', '.xlsx')):
            raise HTTPException(
                status_code=400,
                detail="File must be CSV or XLSX format"
            )
        
        # Read file content
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="File is empty"
            )
        
        # Upload participants using the correct method
        result = await service.upload_participants(
            content,
            file.filename
        )
        
        # Get uploaded participants using correct method name
        participants = await service.get_participants()
        
        return UploadResponse(
            success=True,
            count=result.get('count', 0),
            participants=participants,
            errors=result.get('errors')
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {str(e)}"
        )



@router.get(
    "",
    response_model=ParticipantListResponse,
    summary="List all participants"
)
async def list_participants(
    service: ParticipantService = Depends(get_participant_service)
):
    """Get all uploaded participants."""
    try:
        participants = await service.get_participants()
        return ParticipantListResponse(
            participants=participants,
            total=len(participants)
        )
    except Exception as e:
        logger.error(f"Error listing participants: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve participants"
        )



@router.delete(
    "/{participant_id}",
    summary="Delete participant"
)
async def delete_participant(
    participant_id: str,
    service: ParticipantService = Depends(get_participant_service)
):
    """Delete participant by ID."""
    try:
        success = await service.delete_participant(participant_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Participant {participant_id} not found"
            )
        
        return {
            "success": True,
            "message": f"Participant {participant_id} deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting participant: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete participant"
        )