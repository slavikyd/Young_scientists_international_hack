import zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path
import logging
from typing import List, Optional, Tuple

from app.storage.redis_storage import get_redis
from app.services.template_service import TemplateService
from app.services.participant_service import ParticipantService
from app.utils.pdf_generator import PDFGenerator
from app.schemas.template import TemplateType
from app.config import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()


class CertificateService:
    """Service for generating certificates."""
    
    def __init__(self):
        self.template_service = TemplateService()
        self.participant_service = ParticipantService()
        self.certificates_dir = Path(settings.CERTIFICATES_DIR)
        self.certificates_dir.mkdir(parents=True, exist_ok=True)
    
    async def generate_certificates(
        self,
        template_id: str,
        metadata: Optional[dict] = None,
        include_ids: Optional[List[str]] = None
    ) -> Tuple[bytes, List[dict], List[str]]:
        """
        Generate certificates for participants.
        
        Returns:
            Tuple of (zip_bytes, generated_list, failed_list)
        """
        # Get template
        template = await self.template_service.get_template(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        # Get participants
        all_participants = await self.participant_service.get_all_participants()
        
        if include_ids:
            participants = [p for p in all_participants if p['id'] in include_ids]
        else:
            participants = all_participants
        
        if not participants:
            raise ValueError("No participants found")
        
        # Generate certificates
        zip_buffer = BytesIO()
        generated = []
        failed = []
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for participant in participants:
                try:
                    pdf_bytes = await self._generate_single_certificate(
                        participant,
                        template,
                        metadata
                    )
                    
                    # Add to ZIP
                    filename = f"{participant['full_name'].replace(' ', '_')}.pdf"
                    zf.writestr(filename, pdf_bytes)
                    generated.append({
                        'participant_id': participant['id'],
                        'filename': filename
                    })
                
                except Exception as e:
                    error_msg = f"Failed to generate for {participant['full_name']}: {str(e)}"
                    logger.error(error_msg)
                    failed.append({
                        'participant_id': participant['id'],
                        'error': str(e)
                    })
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue(), generated, failed
    
    async def _generate_single_certificate(
        self,
        participant: dict,
        template: dict,
        metadata: Optional[dict] = None
    ) -> bytes:
        """Generate PDF for a single participant."""
        
        # Build variables dict
        variables = {
            'name': participant['full_name'],
            'full_name': participant['full_name'],
            'email': participant['email'],
            'role': participant['role'],
            'place': participant.get('place'),
        }
        
        # Add metadata if provided
        if metadata:
            variables.update({
                'event_name': metadata.get('event_name'),
                'issue_date': metadata.get('issue_date'),
                'event_location': metadata.get('event_location'),
                'organizer': metadata.get('organizer'),
            })
        
        # Add current date
        variables['generated_date'] = datetime.utcnow().isoformat()
        
        # Generate PDF
        pdf_bytes = PDFGenerator.generate_certificate(
            template['content'],
            TemplateType(template['type']),
            variables
        )
        
        return pdf_bytes
    
    async def get_certificate_preview(
        self,
        participant_id: str,
        template_id: str,
        metadata: Optional[dict] = None
    ) -> str:
        """
        Get HTML preview of certificate for participant.
        
        Returns:
            Rendered HTML string
        """
        # Get template
        template = await self.template_service.get_template(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        # Get participant
        participant = await self.participant_service.get_participant(participant_id)
        if not participant:
            raise ValueError(f"Participant {participant_id} not found")
        
        # Build variables
        variables = {
            'name': participant['full_name'],
            'full_name': participant['full_name'],
            'email': participant['email'],
            'role': participant['role'],
            'place': participant.get('place'),
        }
        
        if metadata:
            variables.update({
                'event_name': metadata.get('event_name'),
                'issue_date': metadata.get('issue_date'),
                'event_location': metadata.get('event_location'),
                'organizer': metadata.get('organizer'),
            })
        
        variables['generated_date'] = datetime.utcnow().isoformat()
        
        # Render template
        html_content = PDFGenerator.render_template(
            template['content'],
            variables
        )
        
        return html_content
