from django.shortcuts import render
from django.utils import timezone
from pydantic import ValidationError
from .models import LOOKUP_DETAILS, AssignmentFollowUp
from django.contrib import messages
from django.http import JsonResponse
import json
from django.utils.timezone import get_current_timezone
from datetime import datetime
from django.views.decorators.http import require_http_methods
from vehicle.models import ServiceStatusHistory, ServiceBooking
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from vehicle.models import CustomUser
from django.http import JsonResponse
import json
import logging
from django.db.models import Q
from django.template.loader import render_to_string


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def technician_board(request):
    tech_team_name = request.user.username.upper()
    return render(request, 'assignment/technician_board.html', {'tech_team_name': tech_team_name})

def create_assignment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            dubai_tz = get_current_timezone()
            current_datetime = timezone.now().astimezone(dubai_tz)
            
            assignment = AssignmentFollowUp.objects.create(
                req_date=current_datetime.date(),
                client_information=data.get('client_information'),
                date=data.get('date') or None,
                time=data.get('time') or None,
                tech_team=data.get('tech_team', ''),
                assign_start=data.get('assign_start') or None,
                assign_end=data.get('assign_end') or None,
                start_time=data.get('start_time') or None,
                end_time=data.get('end_time') or None,
                status='Draft',
                payment=data.get('payment', ''),
                jc_number=data.get('jc_number', ''),
                remarks=data.get('remarks', ''),
                customer_no=data.get('customer_no', ''),
                vin_number=data.get('vin_number', '')
            )
            
            return JsonResponse({'message': 'Assignment created successfully'}, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
            
    return render(request, 'assignment/home.html')

def list_assignments(request):
    date_filter = request.GET.get('date')
    
    if date_filter:
        filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
        assignments = AssignmentFollowUp.objects.filter(date=filter_date).order_by('id').values()
    else:
        assignments = AssignmentFollowUp.objects.all().order_by('id').values()
    
    return JsonResponse({'assignments': list(assignments)})


# def update_datetime(request):
#     if request.method == 'POST':
#         data = json.loads(request.body)
#         assignment_id = data.get('assignment_id')
#         field_type = data.get('field_type')
#         new_value = data.get('new_value') or data.get('new_date') or data.get('new_time')

#         try:
#             assignment = AssignmentFollowUp.objects.get(id=assignment_id)
            
#             status_mapping = {
#                 'Draft': 'Service Booked',
#                 'Scheduled': 'Vehicle Received',
#                 'Ongoing': 'Work In Progress',
#                 'Completed': 'Completed'
#             }

#             if field_type == 'tech_team':
#                 conflicts = AssignmentFollowUp.objects.filter(
#                     tech_team=new_value,
#                     date=assignment.date
#                 ).exclude(id=assignment_id)
                
#                 for conflict in conflicts:
#                     if conflict.assign_start and conflict.assign_end and assignment.assign_start and assignment.assign_end:
#                         if (assignment.assign_start < conflict.assign_end and
#                             assignment.assign_end > conflict.assign_start):
#                             return JsonResponse({
#                                'error': f"Tech team '{assignment.tech_team}' already has an assignment at {new_value}"
#                             }, status=400)

#             field_mapping = {
#                 'date': 'date',
#                 'time': 'time',
#                 'assign_start': 'assign_start',
#                 'assign_end': 'assign_end',
#                 'start_time': 'start_time',
#                 'end_time': 'end_time',
#                 'tech_team': 'tech_team',
#                 'status': 'status'
#             }

#             if field_type in field_mapping:
#                 setattr(assignment, field_mapping[field_type], new_value)
#                 old_status = assignment.status
                
#                 if field_type == 'assign_end' and new_value:
#                     assignment.status = 'Scheduled'
#                 elif field_type == 'end_time' and new_value:
#                     assignment.status = 'Completed'
#                 elif field_type == 'start_time' and new_value:
#                     assignment.status = 'Ongoing'

#                 if old_status != assignment.status:
#                     try:
#                         service_booking = ServiceBooking.objects.get(
#                             additional_info=assignment.client_information,
#                             service_date=assignment.req_date
#                         )
                        
#                         ServiceStatusHistory.objects.create(
#                             service_booking=service_booking,
#                             status=status_mapping[assignment.status],
#                             notes=f'Status updated to {status_mapping[assignment.status]}'
#                         )
                        
#                         service_booking.current_status = status_mapping[assignment.status]
#                         service_booking.save()
                        
#                     except ServiceBooking.DoesNotExist:
#                         pass

#                 assignment.full_clean()
#                 assignment.save()
#                 return JsonResponse({
#                     'status': 'success',
#                     'updated_value': getattr(assignment, field_mapping[field_type]),
#                     'current_status': assignment.status
#                 })

#         except ValidationError as e:
#             return JsonResponse({'error': str(e)}, status=400)
#         except AssignmentFollowUp.DoesNotExist:
#       
# 
#       return JsonResponse({'error': 'Assignment not found'}, status=404)


@csrf_exempt
def update_datetime(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        assignment_id = data.get('assignment_id')
        field_type = data.get('field_type')
        new_value = data.get('new_value') or data.get('new_date') or data.get('new_time')

        logger.info(f"Received request - Assignment ID: {assignment_id}, Field Type: {field_type}, New Value: {new_value}")

        try:
            assignment = AssignmentFollowUp.objects.get(id=assignment_id)
            logger.info(f"Found assignment: {assignment.client_information}")
            
            status_mapping = {
                'Draft': 'BOOKED',
                'Scheduled': 'VEHICLE_RECEIVED',
                'Ongoing': 'WORK_IN_PROGRESS',
                'Completed': 'COMPLETED'
            }

            # Tech team conflict check
            if field_type == 'tech_team':
                conflicts = AssignmentFollowUp.objects.filter(
                    tech_team=new_value,
                    date=assignment.date
                ).exclude(id=assignment_id)
                
                for conflict in conflicts:
                    if conflict.assign_start and conflict.assign_end and assignment.assign_start and assignment.assign_end:
                        if (assignment.assign_start < conflict.assign_end and
                            assignment.assign_end > conflict.assign_start):
                            logger.warning(f"Tech team conflict detected for {new_value}")
                            return JsonResponse({
                               'error': f"Tech team '{assignment.tech_team}' already has an assignment at {new_value}"
                            }, status=400)

            field_mapping = {
                'date': 'date',
                'time': 'time',
                'assign_start': 'assign_start',
                'assign_end': 'assign_end',
                'start_time': 'start_time',
                'end_time': 'end_time',
                'tech_team': 'tech_team',
                'status': 'status'
            }

            if field_type in field_mapping:
                setattr(assignment, field_mapping[field_type], new_value)
                old_status = assignment.status
                logger.info(f"Old status: {old_status}")
                
                status_changed = False
                if field_type == 'assign_end' and new_value:
                    assignment.status = 'Scheduled'
                    status_changed = True
                elif field_type == 'start_time' and new_value:
                    assignment.status = 'Ongoing'
                    status_changed = True
                elif field_type == 'end_time' and new_value:
                    assignment.status = 'Completed'
                    status_changed = True

                logger.info(f"New status: {assignment.status}")

                # Handle email notifications
                email_status = {'sent': False, 'recipient': None, 'error': None}
                if assignment.status == 'Completed' and old_status != 'Completed':
                    try:
                        customer = CustomUser.objects.get(customer_no=assignment.customer_no)
                        if customer.email:
                            context = {
                                'customer_name': customer.customer_name,
                                'service_date': assignment.date,
                                'status': 'Completed',
                                'assignment_id': assignment.id,
                                'client_information': assignment.client_information,
                                'customer_no': assignment.customer_no
                            }
                            html_message = render_to_string('assignment/email_template.html', context)
                            email_sent = send_mail(
                                subject='Vehicle Service Completed',
                                message='',
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                recipient_list=[customer.email],
                                fail_silently=False,
                                html_message=html_message
                            )
                            email_status.update({'sent': bool(email_sent), 'recipient': customer.email})
                    except Exception as e:
                        email_status['error'] = str(e)
                        logger.error(f"Email error: {str(e)}")

                # Enhanced service booking status update
                if status_changed:
                    try:
                        # First try to find by additional_info
                        service_bookings = ServiceBooking.objects.filter(
                            additional_info=assignment.client_information
                        )
                        
                        # If no bookings found and we have a customer number, try that
                        if not service_bookings.exists() and assignment.customer_no:
                            customer_no = str(assignment.customer_no)
                            service_bookings = ServiceBooking.objects.filter(
                                created_by_id=customer_no
                            )
                        
                        logger.info(f"Found {service_bookings.count()} matching service bookings")
                        
                        new_status = status_mapping.get(assignment.status)
                        if new_status and service_bookings.exists():
                            for booking in service_bookings:
                                old_booking_status = booking.current_status
                                
                                # Create status history
                                ServiceStatusHistory.objects.create(
                                    service_booking=booking,
                                    status=new_status,
                                    notes=f'Status updated from {old_booking_status} to {new_status}',
                                    created_at=timezone.now(),
                                    updated_at=timezone.now()
                                )
                                
                                # Update booking status
                                booking.current_status = new_status
                                booking.save()
                                
                                logger.info(f"Updated booking {booking.id} status: {old_booking_status} -> {new_status}")
                        else:
                            logger.warning(f"No service bookings found or invalid status mapping")
                            
                    except Exception as e:
                        logger.error(f"Status update error: {str(e)}", exc_info=True)

                assignment.save()
                
                response_data = {
                    'status': 'success',
                    'updated_value': getattr(assignment, field_mapping[field_type]),
                    'current_status': assignment.status,
                    'email_status': email_status
                }
                
                logger.info(f"Operation completed successfully: {response_data}")
                return JsonResponse(response_data)

        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            return JsonResponse({'error': str(e)}, status=400)
        except AssignmentFollowUp.DoesNotExist:
            logger.error(f"Assignment not found: {assignment_id}")
            return JsonResponse({'error': 'Assignment not found'}, status=404)

@require_http_methods(["GET"])
def get_meaning_options(request, lookup_name):
    meanings = LOOKUP_DETAILS.objects.filter(LOOKUP_NAME=lookup_name).values_list('MEANING', flat=True)
    sorted_meanings = sorted(meanings)
    return JsonResponse({"meanings": list(sorted_meanings)})

def track_assignment(request):
    return render(request, 'assignment/track_assignment.html')

@require_http_methods(["GET"])
def get_tech_team(request):
    tech_team_values = LOOKUP_DETAILS.objects.filter(
        LOOKUP_NAME='TECH TEAM'
    ).values_list('MEANING', flat=True)
    
    return JsonResponse({
        'status': 'success',
        'data': list(tech_team_values)
    })

def get_assignment_data(request):
    target_date = request.GET.get('date', datetime.now().date().isoformat())
    
    unique_tasks = AssignmentFollowUp.objects.filter(
        date=target_date
    ).values_list('client_information', flat=True).distinct()

    tasks_data = []
    
    tech_teams = LOOKUP_DETAILS.objects.filter(
        LOOKUP_NAME='TECH TEAM'
    ).values_list('MEANING', flat=True)

    for task in unique_tasks:
        task_entry = {
            "task": task
        }
        
        for tech in tech_teams:
            assignment = AssignmentFollowUp.objects.filter(
                date=target_date,
                client_information=task,
                tech_team=tech
            ).first()
            
            task_entry[tech.lower()] = task if assignment else ""

        tasks_data.append(task_entry)

    return JsonResponse({
        "tasks": tasks_data
    })

def get_technician_assignments(request):
    technician_name = request.GET.get('tech_team')
    
    if technician_name:
        assignments = AssignmentFollowUp.objects.filter(
            tech_team=technician_name
        ).values(
            'id',
            'tech_team',
            'client_information',
            'assign_start',
            'assign_end',
            'start_time',
            'end_time',
            'status',
            'date',
            'customer_no',
            'vin_number'
        ).order_by('date', 'assign_start')
        
        return JsonResponse({'assignments': list(assignments)})
    
    return JsonResponse({'error': 'Technician name is required'}, status=400)
