from core.views import BaseModelViewSet
from .serializers import *
from django.views.generic.base import View, TemplateView
from django.shortcuts import reverse, render
from core.utils import get_datatable_col_info
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
import pandas as pd
from .models import *


BASE_PRICELISTUPDATEHDR_QUERY = PricelistUpdateHdr.objects.all().order_by('-creation_date')

class PricelistUpdateHdrViewSet(BaseModelViewSet):
    serializer_class = PricelistUpdateHdrSerializer

    def get_queryset(self):
        tab_status = self.request.GET.get('tab_status', None)
        status = tab_status.split('#')[1]
        if status == 'ALL':
            query_set = BASE_PRICELISTUPDATEHDR_QUERY
        else:
            query_set = BASE_PRICELISTUPDATEHDR_QUERY.filter(status=status)
        return query_set

class PricelistUpdateIndexView(View):
    template_name = "pricelist_update/app.html"

    def get(self, request, installation_id=None):
        filter_props = self.headerbuckets(request)
        data = {
            "data_tabl_meta": self.pricelist_list_meta(request),
            "header_meta": {
                "title": "Pricelist upload",
                "add_label": "Add Pricelist upload",
                "filter_label": "pricelist_upload",
                "add_title": "Add price list upload",
                "add_link": "/pricelist/add/",
                "add_unique_name": "addpricelist_upload",
                "filter_props_data" : filter_props,
            },
            "view_meta": {
                "row_view_url": "/pricelist/update/0",
                "width": "75",
                "title": "View Pricelist upload",
            },
        }

        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse(data)

        return render(request, self.template_name, context=data)

    def headerbuckets(self,request,json_flag=True,filter_date=None):
        queryset = PricelistUpdateHdr.objects
        filter_props = [
            {
                "label": "ALL",
                "count": queryset.all().count(),
                "active": True,
                "value": "status#ALL",
                "order": 1
            },
            {
                "label": "OPEN",
                "count": queryset.filter(status = 'OPEN').count(),
                "active": False,
                "value": "status#OPEN",
                "order": 2
            },
            {
                "label": "IN PROCESS",
                "count": queryset.filter(status = 'IN PROCESS').count(),
                "active": False,
                "value": "status#IN PROCESS",
                "order": 3
            },
            {
                "label": "COMPLETED",
                "count": queryset.filter(status = 'COMPLETED').count(),
                "active": False,
                "value": "status#COMPLETED",
                "order": 4
            },
            {
                "label": "REJECTED",
                "count": queryset.filter(status = 'REJECTED').count(),
                "active": False,
                "value": "status#REJECTED",
                "order": 4
            },
            ]

        return filter_props

    def pricelist_list_meta(self, request):
        model_name = "PricelistUpdateHdr"
        model_app_name = "pricelist_update"
        col_info = get_datatable_col_info(model_name, model_app_name)

        all_column_info = col_info["column_info"]
        display_col_indexes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

        all_column_info = [
            # {'data': 'id', 'name': 'id', 'title': 'ID','visible':False},
            {'data': 'batch_id', 'name': 'batch_id', 'title': 'Batch no'},
            {'data': 'price_list_name', 'name': 'price_list_name', 'title': 'Price List'},

            {'data': 'status', 'name': 'status', 'title': 'Status',},
            {'data': 'created_by', 'name': 'created_by', 'title': 'Created By','searchable':True},
            {'data': 'last_updated_by', 'name': 'last_updated_by', 'title': 'Last Updated by','searchable':True},
            {'data': 'creation_date', 'name': 'creation_date', 'title': 'Creation Date',},
            {'data': 'last_update_date', 'name': 'last_update_date', 'title': 'Last update date',},            
        ]
        cust_classes = {
            "Created": "btn-primary",
            "Draft": "btn-info",
            "QUALIFIED": "btn-success",
            "ASSIGNED": "btn-warning",
        }

        return {
            "column_info": all_column_info,
            "table_name": "Price lists" ,
            "cust_classes": cust_classes,
            "data_table_url": reverse("pricelist:pricelist_data_list-list"),
            "row_view_url": "/pricelist/update/0/",
            "custom_columns": {},
            "display_col_indexes": display_col_indexes,
        }

from core.models import Inventory, UserOrganisationInventory

class PriceListAddView(TemplateView):
    template_name = 'pricelist_update/add.html'

    def get_context_data(self, *args, **kwargs):
        context = super(PriceListAddView, self).get_context_data(*args, **kwargs)
        print(self.request.user.id)
        user_inventories = UserOrganisationInventory.objects.filter(user=self.request.user.id)
        context['roles_json'] = list(set([item.role.identifier for item in user_inventories if item.role.identifier is not None]))
        print(context['roles_json'])
        return context


class PriceListUpdateView(TemplateView):
    template_name = "pricelist_update/add.html"

    def get_context_data(self, batch_id, **kwargs):
        user_inventories = UserOrganisationInventory.objects.filter(user=self.request.user.id)

        context = super(PriceListUpdateView, self).get_context_data(**kwargs)
        context['main_obj'] = pd.DataFrame(PricelistUpdateHdr.objects.filter(batch_id=batch_id).values()).astype('str').fillna('').to_json(orient='records')
        context['lines'] = pd.DataFrame(PricelistUpdateLine.objects.filter(batch_id=batch_id).values('item_code', 'cur_price', 'cur_price_vat', 'disc_by', 'disc_value', 'new_price', 'new_price_vat', 'price_list_start_date', 'price_list_end_date',)).astype('str').fillna('').to_json(orient='records')
        context['is_update'] = True
        context['glo_is_update_flag'] = 'Y'
        context['roles_json'] = list(set([item.role.identifier for item in user_inventories if item.role.identifier is not None]))

        context['org_inv'] = Inventory.objects.filter(organization_id=self.request.session['tenant']).first()
        print(context['roles_json'])
        return context


def search_pricelist_items(request):
    if (request.GET.get('items')):
        data = request.GET.get('items')
        pricelist = request.GET.get('pricelist')
        row_data = list()
        item_data = data.split(",")
        for item in item_data:
            item_reuslt = item.split("~")
            row_data.append(item_reuslt[0])
        
        qurey_data = PriceList.objects.filter(item_code__in=row_data, name=pricelist).values('item_code', 'inventory_item_id', 'price').distinct()

        df = pd.DataFrame(qurey_data).astype('str')
        if not df.empty:
            df['item_code']=df['item_code']
            df['inventory_item_id']=df['inventory_item_id']  
            df['price']=df['price']  

        if qurey_data:
            qurey_datas = PriceList.objects.filter(item_code__in=row_data, name=pricelist).values('item_code').distinct()
            item_id = list()
            for qurey in qurey_datas:
                item_id.append(str(qurey.get('item_code')))

            temp3 = [x for x in row_data if x not in item_id]
        else:
            temp3 = row_data
        context = {
            'data': df.to_dict(orient="records"),
            'not_found': temp3
        }
        return JsonResponse(context,safe=False)


class PriceListCreateAPI(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        tableData = request.data.get('tableData', [])
        serializer = PricelistUpdateHdrSerializer(data=data.get('data'))
        if serializer.is_valid():
            header:PricelistUpdateHdr = serializer.save()
            if len(tableData):
                for line in tableData:
                    line:PricelistUpdateLine = PricelistUpdateLine.objects.create(
                            batch_id=header,
                            item_code=line['item_code'],
                            cur_price=line['cur_price'],
                            cur_price_vat=line['cur_price_vat'],
                            disc_by=line['disc_by'],
                            disc_value=line['disc_value'],
                            new_price=line['new_price'],
                            new_price_vat=line['new_price_vat'],
                            price_list_start_date=line['price_list_start_date'],
                            price_list_end_date=line['price_list_end_date'],
                        )
            header.status = 'OPEN'
            header.save()
            return Response({"msg": "Saved", 'batch_id': header.batch_id, 'obj': PricelistUpdateHdrSerializer(header).data}, status=200)
        return Response(serializer.errors, status=400)

    def put(self, request, *args, **kwargs):
        data = request.data
        tableData = request.data.get('tableData', [])

        batch_id = request.data.get("data").get('batch_id')
        header = PricelistUpdateHdr.objects.get(batch_id=batch_id)
        serializer = PricelistUpdateHdrSerializer(header, data=data.get('data'))
        if serializer.is_valid():
            header:PricelistUpdateHdr = serializer.save()
            PricelistUpdateLine.objects.filter(batch_id=header).delete()
            if len(tableData):
                for line in tableData:
                    line:PricelistUpdateLine = PricelistUpdateLine.objects.create(batch_id=header,**line,)
            return Response({"msg": "Saved", 'batch_id': header.batch_id, 'obj': PricelistUpdateHdrSerializer(header).data}, status=200)
        return Response(serializer.errors, status=400)



from setup.views import render_send_email
from core.models import EmployeeRole
from django.contrib.auth import get_user_model
User = get_user_model()

class PriceListStatusUpdateAPI(APIView):
    def post(self, request, *args, **kwargs):
        status = request.data.get("status")
        batch_id = request.data.get("batch_id")
        header = PricelistUpdateHdr.objects.get(batch_id=batch_id)
        if status:
            header.status = status

            org_inv = Inventory.objects.filter(organization_id=self.request.session['tenant']).first()
            print(org_inv)
            if status == 'IN PROCESS':

                role_obj = EmployeeRole.objects.filter(identifier='PRICELIST_APPROVER_'+org_inv.org_type).first()
                user = User.objects.filter(username=role_obj.attribute2).first()
                print(user, user.email)
                if role_obj and role_obj.attribute1:
                    email_subject = f"""Submited | Price list update {batch_id}"""
                    html_message = f"""Submited | Price list update {batch_id}"""
                    
                    header.save()

                    render_send_email(
                            [user.email],
                            [],
                            email_subject,
                            html_message,
                            created_by=request.user.username,
                            attachments=[]
                        )
                else:
                    return Response({'msg': 'Approver not configured in the system, coudn"t update!!'}, status=400)
                
            elif status in ['REJECTED', 'COMPLETED']:
                user = User.objects.filter(username=header.created_by).first()
                if user and user.email:
                    header.save()

                    term = 'Rejected' if status == 'REJECTED' else 'Approved'

                    email_subject = f"""{term} | Price list update {batch_id}"""
                    html_message = f"""{term} | Price list update {batch_id}"""
                    render_send_email(
                            [user.email, ],
                            [],
                            email_subject,
                            html_message,
                            created_by=request.user.username,
                            attachments=[]
                        )
                else:
                    return Response({'msg': 'Email not configured in the system for price list creator, coudn"t update!!'}, status=400)

                
        return Response({"msg": "Status changed", 'batch_id': header.batch_id}, status=200)





import json

def lovs(request):
    query = request.POST.get('q','')
    action = request.POST.get('action','')
    context = json.loads(request.POST.get('context','{}'))
   
    if action == 'price_list_name':
        q_data = [
            {"name":"ALY Price List 1", "id":1},
            {"name":"ALY Price List 2", "id":2}
        ]
        df = pd.DataFrame(q_data).astype('str')

        if not df.empty:
            df['id']=df["name"]
            df['text']=df["name"]    
 
    data = df.to_dict(orient="records")
    count = len(data)
    return JsonResponse({
        'incomplete_results': "false",
        'items': data,
        'total_count': count
    })