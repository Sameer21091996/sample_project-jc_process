from django.conf import settings


DATATABLES_DATE_FORMAT = "%d-%b-%Y"
DATATABLES_DATETIME_FORMAT = "%d-%b-%Y %I:%M %p"


ACCESS_APP_BASE_URL = {
    "UAT":"https://servicedev.ayconnect.ae:8000",
    "PROD":"https://hr.alyousuf.net",
}

def get_access_app_url():
    return ACCESS_APP_BASE_URL[settings.ENV]