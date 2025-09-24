---
description: Updated 9/17/2025 See our OpenAPI docs for most recent changes.
---

# API

## API Gateway Developer Guide

### Overview

The Simpler Grants API Gateway provides developers with programmatic access to search federal grant opportunities through a RESTful API. This guide walks you through generating an API key via our web interface and integrating with your applications to search for funding opportunities.

{% hint style="danger" %}
The API is currently in early development. Features are under active development and subject to change. To see the latest changes please take a look at our [OpenAPI doc](https://api.simpler.grants.gov/docs#/Opportunity%20v1/post_v1_opportunities_search).&#x20;
{% endhint %}

### Getting Started

{% hint style="info" %}
Are you looking for more guidance? [Check out our full API tutorial](simpler-grants-api-tutorial/) to get started creating applications that leverage the Simpler.Grants.gov API.&#x20;
{% endhint %}

#### Prerequisites

* A user account on the Simpler Grants platform
* Basic understanding of REST APIs and HTTP requests
* Access to make HTTP requests from your application

#### Step 1: Generate Your API Key

1. **Log into the Platform**
   * Navigate to the Simpler Grants website
   * Sign in with your Login.gov credentials
2. **Access the API Dashboard**
   * Go to the developer page under the community dropdown or via this [link](https://simpler.grants.gov/developer)
   * Click "Manage API Keys" after reading through the developer page.
3. **Create a New API Key**
   * Click "Create API Key"&#x20;
   * Provide a descriptive name for your key (e.g., "My Grant Search App")
   * Click "Create API Key" to create the key

#### Step 2: API Authentication

All API requests must include your API key in the `X-API-Key` header:

```
X-API-Key: YOUR_API_KEY_HERE
```

### API Endpoints

#### Base URL

* **Production**: `https://api.simpler.grants.gov`
* **Development**: Contact [support](../simpler-grants.gov-analytics/) for development endpoints

#### **Core Endpoints**

{% content-ref url="search-opportunities.md" %}
[search-opportunities.md](search-opportunities.md)
{% endcontent-ref %}

{% content-ref url="extracts.md" %}
[extracts.md](extracts.md)
{% endcontent-ref %}

#### Common Issues

1. **Invalid API Key**
   * Ensure key is included in `X-API-Key` header
   * Verify key is active and not expired
   * Check for typos in the key
2. **Request Format Errors**
   * Ensure `Content-Type: application/json` header
   * Validate JSON syntax
   * Check required fields (pagination is required)
3. **Parameter Validation**
   * `page_size` must be between 1 and 100
   * Date formats must be YYYY-MM-DD
   * Enum values must match exactly (case-sensitive)

### Best Practices

#### Rate Limiting

* The API implements rate limiting to ensure fair usage
* If you receive 429 responses, implement exponential backoff
* Consider caching results to reduce API calls
* If you are searching all opportunities then use the extracts endpoint

#### Efficient Searching

* Use specific filters to reduce result sets
* Implement pagination for large result sets
* Consider using CSV format for bulk data downloads

#### Security

* Never expose API keys in client-side code
* Store keys securely using environment variables
* Rotate keys periodically
* Use HTTPS for all requests

#### Error Handling

* Always check HTTP status codes
* Implement retry logic with backoff for transient errors
* Log errors for debugging but don't expose sensitive information

### Example Use Cases

{% tabs %}
{% tab title="Grant Discovery Dashboard" %}
Build a dashboard that shows relevant opportunities based on user preferences:

<pre class="language-python"><code class="lang-python"><strong>def get_relevant_grants(user_interests, applicant_type):
</strong>    filters = {
        "opportunity_status": {"one_of": ["posted", "forecasted"]},
        "applicant_type": {"one_of": [applicant_type]}
    }
    
    # Search for each interest area
    all_opportunities = []
    for interest in user_interests:
        payload = {
            "query": interest,
            "filters": filters,
            "pagination": {"page_offset": 1, "page_size": 10}
        }
        # Make API call and collect results
        opportunities = search_opportunities(payload)
        all_opportunities.extend(opportunities)
    
    return deduplicate_opportunities(all_opportunities)
</code></pre>
{% endtab %}

{% tab title="Deadline Monitoring System" %}
Monitor approaching deadlines for relevant opportunities:

```python
def check_approaching_deadlines(days_ahead=30):
    end_date = datetime.now() + timedelta(days=days_ahead)
    
    payload = {
        "filters": {
            "opportunity_status": {"one_of": ["posted"]},
            "close_date": {
                "start_date": datetime.now().strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d")
            }
        },
        "pagination": {
            "page_offset": 1,
            "page_size": 100,
            "sort_order": [{"order_by": "close_date", "sort_direction": "ascending"}]
        }
    }
    
    return search_opportunities(payload)
```
{% endtab %}

{% tab title=" Funding Analytics" %}
Analyze funding trends and patterns:

```python
def analyze_funding_by_agency():
    payload = {
        "filters": {
            "opportunity_status": {"one_of": ["posted"]},
            "post_date": {"start_date": "2024-01-01"}
        },
        "pagination": {"page_offset": 1, "page_size": 1000}
    }
    
    response = search_opportunities(payload)
    
    # Analyze facet counts for agency distribution
    agency_stats = response.get("facet_counts", {}).get("agency_name", {})
    return sorted(agency_stats.items(), key=lambda x: x[1], reverse=True)
```
{% endtab %}
{% endtabs %}

### Support and Resources

#### Getting Help

* **Documentation**: Check this guide and the OpenAPI documentation
* **Issues**: Report bugs or request features through the appropriate channels
* **Community**: Join developer discussions and share experiences

#### Additional Resources

* [OpenAPI Specification](https://api.simpler.grants.gov/docs) - Interactive API documentation
* [GitHub Repository](https://github.com/HHS/simpler-grants-gov) - Source code and issue tracking
* [Release Notes](https://github.com/HHS/simpler-grants-gov/releases) - API updates and changes

***

**Note**: This API is under active development. Please refer to the latest documentation and release notes for the most current information. We welcome feedback and contributions from the developer community.
