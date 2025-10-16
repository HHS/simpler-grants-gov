# Try some variations

Now that you've made your first call, let's try a few variations to see different features:

#### Variation 1: Search for Specific Opportunities

This searches for education-related opportunities that are currently posted, sorted by deadline.

```bash
curl -X POST "https://api.simpler.grants.gov/v1/opportunities/search" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "education", 
    "filters": {
      "opportunity_status": {"one_of": ["posted"]}
    },
    "pagination": {
      "page_offset": 1,
      "page_size": 10,
      "sort_order": [
        {
          "order_by": "close_date",
          "sort_direction": "ascending"
        }
      ]
    }
  }'
```

#### Variation 2:  Filter by Agency

This finds opportunities from the National Science Foundation or National Institutes of Health.



```bash
curl -X POST "https://api.simpler.grants.gov/v1/opportunities/search" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "agency": {"one_of": ["NSF", "NIH"]},
      "opportunity_status": {"one_of": ["posted", "forecasted"]}
    },
    "pagination": {
      "page_offset": 1,
      "page_size": 15,
      "sort_order": [
        {
          "order_by": "agency_name",
          "sort_direction": "ascending"
        }
      ]
    }
  }'
```

Next we are going to create a Python script together which will tie in everything that we have learned so far. By the end of it you will be ready to create and manage your own software which leverages Simpler.Grants.gov's API.&#x20;

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](common-issues-and-solutions.md).&#x20;
{% endhint %}
