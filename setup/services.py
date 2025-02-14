from django.template import Context, Template
from .models import TemplateContent, CompanyLogo
import re
from .data import logo_base64
import requests
import json
import base64

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


import os
from django.conf import settings

def get_html_for_template_name(template_name, header_context, lines_context,logo_org_id,entity_name='COMMON'):
    # print('from service', template_name, 'header\n', header_context, 'lines\n', lines_context)
    try:
        # Retrieve the TemplateContent object based on the provided template_name
        template:TemplateContent = TemplateContent.objects.get(template_name=template_name)
        
        if template:
            template_html = template.html_content
            
            if template.has_header_logo:
                # Add a header logo HTML snippet with a specified logo
                logo = logo_base64
                if(logo_org_id!=''):
                    logo = 'data:image/png;base64,'+base64.b64encode(
                                CompanyLogo.objects.get(org_id=logo_org_id,entity_name=entity_name).header_logo
                                ).decode()
                header_logo_html = f'''<div style="display: flex; justify-content: start;"><img src="{logo}" style="width: 100%;" /></div>'''
                template_html = header_logo_html + template_html
            
            if template.has_lines:
                no_of_lines_sections = template.no_of_lines_sections
                # no_of_lines_sections = 2
                # if no_of_lines_sections != len(lines_context):
                #     raise Exception("No of items in lines context should match with no_of_lines_sections!!!")

                tr_regex = r'<table\b[^>]*>(.*?)<\/table>'  
                matches = list(re.finditer(tr_regex, template_html))
                # if no_of_lines_sections != len(matches):
                #     raise Exception("Your template doesn't follow the conventions mentioned in the user guide!!!")

                # all_tr_regex = r'<tr\b[^>]*>(?:(?:(?!<tr\b).)*?AAA(?:(?!<tr\b).)*?<\/tr>)*?<\/table>'

                all_tr_regex = r'<tr\b[^>]*>(?:(?!</tr>).|\n)*?</tr>'

                nested_tr_tags = re.findall(all_tr_regex, template_html, re.DOTALL)

                with open(os.path.join(settings.BASE_DIR, 'query.html'), 'w+') as f:
                # print()
                    counter = 0
                    for index, base_tr in enumerate(nested_tr_tags):
                        if counter < no_of_lines_sections:
                            if '$L$' in base_tr:
                                rows_with_context = ''
                                
                                # Iterate over the lines_context list and render the base table row with each data context
                                for row_data in lines_context[0]:
                                    rows_with_context += Template(base_tr).render(Context(row_data,autoescape =False))


                                # Replace the base table row in the template HTML with the rendered rows
                                template_html = template_html.replace(base_tr, "$PLACEHOLDDER$", 1)
                                template_html = template_html.replace("$PLACEHOLDDER$", rows_with_context)
                                counter += 1
 

                # Render the template HTML with the header_context applied
                template_html = Template(template_html).render(Context(header_context))
                template_html = template_html.replace('$L$', '')

                if template.has_footer_logo:
                    # Add a footer logo HTML snippet with a specified footer logo
                    footer_logo_html = f'''<div style="display: flex; justify-content: start;"><img src="{logo_base64}" style="width: 100%;"/></div>'''
                    template_html = template_html + footer_logo_html
                    
                return '<div style="display:flex; flex-direction: column; justify-content:center;">'+ template_html + '</div>'
            
            else:
                # Render the template HTML with the header_context applied
                template_html = Template(template_html).render(Context(header_context))
                
                if template.has_footer_logo:
                    # Add a footer logo HTML snippet with a specified footer logo
                    footer_logo_html = f'''<div style="display: flex; justify-content: center;"><img src="{logo_base64}" style="width: 100%;"/></div>'''
                    template_html = template_html + footer_logo_html
                
                return '<div style="display:flex; flex-direction: column; justify-content:center;">'+ template_html + '</div>'
        
    except TemplateContent.DoesNotExist:
        raise Exception('Please provide correct template name')


    except Exception as e:
        exception_message = e.args[0]
        raise Exception(exception_message, e)

