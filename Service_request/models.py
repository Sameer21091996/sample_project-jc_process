from django.db import models

class ServiceRequestHeader(models.Model):
    vin = models.CharField(max_length=100, verbose_name="VIN")
    mileage = models.IntegerField(verbose_name="Mileage", null=True, blank=True)
    pre_job_card = models.CharField(max_length=100, verbose_name="Pre Job Card", null=True, blank=True)
    incident_type = models.CharField(max_length=100, verbose_name="Incident Type")
    service_advisor = models.CharField(max_length=100, verbose_name="Service Advisor")
    
    mobile_number = models.CharField(max_length=15, verbose_name="Mobile Number", null=True, blank=True)
    service_location = models.CharField(max_length=100, verbose_name="Service Location", null=True, blank=True)
    problem_summary = models.TextField(verbose_name="Problem Summary")
    resolution_summary = models.TextField(verbose_name="Resolution Summary", null=True, blank=True)
    incident_status = models.CharField(max_length=50, verbose_name="Incident Status", default="Open")
    
    work_dept = models.CharField(max_length=100, verbose_name="Work Dept", null=True, blank=True)
    group = models.CharField(max_length=100, verbose_name="Group")
    outdoor_van_number = models.CharField(max_length=100, verbose_name="Outdoor VAN Number", null=True, blank=True)
    outdoor_location_name = models.CharField(max_length=100, verbose_name="Outdoor Location Name", null=True, blank=True)
    account_number = models.CharField(max_length=100, verbose_name="Account Number")
    
    customer_name = models.CharField(max_length=100, verbose_name="Customer Name")
    
    incident_number = models.CharField(max_length=100, verbose_name="Incident Number")
    
    registration_number = models.CharField(max_length=100, verbose_name="Registration Number", null=True, blank=True)
    promised_time = models.DateTimeField(verbose_name="Promised Time", null=True, blank=True)
    ship_to_account_number = models.CharField(max_length=100, verbose_name="Ship to Account Number", null=True, blank=True)
    ship_to_customer_name = models.CharField(max_length=100, verbose_name="Ship to Customer Name", null=True, blank=True)
    bill_to_account_number = models.CharField(max_length=100, verbose_name="Bill to Account Number", null=True, blank=True)
    
    bill_to_customer_name = models.CharField(max_length=100, verbose_name="Bill to Customer Name", null=True, blank=True)
    related_job_card_no = models.CharField(max_length=100, verbose_name="Related Job Card Number", null=True, blank=True)
    address = models.TextField(verbose_name="Address", null=True, blank=True)
    model = models.CharField(max_length=100, verbose_name="Model", null=True, blank=True)
    date_of_sale = models.DateField(verbose_name="Date of Sale", null=True, blank=True)
    
    lpo_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="LPO Amount", null=True, blank=True)
    lpo_reference_number = models.CharField(max_length=100, verbose_name="LPO Reference Number", null=True, blank=True)
    service_provider = models.CharField(max_length=100, verbose_name="Service Provider", null=True, blank=True)
    context = models.CharField(max_length=100, verbose_name="Context")
    item = models.CharField(max_length=100, verbose_name="Item", null=True, blank=True)
    
    description = models.TextField(verbose_name="Description", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    closed_at = models.DateTimeField(verbose_name="Closed At", null=True, blank=True)
    created_by = models.CharField(max_length=100, verbose_name="Created By")
    last_updated_by = models.CharField(max_length=100, verbose_name="Last Updated By")
    Mobile_Number = models.CharField(max_length=15, verbose_name="Mobile Number", null=True, blank=True)
    
    category = models.CharField(max_length=100, verbose_name="Category", null=True, blank=True)

    def __str__(self):
        return f"{self.vin} - {self.incident_type}"
    class Meta:
        db_table = 'SERVICEREQUESTHEADER'



class ServiceRequestLine(models.Model):
    RECORD_TYPE_CHOICES = [
        ('ROActivity', 'RO Activity'),
        ('Estimate', 'Estimate'),
        ('Actual', 'Actual'),
    ]
  
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES) 
    is_processed = models.BooleanField(default=False)  # Add this new field
    parent_line = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)

    service_request = models.ForeignKey(ServiceRequestHeader, on_delete=models.CASCADE, null=True, blank=True, related_name="unified_records")
    line_number = models.PositiveIntegerField(null=True, blank=True)
    operation_code = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    problem = models.TextField(null=True, blank=True)
    correction = models.TextField(null=True, blank=True)
    view_components = models.TextField(null=True, blank=True)
    gift_voucher_scheme = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
  

    component_type = models.CharField(max_length=100, null=True, blank=True)
    activity_line = models.CharField(max_length=50, null=True, blank=True)
    activity_desc = models.CharField(max_length=255, blank=True, null=True)
    component_code = models.CharField(max_length=50, null=True, blank=True)
    component_description = models.CharField(max_length=255, blank=True, null=True)
    estimate_status = models.CharField(max_length=50, blank=True, null=True)
    suggested_quantity = models.FloatField(null=True, blank=True)
    actual_quantity = models.FloatField(null=True, blank=True)
    on_hand_quantity = models.FloatField(null=True, blank=True)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
 
 
    parts_issue_status = models.CharField(max_length=50, blank=True, null=True)
    adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, null=True, blank=True)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    vat = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    estimated_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    estimated_variation = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
   
   
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.record_type} - ID {self.id}"
    
    class Meta:
        db_table = 'SERVICEREQUESTLINE'




class CONSUMABLE(models.Model):
    service_request_line = models.ForeignKey(
        ServiceRequestLine, 
        on_delete=models.CASCADE,
        related_name='consumables', null=True, blank=True
    )
    service_request = models.ForeignKey(ServiceRequestHeader,null=True,blank=True, on_delete=models.CASCADE, related_name='Consumanbles')
   
    line = models.PositiveIntegerField()
    operation_code = models.CharField(max_length=255, null=True, blank=True)
    actual_qty = models.PositiveIntegerField()
    trans_qty = models.PositiveIntegerField()
    proc_qty = models.PositiveIntegerField()
    returned_qty = models.PositiveIntegerField()
    cons_oh_qty = models.PositiveIntegerField(verbose_name="Cons OH Qty")
    tot_selling_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Total Selling Price")
    transaction_date = models.DateTimeField()
    return_qty = models.PositiveIntegerField(null=True, blank=True)
    return_flag = models.BooleanField(default=False, verbose_name="Return")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    
    def __str__(self):
        return f"Line {self.line}: {self.operation_code}"
    
    class Meta:
        db_table = 'CONSUMABLE'


class LABOR(models.Model):
    service_request_line = models.ForeignKey(
        ServiceRequestLine, 
        on_delete=models.CASCADE,
        related_name='Labour', null=True, blank=True
    )
    service_request = models.ForeignKey(ServiceRequestHeader,null=True,blank=True, on_delete=models.CASCADE, related_name='Labour')
    
    line = models.PositiveIntegerField()
    operation_code = models.CharField(max_length=255)
    employee_name = models.CharField(max_length=255)
    employee_no = models.PositiveIntegerField()
    trx_qty = models.PositiveIntegerField(verbose_name="Transaction Quantity")
    plan_start_date = models.DateTimeField()
    plan_end_date = models.DateTimeField()
    actual_start_date = models.DateTimeField()
    actual_end_date = models.DateTimeField()
    status = models.CharField(max_length=50, choices=[('open', 'Open'), ('closed', 'Closed')], default='open')
    action = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Line {self.line}: {self.operation_code} - {self.employee_name}"

    class Meta:
        db_table = 'LABOR'

class Sublet(models.Model):
    ACTIVITY_CHOICES = [
        ('SUBLET', 'Sublet'),
        
    ]
    
    service_request = models.ForeignKey(ServiceRequestHeader,null=True,blank=True, on_delete=models.CASCADE, related_name='sublets')
    service_request_line = models.ForeignKey(ServiceRequestLine, null=True, blank=True, on_delete=models.CASCADE, related_name='sublet_lines')
    supplier_name = models.CharField(max_length=255,null=True,blank=True)
    petty_cash_supplier=models.CharField(max_length=300,null=True,blank=True)
    activity_description = models.CharField(max_length=255, choices=ACTIVITY_CHOICES,null=True,blank=True)
    apply_vat = models.BooleanField(default=False,null=True,blank=True)
    transaction_amount = models.DecimalField(max_digits=10, decimal_places=2,null=True,blank=True)
    supplier_invoice_num = models.CharField(max_length=255,null=True,blank=True)
    supplier_invoice_date = models.DateField()
    vat_percentage = models.DecimalField(max_digits=5, decimal_places=2,null=True,blank=True)
    vat_amount = models.DecimalField(max_digits=10, decimal_places=2,null=True,blank=True)
    total_amount_incl_vat = models.DecimalField(max_digits=10, decimal_places=2,null=True,blank=True)
    operation_code = models.CharField(max_length=255,null=True,blank=True)
    supplier_site_name=models.CharField(max_length=300,null=True,blank=True)
    return_sublet = models.BooleanField(default=False,null=True,blank=True)


    requisition_number = models.CharField(max_length=255, null=True, blank=True)
    purchase_order_number = models.CharField(max_length=255, null=True, blank=True)
    po_receipts = models.CharField(max_length=255, null=True, blank=True)
    ap_invoice_number = models.CharField(max_length=255, null=True, blank=True)
    return_ap_invoice_number = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    output_msg = models.TextField(null=True, blank=True)
    print_return = models.BooleanField(default=False, null=True, blank=True)
    

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    def _str_(self):
        return f"Sublet - {self.supplier_invoice_num} - {self.actual_customer}"
    
    class Meta:
        ordering = ['-supplier_invoice_date']
        verbose_name = 'Sublet'
        verbose_name_plural = 'Sublets'




class CUSTOMERBALANCE(models.Model):
    service_request = models.ForeignKey('ServiceRequestHeader',
                                      on_delete=models.CASCADE,
                                      related_name='customer_balances',
                                      null=True, blank=True)
    
    customer = models.CharField(max_length=255)
    transaction_type = models.CharField(max_length=255, verbose_name="Type")
    receipt_number = models.CharField(max_length=255, null=True, blank=True)
    credit_memo = models.CharField(max_length=255, null=True, blank=True)
    original_amount = models.DecimalField(max_digits=12, decimal_places=2)
    utilized_outstanding_amount = models.DecimalField(max_digits=12, decimal_places=2)
    loc_available_amount = models.DecimalField(max_digits=12, decimal_places=2)
    split_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    txn_amount = models.DecimalField(max_digits=12, decimal_places=2)
    receivable_level = models.CharField(max_length=255)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=100, verbose_name="Created By", default="System")
    last_updated_by = models.CharField(max_length=100, verbose_name="Last Updated By", default="System")

    def save(self, *args, **kwargs):
        if self.service_request:
            self.customer = self.service_request.customer_name
            self.created_by = self.service_request.created_by
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer} - {self.transaction_type}"

    class Meta:
        db_table = 'CUSTOMERBALANCE'


class ComponentSubtotal(models.Model):
    service_request = models.ForeignKey(
        ServiceRequestHeader,
        on_delete=models.CASCADE,
        related_name='component_subtotals'
    )
    component_type = models.CharField(max_length=100)
    net_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    vat = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    estimated_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    estimated_variation = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'COMPONENTSUBTOTAL'
        unique_together = ('service_request', 'component_type')

    def __str__(self):
        return f"{self.service_request.incident_number} - {self.component_type} Subtotal"




class MATERIAL(models.Model):
    service_request_line = models.ForeignKey(
        ServiceRequestLine,
        on_delete=models.CASCADE,
        related_name='materials', 
        null=True, 
        blank=True
    )
    service_request = models.ForeignKey(
        ServiceRequestHeader,
        null=True,
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='Materials'
    )
    
    line = models.PositiveIntegerField()
    requested_part = models.CharField(max_length=255)
    issued_part = models.CharField(max_length=255)
    req_qty = models.PositiveIntegerField()
    issued_qty = models.PositiveIntegerField()
    ack_qty = models.PositiveIntegerField()
    canc_qty = models.PositiveIntegerField(null=True, blank=True)
    returned_qty = models.PositiveIntegerField(null=True, blank=True)
    tot_selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    request_number = models.CharField(max_length=255)
    transaction_date = models.DateTimeField()
    line_status = models.CharField(max_length=50)
    parts_status = models.CharField(max_length=50)
    cancel_status = models.CharField(max_length=50, null=True, blank=True)
    is_cancelled = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'MATERIAL'
