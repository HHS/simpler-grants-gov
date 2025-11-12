import random
import string
import time

SESSION_COOKIES = ['session']


def lambda_handler(event, context):
    """Viewer Request - Add cache buster for authenticated users"""
    request = event['Records'][0]['cf']['request']
    
    is_authenticated = has_session_cookie(request)
    
    if is_authenticated:
        # Combine epoch timestamp + random string for guaranteed uniqueness
        epoch_ms = int(time.time() * 1000)  # milliseconds for extra precision
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        cache_buster = f"{epoch_ms}_{random_suffix}"
        
        existing_qs = request.get('querystring', '')
        
        if existing_qs:
            request['querystring'] = f"{existing_qs}&_cb={cache_buster}"
        else:
            request['querystring'] = f"_cb={cache_buster}"
    
    # Add auth flag header for Origin Response function (if using)
    request['headers']['x-user-authenticated'] = [{
        'key': 'X-User-Authenticated',
        'value': 'true' if is_authenticated else 'false'
    }]
    
    return request


def has_session_cookie(request):
    """Check if any session cookie exists in the request"""
    cookie_headers = request.get('headers', {}).get('cookie', [])
    
    for header in cookie_headers:
        cookie_string = header.get('value', '')
        for cookie_name in SESSION_COOKIES:
            if f'{cookie_name}=' in cookie_string:
                return True
    
    return False

