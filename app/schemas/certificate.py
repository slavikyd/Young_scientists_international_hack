from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CertificateGenerateRequest(BaseModel):
    """Request to generate certificates."""
    template_id: str = Field(..., description="Template ID to use")
    event_name: str = Field(..., description="Event name")
    event_location: str = Field(..., description="Event location")
    issue_date: str = Field(..., description="Certificate issue date")
    send_email: bool = Field(default=False, description="Send certificates via email")

    class Config:
        json_schema_extra = {
            "example": {
                "template_id": "550e8400-e29b-41d4-a716-446655440000",
                "event_name": "Annual Science Conference 2024",
                "event_location": "Sirius Federal Territory",
                "issue_date": "2024-11-28",
                "send_email": False
            }
        }


class CertificateResponse(BaseModel):
    """Certificate response."""
    id: str = Field(..., description="Certificate ID")
    participant_id: str = Field(..., description="Participant ID")
    template_id: str = Field(..., description="Template ID used")
    status: str = Field(..., description="Generation status")
    created_at: datetime = Field(..., description="Creation timestamp")
    file_path: Optional[str] = Field(None, description="Path to generated PDF")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "participant_id": "550e8400-e29b-41d4-a716-446655440002",
                "template_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "completed",
                "created_at": "2024-11-28T10:00:00",
                "file_path": "/temp/certificates/john_doe.pdf"
            }
        }


class CertificateGenerateResponse(BaseModel):
    """Response for certificate generation request."""
    status: str = Field(..., description="Generation status: success, warning, error")
    count: int = Field(..., description="Number of certificates generated")
    message: Optional[str] = Field(None, description="Status message")
    errors: Optional[List[str]] = Field(default_factory=list, description="List of errors if any")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "count": 4,
                "message": None,
                "errors": []
            }
        }


class PreviewResponse(BaseModel):
    """Certificate preview response."""
    html_content: str = Field(..., description="Rendered HTML preview")
    participant_id: str = Field(..., description="Participant ID")
    template_id: str = Field(..., description="Template ID used")

    class Config:
        json_schema_extra = {
            "example": {
                "html_content": "<html>...</html>",
                "participant_id": "550e8400-e29b-41d4-a716-446655440001",
                "template_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class CertificateMetadata(BaseModel):
    """Certificate metadata."""
    id: str = Field(..., description="Certificate ID")
    participant_id: str = Field(..., description="Participant ID")
    template_id: str = Field(..., description="Template ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    file_path: Optional[str] = Field(None, description="PDF file path")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "participant_id": "550e8400-e29b-41d4-a716-446655440002",
                "template_id": "550e8400-e29b-41d4-a716-446655440000",
                "created_at": "2024-11-28T10:00:00",
                "file_path": "/temp/certificates/john_doe.pdf"
            }
        }


# ============ ALIASES FOR BACKWARDS COMPATIBILITY ============

GenerateRequest = CertificateGenerateRequest
GenerateResponse = CertificateGenerateResponse

__all__ = [
    'CertificateGenerateRequest',
    'CertificateResponse',
    'CertificateGenerateResponse',
    'PreviewResponse',
    'CertificateMetadata',
    'GenerateRequest',
    'GenerateResponse',
]