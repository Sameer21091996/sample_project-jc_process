from django.urls import path
from . import views

app_name = 'stock_app'

urlpatterns = [
    path('', views.stock_Dashboard, name='home'),
    path('stock_item_dashboard/', views.stock_item_dashboard, name='Form'),
    path('stock_item_view/', views.stock_item_view, name='view'),
    path('itemPublishing/', views.item_publishing_view, name='itemPublishing'),
    path('shared/', views.shared_stock_view, name='shared_view'),  # Add this new line
]