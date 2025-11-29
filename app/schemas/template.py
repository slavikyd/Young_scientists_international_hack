from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TemplateCreate(BaseModel):
    """Create template request."""
    name: str = Field(..., description="Template name")
    type: str = Field(default="html", description="Template type: html or svg")
    content: str = Field(..., description="Template HTML/SVG content")
    variables: Optional[List[str]] = Field(default_factory=list, description="Template variables")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Certificate Template",
                "type": "html",
                "content": "<html>...</html>",
                "variables": ["name", "event_name"]
            }
        }


class TemplateUpdate(BaseModel):
    """Update template request."""
    name: Optional[str] = Field(None, description="Template name")
    content: Optional[str] = Field(None, description="Template content")
    variables: Optional[List[str]] = Field(None, description="Template variables")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Updated Certificate",
                "content": "<html>...</html>",
                "variables": ["name", "place"]
            }
        }


class TemplateResponse(BaseModel):
    """Template response - metadata only (no content)."""
    id: str = Field(..., description="Template ID")
    name: str = Field(..., description="Template name")
    type: str = Field(..., description="Template type")
    variables: Optional[List[str]] = Field(default_factory=list, description="Template variables")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Certificate Template",
                "type": "html",
                "variables": ["name", "event_name"],
                "created_at": "2024-11-28T10:00:00",
                "updated_at": None
            }
        }


class TemplateListResponse(BaseModel):
    """List of templates response."""
    templates: List[TemplateResponse] = Field(..., description="List of templates")
    total: int = Field(..., description="Total template count")

    class Config:
        json_schema_extra = {
            "example": {
                "templates": [],
                "total": 0
            }
        }