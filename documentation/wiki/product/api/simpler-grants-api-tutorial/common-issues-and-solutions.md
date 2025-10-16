# Common issues & solutions

### Quick Reference

#### Essential Information

* **API Base URL**: `https://api.simpler.grants.gov`
* **Authentication Header**: `X-API-Key: YOUR_API_KEY_HERE`
* **Content Type**: `application/json`
* **Main Search Endpoint**: `POST /v1/opportunities/search`

#### Required Fields

Every search request must include:

```json
{
  "pagination": {
    "page_offset": 1,
    "page_size": 25,
    "sort_order": [
      {
        "order_by": "opportunity_id",
        "sort_direction": "descending"
      }
    ]
  }
}
```

#### Common Status Codes

* **200**: Success! Your request worked
* **400**: Bad request - check your JSON format
* **401**: Unauthorized - check your API key
* **429**: Too many requests - slow down
* **500**: Server error - try again later

#### Problem: "401 Unauthorized" Error

**Solution**: Check your API key

* Make sure you copied it correctly (all 25 characters)
* Verify you're using the header `X-API-Key` (not `X-Auth` or anything else)
* Ensure there are no extra spaces

#### Problem: "400 Bad Request" Error

**Solution**: Check your JSON format

* Use a JSON validator to make sure your request body is valid JSON
* Ensure `pagination` is always included - it's required
* Check that all field names match exactly (case-sensitive)

#### Problem: No Results Returned

**Solution**: Try broader search criteria

* Remove filters to see if there are any opportunities at all
* Try different search terms
* Check if you're filtering by dates that might exclude current opportunities

#### Problem: "Too Many Requests" Error

**Solution**: Slow down your requests

* Wait a few seconds between API calls
* The API has rate limits to ensure fair usage for everyone
