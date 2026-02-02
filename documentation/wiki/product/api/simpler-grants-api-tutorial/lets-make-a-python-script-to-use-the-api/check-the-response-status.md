# Check the response status

Now let's run the script to make sure that everything is working. We are going to add error validation to the response so that when the script executes it will either return a success message or an error message.

<pre class="language-python"><code class="lang-python">import requests
<strong>import json
</strong>
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
    # If it’s a success (200), we print the JSON and "Success". 
    if response.status_code == 200:
        data = response.json()
        print("Success")
        print(data)
        
    # Otherwise, we show the error code and the server’s message.
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        
# Run the search
if __name__ == "__main__":
    print("\nSearching for health-related opportunities...")
    search_opportunities("health")
</code></pre>

Now let's run the code that we have written to test the response from the Simpler.Grants.gov API. Save what you have written and then go back to your terminal. You can execute the command you see below which will run the script once.&#x20;

{% tabs %}
{% tab title="Windows(PowerShell)" %}
```powershell
python search_opportunities.py
```
{% endtab %}

{% tab title="MacOS/Linux" %}
<pre class="language-bash"><code class="lang-bash"><strong>python3 search_opportunities.py
</strong></code></pre>
{% endtab %}
{% endtabs %}

If you are getting an error message please check to make sure that your code matches the example. if you continue to have issues check out the [common issues & solutions section](../common-issues-and-solutions.md) to see if it is applicable to the error you are seeing.&#x20;

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
