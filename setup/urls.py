from django.urls import path, include
from rest_framework import routers
from . import views


app_name = 'setup'
router = routers.DefaultRouter()
router.register(r'template_list', views.TemplateContentViewSet, basename="template_list")


urlpatterns = [
    path('api/', include(router.urls)),
    path('template',views.TemplateContentView.as_view(), name='template'),
    path('action/<action_type>/<row_id>', views.TemplateContentView.as_view(), name='template'),
    path('action/<action_type>', views.TemplateContentView.as_view(), name='template'),

    path('template-view', views.template_view , name='template-view'),
    path('template-api', views.TemplateHTMLApi.as_view() , name='template-api'),
    path('template-list', views.template_list_view , name='template-list'),
    path('template-save-api', views.TemplateSaveApi.as_view() , name='template-save-api'),
    path('conc_prog',views.ConcProgView, name='conc_prog'),
    path('conc_prog_invtr',views.ConcProgInvtrView, name='conc_prog_invtr'),
    path('conc_prog_pdf',views.ConcProgPdfView, name='conc_prog_pdf'),
    path('get-input',views.ConcProgInputDataView, name='get-input'),
    path('refresh_report',views.refresh_report, name='refresh_report'),
    path('add-concprog',views.AddConcProgView, name='add-concprog'),
    path('pdf',views.download_file, name='pdf'),
    path('email-via-template', views.TemplateHTMLEmailApi.as_view() , name='email-via-template'),
    path('exec_sql', views.ExecSql.as_view() , name='exec_sql'),

    path('customer_dms', views.CustomerDmsView.as_view(), name='customer_dms'),
    path('dms_records', views.DmsRecordsView, name='dms_records'),
    path('trip_details', views.TripDetailsView, name='trip_details'),
    path('documentation_details', views.DocumentationDetailsView, name='documentation_details'),
]
