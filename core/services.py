import json
import requests
import environ
env = environ.Env()
environ.Env.read_env()
import base64
from .serializers import TableColumn, TableColumnSerializer 
from .models import APILog
import datetime
from django.utils import timezone
from core.models import *
from core.utils import get_loginuser_details
from django.http import JsonResponse
import time
from core.utils import get_lookupvalue_obj
from core.endpoints import OIC_ENDPOINTS
import threading
from setup.services import get_html_for_template_name
from django.conf import settings
from accounts.email import send_async_mail_cc
import traceback
from django.conf import settings


class CallOracleThread(threading.Thread):
    def __init__(self, url,payload,request,method='POST'):
        self.url = url
        self.payload = payload
        self.method = method
        self.request = request
        threading.Thread.__init__(self)
    def run(self):
        url= self.url
        payload = self.payload
        method = self.method
        request = self.request
        if "https://" not in url: 
            url = env('OIC_URL')+url
        
        payload = json.dumps(payload)
        basic_auth = env('OIC_USERNAME')+':'+env('OIC_PASSWORD')
        encoded_basic_auth = base64.b64encode(basic_auth.encode()).decode()
    
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Basic '+encoded_basic_auth
        }

        try:
            resp = get_loginuser_details(request)
            org_id=resp['defs'].get('org_id')
            tenant = Inventory.objects.get(pk=org_id)
            log_id = APILog.objects.create(
                url = url,
                method = method,
                request_body = payload,
                response_code = '',
                tenant = tenant,
                created_by= resp['defs'].get('oracle_user_name'),
                started_at = timezone.now()
            )
        except Exception as e:
            log_id = APILog.objects.create(
                url = url,
                method = method,
                request_body = payload,
                response_code = '',
                started_at = timezone.now(),
                tenant = None,
                created_by= self.request.session.get('user'),
            )

        try:
            response = requests.request("POST", url, headers=headers, data=payload)
            res_json = response.json()
            if type(res_json) is dict:
                if 'topLevelArray' in list(res_json):
                    res_json = res_json['topLevelArray']
        except Exception as e:
            print(e)
            res_json = str(response.text)
            errors = {
                "exception": str(e),
                "response": res_json,
            }
            return JsonResponse(errors,status=500,safe=False)
        
        log_id.finished_at = timezone.now()
        log_id.response_body = response.text
        log_id.response_code = response.status_code
        log_id.save()
            
        if(response.text != ''):
            return res_json
        else:
            return "No Response"


def call_oracle_api_async(url,payload,request,method='POST'):
    CallOracleThread(url,payload,request,method='POST').start()




def call_oracle_api_without_payload(url,payload,method='POST'):
    if "https://" not in url: 
        url = env('OIC_URL')+url

    print(url)
    
    basic_auth = env('OIC_USERNAME')+':'+env('OIC_PASSWORD')
    encoded_basic_auth = base64.b64encode(basic_auth.encode()).decode()
    headers = {
        'Authorization': 'Basic '+encoded_basic_auth
    }
    log_id = APILog.objects.create(
            url = url,
            method = method,
            request_body = payload,
            response_code = '',
            started_at = timezone.now()
        )
    print('url',url)
    print('headers',headers)
    print('payload',payload)

    response = requests.request("POST", url, headers=headers, data=payload)
    print('response',response)
    try:
        res_json = response.json()
        if type(res_json) is dict:
            if 'topLevelArray' in list(res_json):
                res_json = res_json['topLevelArray']
    except ValueError as e:
        res_json = str(response)
        return 
    
    log_id.finished_at = timezone.now()
    log_id.response_body = response.text
    log_id.response_code = response.status_code
    log_id.save()

    if(response.text != ''):
        return res_json
    else:
        return "No Response"



def call_oracle_api(url,payload,method='POST'):
    
    if "https://" not in url: 
        url = env('OIC_URL')+url
    payload = json.dumps(payload)

    print(url)
    
    basic_auth = env('OIC_USERNAME')+':'+env('OIC_PASSWORD')
    encoded_basic_auth = base64.b64encode(basic_auth.encode()).decode()
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic '+encoded_basic_auth
    }

    log_id = APILog.objects.create(
            url = url,
            method = method,
            request_body = payload,
            response_code = '',
            started_at = timezone.now()
        )

    response = requests.request("POST", url, headers=headers, data=payload)
    print('response',response)
    try:
        res_json = response.json()
        if type(res_json) is dict:
            if 'topLevelArray' in list(res_json):
                res_json = res_json['topLevelArray']
    except ValueError as e:
        res_json = str(response)
        return 
    
    log_id.finished_at = timezone.now()
    log_id.response_body = response.text[:5000]
    log_id.response_code = response.status_code
    log_id.save()

    if(response.text != ''):
        return res_json
    else:
        return "No Response"
    

def get_table_columns(table_identifier, action=False):
    columns = TableColumn.objects.filter(table__table_identifier=table_identifier).order_by('column_order')
    data = TableColumnSerializer(columns, many=True).data
    if action or not len(columns):
        action_column = {"title": "Action", "data": "action"}
        data.insert(0, action_column)
    return data



def call_receipt_creation_oracle_api(url,payload,request,method='POST'):
    ReciptCallOracleThread(url,payload,request,method='POST').start()

class ReciptCallOracleThread(threading.Thread):
    def __init__(self, url,payload,request,method='POST'):
        self.url = url
        self.payload = payload
        self.method = method
        self.request = request
        threading.Thread.__init__(self)
        
    def run(self):
        #time.sleep(62)
        method = self.method
        url=self.url
        payload=self.payload
        if "https://" not in url: 
            url = env('OIC_URL')+url
            
        if 'pdcbatchnum' in payload:
            receiptinfo = Receipt.objects.filter(pdc_batch_number=payload['pdcbatchnum']).first()
            receipt_id = receiptinfo.id
        else:
            receipt_id = payload['receipt_id']
        payload = json.dumps(payload)
        print('payload--->',payload)
        print(url)

        basic_auth = env('OIC_USERNAME')+':'+env('OIC_PASSWORD')
        encoded_basic_auth = base64.b64encode(basic_auth.encode()).decode()
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Basic '+encoded_basic_auth
        }
        
        connection_error_str = 'lost RPC connection to heterogeneous remote agent'
        retry_count = int(get_lookupvalue_obj('RECEIPT_RETRY','RECEIPT_CREATION').meaning)
        oic_status_flag = False
        i = 0
        while i < retry_count and oic_status_flag == False:

            log_id = APILog.objects.create(
                url = url,
                method = method,
                request_body = payload,
                response_code = '',
                started_at = timezone.now(),
                tenant = Inventory.objects.get(organization_id = 94),
                created_by= self.request.session.get('user'),
            )

            response = requests.request("POST", url, headers=headers, data=payload)
            try:
                res_json = response.json()
                if type(res_json) is dict:
                    if 'topLevelArray' in list(res_json):
                        res_json = res_json['topLevelArray']
            except ValueError as e:
                res_json = str(response)
                return 
            
            log_id.finished_at = timezone.now()
            log_id.response_body = response.text
            log_id.response_code = response.status_code
            log_id.save()

            if response.text != '' and connection_error_str not in response.text:
                oic_status_flag = True

            i += 1

        receipt = Receipt.objects.get(id=receipt_id)
        receipt_number = ''
        if(response.text != ''):
            resp = res_json
            print('resp---->',resp)
            if(receipt.receipt_method_type.pk!=26):
                cash_receipt_id =  resp['cash_receipt_id'] if 'cash_receipt_id' in resp and resp['cash_receipt_id']!='' else None
                if 'adv_tax_inv_number' in resp and resp['adv_tax_inv_number']!='':
                    cash_receipt_id = resp['adv_cash_receipt']  if resp['adv_cash_receipt']!='' else None

                doc_number = resp['Normal_doc_seq_value'] if 'Normal_doc_seq_value' in resp else None
                if 'adv_tax_inv_number' in resp and resp['adv_tax_inv_number']!='':
                    doc_number = resp['adv_doc_seq_value']  if resp['adv_doc_seq_value']!='' else None

                if('SR_cash_receipt_id' in resp and resp['SR_cash_receipt_id']!=''):
                    cash_receipt_id = resp['SR_cash_receipt_id']
                    doc_number = resp['SR_Order_doc_seq_value']

                oracle_status = "finalized" if cash_receipt_id!=None else 'oracle_failed'
    
                if(receipt.cash_receipt_id=='' or receipt.cash_receipt_id==None):
                    receipt.document_number = doc_number
                    receipt.cash_receipt_id = cash_receipt_id
                    receipt.receipt_creation_status = oracle_status
                    receipt.tenant = Inventory.objects.get(organization_id = 94)
                    receipt.created_by = receipt.created_by
                else:
                    receipt.receipt_creation_status = "finalized"

                receipt.save()
                
                receipt_number += receipt.receipt_number +','
                if oracle_status=='oracle_failed':
                    send_receipt_alert(receipt)
                if('adv_tax_inv_number' in resp and resp['adv_tax_inv_number']!=''):
                    log_id = AdvTaxReceiptInvoice.objects.create(
                                receipt = receipt,
                                cash_receipt_id =  cash_receipt_id ,
                                amount_before_vat = resp['amount_before_vat'] ,
                                vat_amount = resp['vat'] ,
                                adv_tax_inv_number = resp['adv_tax_inv_number'] ,
                                tax_rate =5 ,
                                adv_receipt_status = resp['adv_receipt_status'] ,
                                adv_receipt_status_msg = resp['adv_tax_invoice_status'] ,
                                tenant = Inventory.objects.get(organization_id = 94),
                                created_by= self.request.session.get('user'),
                            )
                    
                    ati_resp = {
                        'amount_before_vat' : resp['amount_before_vat'],
                        'vat' : resp['vat'],
                        'adv_tax_inv_number' : resp['adv_tax_inv_number'],
                        'adv_receipt_status' : resp['adv_receipt_status'],
                        'adv_tax_invoice_status' : resp['adv_tax_invoice_status'],
                    }
                    
                if(receipt.ob_request_number!=None):
                    ob_request_number = receipt.ob_request_number
                    finalized_receipts = Receipt.objects.filter(ob_request_number=ob_request_number).exclude(receipt_creation_status='finalized')
                    if not finalized_receipts:
                        url = OIC_ENDPOINTS['ayothbranch'][settings.ENV]
                        payload = {
                                        "REQUEST_NUMBER": ob_request_number
                                    }
                        otherbranch_resp = call_oracle_api(url,payload)
                        ob_status = 'INPROGRESS'
                        if 'ERROR_CODE' in otherbranch_resp and otherbranch_resp['ERROR_CODE']=='S':
                            ob_status = 'SUCCESS'
                        else:
                            ob_status = 'FAILED'
                        receipt = Receipt.objects.filter(ob_request_number=ob_request_number).update(
                                ob_oracle_status=ob_status
                            )

            elif(receipt.receipt_method_type.pk==26):
                pdc_batch = receipt.pdc_batch_number
                for receipt_data in resp:
                    doc_number = receipt_data['doc_seq_value'] if 'doc_seq_value' in receipt_data else ''
                    oracle_status = "finalized" if 'cash_receipt_id' in receipt_data and receipt_data['cash_receipt_id']!='' else 'oracle_failed'
                    receipt_id = receipt_data['receipt_id'] if 'receipt_id' in receipt_data else ''
                    if(receipt_id!=''):
                        pdcreceipt = Receipt.objects.filter(id=receipt_id).update(
                            cash_receipt_id = receipt_data['cash_receipt_id'] if 'cash_receipt_id' in receipt_data and receipt_data['cash_receipt_id']!='' else None,
                            document_number = doc_number,
                            receipt_creation_status = oracle_status
                            )
                        
                        if oracle_status=='oracle_failed':
                            send_receipt_alert(receipt)
                
            return res_json
        else:
            return "No Response"

def send_receipt_alert(receipt):
    try:
        to = ['mdjeelan@alyousuf.com',
                'fshaik@alyousuf.com',
                'nchalil@alyousuf.com',
                'tabrezg@alyousuf.com',
                'naveens@alyousuf.com',
                'sjehangir@alyousuf.com']
        cc = []
        subject = 'Receipt Failure Alert'
        template_name = 'RECEIPT_CREATION_FAILURE'
        data_list = []
        header_context ={
                    "receipt_number":receipt.receipt_number,
                    "receipt_type_code":receipt.receipt_type_code ,
                    "location": receipt.location,
                    "created_by":  receipt.created_by
                }  
        response = template_render_send_email(to,cc,subject,template_name,header_context,data_list)
    except Exception as e:
            print(e)
            print(traceback.print_exc())

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