from pydantic import BaseModel, Field
from typing import Optional, List


class ParticipantCreate(BaseModel):
    """Create participant request."""
    full_name: str = Field(..., description="Participant full name")
    email: str = Field(..., description="Participant email")
    role: str = Field(default="participant", description="Participant role")
    place: Optional[int] = Field(None, description="Prize place (1, 2, 3)")

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "email": "john@example.com",
                "role": "participant",
                "place": None
            }
        }


class ParticipantResponse(BaseModel):
    """Participant response."""
    id: str = Field(..., description="Participant ID")
    full_name: str = Field(..., description="Participant full name")
    email: str = Field(..., description="Participant email")
    role: str = Field(..., description="Participant role")
    place: Optional[int] = Field(None, description="Prize place")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "full_name": "John Doe",
                "email": "john@example.com",
                "role": "participant",
                "place": None
            }
        }


class ParticipantListResponse(BaseModel):
    """List of participants response."""
    participants: List[ParticipantResponse] = Field(..., description="List of participants")
    total: int = Field(..., description="Total participant count")

    class Config:
        json_schema_extra = {
            "example": {
                "participants": [],
                "total": 0
            }
        }


class UploadResponse(BaseModel):
    """File upload response."""
    success: bool = Field(..., description="Upload success status")
    count: int = Field(..., description="Number of participants uploaded")
    participants: List[ParticipantResponse] = Field(default_factory=list, description="Uploaded participants")
    errors: Optional[List[str]] = Field(default_factory=list, description="Upload errors")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "count": 2,
                "participants": [],
                "errors": []
            }
        }
