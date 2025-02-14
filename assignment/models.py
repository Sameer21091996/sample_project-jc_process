from datetime import datetime
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

class AssignmentFollowUp(models.Model):
    req_date = models.DateField(verbose_name="Request Date")
    client_information = models.TextField(verbose_name="Client Information")
    date = models.DateField(verbose_name="Date", null=True, blank=True)
    time = models.TimeField(verbose_name="Time", null=True, blank=True)
    tech_team = models.CharField(max_length=100, verbose_name="Tech Team", null=True, blank=True)
    assign_start =  models.TimeField(verbose_name="End Time", null=True, blank=True)
    assign_end = models.TimeField(verbose_name="End Time", null=True, blank=True)
    start_time = models.TimeField(verbose_name="Start Time", null=True, blank=True)
    end_time = models.TimeField(verbose_name="End Time", null=True, blank=True)
    CREATED_BY = models.CharField(max_length=100, default='ADMIN', null=True, blank=True)
    LAST_UPDATED_BY = models.CharField(max_length=100, default='ADMIN', null=True, blank=True)
    CREATION_DATE = models.DateField(auto_now_add=True, null=True, blank=True)
    LAST_UPDATE_DATE = models.DateField(auto_now=True, null=True, blank=True)
    status = models.CharField(
        max_length=50, 
        choices=[
            ('Draft', 'Draft'),
            ('Scheduled', 'Scheduled'),
            ('Completed', 'Completed'),
            ('Ongoing', 'Ongoing'),
            ('Pending', 'Pending')
        ],
        default='Draft',
        verbose_name="Status"
    )
    payment = models.CharField(max_length=50, null=True, blank=True, verbose_name="Payment")
    jc_number = models.CharField(max_length=50, null=True, blank=True, verbose_name="JC#")
    remarks = models.TextField(null=True, blank=True, verbose_name="Remarks")
    customer_no = models.CharField(max_length=200, null=True, blank=True, verbose_name="Customer Number")
    vin_number = models.CharField(max_length=50, null=True, blank=True, verbose_name="VIN Number")


    def clean(self):
        if self.tech_team and self.date and self.assign_start:
            # Check for existing assignments for same tech team and date
            overlapping = AssignmentFollowUp.objects.filter(
                tech_team=self.tech_team,
                date=self.date,
                assign_start=self.assign_start
            ).exclude(id=self.id)
            
            if overlapping.exists():
                raise ValidationError(
                    f"Tech team '{self.tech_team}' already has an assignment starting at "
                    f"{self.assign_start.strftime('%H:%M')} on this date. "
                    f"Please select a different time slot."
                )

            # Check for time slot overlaps
            existing_assignments = AssignmentFollowUp.objects.filter(
                tech_team=self.tech_team,
                date=self.date
            ).exclude(id=self.id)
            
            for assignment in existing_assignments:
                if assignment.assign_start:
                    if self.assign_start == assignment.assign_start:
                        raise ValidationError(
                            f"Tech team '{self.tech_team}' is already scheduled at "
                            f"{self.assign_start.strftime('%H:%M')} on this date."
                        )

            # Only validate assign_end if it's provided
            if self.assign_end:
                # Convert both times to datetime.time objects for comparison
                if isinstance(self.assign_end, str):
                    assign_end_time = datetime.strptime(self.assign_end, '%H:%M').time()
                else:
                    assign_end_time = self.assign_end

                if isinstance(self.assign_start, str):
                    assign_start_time = datetime.strptime(self.assign_start, '%H:%M').time()
                else:
                    assign_start_time = self.assign_start

                if assign_end_time <= assign_start_time:
                    raise ValidationError("Assignment end time must be later than start time")



    def __str__(self):
        return f"{self.client_information} - {self.date} - {self.status}"
    



class LOOKUP_MASTER(models.Model):
    MEANING = models.CharField(max_length=200,null=True, blank=True)
    LOOKUP_NAME = models.CharField(max_length=200,null=True, blank=True)
    ACTIVE=models.CharField(max_length=200,null=True, blank=True)
    START_DATE=models.DateField(null=True, blank=True)
    END_DATE=models.DateField(null=True, blank=True)
    CREATION_DATE=models.DateField(null=True, blank=True)
    CREATED_BY=models.CharField(max_length=200,null=True, blank=True)
    LAST_UPDATE_DATE = models.DateField(null=True, blank=True)
    LAST_UPDATED_BY = models.CharField(max_length=200,null=True, blank=True)
    DISPLAY_TO_ADMIN=models.CharField(max_length=200,null=True, blank=True)
    DISPLAY_TO_USER=models.CharField(max_length=200,null=True, blank=True)
    class Meta:
        db_table = 'LOOKUP_MASTER'

class LOOKUP_DETAILS(models.Model):
    LOOKUP_CODE = models.CharField(max_length=200,null=True, blank=True)
    LOOKUP_VALUE = models.CharField(max_length=200,null=True, blank=True)
    ACTIVE = models.CharField(max_length=200,null=True, blank=True)      
    START_DATE =  models.DateField(null=True, blank=True)
    END_DATE  =   models.DateField(null=True, blank=True)
    CREATION_DATE  = models.DateField(null=True, blank=True)
    CREATED_BY       = models.CharField(max_length=200,null=True, blank=True)
    LAST_UPDATE_DATE  = models.DateField(null=True, blank=True)
    LAST_UPDATED_BY    = models.CharField(max_length=200,null=True, blank=True)
    LOOKUP_SHORT_CODE  = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE_CATEGORY  = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE1          = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE2         = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE3         = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE4          = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE5          = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE6          = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE7          = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE8          = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE9          = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE10         = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE11        = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE12         = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE13        = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE14         = models.CharField(max_length=200,null=True, blank=True)
    ATTRIBUTE15         = models.CharField(max_length=200,null=True, blank=True)
    MEANING             = models.CharField(max_length=200,null=True, blank=True)
    LOOKUP_NAME       = models.CharField(max_length=200,null=True, blank=True)

    class Meta:
        db_table = 'LOOKUP_DETAILS'

