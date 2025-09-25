# Make the API call

Now that we have both our search term and the payload defined, as well as our headers for authentication it is finally time to make an API call. We are going to add a POST request which will reach out to the Simpler.Grants.gov API with our code and will save the response into the new response variable.&#x20;

Reminder that we are setting up the call with the following information:

* `json=payload` makes `requests` send the body as JSON.
* We’re calling `/v1/opportunities/search` on the base URL.

```python
import requests
import json

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
    
    # Add search term if provided
    if search_term:
        payload["query"] = search_term
        
    # Make the API call
    response = requests.post(
        f"{BASE_URL}/v1/opportunities/search",
        headers=headers,
        json=payload
    )
    
# Run the search
if __name__ == "__main__":
    print("\nSearching for health-related opportunities...")
    search_opportunities("health")
```

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
