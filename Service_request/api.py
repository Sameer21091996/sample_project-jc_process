
from datetime import date, datetime
from decimal import Decimal
from email.quoprimime import unquote
import json
import random
from time import timezone
import uuid
from django.http import JsonResponse
from ninja import NinjaAPI, Path, Schema
from django.shortcuts import get_object_or_404
from typing import List, Optional, Union
from vehicle.models import VehicleCustomerLink, CustomUser, Item
from assignment.models import LOOKUP_DETAILS,LOOKUP_MASTER
from Service_request.models import CONSUMABLE, CUSTOMERBALANCE, LABOR, MATERIAL, ComponentSubtotal, ServiceRequestHeader, ServiceRequestLine, Sublet
from urllib.parse import unquote
from django.db.models import Sum

servicerequest_api = NinjaAPI(version="service-1.0.0")




@servicerequest_api.get("/customer-details", response={200: dict})
def get_customer_details(request, vin_number: str):
    try:
        vehicle_link = get_object_or_404(
            VehicleCustomerLink, 
            VIN_NUMBER=vin_number,
            ENABLED_FLAG='Y'
        )
        
        customer = get_object_or_404(
            CustomUser, 
            customer_no=vehicle_link.CUSTOMER_NUMBER
        )
        
        item = get_object_or_404(
            Item, 
            ITEM_ID=vehicle_link.ITEM_ID
        )
        
        return 200, {
            "customer_name": customer.customer_name,
            "ship_to_account_number": customer.ship_to_account_number,
            "ship_to_customer_name": customer.ship_to_customer_name,
            "bill_to_account_number": customer.bill_to_account_number,
            "bill_to_customer_name": customer.bill_to_customer_name,
            "address": customer.address,
            "account_number": customer.account_number,
            "mobile_number": customer.mobile_number,
            "item_code": item.ITEM_CODE,
            "item_description": item.DESCRIPTION  # Add this line
        }
        
    except Exception as e:
        return 404, {"error": str(e)}


class ServiceRequestIn(Schema):
    # Mandatory fields
    vin: str
    mileage: int
    pre_job_card: str
    incident_type: str
    service_advisor: str
    mobile_number: str
    service_location: str
    work_dept: str
    problem_summary: str
    group: str
    customer_name: str
    account_number: str
    ship_to_account_number: str
    ship_to_customer_name: str
    bill_to_account_number: str
    bill_to_customer_name: str
    context: str

    # Optional fields
    resolution_summary: Optional[str] = None
    incident_status: Optional[str] = "Open"
    outdoor_van_number: Optional[str] = None
    outdoor_location_name: Optional[str] = None
    incident_number: Optional[str] = None
    registration_number: Optional[str] = None
    promised_time: Optional[datetime] = None
    related_job_card_no: Optional[str] = None
    address: Optional[str] = None
    model: Optional[str] = None
    date_of_sale: Optional[datetime] = None
    lpo_amount: Optional[Decimal] = None
    lpo_reference_number: Optional[str] = None
    service_provider: Optional[str] = None
    item: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None

class ServiceRequestOut(Schema):
    id: int
    vin: str
    incident_number: str
    message: str = "Service request created successfully"




@servicerequest_api.post("/service-request", response={201: ServiceRequestOut, 400: dict})
def create_service_request(request, payload: ServiceRequestIn):
    try:
        # Generate unique incident number
        incident_number = f"INC-{uuid.uuid4().hex[:8].upper()}"
        
        service_request = ServiceRequestHeader.objects.create(
            vin=payload.vin,
            mileage=payload.mileage,
            pre_job_card=payload.pre_job_card,
            incident_type=payload.incident_type,
            service_advisor=payload.service_advisor,
            mobile_number=payload.mobile_number,
            service_location=payload.service_location,
            work_dept=payload.work_dept,
            problem_summary=payload.problem_summary,
            group=payload.group,
            customer_name=payload.customer_name,
            account_number=payload.account_number,
            ship_to_account_number=payload.ship_to_account_number,
            ship_to_customer_name=payload.ship_to_customer_name,
            bill_to_account_number=payload.bill_to_account_number,
            bill_to_customer_name=payload.bill_to_customer_name,
            context=payload.context,
            incident_number=incident_number,
            # Optional fields
            resolution_summary=payload.resolution_summary,
            outdoor_van_number=payload.outdoor_van_number,
            outdoor_location_name=payload.outdoor_location_name,
            registration_number=payload.registration_number,
            promised_time=payload.promised_time,
            related_job_card_no=payload.related_job_card_no,
            address=payload.address,
            model=payload.model,
            date_of_sale=payload.date_of_sale,
            lpo_amount=payload.lpo_amount,
            lpo_reference_number=payload.lpo_reference_number,
            service_provider=payload.service_provider,
            item=payload.item,
            description=payload.description,
            category=payload.category,
            created_by=request.user.username,
            last_updated_by=request.user.username
        )

        return 201, {
            "id": service_request.id,
            "vin": service_request.vin,
            "incident_number": service_request.incident_number,
            "message": "Service request created successfully"
        }

    except Exception as e:
        return 400, {"error": str(e)}


class ServiceRequestUpdate(Schema):
    # All fields are optional for update
    mileage: Optional[int] = None
    pre_job_card: Optional[str] = None
    incident_type: Optional[str] = None
    service_advisor: Optional[str] = None
    mobile_number: Optional[str] = None
    service_location: Optional[str] = None
    work_dept: Optional[str] = None
    problem_summary: Optional[str] = None
    group: Optional[str] = None
    customer_name: Optional[str] = None
    account_number: Optional[str] = None
    ship_to_account_number: Optional[str] = None
    ship_to_customer_name: Optional[str] = None
    bill_to_account_number: Optional[str] = None
    bill_to_customer_name: Optional[str] = None
    context: Optional[str] = None
    resolution_summary: Optional[str] = None
    incident_status: Optional[str] = None
    outdoor_van_number: Optional[str] = None
    outdoor_location_name: Optional[str] = None
    registration_number: Optional[str] = None
    promised_time: Optional[datetime] = None
    related_job_card_no: Optional[str] = None
    address: Optional[str] = None
    model: Optional[str] = None
    date_of_sale: Optional[datetime] = None
    lpo_amount: Optional[Decimal] = None
    lpo_reference_number: Optional[str] = None
    service_provider: Optional[str] = None
    item: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None



@servicerequest_api.put("/service-request/{incident_number}", response={200: dict, 404: dict})
def update_service_request(request, incident_number: str, payload: ServiceRequestUpdate):
    try:
        service_request = get_object_or_404(ServiceRequestHeader, incident_number=incident_number)
        
        # Update only provided fields
        update_data = payload.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if value is not None:
                setattr(service_request, field, value)
        
        service_request.last_updated_by = request.user.username
        service_request.save()
        
        return 200, {
            "message": "Service request updated successfully",
            "incident_number": service_request.incident_number,
            "vin": service_request.vin
        }
        
    except ServiceRequestHeader.DoesNotExist:
        return 404, {"error": "Service request not found"}


@servicerequest_api.get("/lookup-values/{look_type}")
def get_lookup_values(request, look_type: str):
    lookups = LOOKUP_DETAILS.objects.filter(LOOKUP_NAME=look_type)
    
    # Add logging to debug
    print(f"Looking up values for: {look_type}")
    print(f"Found {lookups.count()} records")
    
    return [{
        "value": l.MEANING,
        "id": l.id,
        "code": l.LOOKUP_CODE
    } for l in lookups]


class OperationLineSchema(Schema):
    service_request_id: Union[str, int]  # Accept both string and integer
    operation_code: str
    description: Optional[str] = None
    problem: Optional[str] = None
    correction: Optional[str] = None
    view_components: Optional[str] = None
    gift_voucher_scheme: Optional[Decimal] = None



@servicerequest_api.post("/operation-line")
def create_operation_line(request, data: OperationLineSchema):
    try:
        incident_number = data.service_request_id
        if not isinstance(incident_number, str):
            incident_number = f"INC-{hex(incident_number)[2:].upper()}"

        # Find service request by incident_number
        service_request = ServiceRequestHeader.objects.filter(incident_number=incident_number).first()
        if not service_request:
            return {"error": f"Service request with incident number {incident_number} does not exist"}

        # Remove the existing operation check to allow multiple saves
        
        # Parse operation code
        operation_parts = data.operation_code.split('|')
        operation_code = operation_parts[0].strip()
        operation_description = operation_parts[1].strip() if len(operation_parts) > 1 else ''

        # Create operation line
        operation_line = ServiceRequestLine.objects.create(
            service_request=service_request,
            record_type='ROActivity',
            operation_code=operation_code,
            description=data.description,
            problem=data.problem,
            correction=data.correction,
            view_components=data.view_components or '',
            gift_voucher_scheme=data.gift_voucher_scheme or Decimal('0.00')
        )

        # Create estimate line
        estimate_line = ServiceRequestLine.objects.create(
            service_request=service_request,
            record_type='Estimate',
            component_type='Labour',
            activity_line=operation_code,
            activity_desc=data.problem,
            component_code=operation_code,
            component_description=operation_description,
            estimate_status='Pending',
            suggested_quantity=1.3,
            actual_quantity= 1.3,
            selling_price=100,
            
            net_price=Decimal('0.00')
        )

        return {
            "operation_id": operation_line.id,
            "estimate_id": estimate_line.id,
            "message": "Operation line and estimate line created successfully"
        }

    except Exception as e:
        return {"error": str(e)}



@servicerequest_api.get("/items")
def get_items(request):
    try:
        items = Item.objects.all().values('ITEM_CODE', 'DESCRIPTION','OH_QUANTITY', 'SELLING_PRICE')
        return {
            "status": "success",
            "data": list(items)
        }
    except Exception as e:
        return {"error": str(e)}


class EstimateLineCreate(Schema):
    component_type: str
    activity_line: str
    activity_desc: str
    component_code: Optional[str] = None
    component_description: Optional[str] = None
    estimate_status: Optional[str] = "Pending"
    suggested_quantity: Optional[float] = 0  # Default to 0, will be overridden by actual value
    actual_quantity: Optional[float] = 0
    selling_price: Optional[Decimal] = None
    on_hand_quantity: Optional[float]=None
    

class EstimateLineBulkCreate(Schema):
    estimates: List[EstimateLineCreate]
    update_existing: Optional[bool] = False

@servicerequest_api.post("/Estimate-line/{incident_number}")
def create_or_update_estimate_lines(request, incident_number: str, data: EstimateLineBulkCreate):
    try:
        # Get service request header
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        created_or_updated_estimates = []
                                               
        # If update_existing is True, update all existing estimate lines status
        if data.update_existing:
            ServiceRequestLine.objects.filter(
                service_request=service_request,
                record_type='Estimate',
            ).exclude(
                estimate_status__exact='Finalized'
            ).update(estimate_status='Created')

        for estimate in data.estimates:
            if estimate.component_type == 'MATERIAL':
                if not estimate.component_code:
                    return {"error": "Component code is required for MATERIAL type"}
                
                item = Item.objects.get(ITEM_CODE=estimate.component_code)
                component_description = item.DESCRIPTION
                selling_price = item.SELLING_PRICE
                on_hand_quantity = item.OH_QUANTITY
            else:
                component_description = estimate.component_description or ""
                selling_price = estimate.selling_price or Decimal('0.00')

            # Check if this is a finalization update (estimate status is being changed to 'Finalized')
            if estimate.estimate_status == 'Finalized':
                # Update all matching records
                matching_estimates = ServiceRequestLine.objects.filter(
                    service_request=service_request,
                    component_code=estimate.component_code,
                    component_type=estimate.component_type,
                    activity_line=estimate.activity_line
                )
                
                if matching_estimates.exists():
                    # Update all matching records with Finalized status
                    updated_count = matching_estimates.update(estimate_status='Finalized')
                    
                    # Add all updated records to the response
                    for updated_estimate in matching_estimates:
                        created_or_updated_estimates.append({
                            "id": updated_estimate.id,
                            "component_type": updated_estimate.component_type,
                            "component_code": updated_estimate.component_code,
                            "selling_price": str(updated_estimate.selling_price),
                            "on_hand_quantity": str(updated_estimate.on_hand_quantity),
                            "action": "updated"
                        })
                    continue

            # For all other cases, create new estimate line
            estimate_line = ServiceRequestLine.objects.create(
                service_request=service_request,
                record_type='Estimate',
                component_type=estimate.component_type,
                activity_line=estimate.activity_line,
                activity_desc=estimate.activity_desc,
                component_code=estimate.component_code,
                component_description=component_description,
                estimate_status=estimate.estimate_status,
                suggested_quantity=estimate.suggested_quantity,
                on_hand_quantity=estimate.on_hand_quantity,
                actual_quantity=estimate.actual_quantity,

                selling_price=selling_price
            )

            created_or_updated_estimates.append({
                "id": estimate_line.id,
                "component_type": estimate_line.component_type,
                "component_code": estimate_line.component_code,
                "selling_price": str(estimate_line.selling_price),
                "on_hand_quantity": str(estimate_line.on_hand_quantity),
                "action": "created"
            })

        return {
            "status": "success",
            "incident_number": incident_number,
            "message": "Estimate lines processed successfully",
            "estimates": created_or_updated_estimates
        }

    except ServiceRequestHeader.DoesNotExist:
        return {"error": f"Service request with incident number {incident_number} not found"}
    except Item.DoesNotExist:
        return {"error": f"Item with code {estimate.component_code} not found"}
    except Exception as e:
        return {"error": str(e)}



class ServiceRequestOut(Schema):
    id: int
    vin: str
    mileage: Optional[int]
    pre_job_card: Optional[str]
    incident_type: str
    service_advisor: str
    mobile_number: Optional[str]
    service_location: Optional[str]
    problem_summary: str
    resolution_summary: Optional[str]
    incident_status: str
    work_dept: Optional[str]
    group: str
    outdoor_van_number: Optional[str]
    outdoor_location_name: Optional[str]
    account_number: str
    customer_name: str
    incident_number: str
    registration_number: Optional[str]
    promised_time: Optional[datetime]
    ship_to_account_number: Optional[str]
    ship_to_customer_name: Optional[str]
    bill_to_account_number: Optional[str]
    bill_to_customer_name: Optional[str]
    related_job_card_no: Optional[str]
    address: Optional[str]
    model: Optional[str]
    date_of_sale: Optional[datetime]
    lpo_amount: Optional[Decimal]
    lpo_reference_number: Optional[str]
    service_provider: Optional[str]
    context: str
    item: Optional[str]
    description: Optional[str]
    created_at: datetime
    closed_at: Optional[datetime]
    created_by: str
    last_updated_by: str
    Mobile_Number: Optional[str]
    category: Optional[str]



@servicerequest_api.get("/service-requests/", response=List[ServiceRequestOut])
def get_all_service_requests(request, show_mine: bool = False):
    if show_mine:
        # Filter by current user
        service_requests = ServiceRequestHeader.objects.filter(created_by=request.user.username)
    else:
        # Show all records
        service_requests = ServiceRequestHeader.objects.all()

    return [
        {
            "id": sr.id,
            "vin": sr.vin,
            "mileage": sr.mileage,
            "pre_job_card": sr.pre_job_card,
            "incident_type": sr.incident_type,
            "service_advisor": sr.service_advisor,
            "mobile_number": sr.mobile_number,
            "service_location": sr.service_location,
            "problem_summary": sr.problem_summary,
            "resolution_summary": sr.resolution_summary,
            "incident_status": sr.incident_status,
            "work_dept": sr.work_dept,
            "group": sr.group,
            "outdoor_van_number": sr.outdoor_van_number,
            "outdoor_location_name": sr.outdoor_location_name,
            "account_number": sr.account_number,
            "customer_name": sr.customer_name,
            "incident_number": sr.incident_number,
            "registration_number": sr.registration_number,
            "promised_time": sr.promised_time,
            "ship_to_account_number": sr.ship_to_account_number,
            "ship_to_customer_name": sr.ship_to_customer_name,
            "bill_to_account_number": sr.bill_to_account_number,
            "bill_to_customer_name": sr.bill_to_customer_name,
            "related_job_card_no": sr.related_job_card_no,
            "address": sr.address,
            "model": sr.model,
            "date_of_sale": sr.date_of_sale,
            "lpo_amount": sr.lpo_amount,
            "lpo_reference_number": sr.lpo_reference_number,
            "service_provider": sr.service_provider,
            "context": sr.context,
            "item": sr.item,
            "description": sr.description,
            "created_at": sr.created_at,
            "closed_at": sr.closed_at,
            "created_by": sr.created_by,
            "last_updated_by": sr.last_updated_by,
            "Mobile_Number": sr.Mobile_Number,
            "category": sr.category
        } for sr in service_requests
    ]

@servicerequest_api.get("/service-requests/{incident_number}/", response=ServiceRequestOut)
def get_service_request(request, incident_number: str):
    service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
    return {
        "id": service_request.id,
        "vin": service_request.vin,
            "mileage": service_request.mileage,
            "pre_job_card": service_request.pre_job_card,
            "incident_type": service_request.incident_type,
            "service_advisor": service_request.service_advisor,
            "mobile_number": service_request.mobile_number,
            "service_location": service_request.service_location,
            "problem_summary": service_request.problem_summary,
            "resolution_summary": service_request.resolution_summary,
            "incident_status": service_request.incident_status,
            "work_dept": service_request.work_dept,
            "group": service_request.group,
            "outdoor_van_number": service_request.outdoor_van_number,
            "outdoor_location_name": service_request.outdoor_location_name,
            "account_number": service_request.account_number,
            "customer_name": service_request.customer_name,
            "incident_number": service_request.incident_number,
            "registration_number": service_request.registration_number,
            "promised_time": service_request.promised_time,
            "ship_to_account_number": service_request.ship_to_account_number,
            "ship_to_customer_name": service_request.ship_to_customer_name,
            "bill_to_account_number": service_request.bill_to_account_number,
            "bill_to_customer_name": service_request.bill_to_customer_name,
            "related_job_card_no": service_request.related_job_card_no,
            "address": service_request.address,
            "model": service_request.model,
            "date_of_sale": service_request.date_of_sale,
            "lpo_amount": service_request.lpo_amount,
            "lpo_reference_number": service_request.lpo_reference_number,
            "service_provider": service_request.service_provider,
            "context": service_request.context,
            "item": service_request.item,
            "description": service_request.description,
            "created_at": service_request.created_at,
            "closed_at": service_request.closed_at,
            "created_by": service_request.created_by,
            "last_updated_by": service_request.last_updated_by,
            "Mobile_Number": service_request.Mobile_Number,
            "category": service_request.category
        } 



@servicerequest_api.get("/operation-line/{incident_number}")
def get_operation_line(request, incident_number: str):
    try:
        # First get the service request header using incident number
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        # Then get all operation lines for this service request
        operation_lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            record_type='ROActivity'
        ).values(
            'id',
            'operation_code',
            'description',
            'problem',
            'correction',
            'view_components',
            'gift_voucher_scheme',
            'component_type',
            'activity_line',
            'activity_desc',
            'component_code',
            'component_description',
            'estimate_status',
            'suggested_quantity',
            'actual_quantity',
            'on_hand_quantity',
            'selling_price',
            'net_price',
            'parts_issue_status',
            'adjustment',
            'discount_percentage', 
            'net_amount',
            'vat',
            'final_amount',
            'estimated_total',
            'estimated_variation',
            'created_at',
            'updated_at'
            
        )
        
        return {
            "status": "success",
            "data": list(operation_lines),
            "incident_number": incident_number,
            "service_request_id": service_request.id
        }

    except ServiceRequestHeader.DoesNotExist:
        return {"error": f"Service request with incident number {incident_number} not found"}
    except Exception as e:
        return {"error": str(e)}



@servicerequest_api.get("/Estimate-line/{incident_number}")
def get_operation_line(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        operation_lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            record_type__in=['Estimate', 'Actual']
        ).values(
            'id',
            'record_type',
            'component_type',
            'activity_line', 
            'activity_desc',
            'component_code',
            'component_description',
            'estimate_status',
            'suggested_quantity',
            'actual_quantity',
            'on_hand_quantity',
            'selling_price',
            'net_price',
            'created_at',
            'updated_at',
            'is_processed'
        ).order_by('created_at')

        print("API Response Data:", list(operation_lines))  # Debug line
        
        return {
            "status": "success",
            "data": list(operation_lines),
            "incident_number": incident_number,
            "service_request_id": service_request.id
        }

    except ServiceRequestHeader.DoesNotExist:
        return {"error": f"Service request with incident number {incident_number} not found"}
    except Exception as e:
        return {"error": str(e)}


@servicerequest_api.get("/Estimate-only/{incident_number}")
def get_estimate_lines(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        # Only get Estimate records
        operation_lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            record_type='Estimate'
        ).values(
            'id',
            'record_type',
            'component_type',
            'activity_line',
            'activity_desc',
            'component_code',
            'component_description',
            'estimate_status',
            'suggested_quantity',
            'actual_quantity',
            'on_hand_quantity',
            'selling_price',
            'net_price',
            'created_at',
            'updated_at',
            'is_processed'
        ).order_by('created_at')

        return {
            "status": "success",
            "data": list(operation_lines),
            "incident_number": incident_number,
            "service_request_id": service_request.id
        }

    except ServiceRequestHeader.DoesNotExist:
        return {"error": f"Service request with incident number {incident_number} not found"}
    except Exception as e:
        return {"error": str(e)}

@servicerequest_api.get("/dropdown-options/{lookup_name}")
def get_meaning_options(request, lookup_name: str):
    """
    Fetch MEANING values related to a given LOOKUP_NAME from LOOKUP_DETAILS table.
    """
    meanings = LOOKUP_DETAILS.objects.filter(LOOKUP_NAME=lookup_name).values_list('MEANING', flat=True)
    lookup_values = LOOKUP_DETAILS.objects.filter(LOOKUP_NAME=lookup_name).values_list('LOOKUP_VALUE', flat=True)
    sorted_meanings = sorted(meanings)
    return {
        "meanings": list(sorted_meanings),
        "lookup_values": list(lookup_values)
    }


@servicerequest_api.delete("/delete/{service_request_id}/{id}", tags=["estimates"])
def delete_estimate_line(request, service_request_id: str, id: int):
    try:
        # Get service request directly using id
        service_request = ServiceRequestHeader.objects.get(id=service_request_id)
        
        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM "SERVICEREQUESTLINE"
                WHERE service_request_id = %s 
                AND id = %s 
                AND record_type = 'Estimate'
            """, [service_request_id, id])
           
        return {
            "status": "success", 
            "message": "Estimate line deleted successfully"
        }
    except ServiceRequestHeader.DoesNotExist:
        return {"error": "Service request not found"}
    except Exception as e:
        return {"error": str(e)}




@servicerequest_api.get("/item-codes")
def get_item_codes(request):
    try:
        items = Item.objects.values('ITEM_CODE', 'DESCRIPTION','OH_QUANTITY','SELLING_PRICE')
        return {
            "status": "success",
            "data": list(items)
        }
    except Exception as e:
        return {"error": str(e)}
    


class EstimateLineCreate(Schema):
    component_type: str
    activity_line: str
    activity_desc: str
    component_code: Optional[str] = None
    component_description: Optional[str] = None
    estimate_status: Optional[str] = "Pending"
    suggested_quantity: Optional[float] = 0  # Default to 0, will be overridden by actual value
    actual_quantity: Optional[float] = 0
    selling_price: Optional[Decimal] = None

class EstimateLineBulkCreate(Schema):
    estimates: List[EstimateLineCreate]
    update_existing: Optional[bool] = False

@servicerequest_api.post("/Estimate-line/{incident_number}")
def create_or_update_estimate_lines(request, incident_number: str, data: EstimateLineBulkCreate):
    try:
        # Get service request header
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        created_or_updated_estimates = []

        # If update_existing is True, update all existing estimate lines status
        if data.update_existing:
            ServiceRequestLine.objects.filter(
                service_request=service_request,
                record_type='Estimate'
            ).update(estimate_status='Created')

        for estimate in data.estimates:
            if estimate.component_type == 'MATERIAL':
                if not estimate.component_code:
                    return {"error": "Component code is required for MATERIAL type"}
                
                item = Item.objects.get(ITEM_CODE=estimate.component_code)
                component_description = item.DESCRIPTION
                selling_price = item.SELLING_PRICE
            else:
                component_description = estimate.component_description or ""
                selling_price = estimate.selling_price or Decimal('0.00')

            # Check if the estimate line already exists
            existing_estimate = ServiceRequestLine.objects.filter(
                service_request=service_request,
                component_code=estimate.component_code,
                component_type=estimate.component_type,
                activity_line=estimate.activity_line
            ).first()

            if existing_estimate:
                # Update existing estimate line
                existing_estimate.activity_desc = estimate.activity_desc
                existing_estimate.component_description = component_description
                existing_estimate.estimate_status = estimate.estimate_status
                existing_estimate.suggested_quantity = estimate.suggested_quantity  # Use value as is
                existing_estimate.actual_quantity = estimate.actual_quantity
                existing_estimate.selling_price = selling_price
                existing_estimate.save()

                created_or_updated_estimates.append({
                    "id": existing_estimate.id,
                    "component_type": existing_estimate.component_type,
                    "component_code": existing_estimate.component_code,
                    "selling_price": str(existing_estimate.selling_price),
                    "action": "updated"
                })
            else:
                # Create new estimate line
                estimate_line = ServiceRequestLine.objects.create(
                    service_request=service_request,
                    record_type='Estimate',
                    component_type=estimate.component_type,
                    activity_line=estimate.activity_line,
                    activity_desc=estimate.activity_desc,
                    component_code=estimate.component_code,
                    component_description=component_description,
                    estimate_status=estimate.estimate_status,
                    suggested_quantity=estimate.suggested_quantity,  # Use value as is
                    actual_quantity=estimate.actual_quantity,
                    selling_price=selling_price
                )

                created_or_updated_estimates.append({
                    "id": estimate_line.id,
                    "component_type": estimate_line.component_type,
                    "component_code": estimate_line.component_code,
                    "selling_price": str(estimate_line.selling_price),
                    "action": "created"
                })

        return {
            "status": "success",
            "incident_number": incident_number,
            "message": "Estimate lines processed successfully",
            "estimates": created_or_updated_estimates
        }

    except ServiceRequestHeader.DoesNotExist:
        return {"error": f"Service request with incident number {incident_number} not found"}
    except Item.DoesNotExist:
        return {"error": f"Item with code {estimate.component_code} not found"}
    except Exception as e:
        return {"error": str(e)}
    




from decimal import Decimal
from django.db import connection, transaction
from django.core.exceptions import ObjectDoesNotExist



# @servicerequest_api.post("/sublet/process")
# def process_sublet(request):
#     try:
#         data = json.loads(request.body)
#         sublets = data.get('sublets', [])
#         incident_number = data.get('incident_number')
#         service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
#         existing_ap_invoice = Sublet.objects.filter(
#             service_request=service_request,
#             ap_invoice_number__isnull=False
#         ).first()

#         if existing_ap_invoice:
#             ap_invoice_number = existing_ap_invoice.ap_invoice_number
#         else:
#             ap_invoice_number = f"{incident_number}#SUBL#1#2#1#1"

#         results = []
#         with transaction.atomic():
#             for sublet_data in sublets:
#                 is_new_row = sublet_data.get('is_new_row', False)
                
#                 service_request_line = ServiceRequestLine.objects.filter(
#                     component_code=sublet_data.get('operation_code'),
#                     activity_desc=sublet_data.get('activity_description'),
#                     component_type='Sublet',
#                     service_request=service_request,
#                 ).first()

#                 if not service_request_line:
#                     continue

#                 actual_line = None
#                 if is_new_row:
#                     actual_line = ServiceRequestLine.objects.create(
#                         service_request=service_request,
#                         record_type='Actual',
#                         component_type='Sublet',
#                         activity_line=service_request_line.activity_line,
#                         activity_desc=service_request_line.activity_desc,
#                         component_code=service_request_line.component_code,
#                         component_description=service_request_line.component_description,
#                         suggested_quantity=service_request_line.suggested_quantity,
#                         actual_quantity=service_request_line.actual_quantity,
#                         selling_price=service_request_line.selling_price,
#                         net_price=service_request_line.net_price,
#                         is_processed=True
#                     )
#                 else:
#                     actual_line = service_request_line

#                 sublet = None
#                 if sublet_data.get('id'):
#                     sublet = Sublet.objects.filter(
#                         id=sublet_data['id'],
#                         service_request_line__service_request=service_request
#                     ).first()

#                 sublet_values = {
#                     'service_request': service_request,
#                     'service_request_line': actual_line,
#                     'supplier_name': sublet_data.get('supplier_name', ''),
#                     'petty_cash_supplier': sublet_data.get('petty_cash_supplier', ''),
#                     'activity_description': sublet_data.get('activity_description', ''),
#                     'apply_vat': sublet_data.get('apply_vat', False),
#                     'transaction_amount': Decimal(str(sublet_data.get('transaction_amount', 0) or 0)),
#                     'supplier_invoice_num': sublet_data.get('supplier_invoice_num', ''),
#                     'supplier_invoice_date': sublet_data.get('supplier_invoice_date'),
#                     'vat_percentage': Decimal(str(sublet_data.get('vat_percentage', 0) or 0)),
#                     'vat_amount': Decimal(str(sublet_data.get('vat_amount', 0) or 0)),
#                     'total_amount_incl_vat': Decimal(str(sublet_data.get('total_amount', 0) or 0)),
#                     'supplier_site_name': sublet_data.get('supplier_site_name', ''),
#                     'ap_invoice_number': ap_invoice_number,
#                     'operation_code': sublet_data.get('operation_code', ''),
#                     'status': 'Finalized',
#                     'requisition_number': f"REQ-{uuid.uuid4().hex[:6].upper()}",
#                     'purchase_order_number': f"PO-{uuid.uuid4().hex[:6].upper()}",
#                     'po_receipts': f"RCPT-{uuid.uuid4().hex[:6].upper()}"
#                 }

#                 if sublet:
#                     for key, value in sublet_values.items():
#                         setattr(sublet, key, value)
#                     sublet.save()
#                 else:
#                     sublet = Sublet.objects.create(**sublet_values)

#                 service_request_line.estimate_status = 'Finalized'
#                 service_request_line.save()

#                 results.append({
#                     "line_id": actual_line.id,
#                     "sublet_id": sublet.id,
#                     "ap_invoice_number": ap_invoice_number,
#                     "operation": "updated" if sublet_data.get('id') else "created"
#                 })

#         return JsonResponse({
#             "status": "success",
#             "message": "Sublets processed successfully",
#             "results": results
#         })

#     except ServiceRequestHeader.DoesNotExist:
#         return JsonResponse({
#             "status": "error",
#             "message": f"Service request with incident number {incident_number} not found"
#         })
#     except Exception as e:
#         return JsonResponse({
#             "status": "error",
#             "message": str(e)
#         })



# changed for updating the incident status to Working in progress 
@servicerequest_api.post("/sublet/process")
def process_sublet(request):
    try:
        data = json.loads(request.body)
        sublets = data.get('sublets', [])
        incident_number = data.get('incident_number')
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
       
        existing_ap_invoice = Sublet.objects.filter(
            service_request=service_request,
            ap_invoice_number__isnull=False
        ).first()

        if existing_ap_invoice:
            ap_invoice_number = existing_ap_invoice.ap_invoice_number
        else:
            ap_invoice_number = f"{incident_number}#SUBL#1#2#1#1"

        results = []
        with transaction.atomic():
            for sublet_data in sublets:
                is_new_row = sublet_data.get('is_new_row', False)
               
                service_request_line = ServiceRequestLine.objects.filter(
                    component_code=sublet_data.get('operation_code'),
                    activity_desc=sublet_data.get('activity_description'),
                    component_type='Sublet',
                    service_request=service_request,
                ).first()

                if not service_request_line:
                    continue

                actual_line = None
                if is_new_row:
                    actual_line = ServiceRequestLine.objects.create(
                        service_request=service_request,
                        record_type='Actual',
                        component_type='Sublet',
                        activity_line=service_request_line.activity_line,
                        activity_desc=service_request_line.activity_desc,
                        component_code=service_request_line.component_code,
                        component_description=service_request_line.component_description,
                        suggested_quantity=service_request_line.suggested_quantity,
                        actual_quantity=service_request_line.actual_quantity,
                        selling_price=service_request_line.selling_price,
                        net_price=service_request_line.net_price,
                        is_processed=True
                    )
                else:
                    actual_line = service_request_line

                sublet = None
                if sublet_data.get('id'):
                    sublet = Sublet.objects.filter(
                        id=sublet_data['id'],
                        service_request_line__service_request=service_request
                    ).first()

                sublet_values = {
                    'service_request': service_request,
                    'service_request_line': actual_line,
                    'supplier_name': sublet_data.get('supplier_name', ''),
                    'petty_cash_supplier': sublet_data.get('petty_cash_supplier', ''),
                    'activity_description': sublet_data.get('activity_description', ''),
                    'apply_vat': sublet_data.get('apply_vat', False),
                    'transaction_amount': Decimal(str(sublet_data.get('transaction_amount', 0) or 0)),
                    'supplier_invoice_num': sublet_data.get('supplier_invoice_num', ''),
                    'supplier_invoice_date': sublet_data.get('supplier_invoice_date'),
                    'vat_percentage': Decimal(str(sublet_data.get('vat_percentage', 0) or 0)),
                    'vat_amount': Decimal(str(sublet_data.get('vat_amount', 0) or 0)),
                    'total_amount_incl_vat': Decimal(str(sublet_data.get('total_amount', 0) or 0)),
                    'supplier_site_name': sublet_data.get('supplier_site_name', ''),
                    'ap_invoice_number': ap_invoice_number,
                    'operation_code': sublet_data.get('operation_code', ''),
                    'status': 'Finalized',
                    'requisition_number': f"REQ-{uuid.uuid4().hex[:6].upper()}",
                    'purchase_order_number': f"PO-{uuid.uuid4().hex[:6].upper()}",
                    'po_receipts': f"RCPT-{uuid.uuid4().hex[:6].upper()}"
                }

                if sublet:
                    for key, value in sublet_values.items():
                        setattr(sublet, key, value)
                    sublet.save()
                else:
                    sublet = Sublet.objects.create(**sublet_values)

                service_request_line.estimate_status = 'Finalized'
                service_request_line.save()

                results.append({
                    "line_id": actual_line.id,
                    "sublet_id": sublet.id,
                    "ap_invoice_number": ap_invoice_number,
                    "operation": "updated" if sublet_data.get('id') else "created"
                })

            # Update incident status to Working in Progress
            service_request.incident_status = "Working in Progress"
            service_request.save()

        return JsonResponse({
            "status": "success",
            "message": "Sublets processed successfully and incident status updated to Working in Progress",
            "results": results
        })

    except ServiceRequestHeader.DoesNotExist:
        return JsonResponse({
            "status": "error",
            "message": f"Service request with incident number {incident_number} not found"
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        })



@servicerequest_api.get("/sublet-process/{incident_number}")
def get_sublet_records(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        service_lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            component_type='Sublet'
        )
        
        sublets = Sublet.objects.filter(
            service_request_line__in=service_lines
        ).order_by('id')
        
        sublet_data = []
        
        if sublets.exists():
            for sublet in sublets:
                sublet_data.append({
                    "id": sublet.id,
                    "component_code": sublet.service_request_line.component_code,
                    "supplier_name": sublet.supplier_name,
                    "petty_cash_supplier": sublet.petty_cash_supplier,
                    "supplier_site_name": sublet.supplier_site_name,
                    "activity_description": sublet.activity_description,
                    "transaction_amount": str(sublet.transaction_amount),
                    "apply_vat": sublet.apply_vat,
                    "supplier_invoice_num": sublet.supplier_invoice_num,
                    "supplier_invoice_date": sublet.supplier_invoice_date,
                    "vat_percentage": str(sublet.vat_percentage),
                    "vat_amount": str(sublet.vat_amount),
                    "operation_code": str(sublet.operation_code),
                    "total_amount_incl_vat": str(sublet.total_amount_incl_vat),
                    "ap_invoice_number": sublet.ap_invoice_number,
                    "return_ap_invoice_number": sublet.return_ap_invoice_number,
                    "return_sublet": sublet.return_sublet,
                    "status": sublet.status,
                    "requisition_number": sublet.requisition_number,
                    "purchase_order_number": sublet.purchase_order_number,
                    "po_receipts": sublet.po_receipts
                })
        
        remaining_count = service_lines.count() - len(sublet_data)
        for _ in range(remaining_count):
            sublet_data.append({
                "id": None,
                "component_code": "Sublet",
                "supplier_name": "",
                "petty_cash_supplier": "",
                "supplier_site_name": "",
                "activity_description": "",
                "transaction_amount": "0.00",
                "apply_vat": False,
                "supplier_invoice_num": "",
                "supplier_invoice_date": None,
                "vat_percentage": "5.00",
                "vat_amount": "0.00",
                "operation_code": "",
                "total_amount_incl_vat": "0.00",
                "ap_invoice_number": None,
                "return_ap_invoice_number": None,
                "return_sublet": False,
                "status": None
            })
        
        return {
            "status": "success",
            "data": sublet_data,
            "incident_number": incident_number
        }

    except ServiceRequestHeader.DoesNotExist:
        return {"status": "error", "message": f"Service request with incident number {incident_number} not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}




@servicerequest_api.post("/sublet/return/")
def return_sublet(request):
    try:
        data = json.loads(request.body)
        sublets = data.get('sublets', [])
        incident_number = data.get('incident_number')

        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        results = []

        with transaction.atomic():
            for sublet_data in sublets:
                sublet = Sublet.objects.get(
                    id=sublet_data['id'],
                    service_request=service_request
                )
                
                if sublet.ap_invoice_number:
                    return_ap_invoice_number = sublet.ap_invoice_number.replace('#SUBL#', '#SUBL-RET#')
                    sublet.return_ap_invoice_number = return_ap_invoice_number
                    sublet.return_sublet = True
                    sublet.status = 'Returned'

                    sublet.transaction_amount = Decimal('0.00')
                    sublet.vat_amount = Decimal('0.00')
                    sublet.total_amount_incl_vat = Decimal('0.00')
                    sublet.save()

                    results.append({
                        "sublet_id": sublet.id,
                        "return_ap_invoice_number": return_ap_invoice_number
                    })

        return JsonResponse({
            "status": "success",
            "message": "Sublet returns processed successfully",
            "results": results
        })

    except ServiceRequestHeader.DoesNotExist:
        return JsonResponse({
            "status": "error",
            "message": f"Service request with incident number {incident_number} not found"
        })
    except Sublet.DoesNotExist:
        return JsonResponse({
            "status": "error",
            "message": "One or more sublet records not found"
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        })


@servicerequest_api.get("/sublet-action-history/{sublet_id}")
def get_sublet_action_history(request, sublet_id: int):
    try:
        sublet = Sublet.objects.get(id=sublet_id)
        
        return JsonResponse({
            "status": "success",
            "data": {
                "requisition_number": sublet.requisition_number,
                "purchase_order_number": sublet.purchase_order_number,
                "po_receipts": sublet.po_receipts,
                "ap_invoice_number": sublet.ap_invoice_number,
                "return_ap_invoice_number": sublet.return_ap_invoice_number,
                "status": sublet.status,
                "output_msg": sublet.output_msg,
                "print_return": sublet.print_return
            }
        })
    except Sublet.DoesNotExist:
        return JsonResponse({
            "status": "error",
            "message": "Sublet record not found"
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        })


@servicerequest_api.get("/sublet-activities/{incident_number}")
def get_sublet_activity_descriptions(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        sublet_activities = ServiceRequestLine.objects.filter(
            service_request=service_request,
            component_type='Sublet',
            record_type='Estimate'
        ).values_list('activity_desc', flat=True).distinct()
        
        return {"status": "success", "activities": list(sublet_activities)}
    
    except Exception as e:
        return {"error": str(e)}

@servicerequest_api.get("/sublet-activityline/{incident_number}")
def sublet_activities(request, incident_number: str):
    try:
        # First get the service request
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        # Then query activity lines for sublet components through the relationship
        activities = ServiceRequestLine.objects.filter(
            service_request=service_request,
            component_type='Sublet'
        ).values_list('activity_line', flat=True).distinct()
        
        return {
            'status': 'success',
            'activities': list(activities)
        }
        
    except ServiceRequestHeader.DoesNotExist:
        return {
            'status': 'error',
            'message': f'Service request with incident number {incident_number} not found'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }




@servicerequest_api.get("/consumables/{incident_number}")
def get_consumables_data(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        consumables_data = []
        service_lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            component_type='Consumables'
        )
        
        for line in service_lines:
            consumable = CONSUMABLE.objects.filter(
                service_request_line=line
            ).first()
            
            consumables_data.append({
                "id": consumable.id if consumable else None,
                "component_code": line.component_code,
                "actual_quantity": float(line.actual_quantity),
                "on_hand_quantity": float(line.on_hand_quantity),
                "existing_trans_qty": float(consumable.trans_qty) if consumable else 0,
                "existing_return_qty": float(consumable.return_qty) if consumable else 0,
                "existing_return": consumable.return_flag if consumable else False
            })
            
        return {
            "status": "success",
            "data": consumables_data,
            "incident_number": incident_number
        }

    except ServiceRequestHeader.DoesNotExist:
        return {"status": "error", "message": f"Service request with incident number {incident_number} not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}




from django.utils import timezone  # Add this import at the top
class ConsumableProcessSchema(Schema):
    id: Optional[int] = None
    operation_code: Optional[str] = None
    line: Optional[int] = None
    actual_quantity: Optional[Decimal] = None
    trans_qty: Optional[Decimal] = None
    proc_qty: Optional[Decimal] = None
    return_qty: Optional[Decimal] = None
    returned_qty: Optional[Decimal] = None
    cons_oh_qty: Optional[Decimal] = None
    tot_selling_price: Optional[Decimal] = None
    return_flag: Optional[bool] = False
    transaction_date: Optional[datetime] = None
    net_price: Optional[Decimal] = None
    vat: Optional[Decimal] = None
    final_amount: Optional[Decimal] = None
    parts_issue_status: Optional[str] = None
    adjustment: Optional[Decimal] = None
    discount_percentage: Optional[Decimal] = None
    net_amount: Optional[Decimal] = None
    estimated_total: Optional[Decimal] = None
    estimated_variation: Optional[Decimal] = None

class ConsumableBulkProcessSchema(Schema):
    consumables: List[ConsumableProcessSchema]
    incident_number: str



# @servicerequest_api.post("/consumables/process/")
# def process_consumables(request, data: ConsumableBulkProcessSchema):
#     try:
#         data = json.loads(request.body)
#         consumables = data.get('consumables', [])
#         incident_number = data.get('incident_number')

#         service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)

#         for item in consumables:
#             service_request_line = ServiceRequestLine.objects.filter(
#                 component_code=item.get('operation_code'),
#                 component_type='Consumables',
#                 service_request=service_request
#             ).first()
            
#             if not service_request_line:
#                 continue

#             consumable = None
#             if item.get('id'):
#                 consumable = CONSUMABLE.objects.filter(
#                     id=item['id'],
#                     service_request_line__service_request=service_request
#                 ).first()

#             default_values = {
#                 'trans_qty': Decimal(item.get('trans_qty', 0)),
#                 'return_qty': Decimal(item.get('return_qty', 0)),
#                 'return_flag': item.get('return', False),
#                 'proc_qty': Decimal(0),
#                 'returned_qty': Decimal(0),
#                 'cons_oh_qty': Decimal(0),
#                 'tot_selling_price': Decimal(0),
#                 'transaction_date': timezone.now(),
#                 'service_request': service_request
#             }
#             if consumable:
#                 for key, value in default_values.items():
#                     setattr(consumable, key, value)
#                 consumable.save()
#             else:
#                 consumable = CONSUMABLE.objects.create(
#                     service_request_line=service_request_line,
#                     line=item.get('line', 0),
#                     operation_code=item.get('operation_code', ''),
#                     actual_qty=Decimal(item.get('actual_quantity', 0)),
#                     **default_values
#                 )

#             service_request_line.net_price = Decimal(item.get('trans_qty', 0)) * service_request_line.selling_price
#             service_request_line.save()

#         return JsonResponse({"status": "success", "message": "Consumables processed successfully"})

#     except ServiceRequestHeader.DoesNotExist:
#         return JsonResponse({"status": "error", "message": f"Service request with incident number {incident_number} not found"})
#     except Exception as e:
#         return JsonResponse({"status": "error", "message": str(e)})



# changed for updating the incident status to Working in progress 
@servicerequest_api.post("/consumables/process/")
def process_consumables(request, data: ConsumableBulkProcessSchema):
    try:
        data = json.loads(request.body)
        consumables = data.get('consumables', [])
        incident_number = data.get('incident_number')

        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)

        with transaction.atomic():
            for item in consumables:
                service_request_line = ServiceRequestLine.objects.filter(
                    component_code=item.get('operation_code'),
                    component_type='Consumables',
                    service_request=service_request
                ).first()
               
                if not service_request_line:
                    continue

                consumable = None
                if item.get('id'):
                    consumable = CONSUMABLE.objects.filter(
                        id=item['id'],
                        service_request_line__service_request=service_request
                    ).first()

                default_values = {
                    'trans_qty': Decimal(item.get('trans_qty', 0)),
                    'return_qty': Decimal(item.get('return_qty', 0)),
                    'return_flag': item.get('return', False),
                    'proc_qty': Decimal(0),
                    'returned_qty': Decimal(0),
                    'cons_oh_qty': Decimal(0),
                    'tot_selling_price': Decimal(0),
                    'transaction_date': timezone.now(),
                    'service_request': service_request
                }
                if consumable:
                    for key, value in default_values.items():
                        setattr(consumable, key, value)
                    consumable.save()
                else:
                    consumable = CONSUMABLE.objects.create(
                        service_request_line=service_request_line,
                        line=item.get('line', 0),
                        operation_code=item.get('operation_code', ''),
                        actual_qty=Decimal(item.get('actual_quantity', 0)),
                        **default_values
                    )

                service_request_line.net_price = Decimal(item.get('trans_qty', 0)) * service_request_line.selling_price
                service_request_line.save()

            # Update incident status to Working in Progress
            service_request.incident_status = "Working in Progress"
            service_request.save()

        return JsonResponse({
            "status": "success", 
            "message": "Consumables processed successfully and incident status updated to Working in Progress"
        })

    except ServiceRequestHeader.DoesNotExist:
        return JsonResponse({"status": "error", "message": f"Service request with incident number {incident_number} not found"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})
    



@servicerequest_api.get("/get-component-values/{incident_number}")
def get_component_values(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        # Get just the values needed from each model
        sublet_values = Sublet.objects.filter(
            service_request=service_request
        ).values('transaction_amount')
        
        labor_values = LABOR.objects.filter(
            service_request=service_request
        ).values('trx_qty')
        
        consumable_values = CONSUMABLE.objects.filter(
            service_request=service_request
        ).values('trans_qty','tot_selling_price')
        
        return {
            "status": "success",
            "data": {
                "sublet_values": list(sublet_values),
                "labor_values": list(labor_values),
                "consumable_values": list(consumable_values)
            }
        }
        
    except ServiceRequestHeader.DoesNotExist:
        return {"status": "error", "message": "Service request not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

 
from django.db.models import F, Sum

from django.db.models import DecimalField
from django.db.models import DecimalField, ExpressionWrapper
@servicerequest_api.get("/estimate-total/{incident_number}")
def get_estimate_total(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            record_type='Estimate'
        )

        # Group lines by component type
        component_totals = {}
        for line in lines:
            component_type = line.component_type.strip().title()
            if component_type not in component_totals:
                component_totals[component_type] = 0
            
            # Calculate line total
            line_total = float(line.actual_quantity) * float(line.selling_price)
            component_totals[component_type] += line_total

        # Calculate grand total
        grand_total = sum(component_totals.values())

        line_details = []
        for line in lines:
            line_total = float(line.actual_quantity) * float(line.selling_price)
            line_details.append({
                "component_type": line.component_type,
                "component_code": line.component_code,
                "component_description": line.component_description,
                "actual_quantity": str(line.actual_quantity),
                "selling_price": str(line.selling_price),
                "line_total": str(line_total),
                "subtotal": str(component_totals[line.component_type])
            })

        return {
            "status": "success",
            "data": {
                "incident_number": incident_number,
                "line_details": line_details,
                "component_totals": {k: str(v) for k,v in component_totals.items()},
                "grand_total": str(grand_total)
            }
        }

    except ServiceRequestHeader.DoesNotExist:
        return {
            "status": "error", 
            "message": f"Service request with incident number {incident_number} not found"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }




class LaborProcessSchema(Schema):
    id: Optional[int] = None
    operation_code: Optional[str] = None
    line: Optional[int] = None
    employee_name: str
    employee_no: int
    trx_qty: int
    plan_start_date: datetime
    plan_end_date: datetime
    actual_start_date: datetime
    actual_end_date: datetime
    status: str = 'open'
    

class LaborBulkProcessSchema(Schema):
    labor_entries: List[LaborProcessSchema]
    incident_number: str

from django.core.exceptions import ValidationError
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)


# @servicerequest_api.post("/labor/process")
# def process_labor(request):
#     try:
#         data = json.loads(request.body)
#         labor_entries = data.get('labor_entries', [])
#         incident_number = data.get('incident_number')
#         service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)

#         results = []
#         with transaction.atomic():
#             for index, labor_data in enumerate(labor_entries, 1):
#                 is_new_row = labor_data.get('is_new_row', False)
                
#                 service_request_line = ServiceRequestLine.objects.filter(
#                     component_code=labor_data.get('operation_code'),
#                     component_type='Labour',
#                     service_request=service_request,
#                 ).first()

#                 if not service_request_line:
#                     continue

#                 actual_line = None
#                 if is_new_row:
#                     actual_line = ServiceRequestLine.objects.create(
#                         service_request=service_request,
#                         record_type='Actual',
#                         component_type='Labour',
#                         activity_line=service_request_line.activity_line,
#                         activity_desc=service_request_line.activity_desc,
#                         component_code=service_request_line.component_code,
#                         component_description=service_request_line.component_description,
#                         suggested_quantity=service_request_line.suggested_quantity,
#                         actual_quantity=labor_data.get('trx_qty', 0),
#                         selling_price=service_request_line.selling_price,
#                         net_price=service_request_line.net_price,
#                         is_processed=True
#                     )
#                 else:
#                     actual_line = service_request_line

#                 labor_values = {
#                     'service_request': service_request,
#                     'service_request_line': actual_line,
#                     'line': index,  # Add line number
#                     'operation_code': labor_data.get('operation_code', ''),
#                     'employee_name': labor_data.get('employee_name', ''),
#                     'employee_no': labor_data.get('employee_no', 0),
#                     'trx_qty': labor_data.get('trx_qty', 0),
#                     'plan_start_date': labor_data.get('plan_start_date'),
#                     'plan_end_date': labor_data.get('plan_end_date'),
#                     'actual_start_date': labor_data.get('actual_start_date'),
#                     'actual_end_date': labor_data.get('actual_end_date'),
#                     'status': labor_data.get('status', 'open')
#                 }

#                 if labor_data.get('id'):
#                     LABOR.objects.filter(id=labor_data['id']).update(**labor_values)
#                     labor = LABOR.objects.get(id=labor_data['id'])
#                 else:
#                     labor = LABOR.objects.create(**labor_values)

#                 if is_new_row:
#                     service_request_line.is_processed = True
#                     service_request_line.estimate_status = 'Finalized'
#                     service_request_line.save()

#                 results.append({
#                     "line_id": actual_line.id,
#                     "labor_id": labor.id,
#                     "operation": "updated" if labor_data.get('id') else "created"
#                 })

#         return JsonResponse({
#             "status": "success",
#             "message": "Labor entries processed successfully",
#             "results": results
#         })

#     except Exception as e:
#         return JsonResponse({
#             "status": "error",
#             "message": str(e)
#         })

# changed for updating the incident status to Working in progress 
@servicerequest_api.post("/labor/process")
def process_labor(request):
    try:
        data = json.loads(request.body)
        labor_entries = data.get('labor_entries', [])
        incident_number = data.get('incident_number')
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)

        results = []
        with transaction.atomic():
            for index, labor_data in enumerate(labor_entries, 1):
                is_new_row = labor_data.get('is_new_row', False)
               
                service_request_line = ServiceRequestLine.objects.filter(
                    component_code=labor_data.get('operation_code'),
                    component_type='Labour',
                    service_request=service_request,
                ).first()

                if not service_request_line:
                    continue

                actual_line = None
                if is_new_row:
                    actual_line = ServiceRequestLine.objects.create(
                        service_request=service_request,
                        record_type='Actual',
                        component_type='Labour',
                        activity_line=service_request_line.activity_line,
                        activity_desc=service_request_line.activity_desc,
                        component_code=service_request_line.component_code,
                        component_description=service_request_line.component_description,
                        suggested_quantity=service_request_line.suggested_quantity,
                        actual_quantity=labor_data.get('trx_qty', 0),
                        selling_price=service_request_line.selling_price,
                        net_price=service_request_line.net_price,
                        is_processed=True
                    )
                else:
                    actual_line = service_request_line

                labor_values = {
                    'service_request': service_request,
                    'service_request_line': actual_line,
                    'line': index,
                    'operation_code': labor_data.get('operation_code', ''),
                    'employee_name': labor_data.get('employee_name', ''),
                    'employee_no': labor_data.get('employee_no', 0),
                    'trx_qty': labor_data.get('trx_qty', 0),
                    'plan_start_date': labor_data.get('plan_start_date'),
                    'plan_end_date': labor_data.get('plan_end_date'),
                    'actual_start_date': labor_data.get('actual_start_date'),
                    'actual_end_date': labor_data.get('actual_end_date'),
                    'status': labor_data.get('status', 'open')
                }

                if labor_data.get('id'):
                    LABOR.objects.filter(id=labor_data['id']).update(**labor_values)
                    labor = LABOR.objects.get(id=labor_data['id'])
                else:
                    labor = LABOR.objects.create(**labor_values)

                if is_new_row:
                    service_request_line.is_processed = True
                    service_request_line.estimate_status = 'Finalized'
                    service_request_line.save()

                results.append({
                    "line_id": actual_line.id,
                    "labor_id": labor.id,
                    "operation": "updated" if labor_data.get('id') else "created"
                })

            # Update incident status to Working in Progress
            service_request.incident_status = "Working in Progress"
            service_request.save()

        return JsonResponse({
            "status": "success",
            "message": "Labor entries processed successfully and incident status updated to Working in Progress",
            "results": results
        })

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        })
    
@servicerequest_api.get("/labor/{incident_number}")
def get_labor_data(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        labor_data = []
        service_lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            component_type='Labour'
        )
        
        for line in service_lines:
            labor = LABOR.objects.filter(
                service_request_line=line
            ).first()
            
            labor_data.append({
                "id": labor.id if labor else None,
                "component_code": line.component_code,
                "employee_name": labor.employee_name if labor else None,
                "employee_no": labor.employee_no if labor else None,
                "trx_qty": labor.trx_qty if labor else 0,
                "status": labor.status if labor else 'open'
            })
            
        return {
            "status": "success",
            "data": labor_data,
            "incident_number": incident_number
        }
    except ServiceRequestHeader.DoesNotExist:
        return {"status": "error", "message": f"Service request with incident number {incident_number} not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}



@servicerequest_api.get("/labor-activities/{incident_number}")
def get_labor_activities(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        activities = ServiceRequestLine.objects.filter(
            service_request=service_request,
            component_type='Labour'
        ).values_list('activity_line', flat=True).distinct()

        return {
            "status": "success",
            "activities": list(activities)
        }
    except ServiceRequestHeader.DoesNotExist:
        return {"error": "Service request not found"}





# # for posting the customer balance
# @servicerequest_api.post("/customer-balance/process/")
# def process_customer_balance(request):
#     try:
#         data = json.loads(request.body)
#         incident_number = data.get('incident_number')
        
#         service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
#         service_request.resolution_summary = data.get('resolution_summary')
#         service_request.save()

#         customer_balance = CUSTOMERBALANCE.objects.create(
#             service_request=service_request,
#             customer=data.get('customer'),
#             transaction_type=data.get('transaction_type'),
#             receipt_number=data.get('receipt_number'),
#             credit_memo=data.get('credit_memo'),
#             original_amount=data.get('original_amount'),
#             utilized_outstanding_amount=data.get('utilized_outstanding_amount'),
#             loc_available_amount=data.get('loc_available_amount'),
#             split_percent=data.get('split_percent'),
#             txn_amount=data.get('txn_amount'),
#             receivable_level=data.get('receivable_level'),
#             created_by=request.user.username,
#             last_updated_by=request.user.username
#         )

#         return JsonResponse({
#             "status": "success",
#             "message": "Customer balance processed successfully"
#         })

#     except ServiceRequestHeader.DoesNotExist:
#         return JsonResponse({
#             "status": "error", 
#             "message": f"Service request not found"
#         })
#     except Exception as e:
#         return JsonResponse({
#             "status": "error",
#             "message": str(e)
#         })

# changed for updating the incident status to Closed
@servicerequest_api.post("/customer-balance/process/")
def process_customer_balance(request):
    try:
        data = json.loads(request.body)
        incident_number = data.get('incident_number')
        
        with transaction.atomic():
            service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
            
            # Update resolution summary and status
            ServiceRequestHeader.objects.filter(incident_number=incident_number).update(
                incident_status='Closed',
                resolution_summary=data.get('resolution_summary')
            )

            customer_balance = CUSTOMERBALANCE.objects.create(
                service_request=service_request,
                customer=data.get('customer'),
                transaction_type=data.get('transaction_type'),
                receipt_number=data.get('receipt_number'),
                credit_memo=data.get('credit_memo'),
                original_amount=data.get('original_amount'),
                utilized_outstanding_amount=data.get('utilized_outstanding_amount'),
                loc_available_amount=data.get('loc_available_amount'),
                split_percent=data.get('split_percent'),
                txn_amount=data.get('txn_amount'),
                receivable_level=data.get('receivable_level'),
                created_by=request.user.username,
                last_updated_by=request.user.username
            )

        return JsonResponse({
            "status": "success",
            "message": "Customer balance processed successfully and incident status updated to Closed",
            "incident_status": "Closed"
        })

    except ServiceRequestHeader.DoesNotExist:
        return JsonResponse({
            "status": "error",
            "message": f"Service request not found"
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        })


# for updating the customer balance
@servicerequest_api.put("/customer-balance/update/{incident_number}")
def update_customer_balance(request, incident_number: str):
    try:
        data = json.loads(request.body)
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        # Update service request resolution summary
        service_request.resolution_summary = data.get('resolution_summary')
        service_request.save()

        # Update customer balance record
        customer_balance = CUSTOMERBALANCE.objects.get(service_request=service_request)
        
        customer_balance.customer = data.get('customer')
        customer_balance.transaction_type = data.get('transaction_type')
        customer_balance.receipt_number = data.get('receipt_number')
        customer_balance.credit_memo = data.get('credit_memo')
        customer_balance.original_amount = data.get('original_amount')
        customer_balance.utilized_outstanding_amount = data.get('utilized_outstanding_amount')
        customer_balance.loc_available_amount = data.get('loc_available_amount')
        customer_balance.split_percent = data.get('split_percent')
        customer_balance.txn_amount = data.get('txn_amount')
        customer_balance.receivable_level = data.get('receivable_level')
        customer_balance.last_updated_by = request.user.username
        customer_balance.save()

        return JsonResponse({
            "status": "success",
            "message": "Customer balance updated successfully"
        })

    except (ServiceRequestHeader.DoesNotExist, CUSTOMERBALANCE.DoesNotExist):
        return JsonResponse({
            "status": "error", 
            "message": "Record not found"
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        })



# for fetching the customer balance
@servicerequest_api.get("/customer-balance/{incident_number}")
def get_customer_balance(request, incident_number):
    try:
        customer_balance = CUSTOMERBALANCE.objects.filter(
            service_request__incident_number=incident_number
        ).select_related('service_request').first()

        if customer_balance:
            data = {
                "status": "success",
                "data": {
                    "customer": customer_balance.customer,
                    "transaction_type": customer_balance.transaction_type,
                    "receipt_number": customer_balance.receipt_number,
                    "credit_memo": customer_balance.credit_memo,
                    "original_amount": float(customer_balance.original_amount),
                    "utilized_outstanding_amount": float(customer_balance.utilized_outstanding_amount),
                    "loc_available_amount": float(customer_balance.loc_available_amount),
                    "split_percent": float(customer_balance.split_percent) if customer_balance.split_percent else None,
                    "txn_amount": float(customer_balance.txn_amount),
                    "receivable_level": customer_balance.receivable_level,
                    "created_by": customer_balance.created_by,
                    "resolution_summary": customer_balance.service_request.resolution_summary
                }
            }
        else:
            data = {
                "status": "success",
                "data": None
            }
        
        return JsonResponse(data)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        })
    
# For Fetching the Transaction history
@servicerequest_api.get("/customer-balance/history/{incident_number}")
def get_customer_balance_history(request, incident_number):
    try:
        transactions = CUSTOMERBALANCE.objects.filter(
            service_request__incident_number=incident_number
        ).order_by('-created_date')

        data = {
            "status": "success",
            "data": [{
                "id": t.id,
                "customer": t.customer,
                "transaction_type": t.transaction_type,
                "receipt_number": t.receipt_number,
                "credit_memo": t.credit_memo,
                "original_amount": float(t.original_amount),
                "utilized_outstanding_amount": float(t.utilized_outstanding_amount),
                "loc_available_amount": float(t.loc_available_amount),
                "split_percent": float(t.split_percent) if t.split_percent else None,
                "txn_amount": float(t.txn_amount),
                "receivable_level": t.receivable_level,
                "created_by": t.created_by,
                "created_date": t.created_date.strftime("%Y-%m-%d %H:%M:%S")
            } for t in transactions]
        }
        
        return JsonResponse(data)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        })




@servicerequest_api.get("/invoice/{incident_number}")
def get_invoice_details(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        service_lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            record_type='Actual'
        )

        labor_total = service_lines.filter(component_type='Labour').aggregate(
            total=Sum('final_amount'))['total'] or 0
        parts_total = service_lines.filter(component_type='Parts').aggregate(
            total=Sum('final_amount'))['total'] or 0
        consumables_total = service_lines.filter(component_type='Consumables').aggregate(
            total=Sum('final_amount'))['total'] or 0
        sublet_total = service_lines.filter(component_type='Sublet').aggregate(
            total=Sum('final_amount'))['total'] or 0

        customer_balance = CUSTOMERBALANCE.objects.filter(
            service_request=service_request).first()

        # Create customer balance dictionary
        balance_details = {
            "customer": customer_balance.customer if customer_balance else "",
            "transaction_type": customer_balance.transaction_type if customer_balance else "",
            "receipt_number": customer_balance.receipt_number if customer_balance else "",
            "credit_memo": customer_balance.credit_memo if customer_balance else "",
            "original_amount": str(customer_balance.original_amount) if customer_balance else "0",
            "utilized_outstanding_amount": str(customer_balance.utilized_outstanding_amount) if customer_balance else "0",
            "loc_available_amount": str(customer_balance.loc_available_amount) if customer_balance else "0",
            "split_percent": str(customer_balance.split_percent) if customer_balance else "0",
            "txn_amount": str(customer_balance.txn_amount) if customer_balance else "0",
            "receivable_level": customer_balance.receivable_level if customer_balance else ""
        }

        return {
            "status": "success",
            "data": {
                "invoice_details": {
                    "bill_to": service_request.bill_to_customer_name,
                    "ship_to": service_request.ship_to_customer_name,
                    "address": service_request.address,
                    "shipping_address": service_request.address,
                    "unit_sale_date": service_request.created_at,
                    "invoice_date": datetime.now(),
                    "unit_sale_order": service_request.incident_number,
                    "invoice_no": f"INV-{service_request.incident_number}",
                    "unit_sale_loc": service_request.service_location,
                    "trn": "",
                    "job_card_type": service_request.incident_type,
                    "make": service_request.item,
                    "model": service_request.model,
                    "date_in": service_request.created_at,
                    "vin": service_request.vin,
                    "ro_number": service_request.incident_number,
                    "registration": service_request.registration_number,
                    "mileage": service_request.mileage,
                    "work_department": service_request.work_dept,
                    "lpo_wo_claim": service_request.lpo_reference_number,
                    "location": service_request.service_location,
                    "customer_trn": "",
                    "registered_bt": service_request.bill_to_customer_name,
                    "receipt_no": "",
                    "tel_no": service_request.mobile_number,
                    "pre_job_card": service_request.pre_job_card,
                    "due_date": service_request.promised_time
                },
                "line_items": {
                    "labor": {
                        "total": str(labor_total),
                        "items": list(service_lines.filter(component_type='Labour').values())
                    },
                    "parts": {
                        "total": str(parts_total),
                        "items": list(service_lines.filter(component_type='Parts').values())
                    },
                    "consumables": {
                        "total": str(consumables_total),
                        "items": list(service_lines.filter(component_type='Consumables').values())
                    },
                    "sublet": {
                        "total": str(sublet_total),
                        "items": list(service_lines.filter(component_type='Sublet').values())
                    }
                },
                "totals": {
                    "gross_total": str(labor_total + parts_total + consumables_total + sublet_total),
                    "vat_total": str(service_lines.aggregate(total=Sum('vat'))['total'] or 0),
                    "net_total": str(service_lines.aggregate(total=Sum('net_amount'))['total'] or 0)
                },
                "customer_balance": balance_details
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}




# For Material 
class MaterialProcessSchema(Schema):
    id: Optional[int] = None
    requested_part: str
    issued_part: str
    req_qty: int
    issued_qty: int
    ack_qty: int
    canc_qty: Optional[int] = None
    returned_qty: Optional[int] = None
    tot_selling_price: Decimal
    request_number: str
    line_status: str
    parts_status: str
    cancel_status: Optional[str] = None
    is_cancelled: Optional[bool] = False

class MaterialBulkProcessSchema(Schema):
    materials: List[MaterialProcessSchema]
    incident_number: str

@servicerequest_api.post("/materials/process/")
def process_materials(request):
    try:
        data = json.loads(request.body)
        materials = data.get('materials', [])
        incident_number = data.get('incident_number')
        
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        results = []
        with transaction.atomic():
            for material_data in materials:
                service_request_line = ServiceRequestLine.objects.filter(
                    component_code=material_data.get('requested_part'),
                    component_type='Material',
                    service_request=service_request,
                ).first()
                
                if not service_request_line:
                    continue

                material_values = {
                    'service_request': service_request,
                    'service_request_line': service_request_line,
                    'line': material_data.get('line', 1),
                    'requested_part': material_data.get('requested_part'),
                    'issued_part': material_data.get('issued_part'),
                    'req_qty': material_data.get('req_qty'),
                    'issued_qty': material_data.get('issued_qty'),
                    'ack_qty': material_data.get('ack_qty'),
                    'canc_qty': material_data.get('canc_qty'),
                    'returned_qty': material_data.get('returned_qty'),
                    'tot_selling_price': material_data.get('tot_selling_price'),
                    'request_number': material_data.get('request_number'),
                    'transaction_date': timezone.now(),
                    'line_status': material_data.get('line_status'),
                    'parts_status': material_data.get('parts_status'),
                    'cancel_status': material_data.get('cancel_status'),
                    'is_cancelled': material_data.get('is_cancelled', False)
                }

                if material_data.get('id'):
                    material = MATERIAL.objects.filter(id=material_data['id']).update(**material_values)
                else:
                    material = MATERIAL.objects.create(**material_values)

                results.append({
                    "id": material.id if isinstance(material, MATERIAL) else material_data.get('id'),
                    "status": "updated" if material_data.get('id') else "created"
                })

        return JsonResponse({
            "status": "success",
            "message": "Materials processed successfully",
            "results": results
        })

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@servicerequest_api.get("/materials/{incident_number}")
def get_materials_data(request, incident_number: str):
    try:
        service_request = ServiceRequestHeader.objects.get(incident_number=incident_number)
        
        materials_data = []
        service_lines = ServiceRequestLine.objects.filter(
            service_request=service_request,
            component_type='Material'
        )
        
        for line in service_lines:
            material = MATERIAL.objects.filter(
                service_request_line=line
            ).first()
            
            if material:
                materials_data.append({
                    "id": material.id,
                    "line": material.line,
                    "requested_part": material.requested_part,
                    "issued_part": material.issued_part,
                    "req_qty": material.req_qty,
                    "issued_qty": material.issued_qty,
                    "ack_qty": material.ack_qty,
                    "canc_qty": material.canc_qty,
                    "returned_qty": material.returned_qty,
                    "tot_selling_price": str(material.tot_selling_price),
                    "request_number": material.request_number,
                    "transaction_date": material.transaction_date,
                    "line_status": material.line_status,
                    "parts_status": material.parts_status,
                    "cancel_status": material.cancel_status,
                    "is_cancelled": material.is_cancelled
                })
            
        return {
            "status": "success",
            "data": materials_data,
            "incident_number": incident_number
        }

    except ServiceRequestHeader.DoesNotExist:
        return {"status": "error", "message": f"Service request with incident number {incident_number} not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
