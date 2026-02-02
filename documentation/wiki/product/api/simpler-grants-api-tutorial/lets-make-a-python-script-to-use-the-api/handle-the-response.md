# Handle the response

Now that we know that everything is working, we are getting a JSON response to our API call which is saved to the response variable that we created. From there we can manipulate the variable and print out information from the response to view when we run the script. Lets clean up the test run that we wrote earlier and use print to format the JSON into something that is easier to read.&#x20;

Try playing around with different search terms and see what the API responds with. For example, If you replace `"health"`  in the main function call with `"space"`, the API will filter results by that term instead.

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
    
    # Check if the request was successful
    # If it’s a success (200), we parse JSON and loop through the list at data["data"].
    if response.status_code == 200:
        data = response.json()
        opportunities = data["data"]
   
    # Format and print out the response 
        print(f"Found {len(opportunities)} opportunities:")
        print("-" * 50)
        
        # We print a few helpful fields from each opportunity.
        for opp in opportunities:
            print(f"Title: {opp['opportunity_title']}")
            print(f"Agency: {opp['agency_name']}")
            print(f"Posted: {opp['post_date']}")
            if opp.get('close_date'):
                print(f"Deadline: {opp['close_date']}")
            print("-" * 50)
    # Otherwise, we show the error code and the server’s message.
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

