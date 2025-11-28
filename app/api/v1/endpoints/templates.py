from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging

from app.services.template_service import TemplateService
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/templates")


def get_template_service() -> TemplateService:
    """Dependency for template service."""
    return TemplateService()


@router.post(
    "",
    response_model=TemplateResponse,
    status_code=201,
    summary="Create new template"
)
async def create_template(
    template: TemplateCreate,
    service: TemplateService = Depends(get_template_service)
):
    """
    Create a new certificate template.
    
    Supported types: html, svg
    Content can include {{variable}} placeholders for templating.
    """
    try:
        result = await service.create_template(template)
        return result
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create template"
        )


@router.get(
    "",
    response_model=TemplateListResponse,
    summary="List all templates"
)
async def list_templates(
    service: TemplateService = Depends(get_template_service)
):
    """Get all certificate templates."""
    try:
        templates = await service.get_all_templates()
        return TemplateListResponse(
            templates=templates,
            total=len(templates)
        )
    except Exception as e:
        logger.error(f"Error listing templates: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve templates"
        )


@router.get(
    "/{template_id}",
    response_model=TemplateResponse,
    summary="Get template by ID"
)
async def get_template(
    template_id: str,
    service: TemplateService = Depends(get_template_service)
):
    """Get a specific template by ID."""
    try:
        template = await service.get_template(template_id)
        
        if not template:
            raise HTTPException(
                status_code=404,
                detail=f"Template {template_id} not found"
            )
        
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting template: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve template"
        )


@router.put(
    "/{template_id}",
    response_model=TemplateResponse,
    summary="Update template"
)
async def update_template(
    template_id: str,
    template: TemplateUpdate,
    service: TemplateService = Depends(get_template_service)
):
    """Update an existing template."""
    try:
        result = await service.update_template(template_id, template)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Template {template_id} not found"
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating template: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update template"
        )


@router.delete(
    "/{template_id}",
    summary="Delete template"
)
async def delete_template(
    template_id: str,
    service: TemplateService = Depends(get_template_service)
):
    """Delete a template."""
    try:
        success = await service.delete_template(template_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Template {template_id} not found"
            )
        
        return {
            "success": True,
            "message": f"Template {template_id} deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting template: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete template"
        )