import io,os
from ldap3 import Server, Connection, ALL
from django.conf import settings
from PIL import Image, ImageDraw
from sqlalchemy import create_engine
import pandas as pd
from django.conf import settings


ldap_url = settings.LDAP_URL

def parseLdapUserDetails(username,password):
    server = Server(ldap_url)
    c = Connection(server, user='alyousuf\\'+str(username), password=password)
    c.bind()
    attributes = ['sn', 'givenName', 'name', 'userPrincipalName','employeeID', 'displayName', 'memberOf','thumbnailphoto','userPassword','CN','company','department','description','title','telephoneNumber','homePhone']
    c.search('DC=alyousuf,DC=net', '(sAMAccountName='+str(username)+')',attributes=attributes) 
    result_data = c.response
    result_data
    c.unbind()
    if result_data:
        # company = result_data[0]['raw_attributes']['company'][0].decode('utf-8')
        employee_id = result_data[0]['raw_attributes']['employeeID']
        company = result_data[0]['raw_attributes']['company']
        department = result_data[0]['raw_attributes']['department']
        description = result_data[0]['raw_attributes']['description']
        title = result_data[0]['raw_attributes']['title']
        telephoneNumber = result_data[0]['raw_attributes']['telephoneNumber']
        homePhone = result_data[0]['raw_attributes']['homePhone']
        photo_main = result_data[0]['raw_attributes']['thumbnailPhoto']

        if employee_id:
            employee_id = int(employee_id[0].decode('utf-8'))
        else :
            employee_id = 0
        if company:
            company  = company[0].decode('utf-8')
        else :
            company = ''
        if department:
            department = department[0].decode('utf-8')
        else :
            department = ''
        if description:
            description = description[0].decode('utf-8')
        else :
            description = ''
        if title:
            title = title[0].decode('utf-8')
        else :
            title = ''
        if telephoneNumber:
            telephoneNumber = telephoneNumber[0].decode('utf-8')
        else :
            telephoneNumber = ''
        if homePhone:
            homePhone = homePhone[0].decode('utf-8')
        else :
            homePhone = ''
        if photo_main:
            photo_main = io.BytesIO(photo_main[0])
            photo_main.seek(0) 
            image = Image.open(photo_main)
            filepath = "/user/"+username+"/"+"photo_main.jpeg"
            filename =settings.MEDIA_ROOT+filepath
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            image.save(settings.MEDIA_ROOT+filepath, 'JPEG')
            photo_main_path = filepath[1:]
        else :
            photo_main_path = ''
        return employee_id,company,department,description,title,telephoneNumber,homePhone,photo_main_path

