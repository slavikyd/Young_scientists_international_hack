from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CertificateMetadata(BaseModel):
    """Certificate-level metadata (not participant-specific)."""
    event_name: str = Field(..., description="Name of the event")
    issue_date: datetime = Field(..., description="Certificate issue date")
    event_location: Optional[str] = None
    organizer: Optional[str] = None


class GenerateRequest(BaseModel):
    """Request for certificate generation."""
    template_id: str
    metadata: Optional[CertificateMetadata] = None
    send_email: bool = Field(default=True, description="Send certificates via email")
    include_ids: Optional[List[str]] = None  # If None, generate for all participants

    class Config:
        json_schema_extra = {
            "example": {
                "template_id": "template-001",
                "metadata": {
                    "event_name": "Annual Science Conference 2024",
                    "issue_date": "2024-11-28T00:00:00Z",
                    "event_location": "Sirius Federal Territory",
                    "organizer": "Sirius"
                },
                "send_email": True,
                "include_ids": None
            }
        }


class GenerateResponse(BaseModel):
    """Response for certificate generation."""
    success: bool
    certificates_generated: int
    failed_count: int = 0
    download_url: Optional[str] = None
    task_id: Optional[str] = None  # If async
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "certificates_generated": 15,
                "failed_count": 0,
                "download_url": "/downloads/certificates_20241128.zip",
                "task_id": None,
                "message": "Certificates generated successfully"
            }
        }


class PreviewResponse(BaseModel):
    """Response for certificate preview."""
    html_content: str = Field(..., description="Rendered HTML for preview")
    participant_id: str
    template_id: str