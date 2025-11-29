import logging
from typing import Dict, Any
from jinja2 import Template
from io import BytesIO
import requests
import os

logger = logging.getLogger(__name__)


def generate_pdf_from_html(template_html: str, variables: Dict[str, Any]) -> bytes:
    """Generate PDF from HTML using PDFEndpoint API with all flags."""
    try:
        # Render template with Jinja2
        template = Template(template_html)
        rendered_html = template.render(**variables)
        
        logger.info(f"📝 Rendered HTML: {len(rendered_html)} chars")
        
        # Ensure UTF-8 meta tag
        if '<meta charset' not in rendered_html:
            rendered_html = rendered_html.replace(
                '<head>',
                '<head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
            ) if '<head>' in rendered_html else f'<head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>{rendered_html}'
        
        # Try PDF API with all flags
        pdf_api_key = os.getenv('PDF_API_KEY', '')
        if pdf_api_key:
            try:
                logger.info("📡 Using PDFEndpoint API with all flags...")
                
                payload = {
                    "html": rendered_html,
                    "margin_top": "1cm",
                    "margin_bottom": "1cm",
                    "margin_right": "1cm",
                    "margin_left": "1cm",
                    "no_backgrounds": False,
                    "no_javascript": True,
                    "no_blank_pages": True,
                    "no_ads": True,
                    "no_forms": True,
                    "sandbox": True
                }
                
                response = requests.post(
                    os.getenv('PDF_API_URL', 'https://api.pdfendpoint.com/v1/convert'),
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {pdf_api_key}"
                    },
                    timeout=60
                )
                
                if response.status_code == 200:
                    pdf_bytes = response.content
                    logger.info(f"✅ PDF via API: {len(pdf_bytes)} bytes")
                    return pdf_bytes
                else:
                    logger.warning(f"API returned {response.status_code}: {response.text}")
                    logger.info("Falling back to xhtml2pdf...")
                    
            except Exception as e:
                logger.warning(f"API failed: {e}, falling back to xhtml2pdf...")
        
        # Fallback: xhtml2pdf
        logger.info("Using xhtml2pdf for PDF generation")
        from xhtml2pdf import pisa
        
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(
            BytesIO(rendered_html.encode('utf-8')),
            pdf_buffer,
            encoding='UTF-8'
        )
        
        if pisa_status.err:
            raise Exception(f"xhtml2pdf error: {pisa_status.err}")
        
        pdf_buffer.seek(0)
        pdf_bytes = pdf_buffer.getvalue()
        
        logger.info(f"✅ PDF generated with xhtml2pdf: {len(pdf_bytes)} bytes")
        return pdf_bytes
        
    except Exception as e:
        logger.error(f"❌ PDF generation failed: {e}", exc_info=True)
        raise


def generate_pdf_from_html_with_css(template_html: str, variables: Dict[str, Any], css: str = None) -> bytes:
    """Generate PDF with optional CSS."""
    try:
        if css:
            if '<head>' in template_html:
                template_html = template_html.replace('<head>', f'<head>\n<style>{css}</style>\n')
            else:
                template_html = f'<head><meta charset="UTF-8"><style>{css}</style></head>{template_html}'
        
        return generate_pdf_from_html(template_html, variables)
        
    except Exception as e:
        logger.error(f"Error generating PDF with CSS: {e}", exc_info=True)
        raise