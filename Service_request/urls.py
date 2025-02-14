from django.urls import path
from . import views


app_name = 'Service_request'

urlpatterns = [
    path('jobCard/', views.Job_Dashboard, name='jobCard'),
    path('', views.job_summary, name='job_summary'),
    path('operation/', views.operation_view, name='operation_view'),
    path('invoice/', views.invoice_view, name='invoice_view'),  
    path('performa/', views.performa_view, name='performa_view'),
]
