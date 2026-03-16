from playwright.async_api import async_playwright
from jinja2 import Environment, FileSystemLoader
import os

async def generate_pdf_from_html(data_dict: dict) -> bytes:
    """
    Renders an HTML template with the provided data dict, opens a headless Chromium browser,
    prints the HTML to a PDF array, and returns the raw PDF bytes.
    """
    # 1. Setup Jinja2 Environment
    current_dir = os.path.dirname(os.path.abspath(__file__))
    templates_dir = os.path.join(current_dir, 'templates')
    env = Environment(loader=FileSystemLoader(templates_dir))
    
    # Load the template
    template = env.get_template('service_request_form.html')
    
    # 2. Render HTML string with data
    rendered_html = template.render(**data_dict)
    
    # 3. Use Playwright to convert HTML to PDF
    async with async_playwright() as p:
        # Launch headless chromium
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Load the rendered HTML into the page
        await page.set_content(rendered_html, wait_until='networkidle')
        
        # Convert to PDF
        pdf_bytes = await page.pdf(
            format="Letter",
            margin={"top": "0.5in", "bottom": "0.5in", "left": "0.5in", "right": "0.5in"},
            print_background=True
        )
        
        await browser.close()
        
        return pdf_bytes
