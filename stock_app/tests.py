# stock_app/api.py
from email.message import EmailMessage
from io import BytesIO
import os
from ninja.errors import HttpError
import jwt
from ninja import Form, NinjaAPI, Schema, File
from ninja.files import UploadedFile
from typing import List
from datetime import datetime
import pandas as pd
from .models import UploadHeader, UploadLine, UploadMedia
from assignment.models import LOOKUP_DETAILS
from rest_framework_simplejwt.tokens import RefreshToken
from ay_connect import settings
from vehicle.models import CustomUser
from ninja.security import HttpBearer
from ninja.errors import HttpError as DataError
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
                'refresh': str(refresh)
            }
        print("Backend: Sending JWT tokens to client")
    except CustomUser.DoesNotExist:
        pass
    raise HttpError(401, "Invalid credentials")

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


# class LoginSchema(Schema):
#     customer_no: str
#     password: str

# class JWTResponse(Schema):
#     access: str
#     refresh: str

# @stock_api.post("/Stock_login", response=JWTResponse)
# def login(request, data: LoginSchema):
#     print(f"Login attempt for customer_no: {data.customer_no}")
#     try:
#         user = CustomUser.objects.get(customer_no=data.customer_no)
#         user.save()
#         if user.check_password(data.password):
#             # Create tokens using RefreshToken
#             refresh = RefreshToken.for_user(user)
            
#             print("\n=== Token Information ===")
#             print(f"Customer No: {data.customer_no}")
#             print(f"Access Token: {str(refresh.access_token)}")
#             print(f"Refresh Token: {str(refresh)}")
#             print("=======================\n")
            
#             return {
#                 'access': str(refresh.access_token),
#                 'refresh': str(refresh)
#             }
#         print("Backend: Sending JWT tokens to client")
#     except CustomUser.DoesNotExist:
#         pass
#     raise DataError(401, "Invalid credentials")


# # Token Refresh:
# @stock_api.post("/token/refresh")

# def refresh_token(request, refresh_token: str):
#     try:
#         refresh = RefreshToken(refresh_token)
#         return {
#             "access": str(refresh.access_token),
#             "refresh": str(refresh)
#         }
#     except Exception as e:
#         return {"error": "Invalid refresh token"}

# class JWTAuth(HttpBearer):
#     def authenticate(self, request, token):
#         try:
#             return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
#         except:
#             return None
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

@stock_api.get("/list/", response=List[StockListSchema])
def get_stock_list(request):
    stocks = UploadHeader.objects.all().order_by('-creation_date')
    return [
        {
            "id": stock.id,
            "title": stock.title,
            "status": stock.status,
            "creation_by": stock.creation_by,
            "creation_date": stock.creation_date,
            "last_updated_by": stock.last_updated_by,
            "last_update_date": stock.last_update_date,
            "upload_type_value":stock.upload_type_value
        }
        for stock in stocks
    ]
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
def update_stock_count(request, header_id: int, payload: List[StockCountPayloadSchema]):
    try:
        header = UploadHeader.objects.get(id=header_id)
        
        # Get total count of stock records
        total_stock_records = UploadLine.objects.filter(
            header_id=header_id,
            col_header_flag=False
        ).count()
        
        # Validate if all records are included
        if len(payload) != total_stock_records:
            return {
                "success": False,
                "message": "All stock records must be processed"
            }
        
        # Validate each record
        for item in payload:
            if not item.actual_count:
                return {
                    "success": False,
                    "message": f"Actual count is required for all records"
                }
                
            variance = float(item.variance)
            if variance > 0 and not item.remarks:
                return {
                    "success": False,
                    "message": f"Remarks required for records with variance"
                }
        
        # If validation passes, update records
        last_used_attribute = 4
        base_attribute = last_used_attribute + 1
        
        header_row = UploadLine.objects.get(header_id=header_id, col_header_flag=True)
        setattr(header_row, f'attribute{base_attribute}', 'Actual Count')
        setattr(header_row, f'attribute{base_attribute + 1}', 'Variance')
        setattr(header_row, f'attribute{base_attribute + 2}', 'Remarks')
        header_row.save()
        
        updated_lines = []
        for item in payload:
            line = UploadLine.objects.get(id=item.line_id, header_id=header_id)
            setattr(line, f'attribute{base_attribute}', item.actual_count)
            setattr(line, f'attribute{base_attribute + 1}', item.variance)
            setattr(line, f'attribute{base_attribute + 2}', item.remarks)
            line.line_status = "Completed"
            line.save()
            
            # Add updated line data to response
            updated_lines.append({
                "id": line.id,
                "line_status": "Completed",
                "actual_count": item.actual_count,
                "variance": item.variance,
                "remarks": item.remarks,
                "data": {k: v for k, v in line.__dict__.items() 
                        if k.startswith('attribute') and k <= 'attribute4' and v is not None}
            })
            
        header.status = "Completed"
        header.save()

        return {
            "success": True,
            "message": "Stock count updated successfully",
            "updated_data": updated_lines,
            "header": {
                "id": header.id,
                "status": header.status,
                "title": header.title
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }





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






class StockCountPayloadSchema(Schema):
    line_id: int
    actual_count: str
    variance: str
    remarks: Optional[str] = None
    line_status: str
    
@stock_api.post("/update-stock-count-mobile/{header_id}", response=Dict[str, Any])
def update_stock_count(request, header_id: int, payload: List[StockCountPayloadSchema]):
    header = UploadHeader.objects.get(id=header_id)
    
    # Find the last used attribute number
    last_used_attribute = 4  # Since attribute4 has stock_count
    base_attribute = last_used_attribute + 1  # Start from attribute5
    
    # First update the header row with new column names
    header_row = UploadLine.objects.get(header_id=header_id, col_header_flag=True)
    setattr(header_row, f'attribute{base_attribute}', 'Actual Count')
    setattr(header_row, f'attribute{base_attribute + 1}', 'Variance')
    setattr(header_row, f'attribute{base_attribute + 2}', 'Remarks')
    header_row.save()
    
    # Then update the detail rows with values
    for item in payload:
        line = UploadLine.objects.get(id=item.line_id, header_id=header_id)
        setattr(line, f'attribute{base_attribute}', item.actual_count)
        setattr(line, f'attribute{base_attribute + 1}', item.variance)
        setattr(line, f'attribute{base_attribute + 2}', item.remarks)
        line.line_status = item.line_status
        line.save()

        # Update header status to match line status
    header.status = payload[0].line_status
    header.save()

    return get_stock_detail(request, header_id)




class UploadLineSchema(Schema):
    id: int
    line_status: str
    col_header_flag: bool
    data: Dict[str, Optional[str]]

@stock_api.get("/detail-mobile/{header_id}", response=Dict[str, Any])
def get_stock_detail(request, header_id: int):
    header = UploadHeader.objects.get(id=header_id)
    lines = UploadLine.objects.filter(header_id=header_id)
    
    data= {
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
        "lines": [
            {
                "id": line.id,
                "line_status": line.line_status,
                "col_header_flag": line.col_header_flag,
                "data": {k: v for k, v in line.__dict__.items() 
                        if k.startswith('attribute') and v is not None}
            }
            for line in lines
        ],

        
    }
    data["headings"] = list(data["lines"][0]["data"].values())
    print(data["headings"])
    return data
