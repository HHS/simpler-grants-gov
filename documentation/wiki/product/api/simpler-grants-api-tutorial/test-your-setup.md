# Test your setup

Let's make sure everything is working with a simple test call.

#### Option A: Using cURL (Recommended for Beginners)

Open your terminal and copy and paste in and then run this command (replace `YOUR_API_KEY_HERE` with your actual key):

```bash
curl -X POST "https://api.simpler.grants.gov/v1/opportunities/search" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "pagination": {
      "page_offset": 1,
      "page_size": 5,
      "sort_order": [
        {
          "order_by": "opportunity_id",
          "sort_direction": "descending"
        }
      ]
    }
  }'
```

#### Option B: Using Postman

1. **Create a new request**:
   * Method: `POST`
   * URL: `https://api.simpler.grants.gov/v1/opportunities/search`
2. **Add headers**:
   * `X-API-Key`: `YOUR_API_KEY_HERE`
   * `Content-Type`: `application/json`
3.  **Add request body** (select "raw" and "JSON"):

    ```json
    {
      "pagination": {
        "page_offset": 1,
        "page_size": 5,
        "sort_order": [
          {
            "order_by": "opportunity_id",
            "sort_direction": "descending"
          }
        ]
      }
    }
    ```
4. **Click Send**

#### What Should Happen

If everything worked, you should see a response like this:

```json
{
  "message": "Success",
  "data": [
    {
      "opportunity_id": "12345678-1234-1234-1234-123456789012",
      "opportunity_number": "EPA-R9-SFUND-23-003",
      "opportunity_title": "Environmental Research Grant Program",
      "agency_name": "Environmental Protection Agency",
      "post_date": "2024-01-15",
      "close_date": "2024-06-30",
      "opportunity_status": "posted"
    }
  ],
  "pagination_info": {
    "page_offset": 1,
    "page_size": 5,
    "total_pages": 247,
    "total_records": 1234
  }
}
```

{% hint style="success" %}
**Congratulations**\
You just made your first API call and retrieved grant opportunities!
{% endhint %}

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](common-issues-and-solutions.md).&#x20;
{% endhint %}

