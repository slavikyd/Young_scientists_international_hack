import os
import uuid
import zipfile
import io
import base64
import logging
from pathlib import Path
from typing import Optional, Dict, Any


from app.storage.redis_storage import RedisStorage
from app.utils.exceptions import NotFoundError, ValidationError


logger = logging.getLogger(__name__)


TEMPLATES_DIR = os.getenv('TEMPLATES_DIR', './data/templates')


class TemplateService:
    """Service for managing certificate templates."""

    def __init__(self):
        self.storage = RedisStorage()
        os.makedirs(TEMPLATES_DIR, exist_ok=True)

    async def create_template(self, name: str, content: str, template_type: str = 'html') -> Dict[str, Any]:
        """
        Create a new template.
        
        Args:
            name: Template name (supports Cyrillic)
            content: HTML/template content (UTF-8)
            template_type: Type of template ('html')
            
        Returns:
            Template metadata
        """
        try:
            logger.info(f"Creating template: {name}")
            
            template_id = str(uuid.uuid4())
            template_path = os.path.join(TEMPLATES_DIR, f"{template_id}.html")
            
            # Write template with UTF-8 encoding (Cyrillic support!)
            with open(template_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Store metadata in Redis
            template_metadata = {
                'id': template_id,
                'name': name,  # UTF-8 Cyrillic name
                'type': template_type,
                'content_path': template_path,
                'variables': [],
                'created_at': str(os.path.getctime(template_path)),
                'updated_at': None
            }
            
            await self.storage.save_template(template_id, template_metadata)

            
            logger.info(f"Template created: {template_id}")
            return template_metadata
            
        except Exception as e:
            logger.error(f"Error creating template: {e}")
            raise

    async def upload_template_zip(self, zip_bytes: bytes, template_name: str) -> Dict[str, Any]:
        """
        Upload a ZIP archive containing HTML template and images.
        
        ZIP structure:
        - template.html (main template file - UTF-8 with Cyrillic support)
        - images/ (or any folder with images)
            - logo.png
            - background.jpg
            - etc.
        
        Args:
            zip_bytes: ZIP file content
            template_name: Name for this template
            
        Returns:
            Template metadata with image mapping
        """
        try:
            logger.info(f"Processing template ZIP: {template_name}")
            
            # Extract ZIP
            zip_buffer = io.BytesIO(zip_bytes)
            with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
                # List contents
                file_list = zip_file.namelist()
                logger.info(f"ZIP contents: {file_list}")
                
                # Find template HTML
                template_files = [f for f in file_list if f.lower().endswith('.html')]
                if not template_files:
                    raise ValidationError("No HTML file found in ZIP")
                
                # Read template (UTF-8 for Cyrillic!)
                template_file = template_files[0]
                template_html = zip_file.read(template_file).decode('utf-8')
                
                # Create template folder
                template_id = str(uuid.uuid4())
                template_folder = os.path.join(TEMPLATES_DIR, template_id)
                os.makedirs(template_folder, exist_ok=True)
                
                # Extract all files and convert images to base64
                image_paths = {}
                for file_info in zip_file.infolist():
                    if file_info.is_dir():
                        continue
                    
                    # Extract file
                    file_content = zip_file.read(file_info.filename)
                    file_path = os.path.join(template_folder, file_info.filename)
                    
                    # Create subdirectories
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    
                    # Write file
                    with open(file_path, 'wb') as f:
                        f.write(file_content)
                    
                    # If image, create base64 reference
                    if any(file_info.filename.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif']):
                        b64_content = base64.b64encode(file_content).decode()
                        # Get file extension to determine MIME type
                        ext = Path(file_info.filename).suffix.lower()
                        mime_types = {
                            '.png': 'image/png',
                            '.jpg': 'image/jpeg',
                            '.jpeg': 'image/jpeg',
                            '.gif': 'image/gif',
                            '.svg': 'image/svg+xml'
                        }
                        mime = mime_types.get(ext, 'image/png')
                        data_uri = f"data:{mime};base64,{b64_content}"
                        
                        # Store mapping: relative path -> data URI
                        rel_path = file_info.filename
                        image_paths[rel_path] = data_uri
                        logger.info(f"Converted image to base64: {rel_path}")
                
                # Replace image paths in template with base64 data URIs
                modified_template = template_html
                for img_path, data_uri in image_paths.items():
                    # Replace various image path formats
                    modified_template = modified_template.replace(f'src="{img_path}"', f'src="{data_uri}"')
                    modified_template = modified_template.replace(f"src='{img_path}'", f"src='{data_uri}'")
                    modified_template = modified_template.replace(img_path, data_uri)
                
                # Save modified template
                template_path = os.path.join(template_folder, 'template.html')
                with open(template_path, 'w', encoding='utf-8') as f:
                    f.write(modified_template)
                
                # Store metadata
                template_metadata = {
                    'id': template_id,
                    'name': template_name,
                    'type': 'html',
                    'content_path': template_path,
                    'variables': [],
                    'has_images': len(image_paths) > 0,
                    'image_count': len(image_paths),
                    'created_at': str(os.path.getctime(template_path)),
                    'updated_at': None
                }
                
                await self.storage.save_template(template_id, template_metadata)

                
                logger.info(f"Template ZIP processed: {template_id} with {len(image_paths)} images")
                return template_metadata
            
        except Exception as e:
            logger.error(f"Error processing template ZIP: {e}", exc_info=True)
            raise

    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template metadata."""
        return await self.storage.get_template(template_id)

    async def get_all_templates(self) -> list:
        """Get all templates."""
        return await self.storage.get_all_templates()

    async def delete_template(self, template_id: str) -> bool:
        """Delete template."""
        try:
            # Delete files
            template_folder = os.path.join(TEMPLATES_DIR, template_id)
            if os.path.exists(template_folder):
                import shutil
                shutil.rmtree(template_folder)
            
            # Delete metadata
            await self.storage.delete_template(template_id)
            logger.info(f"Template deleted: {template_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting template: {e}")
            raise
