from .models import *
from core.serializers import AbstractSerializer
from rest_framework import serializers
from core.models import *



# class TemplateContentSerializer(AbstractSerializer):
#     class Meta:
#         model = TemplateContent
#         fields = '__all__'

        
class TemplateContentSerializer(AbstractSerializer):

  modelObj = TemplateContent
  
  model_meta = modelObj._meta.concrete_fields
  for field in model_meta:
    if(field.get_internal_type()=='ForeignKey' and field.name!='tenant'):
        locals()[field.name] = serializers.SerializerMethodField()
        exec("""def get_"""+field.name+"""(self, obj):
                return obj."""+field.name+""".option_label""")

  class Meta:
    model = TemplateContent
    fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(TemplateContentSerializer, self).__init__(*args, **kwargs)

class ConcProgMasterSerializer(AbstractSerializer):

  class Meta:
    model = ConcProgMaster
    fields = '__all__'

class ConcReqHdrSerializer(serializers.ModelSerializer):

  class Meta:
    model = concreqdtl_stg
    fields = '__all__'

class ConcReqHdrStgSerializer(serializers.ModelSerializer):
  request_date = serializers.DateTimeField(format="%d-%b-%Y %H:%M:%S", read_only=True)
  actual_start_date = serializers.DateTimeField(format="%d-%b-%Y %H:%M:%S", read_only=True)
  actual_completion_date = serializers.DateTimeField(format="%d-%b-%Y %H:%M:%S", read_only=True)
  requested_header =  serializers.SerializerMethodField()

  def get_requested_header(self, instance):
     lst = concreqdtl_stg.objects.filter(header_id=instance.header_id)
     return ConcReqHdrSerializer(lst, many=True).data
  
  class Meta:
    model = concreqhdr_stg
    fields = ['header_id','request_id','program_application_id','concurrent_program_id','program_short_name',
              'program','user_concurrent_program_name','request_status','output_file','actual_start_date','requested_header',
              'actual_completion_date','request_date']

class OperatingUnitSerializer(serializers.ModelSerializer):

  class Meta:
    model = OperatingUnit
    fields = '__all__'