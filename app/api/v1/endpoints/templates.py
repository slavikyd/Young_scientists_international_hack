from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
import logging

from app.services.template_service import TemplateService
from app.schemas.template import TemplateCreate, TemplateResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/templates")


def get_template_service() -> TemplateService:
    return TemplateService()


@router.post("/upload-zip", response_model=TemplateResponse)
async def upload_template_zip(
    file: UploadFile = File(...),
    name: str = Form(...),
    service: TemplateService = Depends(get_template_service)
):
    try:
        logger.info(f"Uploading ZIP: {file.filename}")
        zip_content = await file.read()
        template = await service.upload_template_zip(zip_content, name)
        return TemplateResponse(**template)
    except Exception as e:
        logger.error(f"Error uploading ZIP: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("", response_model=TemplateResponse)
@router.post("/", response_model=TemplateResponse)
async def create_template(
    request: TemplateCreate,
    service: TemplateService = Depends(get_template_service)
):
    try:
        logger.info(f"Creating template: {request.name}")
        template = await service.create_template(
            name=request.name,
            content=request.content,
            template_type=request.type
        )
        return TemplateResponse(**template)
    except Exception as e:
        logger.error(f"Error creating template: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list)
@router.get("/", response_model=list)
async def get_all_templates(
    service: TemplateService = Depends(get_template_service)
):
    try:
        templates = await service.get_all_templates()
        if not templates:
            logger.info("No templates found")
            return []
        logger.info(f"Found {len(templates)} templates")
        return [TemplateResponse(**t) for t in templates]
    except Exception as e:
        logger.error(f"Error getting templates: {e}", exc_info=True)
        return []


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    service: TemplateService = Depends(get_template_service)
):
    try:
        template = await service.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return TemplateResponse(**template)
    except Exception as e:
        logger.error(f"Error getting template: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    service: TemplateService = Depends(get_template_service)
):
    try:
        success = await service.delete_template(template_id)
        return {"success": success, "message": "Template deleted"}
    except Exception as e:
        logger.error(f"Error deleting template: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))