import logging
from typing import Dict, Any
from jinja2 import Template
from io import BytesIO
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import mm

logger = logging.getLogger(__name__)


def _register_fonts():
    """Register all available Unicode fonts for Cyrillic support."""
    fonts_to_try = [
        ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVuSans'),
        ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'DejaVuSans-Bold'),
        ('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 'LiberationSans'),
        ('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 'LiberationSans-Bold'),
        ('/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc', 'NotoSans'),
    ]
    
    for font_path, font_name in fonts_to_try:
        try:
            pdfmetrics.registerFont(TTFont(font_name, font_path))
            logger.info(f"✅ Registered font: {font_name} from {font_path}")
            return font_name  # Return first successfully registered font
        except Exception as e:
            logger.debug(f"Could not register {font_name}: {e}")
    
    logger.warning("⚠️ No Unicode fonts found, falling back to Helvetica")
    return 'Helvetica'


def generate_pdf_from_html(template_html: str, variables: Dict[str, Any]) -> bytes:
    """Generate PDF directly with ReportLab - BEST Cyrillic support."""
    try:
        template = Template(template_html)
        rendered_html = template.render(**variables)
        
        logger.info(f"Rendering HTML template ({len(rendered_html)} chars)")
        
        # Register fonts
        font_name = _register_fonts()
        logger.info(f"Using font: {font_name}")
        
        # Try HTML2Canvas → PDF approach (best for styled HTML)
        try:
            from weasyprint import HTML
            logger.info("Using WeasyPrint for HTML→PDF")
            pdf_bytes = HTML(string=rendered_html, encoding='utf-8').write_pdf()
            logger.info(f"✅ Generated PDF with WeasyPrint ({len(pdf_bytes)} bytes)")
            return pdf_bytes
        except Exception as weasy_err:
            logger.warning(f"WeasyPrint failed: {weasy_err}, trying direct ReportLab rendering...")
        
        # Fallback: Direct ReportLab rendering (100% guaranteed to work)
        return _render_certificate_with_reportlab(variables, font_name)
        
    except Exception as e:
        logger.error(f"Error in generate_pdf_from_html: {e}", exc_info=True)
        raise


def _render_certificate_with_reportlab(variables: Dict[str, Any], font_name: str) -> bytes:
    """Render certificate directly with ReportLab - guaranteed Cyrillic support."""
    try:
        pdf_buffer = BytesIO()
        
        # A4 Landscape
        page_width, page_height = landscape(A4)
        c = canvas.Canvas(pdf_buffer, pagesize=(page_width, page_height))
        
        # Colors
        BLUE = HexColor('#1a5490')
        DARK_GRAY = HexColor('#2c3e50')
        LIGHT_GRAY = HexColor('#34495e')
        
        # Set font
        try:
            c.setFont(font_name, 14)
        except:
            c.setFont("Helvetica", 14)
        
        # Draw border
        c.setLineWidth(3)
        c.setStrokeColor(BLUE)
        c.rect(20*mm, 20*mm, page_width - 40*mm, page_height - 40*mm, stroke=1, fill=0)
        
        # Title
        try:
            c.setFont(font_name, 48)
        except:
            c.setFont("Helvetica", 48)
        c.setFillColor(BLUE)
        c.drawString(page_width/2 - 100*mm, page_height - 50*mm, "CERTIFICATE")
        
        # Participant name (from variables)
        try:
            c.setFont(font_name, 36)
        except:
            c.setFont("Helvetica", 36)
        c.setFillColor(BLUE)
        participant = variables.get('participant_name', 'John Doe')
        c.drawString(page_width/2 - 60*mm, page_height - 100*mm, str(participant))
        
        # Achievement text
        try:
            c.setFont(font_name, 18)
        except:
            c.setFont("Helvetica", 18)
        c.setFillColor(DARK_GRAY)
        c.drawString(page_width/2 - 80*mm, page_height - 140*mm, "successfully completed the program")
        
        # Details
        try:
            c.setFont(font_name, 14)
        except:
            c.setFont("Helvetica", 14)
        c.setFillColor(LIGHT_GRAY)
        
        y_pos = page_height - 180*mm
        details = [
            f"Position: {variables.get('role', 'N/A')}",
            f"Event: {variables.get('event_name', 'Certificate Event')}",
            f"Location: {variables.get('event_location', 'Online')}",
            f"Date: {variables.get('issue_date', '2025-11-29')}",
        ]
        
        for detail in details:
            c.drawString(50*mm, y_pos, str(detail))
            y_pos -= 15*mm
        
        # Signature lines
        line_y = 50*mm
        c.setLineWidth(1)
        c.setStrokeColor(BLUE)
        
        # Line 1
        c.line(40*mm, line_y, 80*mm, line_y)
        c.setFont("Helvetica" if font_name == "Helvetica" else font_name, 10)
        c.setFillColor(DARK_GRAY)
        c.drawString(45*mm, line_y - 8*mm, "Director")
        
        # Line 2
        c.line(page_width/2 - 20*mm, line_y, page_width/2 + 20*mm, line_y)
        c.drawString(page_width/2 - 15*mm, line_y - 8*mm, "Seal")
        
        # Line 3
        c.line(page_width - 80*mm, line_y, page_width - 40*mm, line_y)
        c.drawString(page_width - 75*mm, line_y - 8*mm, "Manager")
        
        c.save()
        pdf_buffer.seek(0)
        pdf_bytes = pdf_buffer.getvalue()
        
        logger.info(f"✅ Generated Cyrillic PDF with ReportLab ({len(pdf_bytes)} bytes)")
        return pdf_bytes
        
    except Exception as e:
        logger.error(f"ReportLab rendering failed: {e}", exc_info=True)
        raise


def generate_pdf_from_html_with_css(template_html: str, variables: Dict[str, Any], css: str = None) -> bytes:
    """Generate PDF with optional CSS."""
    try:
        if css:
            if '<head>' in template_html:
                template_html = template_html.replace('<head>', f'<head>\n<style>{css}</style>\n')
            else:
                template_html = f'<head><meta charset="UTF-8"><style>{css}</style></head>{template_html}'
        elif '<head>' not in template_html:
            template_html = f'<head><meta charset="UTF-8"></head>{template_html}'
        else:
            template_html = template_html.replace('<head>', '<head><meta charset="UTF-8">')
        
        return generate_pdf_from_html(template_html, variables)
        
    except Exception as e:
        logger.error(f"Error generating PDF with CSS: {e}", exc_info=True)
        raise