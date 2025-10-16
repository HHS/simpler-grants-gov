# Understanding what just happened

Let's break down that API call:

#### The URL

* `https://api.simpler.grants.gov` - This is our API base URL
* `/v1/opportunities/search` - This endpoint searches for grant opportunities
* `v1` means this is version 1 of our API

#### The Headers

* `X-API-Key: YOUR_API_KEY_HERE` - This authenticates your request
* `Content-Type: application/json` - This tells the server we're sending JSON data

#### The Request Body

```json
{
  "pagination": {
    "page_offset": 1,        // Start with the first page
    "page_size": 5,          // Return 5 opportunities per page
    "sort_order": [          // Sort by opportunity ID, newest first
      {
        "order_by": "opportunity_id",
        "sort_direction": "descending"
      }
    ]
  }
}
```

#### The Response

* `message`: Always "Success" when things work
* `data`: An array of opportunities (5 in this case)
* `pagination_info`: Information about the total results and pages

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](common-issues-and-solutions.md).&#x20;
{% endhint %}
