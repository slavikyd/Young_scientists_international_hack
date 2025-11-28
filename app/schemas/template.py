from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime


class TemplateType(str, Enum):
    HTML = "html"
    SVG = "svg"


class TemplateCreate(BaseModel):
    """Schema for creating a template."""
    name: str = Field(..., min_length=1, max_length=255)
    type: TemplateType
    content: str = Field(..., description="Template content (HTML or SVG)")
    variables: List[str] = Field(default_factory=list, description="Variable placeholders")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "HTML Certificate",
                "type": "html",
                "content": "<html><body><h1>Certificate for {{name}}</h1></body></html>",
                "variables": ["name", "role", "date"]
            }
        }


class TemplateUpdate(BaseModel):
    """Schema for updating a template."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    variables: Optional[List[str]] = None


class TemplateResponse(TemplateCreate):
    """Schema for template responses."""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "template-001",
                "name": "HTML Certificate",
                "type": "html",
                "content": "<html><body><h1>Certificate for {{name}}</h1></body></html>",
                "variables": ["name", "role", "date"],
                "created_at": "2024-11-28T12:00:00Z",
                "updated_at": None
            }
        }


class TemplateListResponse(BaseModel):
    """Response for listing templates."""
    templates: List[TemplateResponse]
    total: int = Field(..., ge=0)