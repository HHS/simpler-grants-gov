# Let's make a python script to use the API

Now let's apply everything we have learned so far to build a simple script together. Over the next few steps in the tutorial we will work together step by step to create a working Python script which can call and display responses from the Simpler.Grants.gov API. Below you can see the final project code that we will build together. This capstone project in the tutorial will give you everything you need to develop software which leverages our powerful federal grants API.&#x20;

### Final Project Code (for reference)

```python
import requests
import json

# Your API configuration
API_KEY = "YOUR_API_KEY_HERE"  # Replace with your actual key
BASE_URL = "https://api.simpler.grants.gov"

def search_opportunities(search_term=""):
    """Search for grant opportunities"""
    
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    # Build the search request
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
    
    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()
        opportunities = data["data"]
        
        print(f"Found {len(opportunities)} opportunities:")
        print("-" * 50)
        
        for opp in opportunities:
            print(f"Title: {opp['opportunity_title']}")
            print(f"Agency: {opp['agency_name']}")
            print(f"Posted: {opp['post_date']}")
            if opp.get('close_date'):
                print(f"Deadline: {opp['close_date']}")
            print("-" * 50)
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

# Run the search
if __name__ == "__main__":
    print("\nSearching for health-related opportunities...")
    search_opportunities("health")

```

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
