
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from pydantic import ValidationError
from datetime import datetime, date, timezone


from django.utils import timezone  


class CustomUser(AbstractUser):
    id = models.AutoField(primary_key=True)
    customer_no = models.CharField(max_length=200, unique=True,null=True, blank=True)
    
    customer_name = models.CharField(max_length=255,null=True, blank=True)
    account_number = models.CharField(max_length=50, null=True, blank=True)
    ship_to_customer_name = models.CharField(max_length=255,null=True, blank=True)
    ship_to_account_number = models.CharField(max_length=50, null=True, blank=True)
    bill_to_customer_name = models.CharField(max_length=255,null=True, blank=True)
    bill_to_account_number = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    
    created_by = models.CharField(max_length=100, default='ADMIN')
    last_updated_by = models.CharField(max_length=100, default='ADMIN')
    creation_date = models.DateField(auto_now_add=True,null=True, blank=True)
    last_update_date = models.DateField(auto_now=True,null=True, blank=True)
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name=('groups'),
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name=('user permissions'),
        help_text=('Specific permissions for this user.'),
    )
    
    def save(self, *args, **kwargs):
        if not self.created_by:
            self.created_by = 'ADMIN'
        if not self.last_updated_by:
            self.last_updated_by = 'ADMIN'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer_no} - {self.customer_name}"

    class Meta:
        db_table = 'custom_user'

class VehicleCustomerLink(models.Model):
    CUSTOMER_NUMBER = models.CharField(max_length=200, null=True)
    VIN_NUMBER = models.CharField(max_length=50, null=True)
    ITEM_ID = models.CharField(max_length=50, null=True)
    ENABLED_FLAG = models.CharField(max_length=1, default='Y',null=True, blank=True)
    START_DATE = models.DateField(null=True, blank=True)
    END_DATE = models.DateField(null=True, blank=True)
    CREATED_BY = models.CharField(max_length=100, default='ADMIN')
    LAST_UPDATED_BY = models.CharField(max_length=100, default='ADMIN')
    CREATION_DATE = models.DateTimeField(default=timezone.now)
    LAST_UPDATE_DATE = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('CUSTOMER_NUMBER', 'VIN_NUMBER')
        db_table = 'CustomSerialLink'


 

class AuditBaseModel(models.Model):
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="%(class)s_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="%(class)s_updated")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Lookup(models.Model):
    LOOK_TYPE = models.CharField(max_length=50, null=True, blank=True, default='')
    CODE = models.CharField(max_length=100, null=True, blank=True, default='')
    MEANING = models.CharField(max_length=100, null=True, blank=True, default='')
    CREATED_BY = models.CharField(max_length=100, null=True, blank=True, default='')
    LAST_UPDATED_BY = models.CharField(max_length=100, null=True, blank=True, default='')
    CREATION_DATE = models.DateTimeField(auto_now=True, null=True, blank=True)
    LAST_UPDATE_DATE = models.DateTimeField(auto_now=True, null=True, blank=True)

    def _str_(self):
        return f"{self.LOOK_TYPE} - {self.CODE}"

    class Meta:
        unique_together = ('LOOK_TYPE', 'CODE')
        ordering = ['LOOK_TYPE', 'CODE']



class Item(models.Model):
    ITEM_ID = models.AutoField(primary_key=True)
    MFG = models.CharField(max_length=100, null=True, blank=True)
    
 
    OH_QUANTITY = models.CharField(max_length=100, null=True, blank=True)
    
    SELLING_PRICE = models.CharField(max_length=100, null=True, blank=True)
    ITEM_CODE = models.CharField(max_length=100, null=True, blank=True)
    DESCRIPTION = models.CharField(max_length=255, null=True, blank=True)
    CREATED_BY = models.CharField(max_length=100, default='ADMIN')
    LAST_UPDATED_BY = models.CharField(max_length=100, default='ADMIN')
    CREATION_DATE = models.DateField(auto_now_add=True)
    LAST_UPDATE_DATE = models.DateField(auto_now=True)

    IMAGE_URL = models.URLField(max_length=1000, null=True, blank=True)

    class Meta:
        db_table = 'Item'

    def __str__(self):
        return f"{self.ITEM_ID} - {self.MFG}"

class ItemSerial(models.Model):
    VIN = models.CharField(max_length=50, primary_key=True)
    ITEM_ID = models.ForeignKey(
        Item, 
        to_field='ITEM_ID',
        on_delete=models.CASCADE, 
        related_name='serials',
        db_constraint=False,
        db_column='ITEM_ID' 
    )
    COLOR = models.CharField(max_length=50, null=True, blank=True)
    MODEL_YEAR = models.CharField(max_length=4, null=True, blank=True)
    ENGINE_NO = models.CharField(max_length=50, null=True, blank=True)
    CREATED_BY = models.CharField(max_length=100, default='ADMIN')
    LAST_UPDATED_BY = models.CharField(max_length=100, default='ADMIN')
    CREATION_DATE = models.DateField(auto_now_add=True)
    LAST_UPDATE_DATE = models.DateField(auto_now=True)

    class Meta:
        db_table = 'ItemSerial'


SERVICE_STATUS_CHOICES = [
    ('BOOKED', 'Service Booked'),
    ('VEHICLE_RECEIVED', 'Vehicle Received'),
    ('WORK_IN_PROGRESS', 'Work In Progress'),
    ('COMPLETED', 'Completed')
]

class ServiceBooking(AuditBaseModel):
    request_id = models.CharField(max_length=1000,null=True, blank=True)
    vehicle = models.ForeignKey(ItemSerial, on_delete=models.CASCADE, related_name="service_bookings")
    workshop_location = models.CharField(max_length=100, null=True, blank=True)
    timing_slot = models.ForeignKey(Lookup, on_delete=models.SET_NULL, null=True, blank=True,
                                  limit_choices_to={'lookup_type': 'Timing Slot'})
    timing_slot_value = models.CharField(max_length=100, null=True, blank=True)
   
    additional_info = models.TextField(blank=True, null=True)
    customer_name = models.CharField(max_length=255, null=True, blank=True)
    service_date = models.DateField(null=True, blank=True)
    current_status = models.CharField(
        max_length=20,
        choices=SERVICE_STATUS_CHOICES,
        default='BOOKED'
    )

    def split_timing_slot(self):
        if self.timing_slot_value:
            try:
                # Split the timing slot value
                time_parts = self.timing_slot_value.split('-')
                start_time_str = time_parts[0].strip()
                end_time_str = time_parts[1].strip()

                # Convert to datetime objects
                start_time = datetime.strptime(start_time_str, '%I:%M %p')
                end_time = datetime.strptime(end_time_str, '%I:%M %p')

                # Set the time fields
                self.assign_start = start_time.time()
                self.assign_end = end_time.time()
            except Exception as e:
                print(f"Error splitting timing slot: {e}")
                self.assign_start = None
                self.assign_end = None

    def save(self, *args, **kwargs):
        # Call split_timing_slot before saving
        self.split_timing_slot()
        super().save(*args, **kwargs)


class ServiceStatusHistory(AuditBaseModel):
    service_booking = models.ForeignKey(ServiceBooking, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=SERVICE_STATUS_CHOICES)
    notes = models.TextField(null=True, blank=True)
    status_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Status {self.status} for {self.service_booking}"



class ServiceHistory(models.Model):
    SERVICE_NUMBER = models.BigAutoField(primary_key=True, default=1000)
    SERVICE_DATE = models.DateTimeField(auto_now=True, null=True, blank=True)
    AMOUNT = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    INCIDENT_TYPE = models.CharField(max_length=100, null=True, blank=True, default='')
    INCIDENT_TYPE_ID = models.CharField(max_length=50, null=True, blank=True, default='')
    STATUS = models.CharField(max_length=50, null=True, blank=True, default='')
    SUMMARY = models.TextField(max_length=1000, null=True, blank=True, default='')
    REGISTRATION = models.CharField(max_length=50, null=True, blank=True, default='')
    BRANCH = models.CharField(max_length=100, null=True, blank=True, default='')
    CUSTOMER_NAME = models.CharField(max_length=255, null=True, blank=True, default='')
    VIN = models.CharField(max_length=150, null=True, blank=True, default='')
    CUSTOMER_NUMBER = models.CharField(max_length=150, null=True, blank=True, default='')
    CREATED_BY = models.CharField(max_length=100, null=True, blank=True, default='')
    LAST_UPDATED_BY = models.CharField(max_length=100, null=True, blank=True, default='')
    CREATION_DATE = models.DateTimeField(auto_now=True, null=True, blank=True)
    LAST_UPDATE_DATE = models.DateTimeField(auto_now=True, null=True, blank=True)

    def _str_(self):
        return f"Service on {self.SERVICE_DATE} for {self.CUSTOMER_NUMBER}"

