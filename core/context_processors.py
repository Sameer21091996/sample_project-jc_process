import time

def variables(request):
    return {
        'STATIC_ASSET_VERSION':int(time.time())
    }
