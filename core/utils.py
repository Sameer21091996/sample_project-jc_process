from core.models import  LookupNameValue
from django.db.models import F
from django.apps import apps
from core.models import *
from django.conf import settings
import hmac
import hashlib
import time
from accounts.models import CustomRolePermission

def form_elements(model, custom_component_field=[], unwanted_fields=[], row_id=0):
    row_data = None
    if(row_id!=0 and row_id!='0' and row_id!=None):
        print('row_id---->',row_id)
        row_data = model.objects.get(pk=row_id)
    
    model_meta = [
        field for field in model._meta.concrete_fields]
    base_columns = ['active', 'start_date', 'end_date', 'creation_date',
                    'created_by', 'last_update_date', 'last_updated_by', 'tenant']
    all_undesired_cols = base_columns + unwanted_fields

    form_elms = {}
    drop_down_datas = {}

    for field in model_meta:
        if (field.name not in all_undesired_cols):
            field_data = {}
            if field.name in list(custom_component_field):
                form_elms[field.name] = custom_component_field[field.name]
            else:
                field_name = field.name
                data_type = field.get_internal_type()
                foreign_model = field.related_model if field.related_model == None else field.related_model.__name__
                field_label = field.verbose_name

                lookup_suffix = '_lkup'
                drop_down_datas = {}
                if (field_name.endswith(lookup_suffix)):
                    look_up_name = field_name.removesuffix(lookup_suffix)
                    drop_down_datas[field_name] = list(
                        LookupNameValue.objects.order_by('order').select_related("fk_lookup_id")
                        .filter(fk_lookup_id__lookup_field_name__iexact=look_up_name)
                        .annotate(
                            value=F("lookup_value_id"),
                            label=F("code")
                        )
                        .values("value", "label")
                    )
                elif (data_type == 'ForeignKey'):
                    model_info = field.foreign_related_fields[0]
                    Model = model_info.model
                    drop_down_datas[field_name] = [
                        {'value': getattr(row, 'pk') , 'label': row.option_label} for row in Model.objects.all()]
                
                if (data_type == 'ForeignKey'):
                    input_type = 'select'
                elif (data_type == 'DateTimeField'):
                    input_type = 'date'
                elif (field.primary_key==True):
                    input_type = 'hidden'
                else:
                    input_type = 'text'

                is_required = 'required' if getattr(field, 'null', False)==False and field.primary_key!=True else ''
                
                field_data = {
                    "name": field_name,
                    "type": input_type,
                    "label": field_label.capitalize() if field.primary_key!=True else None,
                    "id": field_name,
                    "placeholder": field_label.capitalize()
                }
                if(row_data!=None):
                     field_data['value'] = getattr(row_data, field_name)
                     if data_type == 'ForeignKey':
                          field_data['value'] = field_data['value'].pk
                    

                if(is_required!=''):
                    field_data['validation'] = is_required
                if (data_type == 'ForeignKey'):
                    field_data['options'] = drop_down_datas[field_name]

                if (data_type == 'ForeignKey'):
                    select_field_data = {
                                    "component" : "selectcomp",
                                    "context"   : field_data
                                    }
                    select_field_data['context']['class'] =  'select'
                    select_field_data['context']['wrapper'] =  'form-group'
                    select_field_data['context']['model'] =  ''
                    select_field_data['context']['class'] =  'select'
                    field_data = select_field_data

                form_elms[field_name] = field_data
                
    return form_elms

def  get_datatable_col_info(model_name,model_app_name=None):

    model = get_model_obj(model_name)
    main_column_info = []
    base_column_info = []
    model_meta = model._meta.concrete_fields
    base_columns = ['active', 'start_date', 'end_date', 'creation_date',
                'created_by', 'last_update_date', 'last_updated_by', 'tenant']

    for field in model_meta:
        col_name = field.name
        col_verbose_name = field.verbose_name
        field_name = col_name
        if(col_name=='tenant'):
            field_name = 'tenant.organization_name'
        elif(col_name.endswith('_lkup')):
            field_name = col_name+'.code'
        elif(field.get_internal_type() =='ForeignKey'):
            model_info = field.foreign_related_fields[0]
            Model = model_info.model
            field_name = col_name +'.'+ Model.option_label_field()
        col_details = {
            'data' : col_name,
            'name' : field_name,
            'title': col_verbose_name.title(),
            }
        if col_name in base_columns:
                base_column_info.append(col_details)
        else:
            main_column_info.append(col_details)

    col_settings = ColumnSetting.objects.filter(fk_user_id=1, model = model_name ).first() 
    display_col_indexes = col_settings.display_indexes if hasattr(col_settings, 'display_indexes') else None
    
    return {'column_info': main_column_info+base_column_info ,
            'display_col_indexes' : display_col_indexes
            }

def get_model_obj(model_name):
        models = ContentType.objects.filter(model=model_name.lower()).values('app_label').first()
        app_label = models['app_label']
        modelObj = apps.get_model(app_label,model_name)
        return modelObj

def get_loginuser_details(request):
    user_id = request.user.id
    print(user_id)
    user_tenant = request.session.get('tenant')
    user_role_id = request.session.get('role')
    user_inv:Inventory =  Inventory.objects.get(pk=user_tenant)
    user_role =  EmployeeRole.objects.filter(id=user_role_id or -1).first()
    user_role_name = user_role.name if user_role else ''
    user_profile =  UserProfile.objects.get(user_id=user_id)
    employee_id = user_profile.employee_id
    resp = {'user_id': employee_id, 'defs': {'organization_code': user_inv.organization_code ,
                                          'organization_name':user_inv.organization_name, 
                                          'organization_id': user_inv.organization_id, 
                                          'org_id': user_inv.operating_unit_id.pk, 
                                          'uid': employee_id , 
                                          'pid': '', 
                                          'oracle_user_name': request.user.username, 
                                          'rid': user_role_id, 
                                          'aid': '', 
                                          'responsibility_name': user_role_name, 
                                          'org_type': user_inv.org_type,
                                          }}
    print(resp)
    return resp
    # HardCode1   orcale_uer_name should be remove after test

def get_lookupvalue_obj(lookup_code,value_code):
    return LookupNameValue.objects.get(fk_lookup_id__lookup_field_name=lookup_code,code=value_code)

def get_user_details(username):
    user = User.objects.get(username__icontains=username)
    user_id = user.id
    print(user_id)
    user_tenant = UserOrganisationInventory.objects.filter(user=user_id).first()
    tenant = user_tenant.inventory.pk
    user_role_id = user_tenant.role.pk
    user_inv =  Inventory.objects.get(pk=tenant)
    user_role =  EmployeeRole.objects.get(pk=user_role_id)
    user_profile =  UserProfile.objects.get(user_id=user_id)
    employee_id = user_profile.employee_id
    if employee_id==None or employee_id=='':
        employee_id = user_id
    resp = {'user_id': employee_id, 'defs': {'organization_code': user_inv.organization_code ,
                                          'organization_name':user_inv.organization_name, 
                                          'organization_id': user_inv.organization_id, 
                                          'org_id': user_inv.operating_unit_id.pk, 
                                          'uid': employee_id , 
                                          'pid': '', 
                                          'oracle_user_name': username, 
                                          'rid': user_role_id, 
                                          'aid': '', 
                                          'responsibility_name': user_role.name,
                                          }}
    print(resp)
    return resp


class CrossAppAuth:
    def __init__(self,username):
        self.username = username.upper()
        self.username_switchtime = self.username + time.ctime()[0][:-3]

    def get_hex_token(self):
        request_body = self.username_switchtime.encode()
        secret_key = settings.COMMON_AUTH_SECRET_KEY.encode()
        token = hmac.new(secret_key, request_body, hashlib.sha256).hexdigest()
        return token
    
    def validate_token(self,token,username):
        self.username = username.upper()
        return self.get_hex_token() == token
    

def get_menu_permissions(user_id,permission_name=None,menu_id=None):
    try:
        roles = UserOrganisationInventory.objects.filter(user=user_id).values_list('role', flat=True)
        if menu_id==None:
            user_permissions = RolePermissions.objects.filter(employee_role__in=roles)
        else:
            user_permissions = RolePermissions.objects.filter(employee_role__in=roles,navigation_item=menu_id)
        role_permissions = list(user_permissions.values_list('id',flat=True))
        full_access_permissions = list(user_permissions.values_list('full_access',flat=True))
        
        permissions = list(CustomRolePermission.objects.filter(rolepermission__in=role_permissions).select_related( 'custompermission', 'rolepermission').values_list('custompermission__code',flat=True))
        if(True in full_access_permissions):
            permissions.append('FULL_ACCESS')

        if permission_name!=None:
            permissions = 'Y' if permission_name in permissions else 'N'
        return permissions
    except Exception as err:
        if permission_name!=None:
            return 'N'
        else:
            return []