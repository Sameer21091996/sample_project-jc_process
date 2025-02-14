from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import *

class NavigationItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'sort_by', 'is_menu_item')
    list_filter = ('parent',)


class TableColumnInlineAdmin(admin.TabularInline):
    model = TableColumn
    # max_num = 3

class TableConfigurationAdmin(ImportExportModelAdmin,admin.ModelAdmin):
    inlines = [TableColumnInlineAdmin, ]


admin.site.register(TableConfiguration, TableConfigurationAdmin)

class TableColumnAdmin(ImportExportModelAdmin, admin.ModelAdmin):
    list_display = ('__str__', 'column_data_field', 'column_order')


class APILogAdmin(admin.ModelAdmin):
    list_display = ( 'id','request_body', 'response_body','url')
    list_filter = ('request_body',)

admin.site.register(TableColumn, TableColumnAdmin)


admin.site.register(LookupName)
admin.site.register(LookupNameValue)
admin.site.register(Party)
admin.site.register(UserOrganisationInventory)
admin.site.register(UserProfile)
admin.site.register(OperatingUnit)
admin.site.register(NavigationItem, NavigationItemAdmin)
admin.site.register(EmployeeRole)
admin.site.register(Inventory)
admin.site.register(GlLedger)
admin.site.register(Announcements)
admin.site.register(Events)
admin.site.register(APILog, APILogAdmin)


class DataDictionarySectionAdmin(ImportExportModelAdmin, admin.ModelAdmin):
    list_display = ('model_name', )

class DataDictionaryAdmin(ImportExportModelAdmin, admin.ModelAdmin):
    list_display = ('model_name', 'active','is_disabled','section','data_name', 'display_name', 'display_order_by', )
    list_editable = ('active','is_disabled', 'display_order_by')

admin.site.register(DataDictionarySection, DataDictionarySectionAdmin)
admin.site.register(DataDictionary, DataDictionaryAdmin)

