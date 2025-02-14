from email.message import EmailMessage
from io import BytesIO
import os
from django.shortcuts import get_object_or_404
import jwt
from ninja import Form, NinjaAPI, Schema, File
from ninja.files import UploadedFile
from typing import List
from datetime import datetime, timedelta, timezone
import pandas as pd # type: ignore
from .models import ShareLink, StockCountConfig, StockCountHistory, UploadHeader, UploadLine, UploadMedia
from assignment.models import LOOKUP_DETAILS
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from ay_connect import settings
from vehicle.models import CustomUser
from ninja.security import HttpBearer
from ninja.errors import HttpError as DataError
from fpdf import FPDF # type: ignore
from django.utils import timezone  # Remove the datetime.timezone import
from datetime import datetime, timedelta
import jwt
from ninja import Router
from stock_app.models import UploadHeader, ShareLink
from email.message import EmailMessage
import os
from ninja import Form, NinjaAPI, Schema, File
from ninja.files import UploadedFile
from typing import List
from datetime import datetime
import pandas as pd # type: ignore
from fpdf import FPDF # type: ignore
from django.core.mail import EmailMessage
from io import BytesIO
import os
from ay_connect import settings
from vehicle.models import CustomUser # type: ignore
from .models import UploadHeader, UploadLine, UploadMedia
from assignment.models import LOOKUP_DETAILS
from django.http import HttpResponse
from ninja.responses import Response
from django.core.exceptions import ObjectDoesNotExist
from ninja.errors import HttpError as DataError
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from rest_framework_simplejwt.views import TokenRefreshView # type: ignore
from datetime import datetime, timedelta  # Add timedelta here
from django.template.loader import render_to_string
stock_api = NinjaAPI(version="stock-1.0.0")



class DataError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)

class LoginSchema(Schema):
    customer_no: str
    password: str

class JWTResponse(Schema):
    access: str
    refresh: str
    customer_name: str 



# @stock_api.post("/Stock_login", response=JWTResponse)
# def login(request, data: LoginSchema):
#     print(f"Login attempt for customer_no: {data.customer_no}")
#     try:
#         user = CustomUser.objects.get(customer_no=data.customer_no)
#         user.save()
#         if user.check_password(data.password):
#             refresh = RefreshToken.for_user(user)
#             return {
#                 'access': str(refresh.access_token),
#                 'refresh': str(refresh)
#             }
#         print("Backend: Sending JWT tokens to client")
#     except CustomUser.DoesNotExist:
#         pass
#     raise DataError(401, "Invalid credentials")

# Changed for customer name 

@stock_api.post("/Stock_login", response=JWTResponse)
def login(request, data: LoginSchema):
    print(f"Login attempt for customer_no: {data.customer_no}")
    try:
        user = CustomUser.objects.get(customer_no=data.customer_no)
        user.save()
        if user.check_password(data.password):
            refresh = RefreshToken.for_user(user)
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'customer_name': user.customer_name  # Add customer name to response
            }
        print("Backend: Sending JWT tokens to client")
    except CustomUser.DoesNotExist:
        pass
    raise DataError(401, "Invalid credentials")

@stock_api.post("/token/refresh")
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


class UploadTypeSchema(Schema):
    id: int
    LOOKUP_CODE: str
    MEANING: str

class UploadResponseSchema(Schema):
    header_id: int
    lines_count: int
    message: str

@stock_api.get("/upload-types", response=List[UploadTypeSchema])
def get_upload_types(request):
    upload_types = LOOKUP_DETAILS.objects.filter(
        LOOKUP_NAME='UPLOAD TYPE',
        ACTIVE='Y'
    ).values('id', 'LOOKUP_CODE', 'MEANING')
    return list(upload_types)


@stock_api.post("/upload", response=UploadResponseSchema)
def create_upload(
     request,
    title: str = Form(...),
    upload_type_value: str = Form(...),
    file: UploadedFile = File(...)
):
    try:
        
        upload_type_value_obj = LOOKUP_DETAILS.objects.get(
            LOOKUP_NAME='UPLOAD TYPE',
            MEANING=upload_type_value,
            ACTIVE='Y'
        )

        header = UploadHeader.objects.create(
            title=title,
            status="Draft",
            upload_type_id=upload_type_value_obj.id, 
            upload_type_value=upload_type_value,
            creation_by=request.user.username,
            creation_date=datetime.now(),
            last_updated_by=request.user.username,
            last_update_date=datetime.now()
        )



        # Process Excel file
        df = pd.read_excel(file.read())
        
        # Create column headers record
        column_headers = UploadLine.objects.create(
            header=header,
            line_status="Draft",
            col_header_flag=True,
            **{f'attribute{i+1}': str(col) for i, col in enumerate(df.columns) if i < 50}
        )
        
        # Create data records
        bulk_lines = []
        for _, row in df.iterrows():
            line = UploadLine(
                header=header,
                line_status="Draft",
                col_header_flag=False
            )
            for i, value in enumerate(row, start=1):
                if i <= 50:
                    setattr(line, f'attribute{i}', str(value) if pd.notna(value) else None)
            bulk_lines.append(line)
        
        UploadLine.objects.bulk_create(bulk_lines)
        
        return {
            "header_id": header.id,
            "lines_count": len(bulk_lines),
            "message": "Upload completed successfully"
        }
        
    except Exception as e:
        return {
            "header_id": 0,
            "lines_count": 0,
            "message": f"Error during upload: {str(e)}"
        }


class StockListSchema(Schema):
    id: int
    title: str
    status: str
    creation_by: str
    creation_date: datetime
    last_updated_by: str
    last_update_date: datetime
    upload_type_value:str


@stock_api.get("/list/stock-count", response=List[StockListSchema])
def get_stock_count_list(request):
    stocks = UploadHeader.objects.filter(
        upload_type_value="Stock count check"
    ).order_by('-creation_date')
    return [
        {
            "id": stock.id,
            "title": stock.title,
            "status": stock.status,
            "creation_by": stock.creation_by,
            "creation_date": stock.creation_date,
            "last_updated_by": stock.last_updated_by,
            "last_update_date": stock.last_update_date,
            "upload_type_value": stock.upload_type_value
        }
        for stock in stocks
    ]

@stock_api.get("/list/item-publishing", response=List[StockListSchema])
def get_item_publishing_list(request):
    stocks = UploadHeader.objects.filter(
        upload_type_value="Item by publishing"
    ).order_by('-creation_date')
    return [
        {
            "id": stock.id,
            "title": stock.title,
            "status": stock.status,
            "creation_by": stock.creation_by,
            "creation_date": stock.creation_date,
            "last_updated_by": stock.last_updated_by,
            "last_update_date": stock.last_update_date,
            "upload_type_value": stock.upload_type_value
        }
        for stock in stocks
    ]


from ninja import Schema
from typing import Dict, Any, Optional

class UploadLineSchema(Schema):
    id: int
    line_status: str
    col_header_flag: bool
    data: Dict[str, Optional[str]]
@stock_api.get("/detail/{header_id}", response=Dict[str, Any])
def get_stock_detail(request, header_id: int):
    try:
        header = UploadHeader.objects.get(id=header_id)
        lines = UploadLine.objects.filter(header_id=header_id).all()
        try:
            config = StockCountConfig.objects.get(header_id=header_id)
            selected_column = config.selected_column
        except StockCountConfig.DoesNotExist:
            selected_column = "Stock Count"
        
        # Get header row and data rows
        header_row = next((line for line in lines if line.col_header_flag), None)
        data_rows = [line for line in lines if not line.col_header_flag]
        
        data = {
            "header": {
                "id": header.id,
                "title": header.title,
                "status": header.status,
                "creation_by": header.creation_by,
                "creation_date": header.creation_date,
                "last_updated_by": header.last_updated_by,
                "last_update_date": header.last_update_date,
                "upload_type_value": header.upload_type_value,
                "selected_stock_count_column": selected_column
            },
            "lines": []
        }
        numeric_columns = {}
        if header_row and data_rows:
            for i in range(1, 51):
                attr_name = f'attribute{i}'
                header_value = getattr(header_row, attr_name, None)
                if header_value:
                    # Check if column contains numeric values
                    for row in data_rows:
                        value = str(getattr(row, attr_name, '')).strip()
                        if value and value.replace('.', '').replace('-', '').isdigit():
                            numeric_columns[attr_name] = header_value
                            break
    
        data["header"]["numeric_columns"] = numeric_columns

        # Find columns for actual count, variance and remarks
        

        # Find the header row to identify which attributes are Actual Count and Variance
        header_row = next((line for line in lines if line.col_header_flag), None)
        actual_count_attr = None
        variance_attr = None
        remarks_attr = None
        
        if header_row:
            for k, v in header_row.__dict__.items():
                if k.startswith('attribute'):
                    if v == 'Actual Count':
                        actual_count_attr = k
                    elif v == 'Variance':
                        variance_attr = k
                    elif v == 'Remarks':
                        remarks_attr = k

        for line in lines:
            line_data = {
                "id": line.id,
                "line_status": line.line_status,
                "col_header_flag": line.col_header_flag,
                "data": {},
                "actual_count": line.__dict__.get(actual_count_attr) if not line.col_header_flag and actual_count_attr else None,
                "variance": line.__dict__.get(variance_attr) if not line.col_header_flag and variance_attr else None,
                "remarks": line.__dict__.get(remarks_attr) if not line.col_header_flag and remarks_attr else None,
            }
            
            for k, v in sorted(line.__dict__.items()):
                if k.startswith('attribute') and v is not None:
                    if k not in [actual_count_attr, variance_attr,remarks_attr]:
                        line_data["data"][k] = v

            data["lines"].append(line_data)

        print("Detected numeric columns:", numeric_columns)  # Debug log
        return data

    except UploadHeader.DoesNotExist:
        return {"error": "Header not found", "message": f"No header found with ID {header_id}."}, 404
    except Exception as e:
        return {"error": "An error occurred", "message": str(e)}, 500


@stock_api.get("/detail-mobile/{header_id}", response=Dict[str, Any])
def get_stock_detail(request, header_id: int):
    try:
        header = UploadHeader.objects.get(id=header_id)
        lines = UploadLine.objects.filter(header_id=header_id)
        
        data = {
            "header": {
                "id": header.id,
                "title": header.title,
                "status": header.status,
                "creation_by": header.creation_by,
                "creation_date": header.creation_date,
                "last_updated_by": header.last_updated_by,
                "last_update_date": header.last_update_date,
                "upload_type_value": header.upload_type_value
            },
            "lines": []
        }

        # Different handling based on upload type
        if header.upload_type_value == "Stock count check":
            data["lines"] = [
                {
                    "id": line.id,
                    "line_status": line.line_status,
                    "col_header_flag": line.col_header_flag,
                    "data": {k: v for k, v in line.__dict__.items()
                            if k.startswith('attribute') and k <= 'attribute4' and v is not None}
                }
                for line in lines
            ]
        else:  # For "Item by publishing"
            data["lines"] = [
                {
                    "id": line.id,
                    "line_status": line.line_status,
                    "col_header_flag": line.col_header_flag,
                    "data": {k: v for k, v in line.__dict__.items()
                            if k.startswith('attribute') and v is not None}
                }
                for line in lines
            ]

        if data["lines"]:
            data["headings"] = list(data["lines"][0]["data"].values())
        else:
            data["headings"] = []

        return data

    except UploadHeader.DoesNotExist:
        return {
            "error": "Header not found",
            "message": f"No header found with ID {header_id}."
        }, 404

    except Exception as e:
        return {
            "error": "An error occurred",
            "message": str(e)
        }, 500





@stock_api.get("/search/{header_id}")
def search_items(request, header_id: int, search_term: str = None):
    query = UploadLine.objects.filter(
        header_id=header_id,
        col_header_flag=False
    )
    
    if search_term:
        # Assuming attribute2 contains the Item Description
        query = query.filter(attribute2__icontains=search_term)
    
    lines = query.all()
    
    return {
        "lines": [
            {
                "id": line.id,
                "line_status": line.line_status,
                "data": {k: v for k, v in line.__dict__.items()
                        if k.startswith('attribute') and v is not None}
            }
            for line in lines
        ]
    }


@stock_api.get("/detail/{header_id}/counts")
def get_line_counts(request, header_id: int):
    lines = UploadLine.objects.filter(header_id=header_id, col_header_flag=False)
    
    draft_lines = lines.filter(line_status="Draft")
    in_progress_lines = lines.filter(line_status="Counting Done")
    completed_lines = lines.filter(line_status="Completed")

    return {
        "counts": {
            "total": lines.count(),
            "draft": draft_lines.count(),
            "in-progress": in_progress_lines.count(), 
            "completed": completed_lines.count()
        },
        "records": {
            "draft": [
                {
                    "id": line.id,
                    "line_status": line.line_status,
                    "data": {k: v for k, v in line.__dict__.items() 
                            if k.startswith('attribute') and v is not None}
                }
                for line in draft_lines
            ],
            "in-progress": [  # Add this block
                {
                    "id": line.id,
                    "line_status": line.line_status,
                    "data": {k: v for k, v in line.__dict__.items()
                            if k.startswith('attribute') and v is not None}
                }
                for line in in_progress_lines
            ],
            "completed": [
                {
                    "id": line.id,
                    "line_status": line.line_status,
                    "data": {k: v for k, v in line.__dict__.items() 
                            if k.startswith('attribute') and v is not None}
                }
                for line in completed_lines
            ]
        }
    }



# for updating the status to complete 
@stock_api.post("/complete/{header_id}", response=dict)
def complete_upload(request, header_id: int):
    try:
        # Get the header
        header = UploadHeader.objects.get(id=header_id)
        
        # Get all non-header lines
        lines = UploadLine.objects.filter(
            header_id=header_id,
            col_header_flag=False
        )
        
        # Check if all lines have been uploaded
        media_uploads = UploadMedia.objects.filter(
            line_id__in=lines.values_list('id', flat=True)
        ).values_list('line_id', flat=True)
        
        # Convert to set for faster lookup
        uploaded_line_ids = set(media_uploads)
        all_line_ids = set(lines.values_list('id', flat=True))
        
        # If not all lines have uploads, return error
        if uploaded_line_ids != all_line_ids:
            return {
                "success": False,
                "message": "All lines must have uploads before completing"
            }
        
        # Update header status
        header.status = "Completed"
        header.last_update_date = datetime.now()
        header.save()
        
        # Update all line statuses
        lines.update(
            line_status="Completed"
        )
        
        return {
            "success": True,
            "message": "Upload completed successfully"
        }
        
    except UploadHeader.DoesNotExist:
        return {
            "success": False,
            "message": "Header not found"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error during completion: {str(e)}"
        }






class StockCountPayloadSchema(Schema):
    line_id: int
    actual_count: str
    variance: str
    remarks: str
@stock_api.post("/update-stock-count/{header_id}", response=Dict[str, Any])
def update_stock_count(request, header_id: int, payload: List[StockCountPayloadSchema], action: str = "complete"):
    try:
        header = UploadHeader.objects.get(id=header_id)
        header_row = UploadLine.objects.get(header_id=header_id, col_header_flag=True)
        
        updated_lines = []
        for item in payload:
            # Validate remarks based on variance
            variance = float(item.variance)
            actual_count = float(item.actual_count) if item.actual_count else 0
            
            remarks = item.remarks if actual_count == 0 or variance != 0 else "No Remarks"
            
            # Update StockCountHistory
            stock_history = StockCountHistory.objects.filter(
                header_id=header_id,
                upload_line_id=item.line_id,
                actual_count=item.actual_count,
                variance=item.variance
            ).first()
            
            if stock_history:
                stock_history.remarks = remarks
                stock_history.save()
            
            # Update UploadLine
            line = UploadLine.objects.get(id=item.line_id, header_id=header_id)
            line.line_status = "Completed" if action == "complete" else "Draft"
            
            # Find or create remarks column
            remarks_attr = None
            for i in range(1, 50):
                attr_value = getattr(header_row, f'attribute{i}', None)
                if attr_value == 'Remarks':
                    remarks_attr = f'attribute{i}'
                    break
            
            if not remarks_attr:
                last_used_attr = max(i for i in range(1, 50) 
                                   if getattr(header_row, f'attribute{i}', None) is not None)
                remarks_attr = f'attribute{last_used_attr + 1}'
                setattr(header_row, remarks_attr, 'Remarks')
                header_row.save()
            
            setattr(line, remarks_attr, remarks)
            line.save()
            
            line_data = {
                "id": line.id,
                "line_status": "Completed",
                "actual_count": item.actual_count,
                "variance": item.variance,
                "remarks": remarks,
                "data": {k: v for k, v in line.__dict__.items()
                        if k.startswith('attribute') and v is not None}
            }
            updated_lines.append(line_data)
        
        header.status = "Completed" if action == "complete" else "Draft"
        header.save()
        
        return {
            "success": True,
            "message": "Stock count and remarks updated successfully",
            "updated_data": updated_lines,
            "header": {
                "id": header.id,
                "status": header.status,
                "title": header.title
            }
        }
        
    except Exception as e:
        return {"success": False, "message": str(e)}



from ninja import Schema
from typing import List, Optional

class MediaFileSchema(Schema):
    id: int
    file_name: str
    path: str
    type: str
    line_id: Optional[int] = None

class MediaUploadResponseSchema(Schema):
    header_id: int
    media_files: List[MediaFileSchema]
    message:str


@stock_api.post("/upload/media", response=MediaUploadResponseSchema)
def upload_media(
    request,
    header_id: int = Form(...),
    line_id: int = Form(...),
    files: List[UploadedFile] = File(...)
):
    try:
        header = UploadHeader.objects.get(id=header_id)
        line = UploadLine.objects.get(id=line_id)
        uploaded_files = []

        for file in files:
            # Determine subfolder based on file extension
            file_ext = os.path.splitext(file.name)[1].lower()
            if file_ext in ['.jpg', '.jpeg', '.png', '.avif', '.webp']:
                subfolder = 'images'
            elif file_ext in ['.mp4', '.mov']:
                subfolder = 'videos'
            else:
                subfolder = 'documents'
            
            # Read binary data from file
            binary_data = file.read()
            file.seek(0)  # Reset file pointer
            
            # Create upload directory if it doesn't exist
            upload_path = os.path.join('media', subfolder)
            os.makedirs(upload_path, exist_ok=True)
            
            # Generate unique filename
            filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
            file_path = os.path.join(upload_path, filename)
            
            # Save file and create media record
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            media = UploadMedia.objects.create(
                file_name=file.name,
                header=header,
                line=line,
                path=os.path.join(subfolder, filename),
                binary=binary_data
            )
            
            uploaded_files.append({
                "id": media.id,
                "file_name": media.file_name,
                "path": media.path,
                "type": subfolder,
                "line_id": line.id
            })

        return {
            "header_id": header_id,
            "media_files": uploaded_files,
            "message": "Media files uploaded successfully"
        }
    except Exception as e:
        return {
            "header_id": header_id,
            "media_files": [],
            "message": f"Error during media upload: {str(e)}"
        }




def determine_file_type(file_name: str) -> str:
    """
    Determines the file type based on file extension
    """
    image_extensions = {'jpg', 'jpeg', 'png', 'avif', 'webp'}
    video_extensions = {'mp4', 'mov'}
    
    extension = file_name.lower().split('.')[-1]
    
    if extension in image_extensions:
        return 'images'
    elif extension in video_extensions:
        return 'videos'
    return 'documents'

@stock_api.get("/media/{header_id}/{line_id}", response=List[MediaFileSchema])
def get_media_files(request, header_id: int, line_id: int):
    media_files = UploadMedia.objects.filter(header_id=header_id, line_id=line_id)
    return [
        {
            "id": media.id,
            "file_name": media.file_name,
            "path": media.path,
            "type": determine_file_type(media.file_name),
            "line_id": media.line_id
        }
        for media in media_files
    ]






# Delete api for deleting the media:
@stock_api.delete("/media/delete/{header_id}/{line_id}/{media_id}", response=Schema)
def delete_media_files(request, header_id: int, line_id: int, media_id: int):
    try:
        media_file = UploadMedia.objects.filter(
            id=media_id,
            header_id=header_id, 
            line_id=line_id
        ).first()
        
        if not media_file:
            return {
                "status": "success",
                "message": "No file found to delete",
                "header_id": header_id,
                "line_id": line_id,
                "media_id": media_id
            }
        
        file_path = os.path.join('media', media_file.path)
        if os.path.exists(file_path):
            os.remove(file_path)
            media_file.delete()
            
        return {
            "status": "success", 
            "message": "File deleted successfully",
            "header_id": header_id,
            "line_id": line_id,
            "media_id": media_id
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Unable to delete file: {str(e)}",
            "header_id": header_id,
            "line_id": line_id,
            "media_id": media_id
        }




# api for sending the email
@stock_api.post("/send-pdf-email/{header_id}/", response=dict) 
def send_pdf_email(request, header_id: int):
    try:
        # Get the header and details
        header = UploadHeader.objects.get(id=header_id)
        details = get_stock_detail(request, header_id)
        
        # Create PDF
        pdf = FPDF()
        pdf.add_page()
        
        # Add title
        pdf.set_font('Arial', 'B', 16)
        pdf.set_text_color(50, 61, 137)  # RGB for #323d89
        pdf.cell(0, 10, header.title, ln=True, align='C')
        
        # Add table headers
        pdf.set_font('Arial', 'B', 12)
        pdf.set_text_color(255, 255, 255)
        pdf.set_fill_color(50, 61, 137)
        
        # Calculate column width
        col_width = pdf.w / len(details['headings'])
        
        # Add headers
        for heading in details['headings']:
            pdf.cell(col_width, 10, str(heading), 1, 0, 'C', True)
        pdf.ln()
        
        # Add data rows
        pdf.set_font('Arial', '', 10)
        pdf.set_text_color(0, 0, 0)
        
        for line in details['lines']:
            if not line['col_header_flag']:
                for key, value in line['data'].items():
                    pdf.cell(col_width, 10, str(value), 1, 0, 'C')
                pdf.ln()
        
        # Save PDF to BytesIO
        pdf_buffer = BytesIO()
        pdf.output(pdf_buffer)
        
        # Save PDF to model
        pdf_filename = f"stock_details_{header_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_path = os.path.join('pdfs', pdf_filename)
        
        # Email template
        email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                }}
                .header {{
                    background-color: #323d89;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }}
                .content {{
                    padding: 20px;
                }}
                .footer {{
                    background-color: #f5f5f5;
                    padding: 10px;
                    text-align: center;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Stock Count Details</h2>
            </div>
            <div class="content">
                <p>Dear User,</p>
                <p>Please find attached the stock count details for: <strong>{header.title}</strong></p>
                <p>Details:</p>
                <ul>
                    <li>Stock Count ID: {header_id}</li>
                    <li>Generated Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                    <li>Status: {header.status}</li>
                </ul>
                <p>The PDF document is attached to this email for your reference.</p>
                <p>Best regards,<br>Stock Management System</p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """
        
        # Send email with specified addresses
        email = EmailMessage(
            subject=f'Stock Count Details - {header.title}',
            body=email_html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=['tappasameer707@gmail.com'],
            cc=['tappasameer743@gmail.com'],
        )
        
        # Set content type as HTML
        email.content_subtype = "html"
        
        # Attach PDF
        email.attach(pdf_filename, pdf_buffer.getvalue(), 'application/pdf')
        email.send()
        
        return {
            "success": True,
            "message": "PDF generated and email sent successfully"
        }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error during PDF generation and email sending: {str(e)}"
        }




# Chnged for customer name 
class StockCountPayloadSchema(Schema):
    line_id: int
    actual_count: str 
    variance: str
    line_status: str
    username: str
    remarks: str


@stock_api.post("/update-stock-count-mobile/{header_id}", response=Dict[str, Any])
def update_stock_count(request, header_id: int, payload: List[StockCountPayloadSchema]):
    try:
        header = get_object_or_404(UploadHeader, id=header_id)
        header_row = get_object_or_404(UploadLine, header_id=header_id, col_header_flag=True)
        
        username = payload[0].username
        
        # Update header tracking
        header.last_updated_by = username
        header.last_update_date = datetime.now()
        header.status = payload[0].line_status
        header.save()

        # Find/create columns
        actual_count_col = None
        variance_col = None
        last_used_attr = 1
        
        # Find existing columns or create new ones
        for i in range(1, 50):
            attr_value = getattr(header_row, f'attribute{i}', None)
            if attr_value is not None:
                last_used_attr = i
                if attr_value == 'Actual Count':
                    actual_count_col = f'attribute{i}'
                elif attr_value == 'Variance':
                    variance_col = f'attribute{i}'

        # Create columns if they don't exist
        if not actual_count_col:
            actual_count_col = f'attribute{last_used_attr + 1}'
            setattr(header_row, actual_count_col, 'Actual Count')
            last_used_attr += 1
            
        if not variance_col:
            variance_col = f'attribute{last_used_attr + 1}'
            setattr(header_row, variance_col, 'Variance')
            last_used_attr += 1

        header_row.save()
        print(f"Columns set - Actual Count: {actual_count_col}, Variance: {variance_col}")
        
        updated_lines = []
        for item in payload:
            line = get_object_or_404(UploadLine, id=item.line_id, header_id=header_id)
            
            # Store history
            StockCountHistory.objects.create(
                header=header,
                upload_line=line,
                actual_count=item.actual_count,
                variance=item.variance,
                created_by=username,
                remarks=item.remarks,
                line_status=item.line_status
            )
            
            # Update line tracking
            line.last_updated_by = username
            line.last_update_date = datetime.now()
            line.line_status = item.line_status
            
            # Explicitly set actual count and variance
            setattr(line, actual_count_col, item.actual_count)
            setattr(line, variance_col, item.variance)
            
            # Print values before saving
            print(f"Setting values for line {line.id}: Actual Count={item.actual_count}, Variance={item.variance}")
            
            line.save()
            
            # Verify values after saving
            saved_line = UploadLine.objects.get(id=line.id)
            print(f"Saved values for line {line.id}: Actual Count={getattr(saved_line, actual_count_col)}, Variance={getattr(saved_line, variance_col)}")
            
            # Get history
            history = StockCountHistory.objects.filter(upload_line=line, header=header)
            history_data = [{
                'actual_count': h.actual_count,
                'variance': h.variance,
                'created_by': h.created_by,
                'created_date': h.created_date,
                'line_status': h.line_status,
                'remarks': h.remarks,
                'header_id': h.header.id
            } for h in history]
            
            line_data = {
                "id": line.id,
                "line_status": item.line_status,
                "actual_count": item.actual_count,
                "variance": item.variance,
                "last_updated_by": username,
                "last_update_date": line.last_update_date,
                "history": history_data,
                "data": {k: v for k, v in line.__dict__.items() 
                        if k.startswith('attribute') and v is not None}
            }
            updated_lines.append(line_data)

        return {
            "success": True,
            "message": "Stock count updated successfully",
            "updated_data": updated_lines,
            "header": {
                "id": header.id,
                "status": header.status,
                "title": header.title,
                "last_updated_by": username,
                "last_update_date": header.last_update_date
            }
        }
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return {"success": False, "message": str(e)}

class UploadLineSchema(Schema):
    id: int
    line_status: str
    col_header_flag: bool
    data: Dict[str, Optional[str]]
@stock_api.get("/detail-stock-mobile/{header_id}", response=Dict[str, Any])
def get_stock_detail(request, header_id: int):
    try:
        header = UploadHeader.objects.get(id=header_id)
        lines = UploadLine.objects.filter(header_id=header_id)

        try:
            config = StockCountConfig.objects.get(header_id=header_id)
            selected_column = config.selected_column
        except StockCountConfig.DoesNotExist:
            selected_column = "Stock Count"
        
        header_row = next((line for line in lines if line.col_header_flag), None)
        column_mapping = {}
        
        # Find special columns
        actual_count_col = None
        variance_col = None
        remarks_col = None
        
        if header_row:
            for i in range(1, 21):
                attr_name = f'attribute{i}'
                attr_value = getattr(header_row, attr_name, None)
                if attr_value is not None:
                    if attr_value == 'Actual Count':
                        actual_count_col = attr_name
                    elif attr_value == 'Variance':
                        variance_col = attr_name
                    elif attr_value == 'Remarks':
                        remarks_col = attr_name
                    column_mapping[attr_value] = attr_name

        data = {
            "header": {
                "id": header.id,
                "title": header.title,
                "status": header.status,
                "creation_by": header.creation_by,
                "creation_date": header.creation_date,
                "last_updated_by": header.last_updated_by,
                "last_update_date": header.last_update_date,
                "upload_type_value": header.upload_type_value,
                "selected_stock_count_column": selected_column
            },
            "lines": []
        }

        for line in lines:
            line_data = {
                "id": line.id,
                "line_status": line.line_status,
                "col_header_flag": line.col_header_flag,
                "data": {},
                "actual_count": getattr(line, actual_count_col, "0") if actual_count_col else "0",
                "variance": getattr(line, variance_col, "0") if variance_col else "0",
                "remarks": getattr(line, remarks_col, "") if remarks_col else ""
            }
            
            for attr_name, header_name in column_mapping.items():
                if header_name not in [actual_count_col, variance_col, remarks_col]:
                    value = getattr(line, header_name, None)
                    if value is not None:
                        line_data["data"][header_name] = value
            
            data["lines"].append(line_data)

        if header_row:
            data["headings"] = [
                getattr(header_row, f'attribute{i}', None)
                for i in range(1, len(column_mapping) + 1)
                if getattr(header_row, f'attribute{i}', None) is not None
            ]

        return data

    except UploadHeader.DoesNotExist:
        return {"error": "Header not found", "message": f"No header found with ID {header_id}."}, 404
    except Exception as e:
        return {"error": "An error occurred", "message": str(e)}, 500




class StockCountColumnSchema(Schema):
    column_name: str

@stock_api.post("/save-stock-count-column/{header_id}")
def save_stock_count_column(request, header_id: int, data: StockCountColumnSchema):
    try:
        config, created = StockCountConfig.objects.update_or_create(
            header_id=header_id,
            defaults={'selected_column': data.column_name}
        )
        return {"success": True, "message": "Column saved successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}

@stock_api.get("/get-stock-count-column/{header_id}")
def get_stock_count_column(request, header_id: int):
    try:
        config = StockCountConfig.objects.get(header_id=header_id)
        return {"column": config.selected_column}
    except StockCountConfig.DoesNotExist:
        return {"column": "Stock Count"}
    

    

@stock_api.post("/generate-share-link/{header_id}", response=dict, auth=None)
def generate_share_link(request, header_id: int):
    try:
        header = UploadHeader.objects.get(id=header_id)
        
        # Check if an active share link already exists
        existing_share_link = ShareLink.objects.filter(
            header=header,
            expires_at__gt=timezone.now()
        ).first()
        
        if existing_share_link:
            return {
                "success": True,
                "share_url": existing_share_link.share_url,
                "message": "Using existing share link",
                "token": existing_share_link.token
            }

        expiration_date = timezone.now() + timedelta(days=7)
        share_token = jwt.encode(
            {
                'header_id': header_id,
                'exp': expiration_date.timestamp(),
                'public_access': True
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        
        base_url = "http://127.0.0.1:8000/stock"
        share_url = f"{base_url}/shared/?token={share_token}"
        
        share_link = ShareLink.objects.create(
            header=header,
            share_url=share_url,
            token=share_token,
            expires_at=expiration_date
        )
        
        return {
            "success": True,
            "share_url": share_url,
            "message": "Public share link generated successfully",
            "token": share_token
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error generating share link: {str(e)}"
        }

    
@stock_api.post("/send-share-email/{header_id}/", response=dict) 
def send_share_email(request, header_id: int):  
    try:
        header = UploadHeader.objects.get(id=header_id)

        # Get or create share link
        share_link = ShareLink.objects.filter(
            header=header,
            expires_at__gt=timezone.now()
        ).first()

        if not share_link:
            expiration_date = timezone.now() + timedelta(days=7)
            share_token = jwt.encode(
                {
                    'header_id': header_id,
                    'exp': expiration_date.timestamp(),
                    'public_access': True
                },
                settings.SECRET_KEY,
                algorithm='HS256'
            )
            
            base_url = "http://127.0.0.1:8000/stock"
            share_url = f"{base_url}/shared/?token={share_token}"
            
            share_link = ShareLink.objects.create(
                header=header,
                share_url=share_url,
                token=share_token,
                expires_at=expiration_date
            )

        # Send email with just the share link
        email_html = render_to_string('stock_app/item_publishing_email.html', {
            'header_title': header.title,
            'share_url': share_link.share_url
        })

        email = EmailMessage(
            subject=f'Item Publishing Details - {header.title}',
            body=email_html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=['bf99584@gmail.com'],
            cc=['bf99584@gmail.com'],
        )
        
        email.content_subtype = "html"
        email.send()
        
        return {
            "success": True,
            "message": "Email sent successfully",
            "share_url": share_link.share_url
        }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error sending email: {str(e)}"
        }


@stock_api.get("/get-stock-count-history/{header_id}/{line_id}", response=dict)
def get_stock_count_history(request, header_id: int, line_id: int):
    try:
        stock_counts = StockCountHistory.objects.filter(
            header_id=header_id,
            upload_line_id=line_id
        ).order_by('created_date')
        
        # Group counts by created_date to handle multiple submissions
        grouped_counts = {}
        for count in stock_counts:
            date_key = count.created_date.strftime('%Y-%m-%d %H:%M')
            if date_key not in grouped_counts:
                grouped_counts[date_key] = {
                    'actual_count': count.actual_count,
                    'variance': count.variance,
                    'created_by': count.created_by,
                    'created_date': date_key,
                    'remarks': count.remarks,
                    'line_status': count.line_status
                }
        
        return {"success": True, "counts": list(grouped_counts.values())}
    except Exception as e:
        return {"success": False, "error": str(e)}
