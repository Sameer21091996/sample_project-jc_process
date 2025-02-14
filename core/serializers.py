from rest_framework import serializers
from django.utils import timezone
from .models import *
from ay_connect.constants import DATATABLES_DATETIME_FORMAT, DATATABLES_DATE_FORMAT
import pytz

def set_date_field_value(ret, obj, date_fields, show_time=True):

    date_format = DATATABLES_DATETIME_FORMAT if show_time else DATATABLES_DATE_FORMAT
    for date_field in date_fields:
        if hasattr(obj, date_field) and getattr(obj, date_field):
            ret[date_field] = timezone.localtime(getattr(obj, date_field)).strftime(
                date_format) if show_time else getattr(obj, date_field).strftime(date_format)
        else:
            ret[date_field] = ""
    return ret


class AbstractSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(read_only=True)
    created_by = serializers.SerializerMethodField()
    last_updated_by = serializers.SerializerMethodField()
    tenant = serializers.SerializerMethodField()
            
    def get_created_by(self, obj):
        return obj.created_by
        return obj.created_by_name if hasattr(obj, 'created_by_name') else ''

    def get_last_updated_by(self, obj):
        return obj.last_updated_by
        return obj.last_updated_by_name if hasattr(obj, 'last_updated_by_name') else ''

    def get_tenant(self, obj):
        try:
            return obj.tenant.organization_name if obj.tenant and hasattr(obj, 'tenant') else ''
        except:
            return ''      
    def to_representation(self, obj):
        ret = super().to_representation(obj)
        boolean_fields = ['active']
        for field in boolean_fields:
            ret[field] = 'Y' if hasattr(obj, field) and getattr(obj, field) else 'N'
        date_fields = ['start_date', 'end_date', 'creation_date', 'last_update_date', ]
        ret = set_date_field_value(ret, obj, date_fields)
        return ret
                    
    def __init__(self, *args, **kwargs):
            
        super(AbstractSerializer, self).__init__(*args, **kwargs)
        not_required_fields = []
        for field in not_required_fields:
            self.fields[field].required = False

class TopLayerSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(read_only=True)
    created_by = serializers.SerializerMethodField()
    last_updated_by = serializers.SerializerMethodField()
            
    def get_created_by(self, obj):
        return obj.created_by_name if hasattr(obj, 'created_by_name') else ''

    def get_last_updated_by(self, obj):
        return obj.last_updated_by_name if hasattr(obj, 'last_updated_by_name') else ''
             
    def to_representation(self, obj):
        ret = super().to_representation(obj)
        boolean_fields = ['active']
        for field in boolean_fields:
            ret[field] = 'Y' if hasattr(obj, field) and getattr(obj, field) else 'N'
        date_fields = ['start_date', 'end_date', 'creation_date', 'last_update_date', ]
        ret = set_date_field_value(ret, obj, date_fields)
        return ret
                    
    def __init__(self, *args, **kwargs):
            
        super(TopLayerSerializer, self).__init__(*args, **kwargs)
        not_required_fields = []
        for field in not_required_fields:
            self.fields[field].required = False

class LookupNameSerializer(AbstractSerializer):
  
  class Meta:
      model = LookupName
      fields = '__all__'





class DataDictionarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DataDictionary
        fields = '__all__'


class DataDictionarySelectiveFieldsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataDictionary
        fields = ['data_name','visible','is_disabled']



class DataDictionarySectionSerializer(serializers.ModelSerializer):
    datadictionary_set = DataDictionarySerializer(many=True)

    class Meta:
        model = DataDictionarySection
        fields = '__all__'



class AnnouncementsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcements
        fields = '__all__'

class EventsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Events
        fields = '__all__'

        
class TableColumnSerializer(AbstractSerializer):
    title = serializers.CharField(source='column_header')
    data = serializers.CharField(source='column_data_field')
    class Meta:
        model = TableColumn
        fields = ('title', 'data',)
