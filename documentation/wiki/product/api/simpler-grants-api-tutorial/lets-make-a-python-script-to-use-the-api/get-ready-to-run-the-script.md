# Get ready to run the script

In order to run this script we need to add a "main" section so Python knows where to start executing our code. At the bottom outside the function that we have defined lets go ahead and create the main section which will execute the search function that we wrote. When the script is executed it will search for all opportunities and then opportunities with the word "health".&#x20;

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
    
# Run the search
if __name__ == "__main__":   
    print("\nSearching for health-related opportunities...")
    search_opportunities("health")
```

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
