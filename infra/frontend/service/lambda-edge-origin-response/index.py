from datetime import datetime, timedelta

CACHE_TTL = 900  # 15 minutes for anonymous users


def lambda_handler(event, context):
    """Origin Response - Set cache headers based on authentication"""
    request = event["Records"][0]["cf"]["request"]
    response = event["Records"][0]["cf"]["response"]
    headers = response["headers"]
    
    # Check authentication flag set by viewer request
    auth_header = (
        request.get("headers", {})
        .get("x-user-authenticated", [{}])[0]
        .get("value", "false")
    )
    is_authenticated = auth_header == "true"
    
    # Set cache headers based on authentication status
    if is_authenticated:
        disable_cache(headers)
    else:
        enable_cache(headers, CACHE_TTL)
    
    return response


def disable_cache(headers):
    """Set headers to prevent caching (authenticated users)"""
    headers["cache-control"] = [
        {
            "key": "Cache-Control",
            "value": "private, no-store, no-cache, must-revalidate",
        }
    ]
    headers["expires"] = [{"key": "Expires", "value": "0"}]


def enable_cache(headers, ttl):
    """Set headers to enable caching (anonymous users)"""
    headers["cache-control"] = [
        {"key": "Cache-Control", "value": f"public, max-age={ttl}, s-maxage={ttl}"}
    ]
    
    # Calculate and set expiration date
    expires_date = datetime.utcnow() + timedelta(seconds=ttl)
    headers["expires"] = [
        {"key": "Expires", "value": expires_date.strftime("%a, %d %b %Y %H:%M:%S GMT")}
    ]

