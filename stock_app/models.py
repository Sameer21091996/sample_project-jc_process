from django.db import models

class UploadHeader(models.Model):
    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Completed", "Completed")
    ]

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Draft")
    upload_type = models.ForeignKey('assignment.LOOKUP_DETAILS', on_delete=models.CASCADE, related_name="headers", db_constraint=False)
    upload_type_value = models.CharField(max_length=255, null=True, blank=True)  # Changed to CharField
    
    creation_by = models.CharField(max_length=255)
    creation_date = models.DateTimeField()
    last_updated_by = models.CharField(max_length=255)
    last_update_date = models.DateTimeField()

    def _str_(self):
        return self.title

class UploadLine(models.Model):
    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Completed", "Completed")
    ]

    id = models.AutoField(primary_key=True)
    header = models.ForeignKey(UploadHeader, on_delete=models.CASCADE, related_name="lines", db_constraint=False)
    line_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Draft")
    col_header_flag = models.BooleanField(default=False)
    last_updated_by = models.CharField(max_length=255, null=True, blank=True)
    last_update_date = models.DateTimeField(null=True, blank=True)

    attribute1 = models.CharField(max_length=255, null=True, blank=True)
    attribute2 = models.CharField(max_length=255, null=True, blank=True)
    attribute3 = models.CharField(max_length=255, null=True, blank=True)
    attribute4 = models.CharField(max_length=255, null=True, blank=True)
    attribute5 = models.CharField(max_length=255, null=True, blank=True)
    attribute6 = models.CharField(max_length=255, null=True, blank=True)
    attribute7 = models.CharField(max_length=255, null=True, blank=True)
    attribute8 = models.CharField(max_length=255, null=True, blank=True)
    attribute9 = models.CharField(max_length=255, null=True, blank=True)
    attribute10 = models.CharField(max_length=255, null=True, blank=True)
    attribute11 = models.CharField(max_length=255, null=True, blank=True)
    attribute12 = models.CharField(max_length=255, null=True, blank=True)
    attribute13 = models.CharField(max_length=255, null=True, blank=True)
    attribute14 = models.CharField(max_length=255, null=True, blank=True)
    attribute15 = models.CharField(max_length=255, null=True, blank=True)
    attribute16 = models.CharField(max_length=255, null=True, blank=True)
    attribute17 = models.CharField(max_length=255, null=True, blank=True)
    attribute18 = models.CharField(max_length=255, null=True, blank=True)
    attribute19 = models.CharField(max_length=255, null=True, blank=True)
    attribute20 = models.CharField(max_length=255, null=True, blank=True)
    attribute21 = models.CharField(max_length=255, null=True, blank=True)
    attribute22 = models.CharField(max_length=255, null=True, blank=True)
    attribute23 = models.CharField(max_length=255, null=True, blank=True)
    attribute24 = models.CharField(max_length=255, null=True, blank=True)
    attribute25 = models.CharField(max_length=255, null=True, blank=True)
    attribute26 = models.CharField(max_length=255, null=True, blank=True)
    attribute27 = models.CharField(max_length=255, null=True, blank=True)
    attribute28 = models.CharField(max_length=255, null=True, blank=True)
    attribute29 = models.CharField(max_length=255, null=True, blank=True)
    attribute30 = models.CharField(max_length=255, null=True, blank=True)
    attribute31 = models.CharField(max_length=255, null=True, blank=True)
    attribute32 = models.CharField(max_length=255, null=True, blank=True)
    attribute33 = models.CharField(max_length=255, null=True, blank=True)
    attribute34 = models.CharField(max_length=255, null=True, blank=True)
    attribute35 = models.CharField(max_length=255, null=True, blank=True)
    attribute36 = models.CharField(max_length=255, null=True, blank=True)
    attribute37 = models.CharField(max_length=255, null=True, blank=True)
    attribute38 = models.CharField(max_length=255, null=True, blank=True)
    attribute39 = models.CharField(max_length=255, null=True, blank=True)
    attribute40 = models.CharField(max_length=255, null=True, blank=True)
    attribute41 = models.CharField(max_length=255, null=True, blank=True)
    attribute42 = models.CharField(max_length=255, null=True, blank=True)
    attribute43 = models.CharField(max_length=255, null=True, blank=True)
    attribute44 = models.CharField(max_length=255, null=True, blank=True)
    attribute45 = models.CharField(max_length=255, null=True, blank=True)
    attribute46 = models.CharField(max_length=255, null=True, blank=True)
    attribute47 = models.CharField(max_length=255, null=True, blank=True)
    attribute48 = models.CharField(max_length=255, null=True, blank=True)
    attribute49 = models.CharField(max_length=255, null=True, blank=True)
    attribute50 = models.CharField(max_length=255, null=True, blank=True)

    def _str_(self):
        return f"Line {self.id} of Header {self.header.id}"

class UploadMedia(models.Model):
    id = models.AutoField(primary_key=True)
    file_name = models.CharField(max_length=255)
    header = models.ForeignKey(UploadHeader, on_delete=models.CASCADE, related_name="media", db_constraint=False)
    line = models.ForeignKey(UploadLine, on_delete=models.CASCADE, related_name="media", null=True, blank=True, db_constraint=False)
    binary = models.BinaryField(null=True, blank=True)
    path = models.CharField(max_length=255, null=True, blank=True)

    def _str_(self):
        return self.file_name



class ShareLink(models.Model):
    header = models.ForeignKey(UploadHeader, on_delete=models.CASCADE)
    share_url = models.URLField(max_length=500)
    token = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'share_links'


class StockCountConfig(models.Model):
    header_id = models.IntegerField()
    selected_column = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)



class StockCountHistory(models.Model):
    header = models.ForeignKey(UploadHeader, on_delete=models.CASCADE, related_name='stock_count_history', null=True)
    upload_line = models.ForeignKey(UploadLine, on_delete=models.CASCADE, related_name='stock_counts')
    actual_count = models.CharField(max_length=255)
    variance = models.CharField(max_length=255)
    created_by = models.CharField(max_length=255)
    created_date = models.DateTimeField(auto_now_add=True)
    line_status = models.CharField(max_length=20)
    remarks = models.CharField(max_length=200,null=True, blank=True)
  
    class Meta:
        ordering = ['-created_date']
