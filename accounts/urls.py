from django.contrib import admin
from django.urls import path, include
from .views import *
from . import views
from rest_framework import routers

app_name = 'accounts'
router = routers.DefaultRouter()
router.register(r'user_inventory_list', views.UserInventoryViewSet, basename="user_inventory_list")
router.register(r'role_list', views.RolesViewSet, basename="role_list")
router.register(r'role_permissions_list', views.RolePermissionsViewSet, basename="role_permissions_list")

urlpatterns = [
    path('api/', include(router.urls)),
    path('emetate/', emetate),
    path('user_inventory', UserInventoryView.as_view(), name='user_inventory'),
    path('user_inventory/action/<action_type>/<row_id>', UserInventoryView.as_view(), name='user_inventory'),
    path('user_inventory/action/<action_type>', UserInventoryView.as_view(), name='user_inventory'),
    path('roles', RolesView.as_view(), name='roles'),
    path('roles/action/<action_type>/<row_id>', RolesView.as_view(), name='roles'),
    path('roles/action/<action_type>', RolesView.as_view(), name='roles'),
    path('role_permissions', RolePermissionsView.as_view(), name='role_permissions'),
    path('role_permissions/action/<action_type>/<row_id>', RolePermissionsView.as_view(), name='role_permissions'),
    path('role_permissions/action/<action_type>', RolePermissionsView.as_view(), name='role_permissions'),

    # path('login', views.login, name='login'),
    # path('', views.login, name='login'),
    # path('index', views.index, name='index'),
    # path('logout', views.logout, name='logout'),
    # path('imitate', views.imitate, name='imitate'),
    # path('email', views.email, name='email'),
    
    #path('ivantipo/<slug:po_number>', views.ivantiop, name='ivantipo'),
   ]
