# Add the API configuration

Now under the imports we are going to add the API configuration. This is where we will have the API key that we generated earlier and the base url that we will be calling.&#x20;

```python
import requests
import json

# Your API configuration
API_KEY = "YOUR_API_KEY_HERE"  # Replace with your actual key
BASE_URL = "https://api.simpler.grants.gov"
```

{% hint style="info" %}
If you wanted to improve this project in the future you may want to look into moving the API\_KEY and BASE\_URL into a .env file so that they can be kept secret. You don't want to commit your API\_KEY to version control where others may be able to see it.
{% endhint %}

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
