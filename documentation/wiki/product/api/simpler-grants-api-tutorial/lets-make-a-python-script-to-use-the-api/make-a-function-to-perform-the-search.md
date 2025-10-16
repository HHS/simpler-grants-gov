# Make a function to perform the search

Since we have the needed packages imported and the API configuration variables set, we can now start to do things with them. First let's define a function that will perform the search.&#x20;

<pre class="language-python"><code class="lang-python">import requests
import json

# Your API configuration
API_KEY = "YOUR_API_KEY_HERE"  # Replace with your actual key
BASE_URL = "https://api.simpler.grants.gov"

# The function that will contain search logic
<strong>def search_opportunities(search_term=""):
</strong>    """Search for grant opportunities"""
</code></pre>

{% hint style="info" %}
The default `search_term=""` means “no keyword filter.”
{% endhint %}

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
