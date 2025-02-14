"""ay_connect URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf.urls.static import static
from django.conf import settings
from django.http import HttpResponse
import os

from ninja import NinjaAPI
from vehicle.api import api 

from stock_app.api import  stock_api
from Service_request.api import servicerequest_api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls',namespace='core')),
   
    path('accounts/', include('accounts.urls',namespace='accounts')),
	
    path('setup/', include('setup.urls')),
  
    path('pricelist/', include('pricelist_update.urls')),

    path('assignment/', include('assignment.urls', namespace='assignment')),
    path('stock/',include('stock_app.urls',namespace='stock')),
    path('Service_request/', include('Service_request.urls', namespace='Service_request')),
    # path('itemPublishing/',include('stock_app.urls',namespace='itemPublishing')),
    path('api/', api.urls),  
    path('api/stock/', stock_api.urls), 

    path('api/servicerequest/', servicerequest_api.urls),
 
    re_path(r'^fp/', include('django_drf_filepond.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.ENV != "PROD":
    urlpatterns += [
        path("__debug__/", include("debug_toolbar.urls")),
    ]
