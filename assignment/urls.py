from django.urls import path
from . import views

app_name = 'assignment'

urlpatterns = [
    path('', views.create_assignment, name='home'),
    path('create_assignment/', views.create_assignment, name='create_assignment'),

    
    path('technician_board/', views.technician_board, name='technician_board'),
    path('list/', views.list_assignments, name='list_assignments'),
    path('update_datetime/', views.update_datetime, name='update_datetime'),
    path('get_meaning_options/<str:lookup_name>/', views.get_meaning_options, name='get-meaning-options'),
    path('api/technician-assignments/', views.get_technician_assignments, name='technician-assignments'),
    path('track_assignment/', views.track_assignment, name='track_assignment'),
    path('tech-team/', views.get_tech_team, name='get_tech_team'),
    path('get-assignment-data/', views.get_assignment_data, name='get_assignment_data'),
    # path('send-completion-email/', views.send_completion_email, name='send_completion_email'),

]

