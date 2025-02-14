from rest_framework import serializers
from core.models import *
from core.serializers import AbstractSerializer, TopLayerSerializer
from core.models import  LookupName

class UserInventorySerializer(TopLayerSerializer):

  modelObj = UserOrganisationInventory
  
  model_meta = modelObj._meta.concrete_fields
  for field in model_meta:
      if(field.get_internal_type()=='ForeignKey' and field.name!='tenant'):
          locals()[field.name] = serializers.SerializerMethodField()
          exec("""def get_"""+field.name+"""(self, obj):
                   return obj."""+field.name+""".option_label if obj."""+field.name+"""!=None else None """)

  class Meta:
    model = UserOrganisationInventory
    fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(UserInventorySerializer, self).__init__(*args, **kwargs)

class RoleSerializer(AbstractSerializer):

  modelObj = EmployeeRole
  
  model_meta = modelObj._meta.concrete_fields
  for field in model_meta:
      if(field.name.endswith("_lkup")):
          locals()[field.name] = serializers.SerializerMethodField()
          exec("""def get_"""+field.name+"""(self, obj):
                  return obj."""+field.name+""".option_label""")
      elif(field.get_internal_type()=='ForeignKey' and field.name!='tenant'):
          locals()[field.name] = serializers.SerializerMethodField()
          exec("""def get_"""+field.name+"""(self, obj):
                  return obj."""+field.name+""".option_label""")

  class Meta:
    model = EmployeeRole
    fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(RoleSerializer, self).__init__(*args, **kwargs)

class RolePermissionsSerializer(AbstractSerializer):

  modelObj = RolePermissions
  
  model_meta = modelObj._meta.concrete_fields
  for field in model_meta:
      if(field.name.endswith("_lkup")):
          locals()[field.name] = serializers.SerializerMethodField()
          exec("""def get_"""+field.name+"""(self, obj):
                  return obj."""+field.name+""".option_label""")
      elif(field.get_internal_type()=='ForeignKey' and field.name!='tenant'):
          locals()[field.name] = serializers.SerializerMethodField()
          exec("""def get_"""+field.name+"""(self, obj):
                  return obj."""+field.name+""".option_label""")

  class Meta:
    model = RolePermissions
    fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(RolePermissionsSerializer, self).__init__(*args, **kwargs)