from datetime import datetime
from django.conf import settings
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from core.models import APILog
import traceback
import threading
class EmailThread(threading.Thread):
    def __init__(self, subject, content, sender,recipient_list):
        self.subject = subject
        self.content = content
        self.recipient_list = recipient_list
        self.sender = sender
        threading.Thread.__init__(self)
    def run(self):
        plain_message = strip_tags(self.content)
        send_mail(self.subject, plain_message , self.sender, self.recipient_list, html_message=self.content,fail_silently=False,)
        # send_mail('Test CRM',
        #           'New lead assigned:-',
        #           'helpdeskadmin@alyousuf.com',
        #           ['fshaik@alyousuf.com'],
        #           fail_silently=False,)


def send_async_mail(subject, content, sender,recipient_list):
    EmailThread(subject, content, sender,recipient_list).start()

class EmailMultiAlternativesThread(threading.Thread):
    def __init__(self, log_id, subject, content, from_email, to, cc,attachments=None):
        self.log_id = log_id
        self.subject = subject
        self.content = content
        self.to = to
        self.from_email = from_email
        self.cc = cc
        self.attachments = attachments
        threading.Thread.__init__(self)
    def run(self):
        plain_message = strip_tags(self.content)
        # send_mail(self.subject, plain_message , self.sender, self.to, html_message=self.content,fail_silently=True,)
        mail = EmailMultiAlternatives(self.subject, plain_message, self.from_email, self.to, cc=self.cc)
        if self.content:
            mail.attach_alternative(self.content, 'text/html')
        if self.attachments!=None:
            for _file_ in self.attachments:
                mail.attach(_file_['file_name'], _file_['content'], _file_['mime_type'])

        try:
            mail.send()
            response_body = ''
            response_code = 'S'
        except Exception as e:
            print(e)
            print(traceback.print_exc())
            response_body = str(e)
            response_code = 'E'
        APILog.objects.filter(id=self.log_id).update(
            finished_at = datetime.now(),
            response_body = response_body,
            response_code = response_code,
        )

        # send_mail('Test CRM',
        #           'New lead assigned:-',
        #           'helpdeskadmin@alyousuf.com',
        #           ['fshaik@alyousuf.com'],
        #           fail_silently=False,)


def send_async_mail_cc(log_id,subject, content, sender,to,cc,attachments=None):
    if settings.ENV == 'PROD':
        EmailMultiAlternativesThread(log_id,subject, content, sender,to,cc,attachments).start()
    else:
        content = f"""To: {",".join(to)}<br>Cc: {",".join(cc)}<br><br>{content}"""
        EmailMultiAlternativesThread(log_id,subject, content, sender,[
            'mdjeelan@alyousuf.com',
            'fshaik@alyousuf.com',
            'nchalil@alyousuf.com',
            'tabrezg@alyousuf.com',
            'naveens@alyousuf.com',
            'sjehangir@alyousuf.com',
            'mbaskaran@alyousuf.com',
            'ssuvarna@alyousuf.com',
            'offshore@alyousuf.com'
        ],[],attachments).start()
