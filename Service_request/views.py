from django.shortcuts import render
from django.http import HttpResponse
from django.template.loader import render_to_string
import json


def Job_Dashboard(request):
    return render(request, 'Service_request/jobCard.html')

def job_summary(request):
    return render(request, 'Service_request/jobSummary.html')


def invoice_view(request):
    html_content = render_to_string('Service_request/Invoice.html', {
        'show_data': True  # Flag to indicate data should be displayed
    })
    response = HttpResponse(html_content, content_type='text/html')
    response['Content-Disposition'] = 'attachment; filename="invoice.html"'
    return response


def performa_view(request):
    html_content = render_to_string('Service_request/performa_invoice.html', {
        'show_data': True
    })
    response = HttpResponse(html_content, content_type='text/html')
    response['Content-Disposition'] = 'attachment; filename="performa.html"'
    return response


def operation_view(request):
    return render(request, 'Service_request/CreateView_Operation.html')