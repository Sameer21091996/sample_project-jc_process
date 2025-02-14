from django.db import models
from core.models import BaseMasterModel
class PricelistUpdateHdr(BaseMasterModel):
    batch_id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=100, default='OPEN')
    price_list_name = models.CharField(max_length=256)  


class PricelistUpdateLine(BaseMasterModel):
    batch_id = models.ForeignKey(PricelistUpdateHdr, db_constraint=False, on_delete=models.CASCADE)
    item_code = models.CharField(max_length=100)
    cur_price = models.FloatField()
    cur_price_vat = models.FloatField()
    disc_by = models.CharField(max_length=100)
    disc_value = models.FloatField()
    new_price = models.FloatField()
    new_price_vat = models.FloatField()
    price_list_start_date = models.CharField(max_length=100)
    price_list_end_date = models.CharField(max_length=100)



class PriceList(BaseMasterModel):
    list_line_id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=255,null=True, blank=True)
    item_type = models.CharField(max_length=50,null=True, blank=True)
    price = models.IntegerField(null=True, blank=True)
    item_code = models.CharField(max_length=255,null=True, blank=True)
    product_uom_code = models.CharField(max_length=5,null=True, blank=True)
    last_updated_by = models.IntegerField(null=True, blank=True)
    list_line_type_code = models.CharField(
        max_length=50, blank=True, null=True)
    creation_date = models.DateField(null=True, blank=True)
    last_update_date = models.DateField(null=True, blank=True)
    list_header_id = models.IntegerField(null=True, blank=True)
    inventory_item_id = models.IntegerField(null=True, blank=True)
    color = models.CharField(max_length=255,null=True, blank=True)
    year = models.CharField(max_length=255,null=True, blank=True)
    product_attr_value = models.CharField(max_length=255,null=True, blank=True)

    def __str__(self):
        return self.name

    @property
    def option_label(self):
        return "{}".format(self.name)

    @property
    def option_label(self):
        return "{}".format(self.price)

    def option_label_field():
        return 'price'
