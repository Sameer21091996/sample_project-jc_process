from django.conf import settings
import pandas as pd
import json
engine = settings.CURRENT_DB_ENGINE
from datetime import datetime,timedelta
import numpy as np
from contextlib import contextmanager
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from core.models import *
from accounts.models import CustomRolePermission
from core.utils import CrossAppAuth

def get_dynamic_menu(user_id):
    user_roles = UserOrganisationInventory.objects.filter(user=user_id).values_list('role', flat=True)
    if not user_roles:
        return []
    user_role_list = list(user_roles)
    role_permissions = RolePermissions.objects.filter(employee_role__in=user_role_list) 
    navigation_items = []
    for permission in role_permissions:
        navigation_items.append(permission.navigation_item.id)
    return navigation_items

def get_user_menu_roles(user_id):
    user_roles = list(UserOrganisationInventory.objects.filter(user=user_id).values_list('role', flat=True))
    role_permissions = RolePermissions.objects.filter(employee_role__in=user_roles) 
    role_navigations = {}
    for role_info in role_permissions:
        nav_key = role_info.navigation_item.pk
        role_navigations[role_info.navigation_item.pk]= str(role_info.employee_role.pk)  if role_info.navigation_item.pk not in role_navigations else role_navigations[role_info.navigation_item.pk]+','+str(role_info.employee_role.pk)
    return role_navigations

# def get_all_menu(request):
#     all_menus = NavigationItem.active_objects.select_related("parent").all().values('color_class','icon_class','id','name','parent','parent__id','parent__name','url','filter_type', 'href', 'org_id_required').order_by('sort_by')
#     main = []
#     children = {} 
#     user_menu_roles = get_user_menu_roles(request.user.id)
#     cat = CrossAppAuth(request.user.username).get_hex_token()
#     for menu in all_menus:
#         menu_role = user_menu_roles[menu['id']] if  menu['id'] in user_menu_roles else None
#         if(menu['parent__id']==None):
#             href = (
#                 menu["href"].replace("{{username}}", str(request.user.username.upper()))
#                 if menu["href"]
#                 else ""
#             )
#             href += f'''&cat={cat}''' if 'sw' in href else ''
#             main.append( {  'id' : menu['id'], 'name': menu['name'], 'url': menu['url'],  
#                             'color_class':menu['color_class'] or '',
#                             'icon_class':menu['icon_class'] or '',
#                             'filter_type':menu['filter_type'] or '',
#                             'emp_roles': menu_role,
#                             'org_id_required': menu['org_id_required'],
#                             'href': href or menu['url'],

#                           })
#         else:
#             href = (
#                 menu["href"].replace("{{username}}", str(request.user.username.upper()))
#                 if menu["href"]
#                 else ""
#             )
#             href += f'''&cat={cat}''' if 'sw' in href else ''

#             if menu['parent__id'] in children:
#                 children[menu['parent__id']].append({ 'id' : menu['id'], 'name': menu['name'], 'url': menu['url'],'filter_type':menu['filter_type'] or '' , 'emp_roles': menu_role, 'href': href or menu['url'], 'org_id_required': menu['org_id_required'],})
#             else:
#                 children[menu['parent__id']] = [{ 'id' : menu['id'], 'name': menu['name'], 'url': menu['url'],'filter_type':menu['filter_type'] or '' ,'emp_roles': menu_role, 'href': href or menu['url'], 'org_id_required': menu['org_id_required'],}]      
#     all_menus = {'main_menu': main, 'child_menu' : children}
#     return all_menus

def get_all_menu(request):
    if request.user.is_superuser and request.user.is_active:
        all_menus = NavigationItem.active_objects.select_related("parent").all()
    else:
        all_menus = NavigationItem.active_objects.select_related("parent").filter(url='assignment/technician_board')
        
    all_menus = all_menus.values('color_class','icon_class','id','name','parent','parent__id','parent__name','url','filter_type', 'href', 'org_id_required').order_by('sort_by')
    main = []
    children = {} 
    user_menu_roles = get_user_menu_roles(request.user.id)
    cat = CrossAppAuth(request.user.username).get_hex_token()
    for menu in all_menus:
        menu_role = user_menu_roles[menu['id']] if  menu['id'] in user_menu_roles else None
        if(menu['parent__id']==None):
            href = (
                menu["href"].replace("{{username}}", str(request.user.username.upper()))
                if menu["href"]
                else ""
            )
            href += f'''&cat={cat}''' if 'sw' in href else ''
            main.append( {  'id' : menu['id'], 'name': menu['name'], 'url': menu['url'],  
                            'color_class':menu['color_class'] or '',
                            'icon_class':menu['icon_class'] or '',
                            'filter_type':menu['filter_type'] or '',
                            'emp_roles': menu_role,
                            'org_id_required': menu['org_id_required'],
                            'href': href or menu['url'],
                          })
        else:
            href = (
                menu["href"].replace("{{username}}", str(request.user.username.upper()))
                if menu["href"]
                else ""
            )
            href += f'''&cat={cat}''' if 'sw' in href else ''

            if menu['parent__id'] in children:
                children[menu['parent__id']].append({ 'id' : menu['id'], 'name': menu['name'], 'url': menu['url'],'filter_type':menu['filter_type'] or '' , 'emp_roles': menu_role, 'href': href or menu['url'], 'org_id_required': menu['org_id_required'],})
            else:
                children[menu['parent__id']] = [{ 'id' : menu['id'], 'name': menu['name'], 'url': menu['url'],'filter_type':menu['filter_type'] or '' ,'emp_roles': menu_role, 'href': href or menu['url'], 'org_id_required': menu['org_id_required'],}]      
    all_menus = {'main_menu': main, 'child_menu' : children}
    return all_menus



@contextmanager
def db_session():
    global engine
    """ 
        Creates a context with an open SQLAlchemy session.
    """
    engine = create_engine(str(engine.url), convert_unicode=True)
    connection = engine.connect()
    db_session = scoped_session(sessionmaker(autocommit=True, autoflush=True, bind=engine))
    yield db_session.bind
    db_session.close()
    connection.close()

def initalizeResponsibility(user_init,db_engine):
    q = f"""
            select oracle_user_id,user_id pid ,ORACLE_USER_NAME,RESPONSIBILITY_NAME  from apps.xxerp_ad_user_resp_v where user_name = '{user_init['user'].strip().upper()}' and rownum <=1
        """
    print(q)
    user_id = pd.read_sql(q,con=db_engine)['oracle_user_id'].values[0]
    oracle_user_name= pd.read_sql(q,con=db_engine)['oracle_user_name'].values[0]
    #responsibility_name= pd.read_sql(q,con=db_engine)['responsibility_name'].values[0]   
    pid = pd.read_sql(q,con=db_engine)['pid'].values[0]   
    q = f"""
            select apps.xxerp_sales_utilities_pkg.xx_initialize_user_resp({user_id},{user_init['rid']},{user_init['aid']}) result from dual
        """    
    
    print(q)    
    initializedResp = pd.read_sql(q,con=db_engine)['result'].values[0]
    if initializedResp == 'Y':
        #print("Initialized User Respponisbility => ",initializedResp)
        q = f"""
                select apps.xxerp_sales_utilities_pkg.xx_set_policy_context (
                        apps.xxerp_sales_utilities_pkg.xx_get_profile_value ('ORG_ID')
                    ) result
                from dual
            """
        # print(q)
        initializedOpUnit = pd.read_sql(q,con=db_engine)['result'].values[0]
        #print(pd.read_sql(q,con=db_engine))
        q = f"""
        SELECT ORGANIZATION_CODE  , ORGANIZATION_NAME,organization_id,operating_unit org_id  FROM apps.ORG_ORGANIZATION_DEFINITIONS
        WHERE 1=1
        AND ORGANIZATION_ID =  apps.xxerp_sales_utilities_pkg.xx_get_profile_value ('CSD_DEF_REP_INV_ORG')
        """
        print(q)
        # print(pd.read_sql(q,con=db_engine))
        defs = pd.read_sql(q,db_engine).astype('str').to_dict(orient='records')
        print(defs)
        
        # q = f"""select apps.xxerp_sales_utilities_pkg.xx_get_profile_value ('XXERP_IS_MANAGER') xxerp_is_manager from dual"""
        # fd = pd.read_sql(q,con=db_engine)['xxerp_is_manager'].values[0]
        # print(fd)
        # print(q)


        # q = f"""select apps.xxerp_sales_utilities_pkg.xx_get_profile_value ('XXERP_DEFAULT_RESVERVATION_AMOUNT') reservation_amount from dual"""
        # mm = pd.read_sql(q,con=db_engine)['reservation_amount'].values[0]
        # print(mm)
        # print(q)

        # q = f"""select apps.xxerp_sales_utilities_pkg.xx_get_profile_value ('XXERP_PRE_RESV_VALIDITY_TIME') reservation_val from dual"""
        # res_val = pd.read_sql(q,con=db_engine)['reservation_val'].values[0]
        # print(res_val)
        # print(q)
       
       

        if not defs:
            q = f"""select apps.xxerp_sales_utilities_pkg.xx_get_profile_value ('ORG_ID') org_id from dual"""
            defs = pd.read_sql(q,db_engine).astype('str').to_dict(orient='records')

           

        #print(defs)
        q = f"""select  RESPONSIBILITY_NAME    from apps.fnd_responsibility_vl where RESPONSIBILITY_ID={user_init['rid']} """
        print(q)
        responsibility_name= pd.read_sql(q,con=db_engine)['responsibility_name'].values[0]
        #print(responsibility_name)


        #print(defs)
        #responsibility_name=''
        if len(defs) != 0:
            defs = defs[0]
            defs['uid'] = user_id
            defs['pid'] = pid
            defs['oracle_user_name']=oracle_user_name
            defs['rid'] = user_init['rid']
            defs['aid'] = user_init['aid']   
            defs['responsibility_name'] =responsibility_name
            # defs['xxerp_is_manager']=fd
            # defs['reservation_amount']=mm
            # defs['reservation_val']=res_val                  
        else:
            defs={}
            defs['uid'] = user_id
            defs['oracle_user_name']=oracle_user_name
            defs['pid'] = pid
            defs['rid'] = user_init['rid']
            defs['aid'] = user_init['aid']
            defs['responsibility_name'] =responsibility_name 
            # defs['xxerp_is_manager']=fd
            # defs['reservation_amount']=mm
            # defs['reservation_val']=res_val

        if initializedOpUnit == 'Y':
            for i in list(defs):
                defs[i]=str(defs[i])
            return {
                'user_id':int(user_id),
                'defs':defs,            
            }


def get_user_full_name(username):
    query = f"SELECT EMPLOYEE_NAME FROM  apps.xxerp_user_employee_v WHERE USER_NAME = '" +username.upper()+"' and rownum <= 1"
    print(query)
    return str(pd.read_sql(query,con=engine)['employee_name'].values[0])

def get_id_for_user(id_type,username):
    query = f"SELECT {id_type} FROM apps.xxerp_user_employee_v WHERE USER_NAME = '" +username.upper()+"' and rownum <= 1"
    return int(pd.read_sql(query,con=engine)[id_type].values[0])

def get_user_id(username):
    query = f"SELECT user_id FROM  apps.xxerp_user_resp_v WHERE USER_NAME = '" +username.upper()+"' and rownum <= 1"
    query = f"SELECT ORACLE_USER_ID  FROM  apps.xxerp_user_employee_v  WHERE USER_NAME = '" +username.upper()+"' and rownum <= 1"
    return int(pd.read_sql(query,con=engine)['oracle_user_id'].values[0])

def get_user_oracle_name(username):
    query =  f""" SELECT  ORACLE_USER_NAME  from   apps.XXERP_AD_USER_RESP_V   WHERE 1=1  and user_name = '{username}' """
    return str(pd.read_sql(query,con=engine)['oracle_user_name'].values[0])
    

def get_user_access_params(username):
    query = f"SELECT application,role,org_id,organization_id FROM XXERP_GENERIC_ACCESS WHERE USER_NAME = '" +username.upper()+"'  AND ENABLED_FLAG='Y'"
    access_dict = pd.read_sql(query,con=engine).astype('str').to_dict(orient='records')
    return access_dict

def xstr(KeyValuePair, _key):
    try:
        return str(KeyValuePair[_key])
    except:
        return ''


class NestedDict(dict):
     def __getitem__(self, key):
         if key in self: return self.get(key)
         return self.setdefault(key, NestedDict())


def get_dynamic_menu_html(username):
    user_access_query = f"""
            SELECT 
                    * from
                  apps.XXERP_AD_USER_MENU_NEW_V
            WHERE 1=1
                  and user_name = '{username}'

          """
    menus_info = pd.read_sql(user_access_query,con=engine).astype(str).to_dict(orient='records') 
    
    # for menu in list(menus_info):
    #     try:
    #         if menu['url'][-1] == '/':
    #                 menu['url'] = menu['url'][:-1] 
    #     except:
    #         pass

    # print(menus_info)
    dic = NestedDict()
    for r in menus_info:
        #print(r['menu_id'])
        if(r['process'] != 'None' and r['page'] != 'None'):
            dic[r['menu']][r['submenu']][r['process']][r['page']] = r
        elif r['process'] != 'None' and r['page'] == 'None':
            dic[r['menu']][r['submenu']][r['process']] = r
        elif r['process'] == 'None' and r['page'] == 'None':
            dic[r['menu']][r['submenu']] = r
    dic = dict(dic)
    # print(dic)
    html_menu = recHtmlMenuGenerator(dic,'')
    # print(html_menu)
    return html_menu

def array_shft(dic):
    outer = list(dic)
    for i in outer:
        inner = list(dic[i])
        for j in inner:
            return dic[i][j], len(list(dic[i]))





def recHtmlMenuGenerator(menu,html):    
    global randd
    #randd=random.randint(0,1044152)  
    num=0
    for i in list(menu):
        d,count = array_shft(menu)
        
        if count >= 1 and 'user_id' not in list(menu[i]):   
            randd=random.randint(0,1044152)                     
            num=num+1
            if (num % 2) == 0:
                 html = html + f"""
                        <li class="nav-item has-treeview" style="width: 100%; font-size: 13px;"
                        id="{randd}"
                           >  
                             <a href="#" class="nav-link">
                            <i class="nav-icon fas fa-th" ></i>
                            <p>"""+i+"""<i class="right fas fa-angle-left " ></i>
                            </p>
                            </a>
                        <ul class="nav nav-treeview">""" 
            else:
                html = html + f"""
                 <li id="{randd}"  class="nav-item has-treeview" style="width: 100%;    font-size: 13px;">
                 <a href="#" class="nav-link">
                 <i class="nav-icon fas fa-tachometer-alt" ></i>
                 <p>"""+i+"""<i class="right fas fa-angle-left " ></i>
                 </p>
                 </a>
                 <ul class="nav nav-treeview">"""
            

            html = recHtmlMenuGenerator(menu[i],html)

            html = html + '</ul></li>'
        else:
            html = html + f"""
            <li class="nav-item">
                <a  data_top_id={randd}   id="{menu[i]['submenu_id'].replace(' ','').replace('None','')}{ menu[i]['responsibility_id'].replace(' ','').replace('None','') }"  href="""
            
            html = html + f"""{
                    menu[i]['url'].replace(' ','').replace('None','').lower()
                }?mid={
                    menu[i]['menu_id'].replace(' ','').replace('None','')
                }&smid={
                     menu[i]['submenu_id'].replace(' ','').replace('None','')
                }&uid={
                     menu[i]['user_id'].replace(' ','').replace('None','')
                }&rid={
                     menu[i]['responsibility_id'].replace(' ','').replace('None','')
                }&aid={
                     menu[i]['application_id'].replace(' ','').replace('None','')
                }

                        class="nav-link">
                       <i class="far fa-circle nav-icon {xstr(menu[i],'icon')}" ></i>
                        <p>"""+i+"""</p>"""                    
            html = html+"""
                </a>
            </li>"""

    # print(html)
    
    return html

def df_to_jquery_datatable(query,db_instance_engine,hiddenColumnsList):
    df = pd.read_sql(query,con=db_instance_engine).replace(np.nan,'')

    data = df.astype('str').to_dict(orient='records')

    columns = []
    columns.append({
                'data': '',
                'title': " ",
        })
    

    for col in list(df):
        if col in hiddenColumnsList:
            columns.append({
                'data': col,
                "visible": False,
                'title': " ".join([e.title() for e in col.split('_')]),
            })
        else:
            columns.append({
                'data': col,
                'title': " ".join([e.title() for e in col.split('_')]),
            })

def get_navigation_custompermissions(user_id,navigation_id):
    roles = UserOrganisationInventory.objects.filter(user=user_id).values_list('role', flat=True)
    receipt_permissions = RolePermissions.objects.filter(employee_role__in=roles,navigation_item=navigation_id)
    role_permissions = list(receipt_permissions.values_list('id',flat=True))
    full_access_permissions = list(receipt_permissions.values_list('full_access',flat=True))
    
    permissions = list(CustomRolePermission.objects.filter(rolepermission__in=role_permissions).select_related( 'custompermission', 'rolepermission').values_list('custompermission__code',flat=True))
    if(True in full_access_permissions):
        permissions.append('FULL_ACCESS')

    return permissions