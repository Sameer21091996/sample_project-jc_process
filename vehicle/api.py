import jwt
from ninja import NinjaAPI, Schema
from django.contrib.auth import authenticate
from ninja.security import HttpBearer
from datetime import date, datetime
from typing import Optional
import uuid
from django.db import models
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

from assignment.models import AssignmentFollowUp
from .models import CustomUser, Item, ServiceHistory, ServiceStatusHistory, ItemSerial, ServiceBooking, Lookup, VehicleCustomerLink
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from datetime import datetime
from django.db.models import Q
from ninja.errors import HttpError

api = NinjaAPI()

class LoginSchema(Schema):
    customer_no: str
    password: str

class JWTResponse(Schema):
    access: str
    refresh: str

@api.post("/login", response=JWTResponse)
def login(request, data: LoginSchema):
    print(f"Login attempt for customer_no: {data.customer_no}")
    try:
        user = CustomUser.objects.get(customer_no=data.customer_no)
        user.save()
        if user.check_password(data.password):
            refresh = RefreshToken.for_user(user)
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        print("Backend: Sending JWT tokens to client")
    except CustomUser.DoesNotExist:
        pass
    raise HttpError(401, "Invalid credentials")

@api.post("/token/refresh")
def refresh_token(request, refresh_token: str):
    try:
        refresh = RefreshToken(refresh_token)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }
    except Exception as e:
        return {"error": "Invalid refresh token"}

class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except:
            return None

class VehicleSchema(Schema):
    VIN: str
    MFG: str
    IMAGE_URL: str
    MODEL_YEAR: str

@api.get("/vehicles", response=list[VehicleSchema], auth=JWTAuth())
def get_vehicles(request):
    if not request.auth:
        raise HttpError(401, "Authentication required")
    
    customer_no = request.auth.get('customer_no')
    print(f"\n=== Fetching Vehicles for Customer ===")
    print(f"Customer Number: {customer_no}")
    
    vehicle_links = VehicleCustomerLink.objects.filter(
        CUSTOMER_NUMBER=customer_no
    ).values_list('VIN_NUMBER', 'ITEM_ID')
    print(f"Found {len(vehicle_links)} vehicle links")
    
    result = []
    for vin, item_id in vehicle_links:
        print(f"\nProcessing Vehicle:")
        print(f"VIN: {vin}")
        print(f"Item ID: {item_id}")
        
        serial = ItemSerial.objects.get(VIN=vin)
        item = Item.objects.get(ITEM_ID=item_id)
        
        vehicle_data = {
            'VIN': serial.VIN,
            'MFG': item.MFG,
            'IMAGE_URL': item.IMAGE_URL,
            'MODEL_YEAR': serial.MODEL_YEAR
        }
        print(f"Vehicle Details: {vehicle_data}")
        result.append(vehicle_data)
    
    print(f"\nTotal vehicles returned: {len(result)}")
    return result

class ServiceBookingSchema(Schema):
    vehicle_id: str
    workshop_location: str
    timing_slot_id: int
    additional_info: Optional[str]
    customer_name: str
    service_date: date

def is_working_day(check_date):
    working_days = Lookup.objects.filter(
        LOOK_TYPE='Working Days'
    ).values_list('MEANING', flat=True)
    return check_date.strftime('%A') in working_days

def check_available_slots(workshop_location, service_date, timing_slot_id):
    existing_bookings = ServiceBooking.objects.filter(
        workshop_location=workshop_location,
        service_date=service_date,
        timing_slot_id=timing_slot_id
    ).count()
    max_bookings_per_slot = 3
    return existing_bookings < max_bookings_per_slot

@api.get("/available-slots/{date}/{location}")
def get_available_slots(request, date: str, location: str):
    try:
        all_slots = Lookup.objects.filter(LOOK_TYPE='Timing Slot')
        booked_slots = ServiceBooking.objects.filter(
            service_date=date,
            workshop_location=location
        ).values_list('timing_slot_id', flat=True)
        
        available_slots = []
        for slot in all_slots:
            available_slots.append({
                'id': slot.id,
                'value': slot.MEANING,
                'is_available': slot.id not in booked_slots
            })
        return available_slots
    except Exception as e:
        print(f"Error in get_available_slots: {str(e)}")
        return {"error": str(e)}

# @api.post("/book-service", auth=JWTAuth())
# def create_service_booking(request, data: ServiceBookingSchema):
#     try:
#         if not request.auth:
#             return {"success": False, "message": "Authentication required"}
        
#         customer_no = request.auth.get('customer_no')
#         print(f"Creating service booking for customer_no: {customer_no}")

#         vehicle = ItemSerial.objects.filter(
#             VIN=data.vehicle_id
#         ).first()
        
#         if not vehicle:
#             return {"success": False, "message": "Vehicle not found or unauthorized"}

#         service_date = data.service_date
        
#         if service_date < date.today():
#             return {"success": False, "message": "Service date cannot be in the past"}
            
#         if not is_working_day(service_date):
#             return {"success": False, "message": "Selected date is not a working day"}
            
#         existing_booking = ServiceBooking.objects.filter(
#             vehicle_id=data.vehicle_id,
#             service_date=service_date,
#             timing_slot_id=data.timing_slot_id
#         ).exists()
        
#         if existing_booking:
#             return {"success": False, "message": "Vehicle already has a booking on this date and time slot"}
            
#         if not check_available_slots(data.workshop_location, service_date, data.timing_slot_id):
#             return {"success": False, "message": "Selected time slot is not available for this date"}

#         timing_slot = Lookup.objects.get(
#             id=data.timing_slot_id,
#             LOOK_TYPE='Timing Slot'
#         )

#         workshop_location = Lookup.objects.get(
#             LOOK_TYPE='Workshop Location',
#             MEANING=data.workshop_location
#         )

#         last_request_id = ServiceBooking.objects.all().aggregate(models.Max('request_id'))['request_id__max']
#         new_request_id = 1000 if last_request_id is None else int(last_request_id) + 1

#         service_booking = ServiceBooking.objects.create(
#             vehicle=vehicle,
#             workshop_location=workshop_location.MEANING,  
#             timing_slot=timing_slot,
#             timing_slot_value=timing_slot.MEANING,
#             additional_info=data.additional_info,
#             created_by_id=customer_no,
#             request_id=new_request_id,
#             customer_name=data.customer_name,
#             service_date=service_date,
#             current_status='BOOKED'
#         )

#         from assignment.models import AssignmentFollowUp
#         AssignmentFollowUp.objects.create(
#             client_information=service_booking.additional_info,
#             req_date=service_booking.created_at,
#             date=service_booking.service_date,
#             status='Draft',
#             customer_no=customer_no,
#             vin_number=data.vehicle_id
#         )

#         ServiceStatusHistory.objects.create(
#             service_booking=service_booking,
#             status='BOOKED',
#             notes='Service booking created by customer',
#         )

#         print(f"Service booking created successfully: {service_booking.id}")
#         return {
#             "success": True,
#             "message": "Service booked successfully",
#             "booking_id": service_booking.id,
#             "request_id": service_booking.request_id,
#             "timing_slot": timing_slot.MEANING
#         }

#     except Lookup.DoesNotExist:
#         return {"success": False, "message": "Invalid timing slot"}
#     except Exception as e:
#         print(f"Error creating service booking: {str(e)}")
#         return {"success": False, "message": str(e)}    



# @api.post("/book-service", auth=JWTAuth())
# def create_service_booking(request, data: ServiceBookingSchema):
#     try:
#         if not request.auth:
#             return {"success": False, "message": "Authentication required"}
        
#         customer_no = request.auth.get('customer_no')
#         print(f"Creating service booking for customer_no: {customer_no}")

#         vehicle = ItemSerial.objects.filter(
#             VIN=data.vehicle_id
#         ).first()
        
#         if not vehicle:
#             return {"success": False, "message": "Vehicle not found or unauthorized"}

#         service_date = data.service_date
        
#         if service_date < date.today():
#             return {"success": False, "message": "Service date cannot be in the past"}
            
#         if not is_working_day(service_date):
#             return {"success": False, "message": "Selected date is not a working day"}
            
#         existing_booking = ServiceBooking.objects.filter(
#             vehicle_id=data.vehicle_id,
#             service_date=service_date,
#             timing_slot_id=data.timing_slot_id
#         ).exists()
        
#         if existing_booking:
#             return {"success": False, "message": "Vehicle already has a booking on this date and time slot"}
            
#         if not check_available_slots(data.workshop_location, service_date, data.timing_slot_id):
#             return {"success": False, "message": "Selected time slot is not available for this date"}

#         timing_slot = Lookup.objects.get(
#             id=data.timing_slot_id,
#             LOOK_TYPE='Timing Slot'
#         )

#         workshop_location = Lookup.objects.get(
#             LOOK_TYPE='Workshop Location',
#             MEANING=data.workshop_location
#         )

#         last_request_id = ServiceBooking.objects.all().aggregate(models.Max('request_id'))['request_id__max']
#         new_request_id = 1000 if last_request_id is None else int(last_request_id) + 1

#         service_booking = ServiceBooking.objects.create(
#             vehicle=vehicle,
#             workshop_location=workshop_location.MEANING,  
#             timing_slot=timing_slot,
#             timing_slot_value=timing_slot.MEANING,
#             additional_info=data.additional_info,
#             created_by_id=customer_no,
#             request_id=new_request_id,
#             customer_name=data.customer_name,
#             service_date=service_date,
#             current_status='BOOKED'
#         )

#         # Create assignment follow-up
#         from assignment.models import AssignmentFollowUp
#         AssignmentFollowUp.objects.create(
#             client_information=service_booking.additional_info,
#             req_date=service_booking.created_at,
#             date=service_booking.service_date,
#             status='Draft',
#             customer_no=customer_no,
#             vin_number=data.vehicle_id
#         )

#         ServiceStatusHistory.objects.create(
#             service_booking=service_booking,
#             status='BOOKED',
#             notes='Service booking created by customer',
#         )

#         # Send email notification
#         try:
#             context = {
#                 'request_no': str(service_booking.request_id),
#                 'date': service_booking.created_at.strftime('%Y-%m-%d'),
#                 'customer_name': data.customer_name,
#                 'customer_no': customer_no,
#                 'model': vehicle.ITEM_ID.MFG,
#                 'model_year': vehicle.MODEL_YEAR,
#                 'vin': vehicle.VIN,
#                 'workshop_location': data.workshop_location,
#                 'slot_time': timing_slot.MEANING,
#                 'additional_info': data.additional_info or 'N/A'
#             }

#             html_content = render_to_string('vehicle/email-template.html', context)
#             text_content = strip_tags(html_content)

#             email = EmailMessage(
#                 subject=f'Service Booking Confirmation - Request #{service_booking.request_id}',
#                 body=html_content,
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 to=['tappasameer743@gmail.com'],
#                 cc=['tappasameer707@gmail.com']
#             )
#             email.content_subtype = "html"
#             email.send(fail_silently=False)
#             print("Email sent successfully")
#         except Exception as email_error:
#             print(f"Email sending failed: {email_error}")

#         print(f"Service booking created successfully: {service_booking.id}")
#         return {
#             "success": True,
#             "message": "Service booked successfully",
#             "booking_id": service_booking.id,
#             "request_id": service_booking.request_id,
#             "timing_slot": timing_slot.MEANING
#         }

#     except Lookup.DoesNotExist:
#         return {"success": False, "message": "Invalid timing slot"}
#     except Exception as e:
#         print(f"Error creating service booking: {str(e)}")
#         return {"success": False, "message": str(e)}





# @api.post("/book-service", auth=JWTAuth())
# def create_service_booking(request, data: ServiceBookingSchema):
#     try:
#         if not request.auth:
#             return {"success": False, "message": "Authentication required"}
        
#         customer_no = request.auth.get('customer_no')
        
#         # Get the customer details from CustomUser model
#         customer = CustomUser.objects.filter(customer_no=customer_no).first()
#         if not customer:
#             return {"success": False, "message": "Customer not found"}
            
#         print(f"Creating service booking for customer_no: {customer_no}")

#         vehicle = ItemSerial.objects.filter(
#             VIN=data.vehicle_id
#         ).first()
        
#         if not vehicle:
#             return {"success": False, "message": "Vehicle not found or unauthorized"}

#         service_date = data.service_date
        
#         if service_date < date.today():
#             return {"success": False, "message": "Service date cannot be in the past"}
            
#         if not is_working_day(service_date):
#             return {"success": False, "message": "Selected date is not a working day"}
            
#         existing_booking = ServiceBooking.objects.filter(
#             vehicle_id=data.vehicle_id,
#             service_date=service_date,
#             timing_slot_id=data.timing_slot_id
#         ).exists()
        
#         if existing_booking:
#             return {"success": False, "message": "Vehicle already has a booking on this date and time slot"}
            
#         if not check_available_slots(data.workshop_location, service_date, data.timing_slot_id):
#             return {"success": False, "message": "Selected time slot is not available for this date"}

#         timing_slot = Lookup.objects.get(
#             id=data.timing_slot_id,
#             LOOK_TYPE='Timing Slot'
#         )

#         workshop_location = Lookup.objects.get(
#             LOOK_TYPE='Workshop Location',
#             MEANING=data.workshop_location
#         )

#         last_request_id = ServiceBooking.objects.all().aggregate(models.Max('request_id'))['request_id__max']
#         new_request_id = 1000 if last_request_id is None else int(last_request_id) + 1

#         # Format client info with customer name from CustomUser model
#         client_info_with_request = f"{new_request_id} - {customer.customer_name} - {data.additional_info}"

#         service_booking = ServiceBooking.objects.create(
#             vehicle=vehicle,
#             workshop_location=workshop_location.MEANING,  
#             timing_slot=timing_slot,
#             timing_slot_value=timing_slot.MEANING,
#             additional_info=client_info_with_request,
#             created_by_id=customer_no,
#             request_id=new_request_id,
#             customer_name=customer.customer_name,  # Use customer name from CustomUser
#             service_date=service_date,
#             current_status='BOOKED'
#         )

#         # Create assignment follow-up
#         from assignment.models import AssignmentFollowUp
#         AssignmentFollowUp.objects.create(
#             client_information=client_info_with_request,
#             req_date=service_booking.created_at,
#             date=service_booking.service_date,
#             status='Draft',
#             customer_no=customer_no,
#             vin_number=data.vehicle_id
#         )

#         ServiceStatusHistory.objects.create(
#             service_booking=service_booking,
#             status='BOOKED',
#             notes='Service booking created by customer',
#         )

#         # Send email notification
#         try:
#             context = {
#                 'request_no': str(service_booking.request_id),
#                 'date': service_booking.created_at.strftime('%Y-%m-%d'),
#                 'customer_name': customer.customer_name,  # Use customer name from CustomUser
#                 'customer_no': customer_no,
#                 'model': vehicle.ITEM_ID.MFG,
#                 'model_year': vehicle.MODEL_YEAR,
#                 'vin': vehicle.VIN,
#                 'workshop_location': data.workshop_location,
#                 'slot_time': timing_slot.MEANING,
#                 'additional_info': client_info_with_request
#             }

#             html_content = render_to_string('vehicle/email-template.html', context)
#             text_content = strip_tags(html_content)

#             email = EmailMessage(
#                 subject=f'Service Booking Confirmation - Request #{service_booking.request_id}',
#                 body=html_content,
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 to=['tappasameer743@gmail.com'],
#                 cc=['tappasameer707@gmail.com']
#             )
#             email.content_subtype = "html"
#             email.send(fail_silently=False)
#             print("Email sent successfully")
#         except Exception as email_error:
#             print(f"Email sending failed: {email_error}")

#         print(f"Service booking created successfully: {service_booking.id}")
#         return {
#             "success": True,
#             "message": "Service booked successfully",
#             "booking_id": service_booking.id,
#             "request_id": service_booking.request_id,
#             "timing_slot": timing_slot.MEANING
#         }

#     except Lookup.DoesNotExist:
#         return {"success": False, "message": "Invalid timing slot"}
#     except Exception as e:
#         print(f"Error creating service booking: {str(e)}")
#         return {"success": False, "message": str(e)}





# @api.post("/book-service", auth=JWTAuth())
# def create_service_booking(request, data: ServiceBookingSchema):
#     try:
#         if not request.auth:
#             return {"success": False, "message": "Authentication required"}
        
#         customer_no = request.auth.get('customer_no')
        
#         customer = CustomUser.objects.filter(customer_no=customer_no).first()
#         if not customer:
#             return {"success": False, "message": "Customer not found"}
            
#         print(f"Creating service booking for customer_no: {customer_no}")

#         vehicle = ItemSerial.objects.filter(
#             VIN=data.vehicle_id
#         ).first()
        
#         if not vehicle:
#             return {"success": False, "message": "Vehicle not found or unauthorized"}

#         service_date = data.service_date
        
#         if service_date < date.today():
#             return {"success": False, "message": "Service date cannot be in the past"}
            
#         if not is_working_day(service_date):
#             return {"success": False, "message": "Selected date is not a working day"}
            
#         existing_booking = ServiceBooking.objects.filter(
#             vehicle_id=data.vehicle_id,
#             service_date=service_date,
#             timing_slot_id=data.timing_slot_id
#         ).exists()
        
#         if existing_booking:
#             return {"success": False, "message": "Vehicle already has a booking on this date and time slot"}
            
#         if not check_available_slots(data.workshop_location, service_date, data.timing_slot_id):
#             return {"success": False, "message": "Selected time slot is not available for this date"}

#         timing_slot = Lookup.objects.get(
#             id=data.timing_slot_id,
#             LOOK_TYPE='Timing Slot'
#         )

#         workshop_location = Lookup.objects.get(
#             LOOK_TYPE='Workshop Location',
#             MEANING=data.workshop_location
#         )

#         last_request_id = ServiceBooking.objects.all().aggregate(models.Max('request_id'))['request_id__max']
#         new_request_id = 1000 if last_request_id is None else int(last_request_id) + 1

#         client_info_with_request = f"{new_request_id} - {customer.customer_name} - {data.additional_info}"

#         service_booking = ServiceBooking.objects.create(
#             vehicle=vehicle,
#             workshop_location=workshop_location.MEANING,  
#             timing_slot=timing_slot,
#             timing_slot_value=timing_slot.MEANING,
#             additional_info=client_info_with_request,
#             created_by_id=customer_no,
#             request_id=new_request_id,
#             customer_name=customer.customer_name,
#             service_date=service_date,
#             current_status='BOOKED'
#         )

#         AssignmentFollowUp.objects.create(
#             client_information=client_info_with_request,
#             req_date=service_booking.created_at,
#             date=service_booking.service_date,
#             status='Draft',
#             customer_no=customer_no,
#             vin_number=data.vehicle_id
#         )

#         ServiceStatusHistory.objects.create(
#             service_booking=service_booking,
#             status='BOOKED',
#             notes='Service booking created by customer',
#         )

#         try:
#             context = {
#                 'request_no': str(service_booking.request_id),
#                 'date': service_booking.created_at.strftime('%Y-%m-%d'),
#                 'customer_name': customer.customer_name,
#                 'customer_no': customer_no,
#                 'model': vehicle.ITEM_ID.MFG,
#                 'model_year': vehicle.MODEL_YEAR,
#                 'vin': vehicle.VIN,
#                 'workshop_location': data.workshop_location,
#                 'slot_time': timing_slot.MEANING,
#                 'additional_info': client_info_with_request
#             }

#             html_content = render_to_string('vehicle/email-template.html', context)
#             text_content = strip_tags(html_content)

#             email = EmailMessage(
#                 subject=f'Service Booking Confirmation - Request #{service_booking.request_id}',
#                 body=html_content,
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 to=['tappasameer743@gmail.com'],
#                 cc=['tappasameer707@gmail.com']
#             )
#             email.content_subtype = "html"
#             email.send(fail_silently=False)
#             print("Email sent successfully")
#         except Exception as email_error:
#             print(f"Email sending failed: {email_error}")

#         print(f"Service booking created successfully: {service_booking.id}")
#         return {
#             "success": True,
#             "message": "Service booked successfully",
#             "booking_id": service_booking.id,
#             "request_id": service_booking.request_id,
#             "timing_slot": timing_slot.MEANING
#         }

#     except Lookup.DoesNotExist:
#         return {"success": False, "message": "Invalid timing slot"}
#     except Exception as e:
#         print(f"Error creating service booking: {str(e)}")
#         return {"success": False, "message": str(e)}


@api.post("/book-service", auth=JWTAuth())
def create_service_booking(request, data: ServiceBookingSchema):
    try:
        if not request.auth:
            return {"success": False, "message": "Authentication required"}
        
        customer_no = request.auth.get('customer_no')
        
        customer = CustomUser.objects.filter(customer_no=customer_no).first()
        if not customer:
            return {"success": False, "message": "Customer not found"}
            
        print(f"Creating service booking for customer_no: {customer_no}")

        vehicle = ItemSerial.objects.filter(
            VIN=data.vehicle_id
        ).first()
        
        if not vehicle:
            return {"success": False, "message": "Vehicle not found or unauthorized"}

        service_date = data.service_date
        
        if service_date < date.today():
            return {"success": False, "message": "Service date cannot be in the past"}
            
        if not is_working_day(service_date):
            return {"success": False, "message": "Selected date is not a working day"}
            
        existing_booking = ServiceBooking.objects.filter(
            vehicle_id=data.vehicle_id,
            service_date=service_date,
            timing_slot_id=data.timing_slot_id
        ).exists()
        
        if existing_booking:
            return {"success": False, "message": "Vehicle already has a booking on this date and time slot"}
            
        if not check_available_slots(data.workshop_location, service_date, data.timing_slot_id):
            return {"success": False, "message": "Selected time slot is not available for this date"}

        # Debug timing slot
        print(f"Timing slot ID: {data.timing_slot_id}")
        timing_slot = Lookup.objects.get(
            id=data.timing_slot_id,
            LOOK_TYPE='Timing Slot'
        )
        print(f"Timing slot MEANING: {timing_slot.MEANING}")

        # Enhanced timing slot parsing
        try:
            if '-' in timing_slot.MEANING:
                start_time_str, end_time_str = timing_slot.MEANING.split('-')
            else:
                time_parts = timing_slot.MEANING.split()
                if len(time_parts) >= 2:
                    start_time_str = time_parts[0]
                    end_time_str = time_parts[-1]
                else:
                    raise ValueError("Invalid time format")

            start_time_str = start_time_str.strip().upper()
            end_time_str = end_time_str.strip().upper()

            if 'AM' in start_time_str or 'PM' in start_time_str:
                assign_start = datetime.strptime(start_time_str, '%I:%M %p').time()
            else:
                assign_start = datetime.strptime(start_time_str, '%H:%M').time()

            if 'AM' in end_time_str or 'PM' in end_time_str:
                assign_end = datetime.strptime(end_time_str, '%I:%M %p').time()
            else:
                assign_end = datetime.strptime(end_time_str, '%H:%M').time()

        except ValueError as e:
            print(f"Error parsing time: {e}")
            print(f"Timing slot value: {timing_slot.MEANING}")
            return {"success": False, "message": f"Invalid timing slot format: {timing_slot.MEANING}"}

        workshop_location = Lookup.objects.get(
            LOOK_TYPE='Workshop Location',
            MEANING=data.workshop_location
        )

        last_request_id = ServiceBooking.objects.all().aggregate(models.Max('request_id'))['request_id__max']
        new_request_id = 1000 if last_request_id is None else int(last_request_id) + 1

        client_info_with_request = f"{new_request_id} - {customer.customer_name} - {data.additional_info}"

        service_booking = ServiceBooking.objects.create(
            vehicle=vehicle,
            workshop_location=workshop_location.MEANING,  
            timing_slot=timing_slot,
            timing_slot_value=timing_slot.MEANING,
            additional_info=client_info_with_request,
            created_by_id=customer_no,
            request_id=new_request_id,
            customer_name=customer.customer_name,
            service_date=service_date,
            current_status='BOOKED'
        )

        AssignmentFollowUp.objects.create(
            client_information=client_info_with_request,
            req_date=service_booking.created_at,
            date=service_booking.service_date,
            status='Draft',
            customer_no=customer_no,
            vin_number=data.vehicle_id,
            assign_start=assign_start,
            assign_end=assign_end,
            time=assign_start
        )

        ServiceStatusHistory.objects.create(
            service_booking=service_booking,
            status='BOOKED',
            notes='Service booking created by customer',
        )

        try:
            context = {
                'request_no': str(service_booking.request_id),
                'date': service_booking.created_at.strftime('%Y-%m-%d'),
                'customer_name': customer.customer_name,
                'customer_no': customer_no,
                'model': vehicle.ITEM_ID.MFG,
                'model_year': vehicle.MODEL_YEAR,
                'vin': vehicle.VIN,
                'workshop_location': data.workshop_location,
                'slot_time': timing_slot.MEANING,
                'additional_info': client_info_with_request
            }

            html_content = render_to_string('vehicle/email-template.html', context)
            text_content = strip_tags(html_content)

            email = EmailMessage(
                subject=f'Service Booking Confirmation - Request #{service_booking.request_id}',
                body=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=['tappasameer743@gmail.com'],
                cc=['tappasameer707@gmail.com']
            )
            email.content_subtype = "html"
            email.send(fail_silently=False)
            print("Email sent successfully")
        except Exception as email_error:
            print(f"Email sending failed: {email_error}")

        print(f"Service booking created successfully: {service_booking.id}")
        return {
            "success": True,
            "message": "Service booked successfully",
            "booking_id": service_booking.id,
            "request_id": service_booking.request_id,
            "timing_slot": timing_slot.MEANING
        }

    except Lookup.DoesNotExist:
        return {"success": False, "message": "Invalid timing slot"}
    except Exception as e:
        print(f"Error creating service booking: {str(e)}")
        return {"success": False, "message": str(e)}

class StatusUpdateSchema(Schema):
    booking_id: int
    status: str
    notes: Optional[str]

@api.post("/update-service-status")
def update_service_status(request, data: StatusUpdateSchema):
    try:
        booking = ServiceBooking.objects.get(id=data.booking_id)
        
        valid_transitions = {
            'BOOKED': ['RECEIVED'],
            'RECEIVED': ['INSPECTION'],
            'INSPECTION': ['WORK IN PROGRESS'],
            'WORK IN PROGRESS': ['COMPLETED']
        }
        
        if data.status not in valid_transitions.get(booking.current_status, []):
            return {"success": False, "message": "Invalid status transition"}

        booking.current_status = data.status
        booking.save()

        ServiceStatusHistory.objects.create(
            service_booking=booking,
            status=data.status,
            notes=data.notes,
            created_by=request.user
        )

        return {"success": True, "message": "Status updated successfully"}
    except ServiceBooking.DoesNotExist:
        return {"success": False, "message": "Booking not found"}


class ServiceRequestSchema(Schema):
    request_id: str
    vehicle_name: str
    vehicle_image: str
    vin: str
    mfg_year: str
    status: str
    booking_date: str
# @api.get("/service-requests", auth=JWTAuth())
# def get_service_requests(request):
#     try:
#         if not request.auth:
#             raise HttpError(401, "Authentication required")
        
#         user_id = request.auth.get('user_id')
#         print(f"Fetching service requests for user_id: {user_id}")

#         bookings = ServiceBooking.objects.filter(
#             vehicle__customer_links__customer_id=user_id
#         ).order_by('-created_at')

#         response_data = []
        
#         for booking in bookings:
#             status_history = booking.status_history.all().order_by('status_date')
#             status_timeline = [{
#                 'status': history.status,
#                 'date': history.status_date.strftime('%Y-%m-%d %H:%M'),
#                 'notes': history.notes
#             } for history in status_history]
#             response_data.append({
#                 'request_id': booking.request_id,
#                 'vehicle_name': booking.vehicle.name,
#                 'vehicle_image': booking.vehicle.image,
#                 'vin': booking.vehicle.vin,
#                 'mfg_year': booking.vehicle.mfg_year,
#                 'status': booking.current_status,
#                 'booking_date': booking.created_at.strftime('%Y-%m-%d'),
#                 'workshop_location': booking.workshop_location,
#                 'timing_slot': booking.timing_slot.value if booking.timing_slot else '',
#                 'additional_info': booking.additional_info,
#                 'status_timeline': status_timeline
#             })
        
#         return response_data
#     except Exception as e:
#         print(f"Error fetching service requests: {str(e)}")
#         return {"error": str(e)}


# @api.get("/service-requests", auth=JWTAuth())
# def get_service_requests(request):
#     try:
#         if not request.auth:
#             raise HttpError(401, "Authentication required")
       
#         customer_no = request.auth.get('customer_no')  # Changed from user_id to customer_no
#         print(f"Fetching service requests for customer_no: {customer_no}")

#         # Get VIN numbers linked to this customer
#         linked_vins = VehicleCustomerLink.objects.filter(
#             CUSTOMER_NUMBER=customer_no
#         ).values_list('VIN_NUMBER', flat=True)

#         # Filter service bookings for vehicles owned by this customer
#         bookings = ServiceBooking.objects.filter(
#             vehicle__VIN__in=linked_vins
#         ).order_by('-created_at')

#         response_data = []
       
#         for booking in bookings:
#             status_history = booking.status_history.all().order_by('status_date')
#             status_timeline = [{
#                 'status': history.status,
#                 'date': history.status_date.strftime('%Y-%m-%d %H:%M'),
#                 'notes': history.notes
#             } for history in status_history]
            
#             response_data.append({
#                 'request_id': booking.request_id,
#                 'vehicle_name': booking.vehicle.ITEM_ID.MFG,  # Assuming this relationship exists
#                 'vehicle_image': booking.vehicle.ITEM_ID.IMAGE_URL,  # Assuming this relationship exists
#                 'vin': booking.vehicle.VIN,
#                 'mfg_year': booking.vehicle.MODEL_YEAR,
#                 'status': booking.current_status,
#                 'booking_date': booking.created_at.strftime('%Y-%m-%d'),
#                 'workshop_location': booking.workshop_location,
#                 'timing_slot': booking.timing_slot.MEANING if booking.timing_slot else '',
#                 'additional_info': booking.additional_info,
#                 'status_timeline': status_timeline
#             })
       
#         return response_data
#     except Exception as e:
#         print(f"Error fetching service requests: {str(e)}")
#         return {"error": str(e)}


@api.get("/service-requests", auth=JWTAuth())
def get_service_requests(request):
    try:
        if not request.auth:
            raise HttpError(401, "Authentication required")
       
        customer_no = request.auth.get('customer_no')
        print(f"Fetching service requests for customer_no: {customer_no}")

        linked_vins = VehicleCustomerLink.objects.filter(
            CUSTOMER_NUMBER=customer_no
        ).values_list('VIN_NUMBER', flat=True)

        bookings = ServiceBooking.objects.filter(
            vehicle__VIN__in=linked_vins
        ).select_related('vehicle__ITEM_ID').prefetch_related('status_history').order_by('-created_at')

        response_data = []
        
        for booking in bookings:
            status_history = booking.status_history.all().order_by('status_date')
            status_timeline = [{
                'status': history.status,
                'date': history.status_date.strftime('%Y-%m-%d %H:%M'),
                'notes': history.notes
            } for history in status_history]
            
            response_data.append({
                'request_id': booking.request_id,
                'vehicle_name': booking.vehicle.ITEM_ID.MFG,
                'vehicle_image': booking.vehicle.ITEM_ID.IMAGE_URL,
                'vin': booking.vehicle.VIN,
                'mfg_year': booking.vehicle.MODEL_YEAR,
                'status': booking.current_status,
                'booking_date': booking.created_at.strftime('%Y-%m-%d'),
                'workshop_location': booking.workshop_location,
                'timing_slot': booking.timing_slot.MEANING if booking.timing_slot else '',
                'additional_info': booking.additional_info,
                'status_timeline': status_timeline
            })
       
        return response_data
    except Exception as e:
        print(f"Error fetching service requests: {str(e)}")
        return {"error": str(e)}



# class EmailSchema(Schema):
#     booking_id: int
#     vehicle_id: int
#     workshop_location: str
#     timing_slot_id: int 
#     additional_info: Optional[str] = None

# @api.post("/send-email")
# def send_email_api(request, email_data: EmailSchema):
#     try:
#         service_booking = ServiceBooking.objects.get(id=email_data.booking_id)
#         vehicle = ItemSerial.objects.get(id=email_data.vehicle_id)
#         timing_slot = Lookup.objects.get(id=email_data.timing_slot_id)

#         context = {
#             'request_no': str(service_booking.request_id),
#             'date': service_booking.created_at.strftime('%Y-%m-%d'),
#             'customer_name': service_booking.customer_name or 'N/A',
#             'customer_no': service_booking.created_by.cutomer_no if service_booking.created_by else 'N/A',
#             'model': vehicle.name or 'N/A',
#             'model_year': vehicle.mfg_year or 'N/A',
#             'vin': vehicle.vin or 'N/A',
#             'workshop_location': email_data.workshop_location,
#             'slot_time': timing_slot.value if timing_slot else 'N/A',
#             'additional_info': email_data.additional_info or 'N/A'
#         }

        
      
#         html_content = render_to_string('vehicle/email-template.html', context)
#         text_content = strip_tags(html_content)

#         email = EmailMessage(
#             subject='New Service Booking Request',
#             body=html_content,
#             from_email=settings.DEFAULT_FROM_EMAIL,
#             to=['ymahammadkaif@gmail.com'],
#             cc=['bf99584@gmail.com']
#         )
#         email.content_subtype = "html"
#         email.send(fail_silently=False)

#         return {"success": True, "message": "Email sent successfully"}
#     except Exception as e:
#         return {"success": False, "error": str(e)}




@api.get("/lookup/{look_type}")
def get_lookup_values(request, look_type: str):
    lookups = Lookup.objects.filter(LOOK_TYPE=look_type)
    return [{
        "value": l.MEANING,  
        "id": l.id,
        "code": l.CODE
    } for l in lookups]


@api.get("/service-history/{customer_no}", auth=JWTAuth())
def get_service_history(request, customer_no: str):
    if not request.auth:
        raise HttpError(401, "Authentication required")

    history = ServiceHistory.objects.filter(
        CUSTOMER_NUMBER=customer_no
    ).order_by('-SERVICE_DATE')

    return [{
        "service_number": h.SERVICE_NUMBER,
        "service_date": h.SERVICE_DATE,
        "amount": h.AMOUNT,
        "incident_type": h.INCIDENT_TYPE,
        "incident_type_id": h.INCIDENT_TYPE_ID,
        "status": h.STATUS,
        "summary": h.SUMMARY,
        "registration": h.REGISTRATION,
        "branch": h.BRANCH,
        "customer_name": h.CUSTOMER_NAME,
        "customer_number": h.CUSTOMER_NUMBER,
        "vin": h.VIN,
        "created_by": h.CREATED_BY,
        "last_updated_by": h.LAST_UPDATED_BY,
        "creation_date": h.CREATION_DATE,
        "last_update_date": h.LAST_UPDATE_DATE
    } for h in history]





@api.get("/service-history/vehicle/{vin}", auth=JWTAuth())
def get_vehicle_service_history(request, vin: str):
    if not request.auth:
        raise HttpError(401, "Authentication required")

    customer_no =   customer_no = request.auth.get('customer_no') 

    history = ServiceHistory.objects.filter(
        VIN=vin,
        CUSTOMER_NUMBER=customer_no  
    ).order_by('-SERVICE_DATE')

    count = history.count()
    print(f"Total records for VIN {vin} and customer {customer_no}: {count}")

    return [{
        "service_date": h.SERVICE_DATE,
        "incident_type": h.INCIDENT_TYPE,
        "summary": h.SUMMARY,
        "amount": h.AMOUNT
    } for h in history]
