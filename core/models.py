import datetime
from copy import deepcopy
from datetime import timedelta
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
import pandas as pd
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone
from simple_history.models import HistoricalRecords
from django.contrib.auth.models import User
from crequest.middleware import CrequestMiddleware

class ActiveObjectManager(models.Manager):
    def get_queryset(self):
        now = timezone.now()
        queryset = super(ActiveObjectManager, self).get_queryset()
        return queryset.filter(active=True, start_date__lte=now).filter(
            Q(end_date__gt=now) | Q(end_date__isnull=True))

    def accessible(self, user):
        queryset = self.get_queryset()
        orgs = list(
            UserOrganisationInventory.active_objects.filter(user__user_name=user).values_list('tenant_id', flat=True))
        return queryset.filter(tenant_id__in=orgs)

class ActiveRecordsManager(models.Manager):
    def get_queryset(self):
        now = timezone.now()
        queryset = super(ActiveRecordsManager, self).get_queryset()
        return queryset.filter(enabled_flag='Y', start_date_active__date__lte=now).filter(
      Q(end_date_active__date__gt=now) | Q(end_date_active__isnull=True))
    
class ObjectsManager(models.Manager):
    def accessible(self, user):
        queryset = super(ObjectsManager, self).get_queryset()
        orgs = list(
            UserOrganisationInventory.active_objects.filter(user__user_name=user).values_list('tenant_id', flat=True))
        return queryset.filter(tenant_id__in=orgs)


class TenantManager(models.Manager):
    def accessible(self, user):
        queryset = super(TenantManager, self).get_queryset()
        orgs = list(
            UserOrganisationInventory.active_objects.filter(user__user_name=user).values_list('tenant_id', flat=True))
        return queryset.filter(id__in=orgs)
    

class TopLayerBaseModel(models.Model):
    active = models.BooleanField(default=True)
    start_date = models.DateTimeField(null=True)
    end_date = models.DateTimeField(null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    created_by = models.CharField(max_length=240, blank=True, null=True)
    last_update_date = models.DateTimeField(auto_now=True, blank=True, null=True)
    last_updated_by = models.CharField(max_length=240, blank=True, null=True)

    active_objects = ActiveObjectManager()
    objects = ObjectsManager()

    class Meta:
        abstract = True

    @property
    def created_by_name(self):
        return UserProfile.objects.filter(user_name=self.created_by).last().employee_name if self.created_by else ''

    @property
    def last_updated_by_name(self):
        return UserProfile.objects.filter(
            user_name=self.last_updated_by).last().employee_name if self.last_updated_by else ''

    @property
    def is_active(self):
        now = timezone.now()
        return self.active and self.start_date <= now < (self.end_date or now + timedelta(days=1))

    def save(self, *args, **kwargs):
        
        if not self.start_date:
            self.start_date = timezone.now()
        if self.end_date and self.end_date <= self.start_date:
            raise ValidationError("End date cannot be before start date.")
        if not self.created_by:
            crequest = CrequestMiddleware.get_request() 
            self.created_by = crequest.session['username']
            print('self.created_by----->',crequest.session['username'])

        if self._meta.object_name not in ['Device', 'RequestFormResponse', 'RequestFormData', 'Estimation',
                                          'GenericAttachment', 'RequestStatusHistory', 'FollowUp',
                                          'EstimationFollowUp', 'LineResponse', 'RequestedDownload']:
            model_fields = [field.name for field in self._meta.get_fields() if
                            not field.one_to_many and not field.many_to_many and not field.one_to_one]
            fields_to_pop = ['active', 'start_date', 'end_date', 'creation_date', 'created_by',
                             'last_update_date', 'last_updated_by']
            for field in fields_to_pop:
                model_fields.pop(model_fields.index(field))

            search_fields = {'active': True}
            for field in model_fields:
                search_fields[field] = getattr(self, field)

            existing_obj = self.__class__.objects.filter(**search_fields)
            primary_key = self.pk

            if self.pk:
                existing_obj = existing_obj.exclude(pk=self.pk)
            if existing_obj.exists() and self.start_date:
                existing_obj = existing_obj.filter(start_date__lte=self.start_date).filter(
                    Q(end_date__gt=self.start_date) | Q(end_date__isnull=True))
                if existing_obj.exists():
                    raise ValidationError(
                        "Cannot create a duplicate record. To overwrite an existing record, please inactivate the existing one.")
        super(TopLayerBaseModel, self).save(*args, **kwargs)        

class UserProfile(TopLayerBaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile', primary_key=True,db_constraint=False)
    user_name = models.CharField(max_length=240, default='')
    employee_id = models.IntegerField(null=True, blank=True,unique=True)
    company = models.CharField(max_length=240, blank=True, null=True)
    department = models.CharField(max_length=240, blank=True, null=True)
    description = models.CharField(max_length=240, blank=True, null=True)
    title = models.CharField(max_length=240, blank=True, null=True)
    telephoneNumber = models.CharField(max_length=240, blank=True, null=True)
    homePhone = models.CharField(max_length=240, blank=True, null=True)
    photo_main = models.ImageField(upload_to='user', blank=True, null=True)

    @property
    def option_label(self):
        return "{}".format(self.user_name)
    
    def option_label_field():
        return 'user_name' 
class GlLedger(TopLayerBaseModel):
    ledger_id = models.BigIntegerField(primary_key=True)
    business_group_id = models.IntegerField()
    name = models.CharField(max_length=50)
    short_name = models.CharField(max_length=50)
    description = models.CharField(max_length=255, null=True, blank=True)
    chart_of_accounts_id = models.IntegerField()
    period_set_name = models.CharField(max_length=30)

    def __str__(self) -> str:
        return self.name
    
class OperatingUnit(TopLayerBaseModel):
    operating_unit_id = models.BigAutoField(primary_key=True)
    business_group_id = models.IntegerField()
    name = models.CharField(max_length=255)
    date_from = models.DateField()
    date_to = models.DateField(blank=True, null=True)
    short_code = models.CharField(max_length=200)
    name = models.CharField(max_length=255)
    ledger_id = models.ForeignKey(GlLedger, on_delete=models.CASCADE, blank=True, null=True,db_constraint=False)
    default_legal_context_id = models.CharField(max_length=225)
    usable_flag = models.CharField(max_length=225)

    def __str__(self) -> str:
        return self.name

    @property
    def option_label(self):
        return "{}".format(self.name)
    
    def option_label_field():
        return 'name'   
class Inventory(TopLayerBaseModel):
    organization_id = models.BigAutoField(primary_key=True)
    business_group_id = models.IntegerField(blank=True, null=True, default=0)
    enable_date = models.DateField(blank=True, null=True)
    disable_date = models.DateField(blank=True, null=True)
    organization_code = models.CharField(max_length=5, blank=True, null=True)
    organization_name = models.CharField(max_length=255, blank=True, null=True)
    inv_location = models.CharField(max_length=255, blank=True, null=True)
    set_of_books_id = models.ForeignKey(GlLedger, on_delete=models.CASCADE, blank=True, null=True,db_constraint=False)
    inventory_enabled_flag = models.CharField(max_length=225, blank=True, null=True)
    operating_unit_id = models.ForeignKey(OperatingUnit, on_delete=models.CASCADE, blank=True, null=True,db_constraint=False)
    recv_location = models.CharField(max_length=500, blank=True, null=True)
    inv_org_address = models.CharField(max_length=2000, blank=True, null=True)
    inv_location = models.CharField(max_length=255, blank=True, null=True)
    org_type = models.CharField(max_length=240, blank=True, null=True)
    location_id = models.IntegerField(blank=True, null=True)

    @property
    def option_label(self):
        return "{}".format(self.organization_name)
    
    def option_label_field():
        return 'organization_name'

class CoreInventoryStg(TopLayerBaseModel):
    active = models.BooleanField()
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    creation_date = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=240, blank=True, null=True)
    last_update_date = models.DateTimeField(blank=True, null=True)
    last_updated_by = models.CharField(max_length=240, blank=True, null=True)
    organization_id = models.BigIntegerField()
    business_group_id = models.IntegerField(blank=True, null=True)
    enable_date = models.DateField(blank=True, null=True)
    disable_date = models.DateField(blank=True, null=True)
    organization_code = models.CharField(max_length=5, blank=True, null=True)
    organization_name = models.CharField(max_length=255, blank=True, null=True)
    inventory_enabled_flag = models.CharField(max_length=225, blank=True, null=True)
    operating_unit_id_id = models.IntegerField(blank=True, null=True)
    org_type = models.CharField(max_length=240, blank=True, null=True)
    operating_unit_name = models.CharField(max_length=240, blank=True, null=True)
    location_id = models.IntegerField(blank=True, null=True)
    ledger_name = models.CharField(max_length=240, blank=True, null=True)
    ledger_id = models.IntegerField(blank=True, null=True)
    inv_org_address = models.CharField(max_length=2000, blank=True, null=True)
    recv_location = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'core_inventory_stg'


        
class BaseMasterModel(models.Model):
    active = models.BooleanField(default=True)
    start_date = models.DateTimeField(null=True)
    end_date = models.DateTimeField(null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    created_by = models.CharField(max_length=240, blank=True, null=True)
    last_update_date = models.DateTimeField(auto_now=True, blank=True, null=True)
    last_updated_by = models.CharField(max_length=240, blank=True, null=True)
    tenant = models.ForeignKey(Inventory, on_delete=models.SET_NULL, null=True, blank=True,db_constraint=False)
    # interface_flag = models.CharField(max_length=1,blank=True,null=True)

    active_objects = ActiveObjectManager()
    objects = ObjectsManager()

    class Meta:
        abstract = True

    @property
    def created_by_name(self):
        return UserProfile.objects.filter(user_name=self.created_by).last().employee_name if self.created_by else ''

    @property
    def last_updated_by_name(self):
        return UserProfile.objects.filter(
            user_name=self.last_updated_by).last().employee_name if self.last_updated_by else ''

    @property
    def is_active(self):
        now = timezone.now()
        return self.active and self.start_date <= now < (self.end_date or now + timedelta(days=1))

    def save(self, *args, **kwargs):
        if not self.tenant:
            crequest = CrequestMiddleware.get_request() #its the current request
            try:
                self.tenant = Inventory.objects.get(pk=crequest.session['tenant']) if crequest.session['tenant']!=None else None
            except Exception as e:
                self.tenant = None
        if not self.start_date:
            self.start_date = timezone.now()
        if not self.created_by:
            crequest = CrequestMiddleware.get_request() 
            try:
                self.created_by = crequest.session['username'] 
            except Exception as e:
                self.created_by = None
            
        if self.end_date and self.end_date <= self.start_date:
            raise ValidationError("End date cannot be before start date.")

        if self._meta.object_name not in ['Device', 'RequestFormResponse', 'RequestFormData', 'Estimation',
                                          'GenericAttachment', 'RequestStatusHistory', 'FollowUp',
                                          'EstimationFollowUp', 'LineResponse', 'RequestedDownload']:
            model_fields = [field.name for field in self._meta.get_fields() if
                            not field.one_to_many and not field.many_to_many and not field.one_to_one]
            fields_to_pop = ['active', 'start_date', 'end_date', 'creation_date', 'created_by',
                             'last_update_date', 'last_updated_by']
            for field in fields_to_pop:
                model_fields.pop(model_fields.index(field))

            search_fields = {'active': True}
            for field in model_fields:
                search_fields[field] = getattr(self, field)

            existing_obj = self.__class__.objects.filter(**search_fields)
            primary_key = self.pk

            if self.pk:
                existing_obj = existing_obj.exclude(pk=self.pk)
            if existing_obj.exists() and self.start_date:
                existing_obj = existing_obj.filter(start_date__lte=self.start_date).filter(
                    Q(end_date__gt=self.start_date) | Q(end_date__isnull=True))
                if existing_obj.exists():
                    raise ValidationError(
                        "Cannot create a duplicate record. To overwrite an existing record, please inactivate the existing one.")
        super(BaseMasterModel, self).save(*args, **kwargs)



class EmployeeRole(BaseMasterModel):
    name = models.CharField(max_length=50)
    identifier = models.CharField(max_length=240, unique=True, blank=True, null=True)
    
    description = models.CharField(max_length=100, null=True, blank=True)
    attribute1 = models.CharField(max_length=240, null=True, blank=True)
    attribute2 = models.CharField(max_length=240, null=True, blank=True)
    attribute3 = models.CharField(max_length=240, null=True, blank=True)
    attribute4 = models.CharField(max_length=240, null=True, blank=True)
    attribute5 = models.CharField(max_length=240, null=True, blank=True)

    def __str__(self):
        return self.name
    
    @property
    def option_label(self):
        return self.name
    
    def option_label_field():
        return 'name'
    
class UserOrganisationInventory(TopLayerBaseModel):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, verbose_name='User name' ,db_constraint=False)
    operating_unit = models.ForeignKey(OperatingUnit, on_delete=models.CASCADE, verbose_name='Company',db_constraint=False,null=True, blank=True)
    inventory = models.ForeignKey(Inventory, on_delete=models.SET_NULL, verbose_name='Organization', null=True, blank=True,db_constraint=False)
    role = models.ForeignKey(EmployeeRole, on_delete=models.CASCADE, null=True ,db_constraint=False)
    history = HistoricalRecords()

class LookupName(BaseMasterModel):
    lookup_id         = models.BigAutoField(primary_key=True)
    lookup_field_name = models.CharField(max_length=100)
    lookup_name       = models.CharField(max_length=100)
    description       = models.CharField(max_length=240, null=True)
    fk_app_id         = models.IntegerField()

    def __str__(self) -> str:
        return self.lookup_field_name


class LookupNameValue(BaseMasterModel):
    lookup_value_id = models.BigAutoField(primary_key=True)
    code            = models.CharField(max_length=30)
    lookup_type            = models.CharField(max_length=30)
    meaning         = models.CharField(max_length=240)
    description     = models.CharField(max_length=240, null=True)
    tag             = models.CharField(max_length=100, null=True)
    lookup_type     = models.CharField(max_length=100, null=True) 
    order           = models.IntegerField(null=True)
    fk_lookup_id    = models.ForeignKey(LookupName, on_delete=models.CASCADE,db_column='fk_lookup_id',db_constraint=False)

    attribute1 = models.CharField(max_length=150, blank=True, null=True)
    attribute2 = models.CharField(max_length=150, blank=True, null=True)
    attribute3 = models.CharField(max_length=150, blank=True, null=True)
    attribute4 = models.CharField(max_length=150, blank=True, null=True)
    attribute5 = models.CharField(max_length=150, blank=True, null=True)
    attribute6 = models.CharField(max_length=150, blank=True, null=True)
    attribute7 = models.CharField(max_length=150, blank=True, null=True)
    attribute8 = models.CharField(max_length=150, blank=True, null=True)
    attribute9 = models.CharField(max_length=150, blank=True, null=True)
    attribute10 = models.CharField(max_length=150, blank=True, null=True)
    attribute11 = models.CharField(max_length=150, blank=True, null=True)
    attribute12 = models.CharField(max_length=150, blank=True, null=True)
    attribute13 = models.CharField(max_length=150, blank=True, null=True)
    attribute14 = models.CharField(max_length=150, blank=True, null=True)
    attribute15 = models.CharField(max_length=150, blank=True, null=True)

    def __unicode__(self):
        return self.lookup_value_id

    @property
    def option_label(self):
        return self.meaning
    
    def option_label_field():
        return 'meaning'


class LookupValues(models.Model):
    lookup_type = models.CharField(max_length=50, blank=True, null=True)
    lookup_code = models.CharField(max_length=50, blank=True, null=True)
    meaning = models.CharField(max_length=80, blank=True, null=True)
    description = models.CharField(max_length=240, blank=True, null=True)
    enabled_flag = models.CharField(max_length=1, blank=True, null=True)
    start_date_active = models.DateTimeField(blank=True, null=True)
    end_date_active = models.DateTimeField(blank=True, null=True)

    active_records = ActiveRecordsManager()
    class Meta:
        db_table = 'core_lookupvalues'



class FlexValueSets(models.Model):
    flex_value_set_id = models.IntegerField()
    flex_value_set_name = models.CharField(max_length=60)
    last_update_date = models.DateField()
    last_updated_by = models.BigIntegerField()
    creation_date = models.DateField()
    created_by = models.BigIntegerField()
    last_update_login = models.BigIntegerField()
    validation_type = models.CharField(max_length=1)
    protected_flag = models.CharField(max_length=1)
    security_enabled_flag = models.CharField(max_length=1)
    longlist_flag = models.CharField(max_length=1)
    format_type = models.CharField(max_length=1)
    maximum_size = models.IntegerField()
    alphanumeric_allowed_flag = models.CharField(max_length=1)
    uppercase_only_flag = models.CharField(max_length=1)
    numeric_mode_enabled_flag = models.CharField(max_length=1)
    description = models.CharField(max_length=240, blank=True, null=True)
    dependant_default_value = models.CharField(max_length=60, blank=True, null=True)
    dependant_default_meaning = models.CharField(max_length=240, blank=True, null=True)
    parent_flex_value_set_id = models.IntegerField(blank=True, null=True)
    minimum_value = models.CharField(max_length=150, blank=True, null=True)
    maximum_value = models.CharField(max_length=150, blank=True, null=True)
    number_precision = models.IntegerField(blank=True, null=True)
    zd_edition_name = models.CharField(max_length=30)
    zd_sync = models.CharField(max_length=30)

class FlexValues(models.Model):
    row_id = models.TextField(blank=True, null=True)  # This field type is a guess.
    flex_value_set_id = models.IntegerField()
    flex_value_id = models.BigIntegerField()
    flex_value = models.CharField(max_length=150)
    last_update_date = models.DateField()
    last_updated_by = models.BigIntegerField()
    creation_date = models.DateField()
    created_by = models.BigIntegerField()
    last_update_login = models.BigIntegerField(blank=True, null=True)
    enabled_flag = models.CharField(max_length=1)
    summary_flag = models.CharField(max_length=1)
    start_date_active = models.DateField(blank=True, null=True)
    end_date_active = models.DateField(blank=True, null=True)
    parent_flex_value_low = models.CharField(max_length=60, blank=True, null=True)
    parent_flex_value_high = models.CharField(max_length=60, blank=True, null=True)
    structured_hierarchy_level = models.BigIntegerField(blank=True, null=True)
    hierarchy_level = models.CharField(max_length=30, blank=True, null=True)
    compiled_value_attributes = models.CharField(max_length=2000, blank=True, null=True)
    value_category = models.CharField(max_length=30, blank=True, null=True)
    attribute1 = models.CharField(max_length=240, blank=True, null=True)
    attribute2 = models.CharField(max_length=240, blank=True, null=True)
    attribute3 = models.CharField(max_length=240, blank=True, null=True)
    attribute4 = models.CharField(max_length=240, blank=True, null=True)
    attribute5 = models.CharField(max_length=240, blank=True, null=True)
    attribute6 = models.CharField(max_length=240, blank=True, null=True)
    attribute7 = models.CharField(max_length=240, blank=True, null=True)
    attribute8 = models.CharField(max_length=240, blank=True, null=True)
    attribute9 = models.CharField(max_length=240, blank=True, null=True)
    attribute10 = models.CharField(max_length=240, blank=True, null=True)
    attribute11 = models.CharField(max_length=240, blank=True, null=True)
    attribute12 = models.CharField(max_length=240, blank=True, null=True)
    attribute13 = models.CharField(max_length=240, blank=True, null=True)
    attribute14 = models.CharField(max_length=240, blank=True, null=True)
    attribute15 = models.CharField(max_length=240, blank=True, null=True)
    attribute16 = models.CharField(max_length=240, blank=True, null=True)
    attribute17 = models.CharField(max_length=240, blank=True, null=True)
    attribute18 = models.CharField(max_length=240, blank=True, null=True)
    attribute19 = models.CharField(max_length=240, blank=True, null=True)
    attribute20 = models.CharField(max_length=240, blank=True, null=True)
    attribute21 = models.CharField(max_length=240, blank=True, null=True)
    attribute22 = models.CharField(max_length=240, blank=True, null=True)
    attribute23 = models.CharField(max_length=240, blank=True, null=True)
    attribute24 = models.CharField(max_length=240, blank=True, null=True)
    attribute25 = models.CharField(max_length=240, blank=True, null=True)
    attribute26 = models.CharField(max_length=240, blank=True, null=True)
    attribute27 = models.CharField(max_length=240, blank=True, null=True)
    attribute28 = models.CharField(max_length=240, blank=True, null=True)
    attribute29 = models.CharField(max_length=240, blank=True, null=True)
    attribute30 = models.CharField(max_length=240, blank=True, null=True)
    attribute31 = models.CharField(max_length=240, blank=True, null=True)
    attribute32 = models.CharField(max_length=240, blank=True, null=True)
    attribute33 = models.CharField(max_length=240, blank=True, null=True)
    attribute34 = models.CharField(max_length=240, blank=True, null=True)
    attribute35 = models.CharField(max_length=240, blank=True, null=True)
    attribute36 = models.CharField(max_length=240, blank=True, null=True)
    attribute37 = models.CharField(max_length=240, blank=True, null=True)
    attribute38 = models.CharField(max_length=240, blank=True, null=True)
    attribute39 = models.CharField(max_length=240, blank=True, null=True)
    attribute40 = models.CharField(max_length=240, blank=True, null=True)
    attribute41 = models.CharField(max_length=240, blank=True, null=True)
    attribute42 = models.CharField(max_length=240, blank=True, null=True)
    attribute43 = models.CharField(max_length=240, blank=True, null=True)
    attribute44 = models.CharField(max_length=240, blank=True, null=True)
    attribute45 = models.CharField(max_length=240, blank=True, null=True)
    attribute46 = models.CharField(max_length=240, blank=True, null=True)
    attribute47 = models.CharField(max_length=240, blank=True, null=True)
    attribute48 = models.CharField(max_length=240, blank=True, null=True)
    attribute49 = models.CharField(max_length=240, blank=True, null=True)
    attribute50 = models.CharField(max_length=240, blank=True, null=True)
    flex_value_meaning = models.CharField(max_length=150)
    description = models.CharField(max_length=240, blank=True, null=True)
    attribute_sort_order = models.BigIntegerField(blank=True, null=True)

    # class Meta:
    #     managed = False
    #     db_table = 'XXERP_FND_FLEX_VALUES_VL'





class Party(BaseMasterModel):
    party_id                = models.BigAutoField(primary_key=True)
    party_name              = models.TextField(null=True, verbose_name="Contact Name")
    party_number            = models.CharField(max_length=50, blank=True, null=True, verbose_name="Contact Number")
    person_title            = models.CharField(max_length=50, blank=True, null=True, verbose_name="Title") 
    person_first_name       = models.CharField(max_length=150, blank=True, null=True, verbose_name="First Name")  
    person_last_name        = models.CharField(max_length=150, blank=True, null=True, verbose_name="Last Name") 
    mobile_number           = models.CharField(max_length=150, blank=True, null=True, verbose_name="Mobile Number")  
    tel_no                  = models.CharField(max_length=150, blank=True, null=True, verbose_name="Telephone Number")  
    email_address           = models.CharField(max_length=150, blank=True, null=True, verbose_name="Email Address")  

    def __str__(self) -> str:
        return str(self.party_id)
    
    @property
    def option_label(self):
        return "{}".format(self.party_name)
    
    def option_label_field():
        return 'party_name'

class Department(BaseMasterModel):
    department_id = models.BigAutoField(primary_key=True)
    title         = models.CharField(max_length=100)

class Employee(BaseMasterModel):
    full_name      = models.CharField(max_length=240)
    employee_number = models.CharField(max_length=100,null=True,blank=True)
    person_id      = models.BigIntegerField(null=True,blank=True)
    user_name      = models.CharField(max_length=100,null=True)

class ColumnSetting(BaseMasterModel):
    model = models.CharField(max_length=150)
    display_indexes = models.CharField(max_length=255)
    fk_user_id = models.BigIntegerField()
    


# class EmployeeDepartment(BaseMasterModel):
#     employee = models.ForeignKey(UserProfile, db_column='employee_id', on_delete=models.CASCADE,
#                                  related_name='employee', null=True)
#     department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
#     employee_department_role = models.ForeignKey(EmployeeRole, null=True, blank=True,
#                                                  on_delete=models.SET_NULL)
#     supervisor = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True,
#                                    related_name="team_members")
#     history = HistoricalRecords()

#     def __str__(self):
#         return "{} ({})".format(self.employee.employee_name, self.employee.employee_id)

#     def get_team(self):
#         return EmployeeDepartment.active_objects.filter(supervisor=self)

    
class NavigationItem(BaseMasterModel): 
    name = models.CharField(max_length=50)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True,db_constraint=False)
    url = models.TextField(null=True, blank=True)
    sort_by = models.SmallIntegerField(null=True, blank=True)
    is_menu_item = models.BooleanField(default=True)
    icon_class = models.CharField(max_length=240,null=True, blank=True)
    color_class = models.CharField(max_length=240,null=True, blank=True)
    filter_type = models.CharField(max_length=240,null=True, blank=True)
    username_required = models.BooleanField(default=False)
    additional_query = models.CharField(max_length=512, blank=True, null=True)
    href = models.TextField(null=True, blank=True)
    org_id_required = models.BooleanField(default=False)
    base_org = models.PositiveSmallIntegerField(blank=True, null=True)
    
    def __str__(self):
        return self.name

    # @property
    def get_menu_href(self):
        href = self.url
        if self.username_required:
            if "?" in href:
                href += "&u={{request.user.username|upper}}"
            else:
                href += "?u={{request.user.username|upper}}"
        if self.org_id_required:
            if "?" in href:
                href += f"""&oid={self.base_org}"""
            else:
                href += f"""&oid={self.base_org}"""
        if self.additional_query:
            if "?" in href:
                href += f"""&{self.additional_query}"""
            else:
                href += f"""?{self.additional_query}"""
        return href

    def set_menu_href(self):
        self.href = self.get_menu_href()
        self.save()

    @property
    def option_label(self):
        return self.name
     
    def option_label_field():
        return 'name'
    
    @property
    def has_children(self):
        return self.navigationitem_set.exists()

    def has_accessible_children(self, username):
        children = self.get_children(username)
        children_exist = children.exists()
        grandchildren_exist = False
        for child in children: 
            if child.get_children(username).exists():
                grandchildren_exist = True
                break
        return children_exist and grandchildren_exist

    @property
    def has_grandchildren(self):
        return self.navigationitem_set.first().has_children if self.has_children else False

    def get_children(self, username):
        if self.has_grandchildren:
            to_return = self.navigationitem_set.filter(active=True, is_menu_item=True).order_by('sort_by')
        else:
            user_permissions = RolePermissions.objects.filter(employee_department__employee__user_name=username, active=True).filter(
                Q(full_access=True) | Q(read_access=True)).values_list('navigation_item_id')
            to_return = self.navigationitem_set.filter(active=True, id__in=user_permissions, is_menu_item=True).order_by(
                'sort_by')
            

class RolePermissions(BaseMasterModel):
    employee_role = models.ForeignKey(EmployeeRole, null=True, on_delete=models.CASCADE,db_constraint=False)
    navigation_item = models.ForeignKey(NavigationItem, null=True, blank=True, on_delete=models.SET_NULL,
                                        related_name='permissions',db_constraint=False)
    full_access = models.BooleanField(default=False)
    read_access = models.BooleanField(default=False)
    edit_access = models.BooleanField(default=False)
    create_access = models.BooleanField(default=False)
    delete_access = models.BooleanField(default=False)

class Document(BaseMasterModel):
    PENDING, PROCESSING, SUCCESSFUL, FAILED = range(1, 5)
    STATUS = (
        (PENDING, "Pending"),
        (PROCESSING, "Processing"),
        (SUCCESSFUL, "Successful"),
        (FAILED, "Failed"),
    )
    file = models.BinaryField(blank=True, null=True)
    name = models.CharField(max_length=200,blank=True, null=True)
    reference = models.CharField(max_length=100, null=True, blank=True)
    status = models.SmallIntegerField(choices=STATUS)
    period = models.DateField(null=True, blank=True)

    @property
    def option_label(self):
        return "{}".format(self.name)
    
    def option_label_field():
        return 'name'
    
    def created_by_name(self):
        return UserProfile.objects.filter(user_name=self.created_by).last().employee_name if self.created_by else ''
    
    @property
    def last_updated_by_name(self):
        return UserProfile.objects.filter(
            user_name=self.last_updated_by).last().employee_name if self.last_updated_by else ''

#     @property
#     def created_by_name(self):
#         return UserProfile.objects.filter(user_name=self.created_by).last().employee_name if self.created_by else ''
    
#     @property
#     def last_updated_by_name(self):
#         return UserProfile.objects.filter(
#             user_name=self.last_updated_by).last().employee_name if self.last_updated_by else ''

class DataDictionarySection(BaseMasterModel):
    model_name = models.CharField(max_length=200, verbose_name="Model name")
    section_name = models.CharField(max_length=200, )
    view_name = models.CharField(max_length=200,)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self) -> str:
        return self.model_name + self.section_name
    
class DataDictionary(BaseMasterModel):
    data_name = models.CharField(max_length=240, verbose_name="db column name")
    display_name = models.CharField(max_length=240, null=True, blank=True, verbose_name="Display name")
    is_required = models.BooleanField(default=False)
    is_disabled = models.BooleanField(default=False)
    remarks = models.CharField(max_length=500, null=True, blank=True)
    display_class = models.CharField(max_length=500, null=True, blank=True)
    display_order_by = models.IntegerField(null=True, blank=True)
    visible = models.BooleanField(default=True)
    field_type = models.CharField(
        max_length=100,  null=True, verbose_name="input field type")
    model_name = models.CharField(
        max_length=200,null=True, blank=True, verbose_name="Model name")
    navigation_item = models.ForeignKey(NavigationItem, on_delete=models.SET_NULL, null=True, blank=True,db_constraint=False)
    section = models.ForeignKey(DataDictionarySection, on_delete=models.SET_NULL, null=True, blank=True,db_constraint=False)


    def __str__(self):
        return self.model_name + self.data_name
    
    class Meta:
        ordering = ('display_order_by', )

class Emirates(BaseMasterModel):
    name  = models.CharField(max_length=50, null=True, blank=True, verbose_name="Emirates")


    def __str__(self) -> str:
        return self.name
    
    @property
    def option_label(self):
        return "{}".format(self.name)
    
    def option_label_field():
        return 'name'


class ARLocations(BaseMasterModel):
    loc_code = models.CharField(
        max_length=250)
    location_name = models.CharField(null=True, blank=True,
        max_length=250)
    org_id = models.IntegerField(null=True, blank=True)

class TableConfiguration(BaseMasterModel):
    table_identifier = models.CharField(max_length=256)
    table_description = models.TextField(null=True, blank=True)

    def __str__(self) -> str:
        return self.table_identifier 
    
class TableColumn(BaseMasterModel):
    table = models.ForeignKey(TableConfiguration, on_delete=models.CASCADE,db_constraint=False)
    column_header = models.CharField(max_length=256)
    column_data_field = models.CharField(max_length=256)
    column_description = models.TextField(null=True, blank=True)
    column_order = models.PositiveIntegerField(blank=True, null=True)

    def __str__(self):
        return self.table.table_identifier + ' | ' + self.column_header
    
class APILog(BaseMasterModel):
    url = models.CharField( max_length=250)
    method = models.CharField( max_length=50)
    request_body = models.TextField(null=True, blank=True)
    response_code = models.CharField( max_length=50,null=True, blank=True)
    response_body = models.TextField(null=True, blank=True)
    serverside_errors = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField( blank=True, null=True)
    finished_at = models.DateTimeField(null=True, blank=True)
class FlexValueSets(models.Model):
    flex_value_set_id = models.IntegerField()
    flex_value_set_name = models.CharField(max_length=60)
    last_update_date = models.DateField()
    last_updated_by = models.BigIntegerField()
    creation_date = models.DateField()
    created_by = models.BigIntegerField()
    last_update_login = models.BigIntegerField()
    validation_type = models.CharField(max_length=1)
    protected_flag = models.CharField(max_length=1)
    security_enabled_flag = models.CharField(max_length=1)
    longlist_flag = models.CharField(max_length=1)
    format_type = models.CharField(max_length=1)
    maximum_size = models.IntegerField()
    alphanumeric_allowed_flag = models.CharField(max_length=1)
    uppercase_only_flag = models.CharField(max_length=1)
    numeric_mode_enabled_flag = models.CharField(max_length=1)
    description = models.CharField(max_length=240, blank=True, null=True)
    dependant_default_value = models.CharField(max_length=60, blank=True, null=True)
    dependant_default_meaning = models.CharField(max_length=240, blank=True, null=True)
    parent_flex_value_set_id = models.IntegerField(blank=True, null=True)
    minimum_value = models.CharField(max_length=150, blank=True, null=True)
    maximum_value = models.CharField(max_length=150, blank=True, null=True)
    number_precision = models.IntegerField(blank=True, null=True)
    zd_edition_name = models.CharField(max_length=30)
    zd_sync = models.CharField(max_length=30)
    
    class Meta:
        db_table  = "flex_value_sets"

class FlexValues(models.Model):
    row_id = models.TextField(blank=True, null=True)  # This field type is a guess.
    flex_value_set_id = models.IntegerField()
    flex_value_id = models.BigIntegerField()
    flex_value = models.CharField(max_length=150)
    last_update_date = models.DateField()
    last_updated_by = models.BigIntegerField()
    creation_date = models.DateField()
    created_by = models.BigIntegerField()
    last_update_login = models.BigIntegerField(blank=True, null=True)
    enabled_flag = models.CharField(max_length=1)
    summary_flag = models.CharField(max_length=1)
    start_date_active = models.DateField(blank=True, null=True)
    end_date_active = models.DateField(blank=True, null=True)
    parent_flex_value_low = models.CharField(max_length=60, blank=True, null=True)
    parent_flex_value_high = models.CharField(max_length=60, blank=True, null=True)
    structured_hierarchy_level = models.BigIntegerField(blank=True, null=True)
    hierarchy_level = models.CharField(max_length=30, blank=True, null=True)
    compiled_value_attributes = models.CharField(max_length=2000, blank=True, null=True)
    value_category = models.CharField(max_length=30, blank=True, null=True)
    attribute1 = models.CharField(max_length=240, blank=True, null=True)
    attribute2 = models.CharField(max_length=240, blank=True, null=True)
    attribute3 = models.CharField(max_length=240, blank=True, null=True)
    attribute4 = models.CharField(max_length=240, blank=True, null=True)
    attribute5 = models.CharField(max_length=240, blank=True, null=True)
    attribute6 = models.CharField(max_length=240, blank=True, null=True)
    attribute7 = models.CharField(max_length=240, blank=True, null=True)
    attribute8 = models.CharField(max_length=240, blank=True, null=True)
    attribute9 = models.CharField(max_length=240, blank=True, null=True)
    attribute10 = models.CharField(max_length=240, blank=True, null=True)
    attribute11 = models.CharField(max_length=240, blank=True, null=True)
    attribute12 = models.CharField(max_length=240, blank=True, null=True)
    attribute13 = models.CharField(max_length=240, blank=True, null=True)
    attribute14 = models.CharField(max_length=240, blank=True, null=True)
    attribute15 = models.CharField(max_length=240, blank=True, null=True)
    attribute16 = models.CharField(max_length=240, blank=True, null=True)
    attribute17 = models.CharField(max_length=240, blank=True, null=True)
    attribute18 = models.CharField(max_length=240, blank=True, null=True)
    attribute19 = models.CharField(max_length=240, blank=True, null=True)
    attribute20 = models.CharField(max_length=240, blank=True, null=True)
    attribute21 = models.CharField(max_length=240, blank=True, null=True)
    attribute22 = models.CharField(max_length=240, blank=True, null=True)
    attribute23 = models.CharField(max_length=240, blank=True, null=True)
    attribute24 = models.CharField(max_length=240, blank=True, null=True)
    attribute25 = models.CharField(max_length=240, blank=True, null=True)
    attribute26 = models.CharField(max_length=240, blank=True, null=True)
    attribute27 = models.CharField(max_length=240, blank=True, null=True)
    attribute28 = models.CharField(max_length=240, blank=True, null=True)
    attribute29 = models.CharField(max_length=240, blank=True, null=True)
    attribute30 = models.CharField(max_length=240, blank=True, null=True)
    attribute31 = models.CharField(max_length=240, blank=True, null=True)
    attribute32 = models.CharField(max_length=240, blank=True, null=True)
    attribute33 = models.CharField(max_length=240, blank=True, null=True)
    attribute34 = models.CharField(max_length=240, blank=True, null=True)
    attribute35 = models.CharField(max_length=240, blank=True, null=True)
    attribute36 = models.CharField(max_length=240, blank=True, null=True)
    attribute37 = models.CharField(max_length=240, blank=True, null=True)
    attribute38 = models.CharField(max_length=240, blank=True, null=True)
    attribute39 = models.CharField(max_length=240, blank=True, null=True)
    attribute40 = models.CharField(max_length=240, blank=True, null=True)
    attribute41 = models.CharField(max_length=240, blank=True, null=True)
    attribute42 = models.CharField(max_length=240, blank=True, null=True)
    attribute43 = models.CharField(max_length=240, blank=True, null=True)
    attribute44 = models.CharField(max_length=240, blank=True, null=True)
    attribute45 = models.CharField(max_length=240, blank=True, null=True)
    attribute46 = models.CharField(max_length=240, blank=True, null=True)
    attribute47 = models.CharField(max_length=240, blank=True, null=True)
    attribute48 = models.CharField(max_length=240, blank=True, null=True)
    attribute49 = models.CharField(max_length=240, blank=True, null=True)
    attribute50 = models.CharField(max_length=240, blank=True, null=True)
    flex_value_meaning = models.CharField(max_length=150)
    description = models.CharField(max_length=240, blank=True, null=True)
    attribute_sort_order = models.BigIntegerField(blank=True, null=True)

    class Meta:
        db_table  = "flex_values"

class InvChatterMsgLines(BaseMasterModel):
    line_id  = models.IntegerField(blank=True, null=True)
    username = models.CharField(max_length=240, blank=True, null=True)
    doc_type = models.CharField(max_length=240, blank=True, null=True)
    doc_no   = models.CharField(max_length=240, blank=True, null=True)
    msg_content = models.CharField(max_length=240, blank=True, null=True)
    msg_type    = models.CharField(max_length=240, blank=True, null=True)
    removed_flag = models.CharField(max_length=240, blank=True, null=True)
    doc_upload_type = models.CharField(max_length=240, blank=True, null=True)
    reference = models.CharField(max_length=240, blank=True, null=True)
    class Meta:
        db_table  = "inv_chatter_msg_lines"



class Announcements(BaseMasterModel):
    name = models.CharField(max_length=256)
    text = models.TextField()
    category = models.CharField(max_length=256)



class Events(BaseMasterModel):
    name = models.CharField(max_length=256)
    location = models.CharField(max_length=256)
    time = models.CharField(max_length=256)
    additional_text = models.TextField()


class Subinventory(models.Model):
    secondary_inventory_name = models.CharField(max_length=10, blank=True, null=True)
    organization_id = models.IntegerField(blank=True, null=True)
    last_update_date = models.DateTimeField(blank=True, null=True)
    last_updated_by = models.IntegerField(blank=True, null=True)
    creation_date = models.DateTimeField(blank=True, null=True)
    created_by = models.IntegerField(blank=True, null=True)
    last_update_login = models.IntegerField(blank=True, null=True)
    description = models.CharField(max_length=50, blank=True, null=True)
    disable_date = models.DateTimeField(blank=True, null=True)
    inventory_atp_code = models.IntegerField(blank=True, null=True)
    availability_type = models.IntegerField(blank=True, null=True)  
    reservable_type = models.IntegerField(blank=True, null=True)
    locator_type = models.IntegerField(blank=True, null=True)
    picking_order = models.IntegerField(blank=True, null=True)
    material_account = models.IntegerField(blank=True, null=True)
    material_overhead_account = models.IntegerField(blank=True, null=True)
    resource_account = models.IntegerField(blank=True, null=True)
    overhead_account = models.IntegerField(blank=True, null=True)
    outside_processing_account = models.IntegerField(blank=True, null=True)
    quantity_tracked = models.IntegerField(blank=True, null=True)
    asset_inventory = models.IntegerField(blank=True, null=True)
    source_type = models.IntegerField(blank=True, null=True)
    source_subinventory = models.CharField(max_length=10, blank=True, null=True)
    source_organization_id = models.IntegerField(blank=True, null=True)
    requisition_approval_type = models.IntegerField(blank=True, null=True)
    expense_account = models.IntegerField(blank=True, null=True)
    encumbrance_account = models.IntegerField(blank=True, null=True)
    attribute_category = models.CharField(max_length=30, blank=True, null=True)
    attribute1 = models.CharField(max_length=150, blank=True, null=True)
    attribute2 = models.CharField(max_length=150, blank=True, null=True)
    attribute3 = models.CharField(max_length=150, blank=True, null=True)
    attribute4 = models.CharField(max_length=150, blank=True, null=True)
    attribute5 = models.CharField(max_length=150, blank=True, null=True)
    attribute6 = models.CharField(max_length=150, blank=True, null=True)
    attribute7 = models.CharField(max_length=150, blank=True, null=True)
    attribute8 = models.CharField(max_length=150, blank=True, null=True)
    attribute9 = models.CharField(max_length=150, blank=True, null=True)
    attribute10 = models.CharField(max_length=150, blank=True, null=True)
    attribute11 = models.CharField(max_length=150, blank=True, null=True)
    attribute12 = models.CharField(max_length=150, blank=True, null=True)
    attribute13 = models.CharField(max_length=150, blank=True, null=True)
    attribute14 = models.CharField(max_length=150, blank=True, null=True)
    attribute15 = models.CharField(max_length=150, blank=True, null=True)
    request_id = models.IntegerField(blank=True, null=True)
    program_application_id = models.IntegerField(blank=True, null=True)
    program_id = models.IntegerField(blank=True, null=True)
    program_update_date = models.DateTimeField(blank=True, null=True)
    preprocessing_lead_time = models.IntegerField(blank=True, null=True)
    processing_lead_time = models.IntegerField(blank=True, null=True)
    postprocessing_lead_time = models.IntegerField(blank=True, null=True)
    demand_class = models.CharField(max_length=30, blank=True, null=True)
    project_id = models.IntegerField(blank=True, null=True)
    task_id = models.IntegerField(blank=True, null=True)
    subinventory_usage = models.IntegerField(blank=True, null=True)
    notify_list_id = models.IntegerField(blank=True, null=True)
    pick_uom_code = models.CharField(max_length=3, blank=True, null=True)
    depreciable_flag = models.IntegerField(blank=True, null=True)
    location_id = models.IntegerField(blank=True, null=True)
    default_cost_group_id = models.IntegerField(blank=True, null=True)
    status_id = models.IntegerField(blank=True, null=True)
    default_loc_status_id = models.IntegerField(blank=True, null=True)
    lpn_controlled_flag = models.IntegerField(blank=True, null=True)
    pick_methodology = models.IntegerField(blank=True, null=True)
    cartonization_flag = models.IntegerField(blank=True, null=True)
    dropping_order = models.IntegerField(blank=True, null=True)
    subinventory_type = models.IntegerField(blank=True, null=True)
    planning_level = models.IntegerField(blank=True, null=True)
    default_count_type_code = models.IntegerField(blank=True, null=True)
    enable_bulk_pick = models.CharField(max_length=1, blank=True, null=True)
    enable_locator_alias = models.CharField(max_length=1, blank=True, null=True)
    enforce_alias_uniqueness = models.CharField(max_length=1, blank=True, null=True)
    enable_opp_cyc_count = models.CharField(max_length=1, blank=True, null=True)
    opp_cyc_count_days = models.IntegerField(blank=True, null=True)
    opp_cyc_count_header_id = models.IntegerField(blank=True, null=True)
    opp_cyc_count_quantity = models.IntegerField(blank=True, null=True)
    # id = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'core_subinventories'