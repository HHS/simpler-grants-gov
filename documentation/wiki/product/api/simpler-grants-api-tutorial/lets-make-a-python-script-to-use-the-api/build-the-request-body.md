# Build the request body

Still inside the function we are now going to build out the "payload" which is the body of the request. In here we will add parameters which instructs the API what we are searching for.&#x20;

<pre class="language-python"><code class="lang-python"><strong>import requests
</strong>import json

# Your API configuration
API_KEY = "YOUR_API_KEY_HERE"  # Replace with your actual key
BASE_URL = "https://api.simpler.grants.gov"

# The function that will contain search logic
def search_opportunities(search_term=""):
    """Search for grant opportunities"""
    # These headers will authenticate your API call
     headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
     # Build the search request
     # This asks for page 1, 10 results, newest first by post_date.
    payload = {
        "pagination": {
            "page_offset": 1,
            "page_size": 10,
            "sort_order": [
                {
                    "order_by": "post_date",
                    "sort_direction": "descending"
                }
            ]
        }
    }
</code></pre>

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
