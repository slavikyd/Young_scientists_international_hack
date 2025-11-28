import uuid
from typing import List, Optional
from datetime import datetime
import logging
import json
from pathlib import Path

from app.storage.redis_storage import TemplateRedisStorage, get_redis
from app.config import get_settings
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateType


logger = logging.getLogger(__name__)
settings = get_settings()


class TemplateService:
    """Service for managing certificate templates."""
    
    def __init__(self):
        self.storage = TemplateRedisStorage(get_redis())
        self.templates_dir = Path(settings.TEMPLATES_DIR)
        self.templates_dir.mkdir(parents=True, exist_ok=True)
    
    async def create_template(self, template_data: TemplateCreate) -> dict:
        """Create new template."""
        template_id = str(uuid.uuid4())
        
        # Save template content to file
        file_path = self._get_template_file_path(template_id, template_data.type)
        file_path.write_text(template_data.content, encoding='utf-8')
        
        # Save metadata to Redis
        metadata = {
            "id": template_id,
            "name": template_data.name,
            "type": template_data.type,
            "variables": template_data.variables,
            "file_path": str(file_path),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": None
        }
        
        await self.storage.save(template_id, metadata)
        logger.info(f"Created template {template_id}: {template_data.name}")
        
        return metadata
    
    async def get_template(self, template_id: str) -> Optional[dict]:
        """Get template by ID."""
        metadata = await self.storage.get(template_id)
        if not metadata:
            return None
        
        # Load content from file
        file_path = Path(metadata.get('file_path'))
        if file_path.exists():
            metadata['content'] = file_path.read_text(encoding='utf-8')
        
        return metadata
    
    async def get_all_templates(self) -> List[dict]:
        """Get all templates."""
        all_metadata = await self.storage.get_all()
        
        # Load content for each template
        templates = []
        for metadata in all_metadata:
            file_path = Path(metadata.get('file_path'))
            if file_path.exists():
                metadata['content'] = file_path.read_text(encoding='utf-8')
            templates.append(metadata)
        
        return templates
    
    async def update_template(self, template_id: str, update_data: TemplateUpdate) -> Optional[dict]:
        """Update template."""
        metadata = await self.storage.get(template_id)
        if not metadata:
            return None
        
        # Update content if provided
        if update_data.content:
            file_path = Path(metadata.get('file_path'))
            file_path.write_text(update_data.content, encoding='utf-8')
        
        # Update metadata
        if update_data.name:
            metadata['name'] = update_data.name
        if update_data.variables is not None:
            metadata['variables'] = update_data.variables
        
        metadata['updated_at'] = datetime.utcnow().isoformat()
        
        await self.storage.save(template_id, metadata)
        logger.info(f"Updated template {template_id}")
        
        return metadata
    
    async def delete_template(self, template_id: str) -> bool:
        """Delete template."""
        metadata = await self.storage.get(template_id)
        if not metadata:
            return False
        
        # Delete file
        file_path = Path(metadata.get('file_path'))
        if file_path.exists():
            file_path.unlink()
        
        # Delete metadata
        result = await self.storage.delete(template_id)
        if result:
            logger.info(f"Deleted template {template_id}")
        
        return result
    
    @staticmethod
    def _get_template_file_path(template_id: str, template_type: TemplateType) -> Path:
        """Get file path for template."""
        extension = '.html' if template_type == TemplateType.HTML else '.svg'
        return Path(settings.TEMPLATES_DIR) / f"{template_id}{extension}"