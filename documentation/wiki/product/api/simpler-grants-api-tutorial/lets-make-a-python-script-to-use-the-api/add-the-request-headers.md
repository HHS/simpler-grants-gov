# Add the request headers

Now that we have a function defined, let's go ahead and add the request headers. You should be familiar with these from the tests that we did earlier. They are used to authenticate the application with the Simpler.Grants.gov API.

<pre class="language-python"><code class="lang-python">import requests
import json

# Your API configuration
API_KEY = "YOUR_API_KEY_HERE"  # Replace with your actual key
BASE_URL = "https://api.simpler.grants.gov"

# The function that will contain search logic
<strong>def search_opportunities(search_term=""):
</strong>    """Search for grant opportunities"""
    # These headers will authenticate your API call
     headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
</code></pre>

{% hint style="info" %}
* `X-API-Key` authenticates you.
* `Content-Type` tells the server we’re sending JSON.
{% endhint %}

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
