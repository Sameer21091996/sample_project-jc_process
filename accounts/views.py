from django.shortcuts import render, redirect
from django.views.generic import View
from django.shortcuts import resolve_url
from django.http import  JsonResponse
import json
from django.contrib import messages
from django.shortcuts import reverse
from django.db.models import F

from core.views import ActionView, BaseModelViewSet
from core.models import  RolePermissions
from accounts.models import  CustomPermission, CustomRolePermission
from .serializers import *
from core.utils import get_datatable_col_info
from accounts.helpers import get_dynamic_menu, get_all_menu

# Create your views here.

from .auth_backend import ForceAuth
from django.contrib import messages, auth
from django.urls import reverse



def emetate(request):
  if request.method == 'GET':
    username= request.GET['u'].upper()
    request.session['TO_IMITATE'] = username
    user = ForceAuth.authenticate(request,request,username= username)
    res = auth.login(request, user,backend='accounts.auth_backend.ForceAuth')
    request.session['username'] = username

    request.session['user'] = username
    user_tenant = UserOrganisationInventory.objects.filter(user=user.id).first()
    request.session["tenant_disabled"] = "0"
    if user_tenant==None:
        tenant = None
    else:
        tenant = None if not user_tenant.inventory else user_tenant.inventory.pk
    request.session['tenant'] = tenant
    request.session['emp_id'] = UserProfile.objects.get(user_id=user.id).employee_id
    request.session['username'] = UserProfile.objects.get(user_id=user.id).user_name
    request.session['role'] = '' if not user_tenant else user_tenant.role.pk

    return redirect(reverse('core:home_iframe'))
  else:
    JsonResponse('Error',safe=False)
  
  return render(request, 'accounts/login.html')


class RolePermissionsView(ActionView, View):
        template_name = "app.html"
        model = RolePermissions
        app_name = 'accounts'
        sub_app_name = 'role_permissions'

        def get(self, request, action_type=None,row_id=None):
            if(action_type!=None):
                app_data = {
                    'app_name' : self.app_name
                }
                if(action_type=='add' or action_type=='edit'):
                    self.template_name = "addrolepermission.html"
                    all_roles = list(EmployeeRole.objects.annotate(value=F("id"), label=F("name"))
                        .values("value", "label"))
                    nav_menus = list(NavigationItem.objects.annotate(value=F("id"), label=F("name"))
                        .values("value", "label"))
                    custom_permissions = list(CustomPermission.objects.annotate(value=F("id"), label=F("name"))
                        .values("value", "label"))
                    edit_data = {}
                    if(action_type=='edit'):
                        role_permission  = RolePermissions.objects.get(pk=row_id)
                        edit_data['role_data'] =  {'employee_role':role_permission.employee_role.pk,
                                                   'navigation_item':role_permission.navigation_item.pk,
                                                   'full_access':  'true' if role_permission.full_access else 'false' ,
                                                   'delete_access':  'true' if role_permission.delete_access else 'false',
                                                   'edit_access': 'true' if role_permission.edit_access else 'false',
                                                   'read_access': 'true' if role_permission.read_access else 'false',
                                                   'create_access': 'true' if role_permission.create_access else 'false'}
                        edit_data['custom_data'] = list(CustomRolePermission.objects.filter(rolepermission=row_id).values_list('custompermission', flat=True))
                        
                    else:
                        edit_data['role_data'] =  {'employee_role':'',
                                                   'navigation_item':'',
                                                   'full_access': '',
                                                   'delete_access': '',
                                                   'edit_access': '',
                                                   'read_access': '',
                                                   'create_access': ''}
                        edit_data['custom_data'] = []
                    data = {'all_roles':all_roles,'nav_menus':nav_menus,
                            'custom_permissions':custom_permissions,'edit_data':edit_data}
                elif(action_type=='page_form_elements'):
                    model_data = { 
                            'model' : self.model ,
                            'title' : 'Add Role Permission'
                            }
                    data = self.page_form_elements(model_data,action_type,row_id)
                    #over right inputs
                    field_indexes = [3,4,5,6,7]
                    for input_index in field_indexes:
                        data['data'][input_index]['type'] = 'checkbox'
                        del data['data'][input_index]['validation']                    
            else:
                data_tabl_meta = role_permissions_data_list(True)
                header_meta = {"title": "Role Permissions",
                            "add_label": "Add Role Permissions",
                            "filter_label": "All Roles",
                            "add_title" : "Add Role Permission",
                            "add_link" : resolve_url( 'accounts:role_permissions', 'add'),
                            "add_unique_name" : "addrolepermission"
                            }
                view_meta = {
                    'row_view_url': resolve_url('accounts:role_permissions', 0),
                    'width': '40',
                    'title': 'Add Role Permission',
                    'form_elm_url' : '',
                }
                data = {
                    "data_tabl_meta": data_tabl_meta,
                    "header_meta": header_meta,
                    "view_meta": view_meta,
                }
                data = data
                
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse(data)
            
            return render(request, self.template_name, context=data)

        def post(self, request):
            post_data = json.loads(request.body)
            #custom_permissions = post_data['custom_permission']
            #post_data.pop("custom_permission", None)
            res = self.form_post(post_data)
            model = CustomRolePermission
            """ for custom_permission_id in custom_permissions:
                save_data = {'custompermission' : CustomPermission.objects.get(pk=int(custom_permission_id)), 
                             'rolepermission': RolePermissions.objects.get(pk=res['row_id'])}
                custom_per_data = model(**save_data)
                custom_per_data.save() """
            res['list_tab'] = 'accounts-role_permissions'
            messages.success(request, 'inserted')
            return JsonResponse(res)

class RolePermissionsViewSet(BaseModelViewSet):
    serializer_class = RolePermissionsSerializer
    
    def get_queryset(self):
        return RolePermissions.objects.all()
      
def role_permissions_data_list(self, isMeta=None):
    """Get permissions list .if ismeta is not none retun meta info for rable

    Parameters
    ----------
    isMeta:
        true if requesting meta info
    Returns
    -------
    json (if isMeta false)
        return enquiry list
    ObjectArr (if isMeta true)
        return table meta if isMeta variable true
    """

    model_name = 'RolePermissions'
    model_app_name = 'core'
    col_info = get_datatable_col_info(model_name,model_app_name)    
    all_column_info = col_info['column_info']
    display_col_indexes = col_info['display_col_indexes']
    table_name = "Role Permissions"  # table title

    # custom columns defenitions
    # => column index and column html that need to overwrite while rendering
    custom_columns = {
        4: 'cust_class',
        5: 'cust_class',
        6: 'cust_class',
        7: 'cust_class',
        8: 'cust_class',
    }        
    
    # custom column bg colours
    cust_classes = {
        "true" : "Y",
        "false" : "N",
    }

    # data-toggle="modal" data-target=".edit_modal"
    row_view_url = ''
    data_table_url = reverse("accounts:role_permissions_list-list")

    return {
        "column_info": all_column_info,
        "table_name": table_name,
        "cust_classes": cust_classes,
        "data_table_url": data_table_url,
        "row_view_url": row_view_url,
        "custom_columns": custom_columns,
        "display_col_indexes": display_col_indexes,
        "edit_form_url": resolve_url('accounts:role_permissions', 'edit',0) ,
    }

class RolesView(ActionView, View):
    template_name = "app.html"
    model = EmployeeRole
    app_name = 'accounts'
    sub_app_name = 'roles'

    def get(self, request, action_type=None,row_id=None):
        
        if(action_type!=None):
            app_data = {
                'app_name' : self.app_name
            }
            if(action_type=='add' or action_type=='edit'):
                self.template_name = "add.html"
                data = self.add_form_page(app_data,action_type,row_id)
            elif(action_type=='page_form_elements'):
                model_data = { 
                        'model' : self.model ,
                        'title' : 'Add Role '
                        }
                data = self.page_form_elements(model_data,row_id)
        else:
            data_tabl_meta = role_data_list(True)
            header_meta = {"title": "Role",
                        "add_label": "Add Role",
                        "filter_label": "All Roles",
                        "add_title" : "Add Role",
                        "add_link" : resolve_url( 'accounts:roles', 'add'),
                        "add_unique_name" : "addrole"
                        }
            view_meta = {
                'row_view_url': resolve_url('accounts:roles', 0),
                'width': '40',
                'title': 'Add Role',
                'form_elm_url' : '',
            }
            data = {
                "data_tabl_meta": data_tabl_meta,
                "header_meta": header_meta,
                "view_meta": view_meta,
            }
            data = data

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse(data)
        return render(request, self.template_name, context=data)

    def post(self, request):
        post_data = json.loads(request.body)
        res = self.form_post(post_data)
        res['list_tab'] = 'accounts-roles'
        messages.success(request, 'inserted')
        return JsonResponse(res)
    
class RolesViewSet(BaseModelViewSet):
    serializer_class = RoleSerializer
    
    def get_queryset(self):
        return EmployeeRole.objects.all()
    

def role_data_list(self, isMeta=None):
    """Get permissions list .if ismeta is not none retun meta info for rable

    Parameters
    ----------
    isMeta:
        true if requesting meta info
    Returns
    -------
    json (if isMeta false)
        return enquiry list
    ObjectArr (if isMeta true)
        return table meta if isMeta variable true
    """

    model_name = 'EmployeeRole'
    col_info = get_datatable_col_info(model_name)    
    all_column_info = col_info['column_info']
    display_col_indexes = col_info['display_col_indexes']
    table_name = "EmployeeRole"  # table title

    row_view_url = ''
    data_table_url = reverse("accounts:role_list-list")

    return {
        "column_info": all_column_info,
        "table_name": table_name,
        "data_table_url": data_table_url,
        "row_view_url": row_view_url,
        "display_col_indexes": display_col_indexes,
        "edit_form_url": resolve_url('accounts:roles', 'edit',0) ,
    }


"""User Organization inventory starts here"""

class UserInventoryView(ActionView, View):

    template_name = "app.html"
    model = UserOrganisationInventory
    app_name = 'accounts'
    sub_app_name = 'user_inventory'

    def get(self, request, action_type=None,row_id=None):
        
        # menu_details = get_dynamic_menu(request.user.id)
        # for menu in menu_details:
        #     print('menu-->',menu)

        # all_menu = get_all_menu(request)
        #print('all_menu-->',all_menu)

        if(action_type!=None):
            app_data = {
                'app_name' : self.app_name,
                'custom_script_file' : 'js/custom/permission.js'
            }
            if(action_type=='add' or action_type=='edit'):
                self.template_name = "add.html"
                data = self.add_form_page(app_data,action_type,row_id)
            elif(action_type=='page_form_elements'):
                model_data = { 
                        'model' : self.model ,
                        'title' : 'Add Role '
                        }
                data = self.page_form_elements(model_data,row_id)
                operating_unit_index = next((index for (index, d) in enumerate(data['data']) if d.__contains__('name') and d["name"] == "operating_unit"), None)
                inventory_index = next((index for (index, d) in enumerate(data['data']) if d.__contains__('name') and d["name"] == "inventory"), None)
                #company_id  = 379
                #data['data'][inventory_index]['options'] = [{'value': getattr(row, 'pk') , 'label': row.option_label} for row in Inventory.objects.filter(operating_unit_id = company_id)]
        else:
            data_tabl_meta = user_inventory_list_meta(True)
            header_meta = {"title": "User organization inventory",
                        "add_label": "Add User inventory",
                        "filter_label": "All",
                        "add_title" : "Add User inventory",
                        "add_link" : resolve_url( 'accounts:user_inventory', 'add'),
                        "add_unique_name" : "adduserinventory"
                        }
            view_meta = {
                'row_view_url': resolve_url('accounts:user_inventory', 0),
                'width': '40',
                'title': 'Add Role',
            }
            data = {
                "data_tabl_meta": data_tabl_meta,
                "header_meta": header_meta,
                "view_meta": view_meta,
            }
            data = data

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse(data)
        return render(request, self.template_name, context=data)

    def post(self, request):
        post_data = json.loads(request.body)
        res = self.form_post(post_data)
        res['list_tab'] = 'accounts-user_inventory'
        messages.success(request, 'inserted')
        return JsonResponse(res)
    
class UserInventoryViewSet(BaseModelViewSet):
    serializer_class = UserInventorySerializer
    
    def get_queryset(self):
        return UserOrganisationInventory.objects.all()
    

def user_inventory_list_meta(self, isMeta=None):
    """Get permissions list .if ismeta is not none retun meta info for rable

    Parameters
    ----------
    isMeta:
        true if requesting meta info
    Returns
    -------
    json (if isMeta false)
        return enquiry list
    ObjectArr (if isMeta true)
        return table meta if isMeta variable true
    """

    model_name = 'UserOrganisationInventory'
    col_info = get_datatable_col_info(model_name)    
    all_column_info = col_info['column_info']
    display_col_indexes = col_info['display_col_indexes']
    table_name = "UserOrganisationInventory"  # table title
    
    row_view_url = ''
    data_table_url = reverse("accounts:user_inventory_list-list")

    return {
        "column_info": all_column_info,
        "table_name": table_name,
        "data_table_url": data_table_url,
        "row_view_url": row_view_url,
        "display_col_indexes": display_col_indexes,
        "edit_form_url": resolve_url('accounts:user_inventory', 'edit',0) ,
    }

def dynamic_menu_process():
        return '1234567'