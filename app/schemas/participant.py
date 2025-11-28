from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum


class ParticipantRole(str, Enum):
    PARTICIPANT = "participant"
    SPEAKER = "speaker"
    WINNER = "winner"
    PRIZE_WINNER = "prize_winner"


class ParticipantPlace(int, Enum):
    FIRST = 1
    SECOND = 2
    THIRD = 3


class ParticipantCreate(BaseModel):
    """Schema for creating a participant."""
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    role: ParticipantRole
    place: Optional[ParticipantPlace] = None

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "email": "john@example.com",
                "role": "participant",
                "place": None
            }
        }


class ParticipantResponse(ParticipantCreate):
    """Schema for participant responses."""
    id: str = Field(..., description="Unique participant identifier")
    
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
    """Response for listing participants."""
    participants: List[ParticipantResponse]
    total: int = Field(..., ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "participants": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "full_name": "John Doe",
                        "email": "john@example.com",
                        "role": "participant",
                        "place": None
                    }
                ],
                "total": 1
            }
        }


class UploadResponse(BaseModel):
    """Response for file upload."""
    success: bool
    count: int = Field(..., ge=0, description="Number of participants parsed")
    participants: List[ParticipantResponse]
    errors: List[str] = Field(default_factory=list, description="Parsing errors if any")