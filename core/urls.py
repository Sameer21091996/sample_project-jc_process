from django.contrib import admin
from django.urls import path
from . import views
from .views import *
app_name = 'core'


urlpatterns = [
    path('', views.login, name='login'),
    path('user_announcement', views.user_announcement, name='user_announcement'),
    path('home', IframeView.as_view(), name='home_iframe'),
    path('logout', views.logout, name='logout'),
    path('get_all_columns/<model_name>', views.get_all_columns, name='get_all_columns'),
    path('get_select_options/<model_name>', views.get_select_options , name='get_select_options'),
    path('change_user_inventory/<inv_id>', views.change_user_inventory , name='change_user_inventory'),
    path('upload_product_data_dictionary/', views.upload_product_data_dictionary , name='upload_product_data_dictionary'),
    path('close_page', views.close_page, name='close_page'),

]