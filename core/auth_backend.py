from django.contrib.auth.models import User
from django.conf import settings




# requires to define two functions authenticate and get_user

class ForceAuth:  

    def authenticate(self, request, username=None):
        try:
            try:
                user = User.objects.create_user(username, 'eg@email.com', '123456')
                user.save()
            except:
                pass
            user = User.objects.get(username=username)
            return user
        except User.DoesNotExist:
            return None

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None