from django.shortcuts import render, redirect
from django.views.generic import View, TemplateView
from django.shortcuts import resolve_url, reverse
from core.utils import form_elements, get_model_obj, get_loginuser_details
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.conf import settings
from ldap3 import Server, Connection, ALL
from django.contrib import messages, auth
from django.utils.decorators import method_decorator

from .auth_backend import ForceAuth
from django.http import JsonResponse
from core.models import UserProfile
from .ldap import parseLdapUserDetails
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from core.models import *
from django.apps import apps
from accounts.helpers import get_dynamic_menu, get_all_menu
from rest_framework import views as DRF_views, response
from .serializers import *
import json

# Create your views here.
def imitate(request):
    if request.method == 'GET':
        username = request.GET['u'].lower()
        user = ForceAuth.authenticate(request, request, username=username)
        res = auth.login(request, user, backend='accounts.auth_backend.ForceAuth')
        return redirect('index')
    else:
        JsonResponse('Error', safe=False)

    return render(request, resolve_url( "core:home_iframe") )
def login(request):
    
    # # stop
    if request.user.is_authenticated:
        return redirect( resolve_url( "core:home_iframe") )
        
    if request.method == 'POST':
        username = request.POST['username'].upper().strip()
        password = request.POST['password']
        
        print(settings.LDAP_URL)
        settings.AUTH_LDAP_BIND_DN = 'alyousuf\\' + str(username)
        settings.AUTH_LDAP_BIND_PASSWORD = password
        server = Server(settings.LDAP_URL)
        
        # Django Authentication Backend
        user = auth.authenticate(username=username, password=password)
        
        request.session['username'] = username
        
        # if user is None or settings.ENV=='PROD':
        #     c = Connection(server, user='alyousuf\\' + str(username), password=password)

        #     try:
        #         is_ldap_user = c.bind()
        #         pass
        #     except Exception as e:
        #         is_ldap_user = False
        #     print('is_ldap_user--->',is_ldap_user)
        #     if is_ldap_user:
        #         user = auth.authenticate(username=username, password=password)
        #         fetchUserDetailsFromLDAP(username,password)
        #         u = User.objects.get(username=username)
        #         u.set_password(password)
        #         u.save()

        #     user = auth.authenticate(username=username, password=password)

        if user is not None:

            # c = Connection(server, user='alyousuf\\' + str(username), password=password)
            # try:
            #     is_ldap_user = c.bind()
            #     pass
            # except Exception as e:
            #     is_ldap_user = False
            # print('is_ldap_user-->',is_ldap_user)
            # if is_ldap_user:
            #     user = auth.authenticate(username=username, password=password)
            #     fetchUserDetailsFromLDAP(username,password)
            #     u = User.objects.get(username=username)
            #     u.set_password(password)
            #     u.save()
            
            auth.login(request, user)
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
            return redirect(resolve_url( "core:user_announcement"))
        else:
            messages.error(request, 'Incorrect Username or Password')
            return redirect(resolve_url( "core:login"))
    else:
        announcements = AnnouncementsSerializer(Announcements.objects.all(),many=True).data
        events = EventsSerializer(Events.objects.all(),many=True).data
        data = {
            'login_form_url' : resolve_url( "core:login"),
            'announcements':announcements,
            'events' :events
        }
        return render(request, 'core/login.html', context=data)
    
@method_decorator(login_required, name='dispatch')
class IframeView(View):
    
    def get(self, request):
        all_menus = get_all_menu(request)
        user_accessible_menus = get_dynamic_menu(request.user.id)
        user_inventories = UserOrganisationInventory.objects.filter(user=request.user.id)
        inv_array = []
        visited_arr = []

        for user_inv in user_inventories:
            if user_inv.inventory:
                inv_org_type = user_inv.inventory.org_type or None
                if user_inv.inventory.pk not in visited_arr:
                    inv_details = {'org_id': user_inv.inventory.operating_unit_id_id, 'inv_id':user_inv.inventory.pk, 'inv_name':user_inv.inventory.organization_name, 'inv_org_type':inv_org_type,'loc_code':user_inv.inventory.organization_code}
                    inv_array.append(inv_details)
                visited_arr.append(user_inv.inventory.pk)
            # else:
            #     emp_id = request.session.get('emp_id')
            #     username = request.session.get('user')
            #     user_locations = list(UserLocLevels.active_objects.filter(user_name=username).order_by('location_code').values_list('location_code', flat=True).distinct())
            #     ar_locations = ARLocations.objects.filter(loc_code__in = user_locations).distinct('loc_code').order_by('loc_code')
            #     user_locations_obj = UserLocLevels.active_objects.filter(user_name=username).order_by('location').distinct('location')
            #     # inv_array = []
            #     for loc in user_locations_obj:
            #         if not any(d['inv_id'] == loc.location_code for d in inv_array):
            #             inv_details = {'inv_id':loc.location_code, 'inv_name':loc.location, 'inv_org_type':'RECEIPT','loc_code':loc.location_code}
            #             inv_array.append(inv_details)
            #     print('user_locations--->',user_locations)
            #     if(user_locations!=[]):
            #         request.session['location']  = user_locations[-1] if request.session.get('location')==None else request.session.get('location')
            #     else: 
            #         request.session['location']  = None    
        data = {'menu':all_menus,'user_menus':user_accessible_menus,'user_inv_array':inv_array,'APP_VERSION':settings.APP_VERSION, 'roles_json': json.dumps({"roles": [item.role.identifier for item in user_inventories if item.role.identifier is not None]})}
        return render(request, "core/iframe.html", context=data)

def logout(request):
    auth.logout(request)
    messages.success(request, 'You are now logged out')
    return redirect(resolve_url( "core:login"))
 
def user_announcement(request):
    all_menus = get_all_menu(request)
    user_accessible_menus = get_dynamic_menu(request.user.id)
    if request.method == 'POST':
        print("Yaha aaya")
        
        # username = request.POST['username']
        # password = request.POST['password']
        
        # print(settings.LDAP_URL)
        # settings.AUTH_LDAP_BIND_DN = 'alyousuf\\' + str(username)
        # settings.AUTH_LDAP_BIND_PASSWORD = password
        # server = Server(settings.LDAP_URL)
        
        # # Django Authentication Backend
        # user = auth.authenticate(username=username, password=password)
        
        
        # if user is None:
        #     c = Connection(server, user='alyousuf\\' + str(username), password=password)

        #     try:
        #         is_ldap_user = c.bind()
        #         pass
        #     except Exception as e:
        #         is_ldap_user = False
        #     print('is_ldap_user--->',is_ldap_user)
        #     if is_ldap_user:
        #         user = auth.authenticate(username=username, password=password)
        #         fetchUserDetailsFromLDAP(username,password)
        #         u = User.objects.get(username=username)
        #         u.set_password(password)
        #         u.save()

        #     user = auth.authenticate(username=username, password=password)

        # if user is not None:

        #     # c = Connection(server, user='alyousuf\\' + str(username), password=password)
        #     # try:
        #     #     is_ldap_user = c.bind()
        #     #     pass
        #     # except Exception as e:
        #     #     is_ldap_user = False
        #     # print('is_ldap_user-->',is_ldap_user)
        #     # if is_ldap_user:
        #     #     user = auth.authenticate(username=username, password=password)
        #     #     fetchUserDetailsFromLDAP(username,password)
        #     #     u = User.objects.get(username=username)
        #     #     u.set_password(password)
        #     #     u.save()
            
        #     auth.login(request, user)
        #     request.session['user'] = username
        #     user_tenant = UserOrganisationInventory.objects.filter(user=user.id).first()
        #     request.session["tenant_disabled"] = "0"
        #     if user_tenant==None:
        #         tenant = None
        #     else:
        #         tenant = None if not user_tenant.inventory else user_tenant.inventory.pk
        #     request.session['tenant'] = tenant
        #     print(user.id,"&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
        #     request.session['emp_id'] = UserProfile.objects.get(user_id=user.id).employee_id
        #     request.session['username'] = UserProfile.objects.get(user_id=user.id).user_name
        #     request.session['role'] = '' if not user_tenant else user_tenant.role.pk
        return redirect(resolve_url( "core:home_iframe"))

    annoucements = AnnouncementsSerializer(Announcements.objects.all(),many=True).data
    data = {
            'announcements':annoucements,'menu':all_menus,'user_menus':user_accessible_menus
        }
    return render(request, 'core/announcements.html', context=data)

    return redirect(resolve_url( "core:home_iframe"))

    # return redirect(resolve_url( "core:user_announcement"))
 
@method_decorator(login_required, name='dispatch')
class ActionView(View):
    def main_url(self):
        app_name = self.app_name
        sub_app_name = getattr(self, 'sub_app_name',app_name)
        url_str = app_name+":"+sub_app_name
        return url_str
    
    def add_form_page(self,app_data=None,action_type='add',row_id=None):
        row_id = 0 if row_id == None else row_id
        main_url_str = self.main_url()
        view_meta = {
                    'title' : 'Add '+self.app_name ,
                    'form_elm_url' : resolve_url( main_url_str,'page_form_elements',row_id),
                    'form_submit_url' :  resolve_url( main_url_str),
                    'custom_script_file' : app_data['custom_script_file'] if app_data!=None and app_data.__contains__("custom_script_file") else ''
                }
        custom_components = []
        data = {
            "view_meta": view_meta,
            "custom_components":custom_components,            
        }
        return data
    
    def page_form_elements(request,model_data,row_id):
        model =  model_data['model']
        unwanted_fields = model_data['unwanted_fields'] if model_data.__contains__('unwanted_fields') else []
        form_elms = form_elements(model,[],unwanted_fields,row_id)
        formelm_list = list(form_elms.values())
        formelm_list.insert(0,{"component": "h5", "children": "Form"})    
        formelm_list.append({
            "type" : "submit",
            "label" : "Submit",
            "wrapper-class" : "form-group text-right"  
        })     
        return {"data":formelm_list}
    
    def edit_form_data(id,model_name):
        ModelObj = get_model_obj(model_name)
        edit_data = ModelObj.objects.get(pk=id)
        print('edit_data---------->',edit_data)
        return edit_data

    def form_post(self,data):
        model = self.model
        base_columns = ['active', 'start_date', 'end_date', 'creation_date',
                'created_by', 'last_update_date', 'last_updated_by', 'tenant']
        
        model_meta = [field for field in model._meta.fields if field.get_internal_type() == 'ForeignKey' and field.name not in base_columns]
        
        for field in model_meta:
            model_info = field.foreign_related_fields[0]
            related_model = model_info.model
            data[field.name] = related_model.objects.get(pk=data[field.name]) if data.get(field.name, None)!=None else None
        new_data = model(**data)
        new_data.save()

        main_url_str = self.main_url()
        response = {'status': 'success',
                    'list_tab': self.app_name,
                    'list_src': resolve_url(main_url_str),
                    'row_id' : new_data.pk
                    }
        return response
    

def fetchUserDetailsFromLDAP(username, password):
    uid = User.objects.get(username=username).pk
    employee_id, company, department, description, title, telephoneNumber, homePhone, photo_main_path = parseLdapUserDetails(
        username, password)
    # Update details
    has_created = UserProfile.objects.all().filter(user_id=uid)
    if has_created:
        UserProfile.objects.filter(user_id=uid).update(
            employee_id=employee_id,
            user_name=username,
            company=company,
            department=department,
            description=description,
            title=title,
            telephoneNumber=telephoneNumber,
            homePhone=homePhone,
            photo_main=photo_main_path
        )
    else:
        profile = UserProfile(
            user_id=uid,
            employee_id=employee_id,
            user_name=username,
            company=company,
            department=department,
            description=description,
            title=title,
            telephoneNumber=telephoneNumber,
            homePhone=homePhone,
            photo_main=photo_main_path
        )
        profile.save()

class BaseModelViewSet(viewsets.ModelViewSet):

    def filter_queryset(self, queryset):
        if 'format' not in self.request.GET:
            self.filter_backends = [filters.SearchFilter, DjangoFilterBackend]
        return super(BaseModelViewSet, self).filter_queryset(queryset)
    
class BaseListView(TemplateView):
    model_name = None

    def get_context_data(self, **kwargs):
        context = super(BaseListView, self).get_context_data(**kwargs)
        context['datatable_data'] = 'data_dictionary'
        
        return context

def get_all_columns(request,model_name):
    models = ContentType.objects.filter(model=model_name.lower()).values('app_label').first()
    app_label = models['app_label']
    all_tables = ContentType.objects.all()
    
    modelObj = apps.get_model(app_label,model_name)
    model_meta = modelObj._meta.concrete_fields
    field_arr = []
    for field in model_meta:
        field_arr.append(field.verbose_name)
        

    base_columns = field_arr[:7]
    tenant_column = field_arr[7:8]
    main_columns = field_arr[8:]
    all_column_info = main_columns+tenant_column+base_columns

    col_settings = ColumnSetting.objects.filter(fk_user_id=1, model = 'Enquiry').first() 
    display_col_indexes = col_settings.display_indexes if hasattr(col_settings, 'display_indexes') else None
    
def get_select_options(request,model_name):
    """Get rows matching the select input

    Parameters
    ----------
    request : dict
        Query Dictionary. Get number in q query param

    Returns
    -------
    json
        list of accounts start with given primary number
    """
    model_name = 'lookupnamevalue'
    query = request.GET.get("q")
    Model = get_model_obj(model_name)
    option_label_field = Model.option_label_field()
    kwargs = { '{0}__{1}'.format(option_label_field, 'istartswith'): query }
    rows = LookupNameValue.objects.filter(**kwargs).values_list(
        "code"
    )
    return JsonResponse({"items": list(rows)})

def change_user_inventory(request,inv_id):
    if(inv_id.isnumeric()):
        request.session['tenant'] = inv_id
        request.session['tenant_disabled'] = '1'
        user_details = get_loginuser_details(request)
    else:
        if(inv_id!='undefined'):
            request.session['location'] = inv_id
            request.session['tenant_disabled'] = '1'
        user_details = {'defs':''}

    return JsonResponse({'message':'inventory changed','defs':user_details['defs']})


from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def upload_product_data_dictionary(request):
    if request.method == 'POST' and request.FILES.get('file'):
        excel_file = request.FILES['file']
        data_frame = pd.read_excel(excel_file, sheet_name='Sheet25', header=0)
        column_names = data_frame.columns.tolist()
        for index, row in data_frame.head(1).iterrows():
            for column in column_names:
                data_name = row[column].lower()
                display_name = data_frame.loc[0][column]
                field_type = data_frame.loc[1][column]

                if field_type == "VARCHAR2":
                    field_type = "text"
                section = DataDictionarySection.objects.first()
                data_dictionary = DataDictionary(model_name="Product", section=section, data_name=data_name, display_name=display_name, field_type=field_type)
                data_dictionary.save()

        return JsonResponse({'success': '111111111Data created successfully'})
    
def close_page(request):
    data = {}
    return render(request, 'core/close_page.html', context=data)