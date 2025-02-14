from django.template import Context, Template
from .models import TemplateContent
import re
from .data import logo_base64
import requests
import json


def call_pdf_microservice(html):
    url = 'http://localhost:4000/html-to-pdf'
    html = '<html><body><h1>Hello, world!</h1></body></html>'
    headers = {
        'Content-Type': 'application/json'
    }
    payload = {
        'html': html
    }
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    # print('this is response', response.content)
    return response.content


def get_html_for_template_name(template_name, header_context, lines_context):
    print('from service', template_name)
    try:
        # Retrieve the TemplateContent object based on the provided template_name
        template:TemplateContent = TemplateContent.objects.get(template_name=template_name)
        
        if template:
            template_html = template.html_content
            
            if template.has_header_logo:
                # Add a header logo HTML snippet with a specified logo
                header_logo_html = f'''<div style="display: flex; justify-content: start;"><img src="{logo_base64}" style="width: 700px;" /></div>'''
                template_html = header_logo_html + template_html
            
            if template.has_lines:
                # no_of_lines_sections = template.no_of_lines_sections
                no_of_lines_sections = 2
                
                # Find a table row and table within the template HTML
                tr_regex = r'<tr[^>]*>.*?<table[^>]*>.*?<\/table>.*?<\/tr>'  
                tr_string = re.search(tr_regex, template_html, flags=re.DOTALL).group() 
                table_regex = r'<table[^>]*>.*?<\/table>'
                table = re.search(table_regex, tr_string, flags=re.DOTALL).group()
                
                if table:
                    # Find the base table row that contains placeholders to be replaced
                    tr_regex = r'<tr\b[^>]*>(?:(?!</tr>).)*?\{\{[^{}]*\}\}(?:(?!</tr>).)*?<\/tr>'
                    base_tr = re.search(tr_regex, table, flags=re.DOTALL).group()
                    
                    if base_tr:
                        rows_with_context = ''
                        
                        # Iterate over the lines_context list and render the base table row with each data context
                        for i in lines_context:
                            row_with_data = Template(base_tr).render(Context(i))
                            rows_with_context += row_with_data

                        # Replace the base table row in the template HTML with the rendered rows
                        template_html = template_html.replace(base_tr, rows_with_context, 1)
                        
                        # Render the template HTML with the header_context applied
                        template_html = Template(template_html).render(Context(header_context))
                        
                        if template.has_footer_logo:
                            # Add a footer logo HTML snippet with a specified footer logo
                            footer_logo_html = f'''<div style="display: flex; justify-content: start;"><img src="{logo_base64}" style="width: 700px;"/></div>'''
                            template_html = template_html + footer_logo_html
                            
                        return '<div style="display:flex; flex-direction: column; justify-content:center;">'+ template_html + '</div>'
            
            else:
                # Render the template HTML with the header_context applied
                template_html = Template(template_html).render(Context(header_context))
                
                if template.has_footer_logo:
                    # Add a footer logo HTML snippet with a specified footer logo
                    footer_logo_html = f'''<div style="display: flex; justify-content: center;"><img src="{logo_base64}" style="width: 700px;"/></div>'''
                    template_html = template_html + footer_logo_html
                
                return '<div style="display:flex; flex-direction: column; justify-content:center;">'+ template_html + '</div>'
    
    except TemplateContent.DoesNotExist:
        raise Exception('Please provide correct template name')
