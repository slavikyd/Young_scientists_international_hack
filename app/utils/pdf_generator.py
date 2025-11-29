import logging
from typing import Dict, Any
from jinja2 import Template
from io import BytesIO
import html

logger = logging.getLogger(__name__)


def generate_pdf_from_html(template_html: str, variables: Dict[str, Any]) -> bytes:
    """
    Generate PDF from HTML template with variables using xhtml2pdf.
    
    Stable, reliable HTML-to-PDF rendering without pydyf issues.
    
    Args:
        template_html: HTML template content (with Jinja2 variables)
        variables: Dictionary of variables to inject into template
        
    Returns:
        PDF content as bytes
    """
    try:
        # Render template with variables
        template = Template(template_html)
        rendered_html = template.render(**variables)
        
        logger.debug(f"Rendered HTML template with variables: {list(variables.keys())}")
        logger.info(f"Rendered HTML ({len(rendered_html)} chars)")
        
        # Use xhtml2pdf - stable and reliable
        try:
            from xhtml2pdf import pisa
            
            logger.info("Using xhtml2pdf for PDF generation")
            
            # Create PDF
            pdf_buffer = BytesIO()
            pisa_status = pisa.CreatePDF(
                BytesIO(rendered_html.encode('utf-8')),
                pdf_buffer
            )
            
            if pisa_status.err:
                logger.error(f"xhtml2pdf error: {pisa_status.err}")
                raise Exception(f"PDF generation failed: {pisa_status.err}")
            
            pdf_buffer.seek(0)
            pdf_bytes = pdf_buffer.getvalue()
            
            logger.info(f"✅ Generated styled PDF with xhtml2pdf ({len(pdf_bytes)} bytes)")
            return pdf_bytes
            
        except ImportError as e:
            logger.error(f"❌ xhtml2pdf not installed: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ xhtml2pdf rendering failed: {e}", exc_info=True)
            raise
        
    except Exception as e:
        logger.error(f"Error in generate_pdf_from_html: {e}", exc_info=True)
        raise


def generate_pdf_from_html_with_css(template_html: str, variables: Dict[str, Any], css: str = None) -> bytes:
    """
    Generate PDF from HTML template with optional CSS.
    
    Args:
        template_html: HTML template content (with Jinja2 variables)
        variables: Dictionary of variables to inject into template
        css: Optional CSS string for styling
        
    Returns:
        PDF content as bytes
    """
    try:
        # Embed CSS into HTML if provided
        if css:
            # Insert CSS into head or create head if missing
            if '<head>' in template_html:
                template_html = template_html.replace('<head>', f'<head>\n<style>{css}</style>\n')
            else:
                template_html = f'<head><style>{css}</style></head>{template_html}'
        
        return generate_pdf_from_html(template_html, variables)
        
    except Exception as e:
        logger.error(f"Error generating PDF with CSS: {e}", exc_info=True)
        raise
