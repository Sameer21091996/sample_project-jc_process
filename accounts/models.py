from django.db import models
from core.models import BaseMasterModel, RolePermissions, ARLocations, EmployeeRole
from setup.models import ConcProgMaster
class CustomPermission(BaseMasterModel):
    name  = models.CharField(max_length=30)
    code  = models.CharField(max_length=30, null=True, blank=True)
    description = models.CharField(max_length=100, null=True, blank=True)

class CustomRolePermission(BaseMasterModel):
    custompermission  = models.ForeignKey(CustomPermission, on_delete=models.CASCADE,db_constraint=False)
    rolepermission = models.ForeignKey(RolePermissions, on_delete=models.CASCADE,db_constraint=False)


class ConcProgRole(BaseMasterModel):
    role  = models.ForeignKey(EmployeeRole,on_delete=models.SET_NULL,db_constraint=False,null=True,)
    conc_prog = models.ForeignKey(ConcProgMaster, on_delete=models.SET_NULL,db_constraint=False,null=True,)