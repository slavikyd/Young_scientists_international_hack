from jinja2 import Template, TemplateSyntaxError
from weasyprint import HTML, CSS
from io import BytesIO
import logging
from typing import Optional

from app.schemas.template import TemplateType


logger = logging.getLogger(__name__)


class PDFGenerationError(Exception):
    """Custom exception for PDF generation errors."""
    pass


class PDFGenerator:
    """Generate PDF from HTML or SVG templates."""
    
    @staticmethod
    def render_template(template_content: str, variables: dict) -> str:
        """
        Render Jinja2 template with variables.
        
        Args:
            template_content: Template string with {{variable}} placeholders
            variables: Dictionary of variables to inject
            
        Returns:
            Rendered HTML string
        """
        try:
            template = Template(template_content)
            return template.render(**variables)
        except TemplateSyntaxError as e:
            raise PDFGenerationError(f"Template syntax error: {e}")
        except Exception as e:
            raise PDFGenerationError(f"Template rendering failed: {e}")
    
    @staticmethod
    def html_to_pdf(html_content: str) -> bytes:
        """
        Convert HTML to PDF.
        
        Args:
            html_content: HTML string
            
        Returns:
            PDF as bytes
        """
        try:
            # Create HTML object
            html_obj = HTML(string=html_content, base_url=".")
            
            # Generate PDF in memory
            pdf_bytes = html_obj.write_pdf()
            return pdf_bytes
        
        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            raise PDFGenerationError(f"Failed to generate PDF: {e}")
    
    @staticmethod
    def generate_certificate(
        template_content: str,
        template_type: TemplateType,
        variables: dict
    ) -> bytes:
        """
        Generate certificate PDF from template and variables.
        
        Args:
            template_content: Template content (HTML or SVG)
            template_type: Type of template
            variables: Dictionary of variables for template
            
        Returns:
            PDF as bytes
        """
        try:
            # Render template
            rendered_html = PDFGenerator.render_template(
                template_content,
                variables
            )
            
            # Convert to PDF
            if template_type == TemplateType.HTML:
                pdf_bytes = PDFGenerator.html_to_pdf(rendered_html)
            elif template_type == TemplateType.SVG:
                # SVG is typically embedded in HTML for rendering
                wrapped_html = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {{ margin: 0; padding: 0; }}
                        svg {{ max-width: 100%; height: auto; }}
                    </style>
                </head>
                <body>
                    {rendered_html}
                </body>
                </html>
                """
                pdf_bytes = PDFGenerator.html_to_pdf(wrapped_html)
            else:
                raise PDFGenerationError(f"Unsupported template type: {template_type}")
            
            return pdf_bytes
        
        except PDFGenerationError:
            raise
        except Exception as e:
            logger.error(f"Certificate generation failed: {e}")
            raise PDFGenerationError(f"Failed to generate certificate: {e}")