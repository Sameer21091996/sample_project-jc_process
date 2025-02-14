from django.http import HttpResponse
from django.shortcuts import redirect, render, HttpResponseRedirect
from django.urls import reverse
from datetime import datetime
import jwt
from django.conf import settings

from stock_app.api import get_stock_detail
from .models import ShareLink, UploadHeader

def stock_Dashboard(request):
    return render(request, 'stock_app/home.html')

def stock_item_dashboard(request):
    return render(request, 'stock_app/Form.html')



# def stock_item_view(request):
#     return render(request, 'stock_app/viewStock.html')
def shared_stock_view(request):
    token = request.GET.get('token')
    if not token:
        return redirect('stock_app:home')
        
    try:
        # Decode token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        header_id = payload.get('header_id')
        
        # Get header details
        header = UploadHeader.objects.get(id=header_id)
        
        # Redirect to view with correct parameters
        return redirect(f'/stock/stock_item_view/?update_type={header.upload_type_value}&header_id={header_id}')
        
    except (jwt.InvalidTokenError, UploadHeader.DoesNotExist):
        return redirect('stock_app:home')

def stock_item_view(request):
    header_id = request.GET.get('header_id')
    token = request.GET.get('token')
    
    try:
        header = UploadHeader.objects.get(id=header_id)
        # Get stock details using the existing function
        stock_data = get_stock_detail(request, header_id)
        
        context = {
            'header_id': header_id,
            'header_details': {
                'id': header.id,
                'title': header.title,
                'status': header.status,
                'upload_type': header.upload_type_value
            },
            'stock_data': stock_data,
            'is_shared': bool(token)
        }
    except UploadHeader.DoesNotExist:
        context = {
            'header_id': None,
            'header_details': None,
            'stock_data': None,
            'is_shared': bool(token)
        }
    
    return render(request, 'stock_app/viewStock.html', context)

def item_publishing_view(request):
    # Check if request comes with a token (email link)
    token = request.GET.get('token')
    
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            header_id = payload.get('header_id')
            header = UploadHeader.objects.get(id=header_id)
            
            context = {
                'header': header,
                'stock_details': get_stock_detail(request, header_id)
            }
            return render(request, 'stock_app/itemPublishing.html', context)
            
        except jwt.ExpiredSignatureError:
            return HttpResponse("Link has expired", status=400)
        except (jwt.InvalidTokenError, UploadHeader.DoesNotExist):
            return HttpResponse("Invalid link", status=400)
    
    # For direct web access without token
    headers = UploadHeader.objects.all()  # Or apply any filters you need
    context = {
        'headers': headers,
        # Add any other context data needed for the view
    }
    return render(request, 'stock_app/itemPublishing.html', context)