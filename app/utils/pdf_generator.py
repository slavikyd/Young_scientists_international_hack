import logging
from typing import Dict, Any
from jinja2 import Template
from io import BytesIO

logger = logging.getLogger(__name__)


def generate_pdf_from_html(template_html: str, variables: Dict[str, Any]) -> bytes:
    """
    Generate PDF from HTML template with Cyrillic support using WeasyPrint.
    
    Process:
    1. Render Jinja2 template with user variables (inserts HTML with data)
    2. Add UTF-8 and @font-face declarations for DejaVuSans
    3. Use WeasyPrint to convert styled HTML → PDF
    
    Args:
        template_html: HTML template with Jinja2 variables {{ var_name }}
        variables: Dictionary with values to insert
        
    Returns:
        PDF bytes
    """
    try:
        # Step 1: Render template - substitute variables into HTML
        logger.info(f"📝 Step 1: Rendering Jinja2 template with variables")
        template = Template(template_html)
        rendered_html = template.render(**variables)
        logger.info(f"✅ Template rendered: {len(rendered_html)} chars")
        
        # Log first 500 chars for debugging
        logger.debug(f"Rendered HTML preview:\n{rendered_html[:500]}")
        
        # Step 2: Ensure proper encoding and Cyrillic font support
        logger.info(f"📝 Step 2: Adding UTF-8 and @font-face declarations")
        
        # Build complete HTML with proper charset and font declarations
        html_with_fonts = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style>
        @font-face {
            font-family: 'DejaVu Sans';
            src: local('DejaVu Sans');
            font-weight: normal;
            font-style: normal;
        }
        
        @font-face {
            font-family: 'DejaVu Sans';
            src: local('DejaVu Sans Bold');
            font-weight: bold;
            font-style: normal;
        }
        
        * {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
        }
    </style>
</head>
<body>
"""
        
        # Extract body content if exists, otherwise use entire rendered_html
        if '<body' in rendered_html.lower():
            # Extract content between body tags
            body_start = rendered_html.lower().find('<body')
            body_start = rendered_html.find('>', body_start) + 1
            body_end = rendered_html.lower().find('</body>')
            body_content = rendered_html[body_start:body_end] if body_end > body_start else rendered_html
        else:
            body_content = rendered_html
            
        html_with_fonts += body_content + "\n</body>\n</html>"
        
        logger.info(f"✅ HTML prepared with DejaVu Sans font declarations")
        
        # Step 3: Convert HTML to PDF using WeasyPrint
        logger.info(f"📝 Step 3: Converting HTML → PDF with WeasyPrint")
        try:
            # Compatibility shim: some pydyf versions have a different PDF.__init__ signature
            # WeasyPrint may call pydyf.PDF(version, identifier) while older pydyf defines
            # PDF.__init__(self) only. Detect that case and patch the constructor to accept
            # the extra args so WeasyPrint can call it without TypeError.
            try:
                import inspect as _inspect
                import pydyf
                sig = _inspect.signature(pydyf.PDF.__init__)
                if len(sig.parameters) == 1:
                    _orig_init = pydyf.PDF.__init__
                    def _compat_init(self, version=None, identifier=False, *args, **kwargs):
                        _orig_init(self)
                        # Normalize and store attributes that WeasyPrint expects to find
                        try:
                            # helper to convert string/bytes to bytes where appropriate
                            def _to_bytes(val):
                                if val is True or val is False or val is None:
                                    return val
                                if isinstance(val, bytes):
                                    return val
                                try:
                                    return str(val).encode('ascii')
                                except Exception:
                                    return val

                            # WeasyPrint sometimes expects instance attributes like .version and .identifier
                            try:
                                self.version = _to_bytes(version or b'1.7')
                            except Exception:
                                self.version = version
                            try:
                                self.identifier = identifier if identifier in (False, True) else _to_bytes(identifier)
                            except Exception:
                                self.identifier = identifier
                        except Exception:
                            pass
                    pydyf.PDF.__init__ = _compat_init
            except Exception:
                # If anything goes wrong with the shim, continue and let WeasyPrint raise its error
                pass

            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration

            # Configure fonts with DejaVu support
            font_config = FontConfiguration()

            # Create HTML document
            html_doc = HTML(string=html_with_fonts, encoding='utf-8')

            # Generate PDF with font configuration
            pdf_bytes = html_doc.write_pdf(font_config=font_config)
            
            if not pdf_bytes:
                raise RuntimeError("WeasyPrint generated empty PDF")
            
            logger.info(f"✅ PDF generated with WeasyPrint: {len(pdf_bytes)} bytes")
            return pdf_bytes
            
        except ImportError as imp_err:
            logger.error(f"❌ WeasyPrint not installed: {imp_err}")
            raise RuntimeError("WeasyPrint is required for PDF generation")
        except Exception as weasy_err:
            logger.error(f"❌ WeasyPrint error: {weasy_err}", exc_info=True)
            raise RuntimeError(f"Failed to generate PDF: {weasy_err}")
        
    except Exception as e:
        logger.error(f"❌ Error in generate_pdf_from_html: {e}", exc_info=True)
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