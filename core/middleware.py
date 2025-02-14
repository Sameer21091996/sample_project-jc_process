from core.models import NavigationItem
from core.utils import CrossAppAuth


sales_pages_not_aye = [
    '/sales/accessories/',
    '/quotation/',
    '/sales/',
    '/sales/units',
    '/sales/units_acs',
    '/invoice/',
    # '/sales/aye_retail',
    # '/sales/aye_dlr',
    # '/sales/aye_exp',
    # '/sales/aye',
]

def url_is_not_aye_sale(path):
    url_exists = False
    for url in sales_pages_not_aye:
        if path == url :
            url_exists = True 

    return url_exists



class CustomSessionVarHandler:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        current_url_path = request.path

        
        """
            Reset Other Sale Session AYE variable
        """
        is_not_aye_sale = url_is_not_aye_sale(current_url_path)

        if is_not_aye_sale:
            request.session['selected_aye_sales_type'] = ''

        aye_sales_type = request.session.get('selected_aye_sales_type','')
        print('selected_aye_sales_type => ',aye_sales_type )

        if is_not_aye_sale:
            pass
        
        """ End """

        """
        SETTING CROSS APP TOKEN
        """
        request.session['ca_token'] = CrossAppAuth(request.user.username).get_hex_token()
        """ End """

        return response
    
    # def process_template_response(request, response):
