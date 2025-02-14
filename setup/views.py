import base64
import io
import json
from django.views.generic import View
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.contrib import messages
from django.shortcuts import redirect, reverse, render
from django.shortcuts import resolve_url
from ay_connect.constants import get_access_app_url
from core.endpoints import OIC_ENDPOINTS
from core.views import ActionView, BaseModelViewSet
from core.models import *
from core.utils import CrossAppAuth, get_datatable_col_info
from rest_framework import views as DRF_views, response
from .serializers import *
from .services import get_html_for_template_name
from .data import dummy_data_list, dummy_header_context
from rest_framework.parsers import MultiPartParser
from .models import *
from .serializers import *
from sequences import get_next_value
from core.services import call_oracle_api,call_oracle_api_async
from core.utils import get_loginuser_details
from accounts.email import send_async_mail_cc
from django.conf import settings
from django.http import HttpResponseServerError
from datetime import datetime
from accounts.models import ConcProgRole
from django.db import connection
import environ
env = environ.Env()

class TemplateContentView(ActionView, View):
    template_name = "setup/list-template.html"
    model = TemplateContent
    app_name = 'setup'
    sub_app_name = 'template'

    def get(self, request, action_type=None, row_id=None):
        if(action_type!=None):

            app_data = {
                    'app_name' : 'setup'
                }
            if(action_type=='add' or action_type=='edit'):
                self.template_name = "setup/add.html"
                data = self.add_form_page(app_data, action_type,row_id)
            else:
                model_data = { 
                            'model' : self.model ,
                            'title' : 'Add Template'
                            }
                data = self.page_form_elements(model_data, row_id)
        else:
            data_tabl_meta = self.template_data_list()
            header_meta = {"title": "Template",
                        "add_label": "Add Template",
                        "filter_label": "All Template",
                        "add_title" : "Add Template",
                        "add_link" : resolve_url( "setup:template", 'add'),
                        "add_unique_name" : "addTemplate"
                        }
            view_meta = {
                'row_view_url': resolve_url("setup:template", 0),
                'width': '40',
                'title': 'Add Template',
                'form_submit_url' :  resolve_url( self.app_name+':template')
            }
            data = {
                "data_tabl_meta": data_tabl_meta,
                "header_meta": header_meta,
                "view_meta": view_meta,
                'lines': TemplateContentSerializer(TemplateContent.objects.all(), many=True).data
            }
            data = data

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse(data)

        return render(request, self.template_name, context=data)

    def post(self, request):
        post_data = json.loads(request.body)
        res = self.form_post(post_data)
        messages.success(request, 'inserted')
        return JsonResponse(res)
    
    def template_data_list(self):
        """Get Contcat list meta info
        Parameters
        ----------
        self:
            
        Returns
        -------
        json
            return enquiry list
        """
        model_name = table_name = 'TemplateContent'
        col_info = get_datatable_col_info(model_name)    
        all_column_info = col_info['column_info']
        display_col_indexes = [0, 1, 2, 4, 5, 6, 7, ]

        # custom columns defenitions
        # => column index and column html that need to overwrite while rendering
        custom_columns = {
            2: '<button type="button" class="btn btn-sm btn-block cust_class">cell_data</button>',
            5: '<button type="button" class="btn btn-sm btn-success cust_class">Download</button>',
        }
        # custom column bg colours
        cust_classes = {
            "NEW": "btn-primary",
            "QUALIFIED": "btn-success",
            "ASSIGNED": "btn-warning",
        }
        data_table_url = reverse("setup:template_list-list")
        return {
            "column_info": all_column_info,
            "table_name": table_name,
            "cust_classes": cust_classes,
            "data_table_url": data_table_url,
            #"row_view_url": row_view_url,
            "custom_columns": custom_columns,
            "display_col_indexes": display_col_indexes
        }
    
class TemplateContentViewSet(BaseModelViewSet):
    serializer_class = TemplateContentSerializer
    
    def get_queryset(self):
        return TemplateContent.objects.all()


def template_list_view(request):
    templates = TemplateContent.objects.filter(active=True)
    return render(request, 'setup/list-template.html', {'lines': templates})

def template_view(request):
    template_name = request.GET.get('template_name', None)
    if template_name:
        print('teejjjjjjjjjjjjjjjj', template_name)
        template_html = get_html_for_template_name(template_name, dummy_header_context, dummy_data_list, '')
        return render(request, 'setup/print-template.html', context={'html': template_html})
    else:
        return render(request, 'setup/save-template-form.html', context={})

# from xhtml2pdf import pisa
# from weasyprint import HTML, CSS
# from io import BytesIO
# import weasyprint
import pdfkit


# class TemplateHTMLApi(DRF_views.APIView):
#     permission_classes = ()
#     authentication_classes = ()
#     def post(self, req, *args, **kwargs):
#         template_name = req.data.get('template_name', None)
#         pdf_only = req.GET.get('pdf_only', None)
#         header_context = req.data.get('header_context', dummy_header_context)
#         data_list = req.data.get('data_list', dummy_data_list)
#         try:
#             template_html = get_html_for_template_name(template_name, header_context, data_list)
#             if pdf_only:
#                 buffer = BytesIO()

#                 # Use the buffer to receive the generated PDF
#                 pdf = pisa.CreatePDF(BytesIO(template_html.encode("UTF-8")), buffer)

#                 # If the PDF was created successfully, return it as a response
#                 if not pdf.err:
#                     response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
#                     response['Content-Disposition'] = 'attachment; filename="example.pdf"'
#                     return response

#             return JsonResponse({'html':template_html})
#         except Exception as e:
#             print(e)
#             return JsonResponse({'msg': "Template not found"}, status=400)
        
# class TemplateHTMLApi(DRF_views.APIView):
#     permission_classes = ()
#     authentication_classes = ()
#     def post(self, req, *args, **kwargs):
#         template_name = req.data.get('template_name', None)
#         pdf_only = req.GET.get('pdf_only', None)
#         header_context = req.data.get('header_context', dummy_header_context)
#         data_list = req.data.get('data_list', dummy_data_list)
#         try:
#             template_html = get_html_for_template_name(template_name, header_context, data_list)
#             if pdf_only:
#                 options = {
#                     'page-size': 'A4',
#                     'margin-top': '0mm',
#                     'margin-right': '0mm',
#                     'margin-bottom': '0mm',
#                     'margin-left': '0mm',
#                 }
#                 pdf = pdfkit.from_string(template_html, False, options=options)
#                 response = HttpResponse(pdf, content_type='application/pdf')
#                 response['Content-Disposition'] = 'attachment; filename="my_pdf.pdf"'
#                 return response
#             return JsonResponse({'html':template_html})
#         except Exception as e:
#             print(e)
#             return JsonResponse({'msg': "Template not found"}, status=400)
        
# class TemplateHTMLApi(DRF_views.APIView):
#     permission_classes = ()
#     authentication_classes = ()
#     def post(self, req, *args, **kwargs):
#         template_name = req.data.get('template_name', None)
#         pdf_only = req.GET.get('pdf_only', None)
#         header_context = req.data.get('header_context', dummy_header_context)
#         data_list = req.data.get('data_list', dummy_data_list)
#         try:
#             template_html = get_html_for_template_name(template_name, header_context, data_list)
#             if pdf_only:
#                 buffer = BytesIO()

#                 # Create the PDF object, using the buffer as its "file."
#                 weasyprint.HTML(string=template_html).write_pdf(buffer)

#                 # Get the value of the buffer.
#                 pdf = buffer.getvalue()
#                 buffer.close()

#                 # Return the PDF as a response.
#                 response = HttpResponse(pdf, content_type='application/pdf')
#                 response['Content-Disposition'] = 'attachment; filename="mypdf.pdf"'
#                 return response
#             return JsonResponse({'html':template_html})
#         except Exception as e:
#             print(e)
#             return JsonResponse({'msg': "Template not found"}, status=400)
        
# class TemplateHTMLApi(DRF_views.APIView):
#     permission_classes = ()
#     authentication_classes = ()
#     def post(self, req, *args, **kwargs):
#         template_name = req.data.get('template_name', None)
#         pdf_only = req.GET.get('pdf_only', None)
#         header_context = req.data.get('header_context', dummy_header_context)
#         data_list = req.data.get('data_list', dummy_data_list)
#         try:
#             template_html = get_html_for_template_name(template_name, header_context, data_list)
#             if pdf_only:
#                 pdf_file = HTML(string=template_html).write_pdf()

#                 # Return the PDF as a response
#                 response = HttpResponse(pdf_file, content_type='application/pdf')
#                 response['Content-Disposition'] = 'filename="my_pdf.pdf"'
#                 return response
#             return JsonResponse({'html':template_html})
#         except Exception as e:
#             print(e)
#             return JsonResponse({'msg': "Template not found"}, status=400)

# class TemplateHTMLApi(DRF_views.APIView):
#     permission_classes = ()
#     authentication_classes = ()
#     def post(self, req, *args, **kwargs):
#         template_name = req.data.get('template_name', None)
#         pdf_only = req.GET.get('pdf_only', None)
#         header_context = req.data.get('header_context', dummy_header_context)
#         data_list = req.data.get('data_list', dummy_data_list)
#         try:
#             template_html = get_html_for_template_name(template_name, header_context, data_list)
#             if pdf_only:
#                 print('pdf_onlypdf_onlypdf_onlypdf_onlypdf_only')
#                 response = HttpResponse(content_type='application/pdf')
#                 response['Content-Disposition'] = 'attachment; filename="invoice.pdf"'
#                 pisa_status = pisa.CreatePDF(template_html, dest=response)
#                 return response
#             return JsonResponse({'html':template_html})
#         except Exception as e:
#             print(e)
#             return JsonResponse({'msg': "Template not found"}, status=400)
        

# ORIGINAL CODE
# class TemplateHTMLApi(DRF_views.APIView):
#     permission_classes = ()
#     authentication_classes = ()
#     def post(self, req, *args, **kwargs):
#         template_name = req.data.get('template_name', None)
#         header_context = req.data.get('header_context', dummy_header_context)
#         data_list = req.data.get('data_list', dummy_data_list)
#         try:
#             template_html = get_html_for_template_name(template_name, header_context, data_list)
#             return JsonResponse({'html':template_html})
#         except Exception as e:
#             print(e)
#             return JsonResponse({'msg': "Template not found"}, status=400)
# ORIGINAL CODE

options = {
    # 'quiet': '',
    # 'encoding': 'UTF-8',
    # 'no-outline': None,
    # 'disable-smart-shrinking': '',
    'page-size': 'A4',
    'margin-top': '0.75in',
    'margin-right': '0.75in',
    'margin-bottom': '0.75in',
    'margin-left': '0.75in',
    # 'footer-right': '[page]',
    # 'footer-spacing': '5',
    # 'header-spacing': '5',
    # 'header-right': 'My header',
    # 'header-line': '',
    # 'header-font-size': '10',
    # 'header-font-name': 'Arial',
    # 'font-family': 'DejaVu Sans',
    # 'zoom': '1.0',
}




# class TemplateHTMLApi(DRF_views.APIView):
#     permission_classes = ()
#     authentication_classes = ()
#     def post(self, req, *args, **kwargs):
#         template_name = req.data.get('template_name', None)
#         pdf_only = req.data.get('pdf_only', None)
#         header_context = req.data.get('header_context', dummy_header_context)
#         data_list = req.data.get('data_list', dummy_data_list)
#         try:
#             template_html = get_html_for_template_name(template_name, header_context, data_list)
#             if pdf_only:
#                 # pdf_file = weasyprint.HTML(string=template_html).write_pdf()
#                 pdf_bytes = pdfkit.from_string(template_html, False, options=options)

#                 response = HttpResponse(pdf_bytes, content_type='application/pdf')
#                 response['Content-Disposition'] = 'filename="example.pdf"'
#                # call_pdf_microservice(template_html)
#                 return response
#             return JsonResponse({'html':template_html})
#         except Exception as e:
#             print(e)
#             return JsonResponse({'msg': "Template not found"}, status=400)


class TemplateHTMLApi(DRF_views.APIView):
    permission_classes = ()
    authentication_classes = ()
    def post(self, req, *args, **kwargs):
        template_name = req.data.get('template_name', None)
        pdf_only = req.data.get('pdf_only', None)
        header_context = req.data.get('header_context', dummy_header_context)
        data_list = req.data.get('data_list', [])
        logo_org_id = req.data.get('logo_org_id', '')
        try:
            template_html = get_html_for_template_name(template_name, header_context, data_list,logo_org_id)
            if pdf_only:
                # pdf_file = weasyprint.HTML(string=template_html).write_pdf()
                pdf_bytes = pdfkit.from_string(template_html, False, options=options)
                response = HttpResponse(pdf_bytes, content_type='application/pdf')
                response['Content-Disposition'] = 'filename="example.pdf"'
                return response
            return JsonResponse({'html':template_html})
        except Exception as e:
            print(e)
            return JsonResponse({'msg': "Template not foundd"}, status=400)

class TemplateSaveApi(DRF_views.APIView):
    permission_classes = ()
    authentication_classes = ()
    parser_classes = (MultiPartParser,)

    def post(self, request, *args, **kwargs):
        template_name = request.data.get('template_name', None)
        if not template_name:
            return response.Response({'msg': 'Please provide template name'}, status=400)
        if TemplateContent.objects.filter(template_name=template_name).exists():
            return response.Response({'msg': 'Template with this name already exists'}, status=400)
        serializer = TemplateContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return response.Response({'msg': "Saved"}, status=200)
        return response.Response(serializer.errors, status=400)



def ConcProgView(request):
#    select distinct concurrent_program_id, user_concurrent_program_name from setup_concprogmaster
    order_number = request.GET.get('order_number')
    roles = UserOrganisationInventory.active_objects.filter(user=request.user.id).values_list('role', flat=True)
    conc_pg_ids = ConcProgRole.active_objects.filter(role__in=roles).values_list('conc_prog',flat=True)
    concprog = ConcProgMaster.objects.filter(id__in=conc_pg_ids).distinct('user_concurrent_program_name')
    serializer = ConcProgMasterSerializer(concprog, many=True)
    concprog = serializer.data
    if order_number:
        concreqdtl = concreqdtl_stg.objects.filter(prompt='Header_ID*',parameter_value=order_number)
        header = []
        for concreq in concreqdtl:
            header.append(concreq.header_id)
        concreqdtl = concreqhdr_stg.objects.filter(header_id__in=header).order_by('-header_id')
        concreqdtl_serializer = ConcReqHdrStgSerializer(concreqdtl, many=True)
        con_serial= concreqdtl_serializer.data
        update= False
    else:
        # import pdb; pdb.set_trace()
        concreqdtl = concreqhdr_stg.objects.filter(created_by=request.user.username.upper()).order_by('-header_id')[:100]
        concreqdtl_serializer = ConcReqHdrStgSerializer(concreqdtl, many=True)
        con_serial= concreqdtl_serializer.data
        update= True
    context = {
        'concprogs':concprog,
        'concreqdtls':con_serial,
        'update': update,
        'ACCESS_APP_LINK':get_access_app_url(),
    } 
    return render(request, 'concprog.html', context)


def ConcProgInvtrView(request):
#    select distinct concurrent_program_id, user_concurrent_program_name from setup_concprogmaster
    header_id = request.GET.get('header_id')
    roles = UserOrganisationInventory.active_objects.filter(user=request.user.id).values_list('role', flat=True)
    conc_pg_ids = ConcProgRole.active_objects.filter(role__in=roles).values_list('conc_prog',flat=True)
    concprog = ConcProgMaster.objects.filter(id__in=conc_pg_ids).distinct('user_concurrent_program_name')
    serializer = ConcProgMasterSerializer(concprog, many=True)
    concprog = serializer.data
    inventory_transfer= InvtrnRequestHeaders.objects.filter(header_id=header_id).first()
    if inventory_transfer:
        concreqdtl = concreqdtl_stg.objects.filter(prompt='Doc Number',parameter_value=inventory_transfer.doc_number)
        header = []
        for concreq in concreqdtl:
            header.append(concreq.header_id)
        concreqdtl = concreqhdr_stg.objects.filter(header_id__in=header).order_by('-header_id')
        concreqdtl_serializer = ConcReqHdrStgSerializer(concreqdtl, many=True)
        con_serial= concreqdtl_serializer.data
        update= False
    else:
        # import pdb; pdb.set_trace()
        concreqdtl = concreqhdr_stg.objects.filter(created_by=request.user.username.upper()).order_by('-header_id')[:100]
        concreqdtl_serializer = ConcReqHdrStgSerializer(concreqdtl, many=True)
        con_serial= concreqdtl_serializer.data
        update= True
    context = {
        'concprogs':concprog,
        'concreqdtls':con_serial,
        'update': update,
        'ACCESS_APP_LINK':get_access_app_url(),
    } 
    return render(request, 'concprog.html', context)

def ConcProgPdfView(request):
#    select distinct concurrent_program_id, user_concurrent_program_name from setup_concprogmaster
    order_number = request.GET.get('order_number')
    quotation_number = request.GET.get('quotation_id','')
    sale_order = SalesOrder.objects.filter(order_number=order_number)
    concprog = ConcProgMaster.objects.all().distinct('user_concurrent_program_name')
    serializer = ConcProgMasterSerializer(concprog, many=True)
    concprog = serializer.data

    

    if quotation_number:
        concreqdtl = concreqdtl_stg.objects.filter( Q(prompt= 'Quote Number*') ,Q(parameter_value=quotation_number ))
        header = []
        for concreq in concreqdtl:
            header.append(concreq.header_id)
        concreqdtl = concreqhdr_stg.objects.filter(header_id__in=header).order_by('-header_id')
        concreqdtl_serializer = ConcReqHdrStgSerializer(concreqdtl, many=True)
        con_serial= concreqdtl_serializer.data
        update= False
    elif order_number:
        concreqdtl = concreqdtl_stg.objects.filter(Q(prompt= 'Order Number*') | Q(prompt= 'Order No*') | Q(prompt= 'Quote Number*') | Q(prompt= 'Order No From*') ,Q(parameter_value=sale_order[0].order_header_id) | Q(parameter_value=sale_order[0].om_order_number
        ))
        header = []
        for concreq in concreqdtl:
            header.append(concreq.header_id)
        concreqdtl = concreqhdr_stg.objects.filter(header_id__in=header).order_by('-header_id')
        concreqdtl_serializer = ConcReqHdrStgSerializer(concreqdtl, many=True)
        con_serial= concreqdtl_serializer.data
        update= False
    else:
        concreqdtl = concreqhdr_stg.objects.all().order_by('-header_id')
        concreqdtl_serializer = ConcReqHdrStgSerializer(concreqdtl, many=True)
        con_serial= concreqdtl_serializer.data
        update= True
    context = {
        'concprogs':concprog,
        'concreqdtls':con_serial,
        'update': update,
        'ACCESS_APP_LINK':get_access_app_url(),
    } 
    return render(request, 'concprog.html', context)



def refresh_report(request):
    header_id = request.GET['id']
    concreqhdr = concreqhdr_stg.objects.get(header_id=header_id)

    if concreqhdr.output_file is None:
        url = OIC_ENDPOINTS['getconcreqdetails'][settings.ENV]
        payload = {
        "P_HEADER_ID":request.GET['id']
        }
        res = call_oracle_api(url,payload)
        if len(res['P_OUTPUT_VAR']):
            conc_output = json.loads(res['P_OUTPUT_VAR'])
            output = conc_output[0]
            concreqhdr = concreqhdr_stg.objects.get(header_id=header_id)
            # concreqhdr.output_file = base64_to_in_memory_file(output.get('ATTACHMENT',None)).read()
            concreqhdr.request_status = 'Completed'
            concreqhdr.last_update_date = datetime.now()
            concreqhdr.actual_start_date = datetime.fromisoformat(output['ACTUAL_START_DATE'])
            concreqhdr.actual_completion_date = datetime.fromisoformat(output['ACTUAL_COMPLETION_DATE'])
            concreqhdr.output_file_name = output['FILE_NAME']
            concreqhdr.phase_code = output['PHASE_CODE']
            concreqhdr.status_code = output['STATUS_CODE']
            concreqhdr.request_id = output.get('REQUEST_ID',None)
            concreqhdr.save()
            return HttpResponse("Y")



    return HttpResponse("N")


def ConcProgInputDataView(request):
    import psycopg2
    
    location_code = request.session.get('location','')
    if location_code:
        arlocation = ARLocations.objects.filter(loc_code=location_code)
        org_id = arlocation[0].org_id
    else:
        resp = get_loginuser_details(request)
        org_id=resp['defs'].get('org_id')

    conn = psycopg2.connect(
        host=env('DATABASE_HOST'),
        port=env('DATABASE_PORT'),
        database=env('DATABASE_NAME'),
        user=env('DATABASE_EXT_SQL_USER'),
        password=env('DATABASE_EXT_SQL_PASSWORD')
    )
    cursor = conn.cursor()
    concprogs = ConcProgMaster.objects.filter(concurrent_program_id=request.GET.get('id')).order_by('id')
    # serializer = ConcProgMasterSerializer(concprog, many=True)
    # concprog = serializer.data
    html = ''
    for concprog in concprogs:
        if concprog:
            html +='<div style="display:flex; flex-direction: row; justify-content: center; align-items: center;margin: 10px">'
            html +='<label class="form-control-sm" style="width: 32%;clear: both;float:left;margin-right:15px;">'+concprog.prompt+'</label>'
            if concprog.pg_sql_query:
                cursor.execute(concprog.pg_sql_query)
                results = cursor.fetchall()
                a = concprog.prompt
                if a[len(a)-1] == "*":
                    html +='<select required class="form-control js-example-basic-single form-control-sm" id="" name="'+concprog.prompt+'">'
                    html +='<option value="">Select '+concprog.prompt+'</option>'
                    for value in results:
                        
                        html +='<option value="'+str(value[0])+'">'+str(value[1])+'</option>'
                    html +='</select>'
                    
                else:
                    html +='<select class="form-control form-control-sm js-example-basic-single" id="" name="'+concprog.prompt+'">'
                    html +='<option value="">Select '+concprog.prompt+'</option>'
                    for value in results:
                        html +='<option value="'+str(value[0])+'">'+str(value[1])+'</option>'
                    html +='</select>'
            else:
                a = concprog.prompt
                if a[len(a)-1] == "*":
                    if a.find("Date") == -1:
                        print(concprog.prompt)
                        if concprog.prompt =="p_org_id*" or concprog.prompt =="p_org_id" or concprog.prompt == "P_ORG_ID*" or concprog.prompt == "P_ORG_ID" or concprog.prompt == "ORG_ID" or concprog.prompt == "ORG_ID*" or concprog.prompt == 'Org Id*':
                            html +='<input readonly style="height: unset;" class="form-control form-control-sm" type="text" name="'+concprog.prompt+'" value="'+str(org_id)+'" />'
                        elif concprog.prompt =="P_APPS_USER*" or concprog.prompt =="P_APPS_USER":
                            html +='<input class="P_APPS_USER" readonly style="height: unset;" class="form-control form-control-sm" type="text" name="'+concprog.prompt+'" value="SERADMIN" />'
                        else:
                            html +='<input required style="height: unset;" class="form-control form-control-sm" type="text" name="'+concprog.prompt+'" />'
                    else:
                        html +='<input required style="height: unset;" class="form-control form-control-sm" pattern="\d{2}-\d{2}-\d{4}" type="date" name="'+concprog.prompt+'" />'
                    
                else:
                  
                    if a.find("Date") == -1:
                        if concprog.prompt =="p_org_id*" or concprog.prompt =="p_org_id" or concprog.prompt == "P_ORG_ID*" or concprog.prompt == "P_ORG_ID*" or concprog.prompt == "ORG_ID" or concprog.prompt == "ORG_ID*" or concprog.prompt == 'Org Id':
                            html +='<input readonly style="height: unset;" class="form-control form-control-sm" type="text" name="'+concprog.prompt+'" value="'+str(org_id)+'" />'
                        elif concprog.prompt =="P_APPS_USER*" or concprog.prompt == "P_APPS_USER":
                            html +='<input class="P_APPS_USER" readonly style="height: unset;" class="form-control form-control-sm" type="text" name="'+concprog.prompt+'" value="SERADMIN" />'
                        else:
                            html +='<input style="height: unset;" class="form-control form-control-sm" type="text" name="'+concprog.prompt+'" />'
                    else:
                
                        html +='<input style="height: unset;" class="form-control form-control-sm" pattern="\d{2}-\d{2}-\d{4}" type="date" name="'+concprog.prompt+'" />'
            html +='</div>'

    op_unit = OperatingUnit.objects.all()
    op_serializer = OperatingUnitSerializer(op_unit, many=True)
    operation_unit = op_serializer.data
    context ={}
    context = {
       'concprog':html,
       'operation_unit':operation_unit,
    }
    return JsonResponse(context,safe=False)

def AddConcProgView(request):
    

    account_number = request.GET.get('Customer Number*',None)
    mand_customer = True
    if account_number is None:
        account_number = request.GET.get('Customer Number',None)
        mand_customer = False

    customer = Customer.objects.filter(account_number=account_number or None).first()
    if not customer:
        if mand_customer:
            messages.error(request, 'Error: No Such Customer Found')    
            return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/'))



    location_code = request.session.get('location','')
    if location_code:
        arlocation = ARLocations.objects.filter(loc_code=location_code)
        org_id = arlocation[0].org_id
    else:
        resp = get_loginuser_details(request)
        org_id=resp['defs'].get('org_id')
        
    req_params = request.META['QUERY_STRING']
    params = req_params.split('&')
    req_param ={}
    param_value_data = []
    param_array = []
    for param in params:
        param_data = param.split('=')
        req_param= {
            param_data[0]: param_data[1]
        }
        param_value_data.append(param_data[1])
        param_array.append(req_param)
    concprog = ConcProgMaster.objects.filter(concurrent_program_id=param_array[0].get('concprog_id')).order_by('id')
    concreqhdr = ConcReqHdr.objects.create(
        header_id = get_next_value("setup_concreqhdr"),
        concurrent_program_id = concprog[0].concurrent_program_id,
        program_short_name = concprog[0].application_short_name,
        program = concprog[0].user_concurrent_program_name,
        request_date =datetime.now(),
        user_concurrent_program_name = concprog[0].user_concurrent_program_name,
    )
    concreq_stg = concreqhdr_stg.objects.create(
        header_id = get_next_value("setup_concreqhdr"),
        org_id = org_id,
        concurrent_program_id = concprog[0].concurrent_program_id,
        program_short_name = concprog[0].application_short_name,
        program = concprog[0].user_concurrent_program_name,
        request_date = datetime.now(),
        user_concurrent_program_name = concprog[0].user_concurrent_program_name,
    )
    param_value_data.pop(0)
    i = 0
    # import pdb; pdb.set_trace()
    for conc in concprog:
        if conc.prompt.find("Date") != -1:
            print(param_value_data[i])
            if conc.date_format == 'Y':
                if param_value_data[i]:
                    parsed_date = datetime.strptime(param_value_data[i], '%Y-%m-%d')
                    formatted_date = parsed_date.strftime('%d-%b-%Y')
                    formatted_date = formatted_date.replace(parsed_date.strftime('%b'), parsed_date.strftime('%b').upper())
                else:
                    formatted_date = ""
            else:
                if param_value_data[i]:
                    parsed_date = datetime.strptime(param_value_data[i], '%Y-%m-%d')
                    formatted_date = parsed_date.strftime("%Y/%m/%d %H:%M:%S")
                else:
                    formatted_date = ""
            concreqdtl= ConcReqDtl.objects.create(
                header_id = concreqhdr.header_id,
                parameter_name = conc.end_user_column_name,
                prompt = conc.prompt,
                parameter_value = formatted_date,
                column_seq_num =conc.column_seq_num
            )
            concreqdtl= concreqdtl_stg.objects.create(
                header_id = concreq_stg.header_id,
                parameter_name = conc.end_user_column_name,
                prompt = conc.prompt,
                parameter_value = formatted_date,
                column_seq_num =conc.column_seq_num
            )
        elif conc.prompt.find("Customer Number") != -1:
            if param_value_data[i]:
                customer = Customer.objects.filter(account_number=param_value_data[i]).first()
                if customer:
                    cust_account_id = customer.cust_account_id
                else:
                    cust_account_id= ""
            else:
                cust_account_id= ""
            concreqdtl= ConcReqDtl.objects.create(
                header_id = concreqhdr.header_id,
                parameter_name = conc.end_user_column_name,
                prompt = conc.prompt,
                parameter_value = cust_account_id,
                column_seq_num =conc.column_seq_num
            )
            concreqdtl= concreqdtl_stg.objects.create(
                header_id = concreq_stg.header_id,
                parameter_name = conc.end_user_column_name,
                prompt = conc.prompt,
                parameter_value = cust_account_id,
                column_seq_num =conc.column_seq_num
            )
        elif conc.prompt.find("Order No From") != -1:
            print("---------------------------------------", param_value_data[i])
            if param_value_data[i]:
                order = SalesOrder.objects.filter(om_order_number=param_value_data[i]).first()
                if order:
                    order_header_id = order.order_header_id
                else:
                    order_header_id= ""
            else:
                order_header_id= ""
            concreqdtl= ConcReqDtl.objects.create(
                header_id = concreqhdr.header_id,
                parameter_name = conc.end_user_column_name,
                prompt = conc.prompt,
                parameter_value = order_header_id,
                column_seq_num =conc.column_seq_num
            )
            concreqdtl= concreqdtl_stg.objects.create(
                header_id = concreq_stg.header_id,
                parameter_name = conc.end_user_column_name,
                prompt = conc.prompt,
                parameter_value = order_header_id,
                column_seq_num =conc.column_seq_num
            )
        else:
            value = param_value_data[i].replace("+", " ")
            concreqdtl= ConcReqDtl.objects.create(
                header_id = concreqhdr.header_id,
                parameter_name = conc.end_user_column_name,
                prompt = conc.prompt,
                parameter_value = value,
                column_seq_num =conc.column_seq_num
            )
            concreqdtl= concreqdtl_stg.objects.create(
                header_id = concreq_stg.header_id,
                parameter_name = conc.end_user_column_name,
                prompt = conc.prompt,
                parameter_value = value,
                column_seq_num =conc.column_seq_num
            )
        i += 1

    url = OIC_ENDPOINTS['submitconcreq'][settings.ENV]
    payload = {
      "header_id":concreq_stg.header_id
    }
    call_oracle_api_async(url,payload,request)
    messages.success(request, 'Request submitted successfully')    
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/'))

def download_file(request):
    header_id = request.GET.get('id')
    so_number = request.GET.get('so_number','')
    try:
        concreqhdr = concreqhdr_stg.objects.get(header_id=header_id)
        binary_data = concreqhdr.output_file
        response = HttpResponse(content_type='application/octet-stream')
        if so_number != '':
            so_obj = SalesOrder.objects.filter(order_number=so_number)
            if so_obj.first().attribute11 is None:
                so_obj.update(attribute11='Y')


        if concreqhdr.concurrent_program_id == 681579 or concreqhdr.concurrent_program_id == 681578 or concreqhdr.concurrent_program_id == 680580 or concreqhdr.concurrent_program_id == 680579 or concreqhdr.concurrent_program_id == 682578:
            if concreqhdr.output_file_extn == "PDF":
                response['Content-Disposition'] = 'attachment; filename="Invoice#'+header_id+'.pdf"'
            elif concreqhdr.output_file_extn == "EXCEL":
                response['Content-Disposition'] = 'attachment; filename="Invoice#'+header_id+'.xls"'
        else:
            if concreqhdr.output_file_extn == "PDF":
                response['Content-Disposition'] = 'attachment; filename="Request#'+header_id+'.pdf"'
            elif concreqhdr.output_file_extn == "EXCEL":
                response['Content-Disposition'] = 'attachment; filename="Request#'+header_id+'.xls"'
        response.write(binary_data)
        return response
    except concreqhdr_stg.DoesNotExist:
        return HttpResponse('Object not found.', status=404)
# class TemplateHTMLEmailApi(DRF_views.APIView):
#     permission_classes = ()
#     authentication_classes = ()
#     def post(self, req, *args, **kwargs):
#         template_name = req.data.get('template_name', None)
#         # pdf_only = req.data.get('pdf_only', None)
#         header_context = req.data.get('header_context', dummy_header_context)
#         data_list = req.data.get('data_list', dummy_data_list)
#         try:
#             template_html = get_html_for_template_name(template_name, header_context, data_list)
#             return JsonResponse({'html':template_html})
#         except Exception as e:
#             print(e)
#             return JsonResponse({'msg': "Template not found"}, status=400)

from core.models import APILog
from django.conf import settings

def render_send_email(to,cc,subject,template_html,created_by=-1,attachments=None):
    
    email_content = f"""{to}|\n{cc}|\n{subject}|\n"""

    logObj = APILog.objects.create(
        url = settings.EMAIL_HOST +':'+settings.EMAIL_PORT,
        method = 'SMTP',
        request_body = email_content,
        response_code = '',
        started_at = timezone.now(),
        tenant = Inventory.objects.get(organization_id = 94),
        created_by= created_by,
    )
    resp_email = send_async_mail_cc(logObj.id,subject,template_html,settings.FROM_EMAIL,to,cc,attachments)

    return {'html':template_html}
    


def template_render_send_email(to,cc,subject,template_name,header_context,data_list,created_by=-1,attachments=None):
    template_html = get_html_for_template_name(template_name, header_context, data_list,-1)
    
    email_content = f"""{to}|\n{cc}|\n{subject}|\n{template_name}|\n{header_context}"""

    logObj = APILog.objects.create(
        url = settings.EMAIL_HOST +':'+settings.EMAIL_PORT,
        method = 'SMTP',
        request_body = email_content,
        response_code = '',
        started_at = timezone.now(),
        tenant = Inventory.objects.get(organization_id = 94),
        created_by= created_by,
    )
    resp_email = send_async_mail_cc(logObj.id,subject,template_html,settings.FROM_EMAIL,to,cc,attachments)

    

    return {'html':template_html}

class TemplateHTMLEmailApi(DRF_views.APIView):
    permission_classes = ()
    authentication_classes = ()
    def post(self, req, *args, **kwargs):
        template_name = req.data.get('template_name', None)
        header_context = req.data.get('header_context', dummy_header_context)
        data_list = req.data.get('data_list', dummy_data_list)
        to = req.data.get('to', "tabrezg@alyousuf.com")
        cc = req.data.get('cc', "tabrezg@alyousuf.com")
        subject = req.data.get('subject', None)
        # try:
        res = template_render_send_email(to,cc,subject,template_name,header_context,data_list,created_by=self.request.user.id)
        return JsonResponse(res)
        # except Exception as e:
        #     print(e)
        #     return JsonResponse({'msg': "Template not found"}, status=400)
class ExecSql(DRF_views.APIView):
    def get(self, req, *args, **kwargs):
        query = req.GET.get('query', None)
        # query = "UPDATE setup_concreqhdr_stg SET phase_code='C' WHERE header_id=1020"

        import psycopg2
        import environ

        env = environ.Env()
        # Establish a connection to the PostgreSQL database
        conn = psycopg2.connect(
            host=env('DATABASE_HOST'),
            port=env('DATABASE_PORT'),
            database=env('DATABASE_NAME'),
            user=env('DATABASE_EXT_SQL_USER'),
            password=env('DATABASE_EXT_SQL_PASSWORD')
        )
        cursor = conn.cursor()
        try:
            cursor.execute(query)
            conn.commit()
            # results = cursor.fetchall()
            # for row in results:
            #     print(row)

            return HttpResponse("query run successfully")
        except Exception as e:
            import logging
            logging.error(f"An error occurred: {str(e)}")
            return HttpResponseServerError(logging.error(f"An error occurred: {str(e)}"))
        cursor.close()
        conn.close()


class CustomerDmsView(ActionView, View):
    template_name = "customer_dms.html"
    model = ConcReqHdr
    app_name = 'stepup'

    def get(self, request, action_type=None, row_id=None):
        data = {}
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' and action_type==None:
            return JsonResponse(data)
   
        return render(request, self.template_name, context=data)

def DmsRecordsView(request):
    start_date = request.POST.get('start_date', None)
    end_date = request.POST.get('end_date', None)
    status = request.POST.get('status', None)
    dms_number = request.POST.get('dms_number', None)
    order_number = request.POST.get('order_number', None)
    customer_number = request.POST.get('customer_number', None)
    phone_number = request.POST.get('phone_number', None)
    lpo_number = request.POST.get('lpo_number', None)

    if start_date:
        parsed_date_start_date = datetime.strptime(start_date, "%d-%b-%Y")
        start_date_lo = parsed_date_start_date.strftime("%Y-%m-%d")
    if end_date:
        parsed_date_end_date = datetime.strptime(end_date, "%d-%b-%Y")
        end_date_lo = parsed_date_end_date.strftime("%Y-%m-%d")
    else:
        start_date_lo = ""
        end_date_lo =  ""
    url = OIC_ENDPOINTS['AYEgetDMSData'][settings.ENV]
    # payload ={
    #     "p_status": "CLOSED",
    #     "p_customer_id": "1670879",
    #     "p_dms_do": "13640027.1",
    #     "p_lpo_number": "413672",
    #     "p_from_date": "",
    #     "p_order_id": "14036514",
    #     "p_to_date": "",
    #     "p_phone_no": "971503003555"
    # }
    payload ={
        "p_status": status,
        "p_customer_id": customer_number,
        "p_dms_do": dms_number,
        "p_lpo_number": lpo_number,
        "p_from_date": start_date_lo,
        "p_order_id": order_number,
        "p_to_date": end_date_lo,
        "p_phone_no": phone_number
    }
    print('payload-------->',payload)
    resp = call_oracle_api(url,payload)
    print('resp-------->',resp)  
    return JsonResponse(resp) 

def TripDetailsView(request):
    trip_id = request.GET.get('trip_id', None)
    dms_do = request.GET.get('dms_do', None)
    dms_line = request.GET.get('dms_line', None)
    url = OIC_ENDPOINTS['AYEDMSGetTripDetails'][settings.ENV]
    payload ={
        "p_trip_id": trip_id
    }
    print('payload-------->',payload)
    resp = call_oracle_api(url,payload)
    print('resp-------->',resp)

    url2 = OIC_ENDPOINTS['DMSGetTripDetails'][settings.ENV]
    payload2 ={
        "p_dms_line_id": dms_line,
        "p_dms_do_no": dms_do
    }
    print('payload-------->',payload2)
    resp2 = call_oracle_api(url2,payload2)
    print('resp-------->',resp2)
    context={
            'trip':resp,
            'tripDetails': resp2
        }
    return JsonResponse(context)

def DocumentationDetailsView(request):
    dms_do = request.GET.get('dms_do', None)
    url = OIC_ENDPOINTS['AYEDMSdocuDets'][settings.ENV]
    payload ={
        "pdmsdo": dms_do.replace("'","")
    }
    resp = call_oracle_api(url,payload)
    return JsonResponse(resp)

