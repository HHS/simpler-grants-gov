---
description: Updated 9/17/2025 see our OpenAPI doc for most recent changes.
---

# Search opportunities

### **Endpoint**: `POST /v1/opportunities/search`

Search for grant opportunities using various filters and criteria.

### Caveats

* Search will only return a maximum of 10,000 opportunities. Any opportunties past that will be culled for performance. If you are receiving the maximum amount of opportunities as a response there is a good chance that you are not getting all possible results returned. In that case it is recommended to add more filters to get a smaller subset of opportunities. If you want to get an export of all opportunities see the [extracts endpoint. ](extracts.md)
* Search should return the same data as GET opportunity, except attachments are not included and the data is cached in search hourly.&#x20;

### **Get Opportunity Details**

**Endpoints**:

* `GET /v1/opportunities/{opportunity_id}` (UUID format)

Retrieve detailed information about a specific opportunity.

### Search Parameters

The opportunity search endpoint accepts the following parameters:

#### Query Parameters

* **`query`** (string, optional): Free-text search across multiple fields
  * Example: `"research"`, `"education funding"`
  * Maximum length: 100 characters
* **`query_operator`** (string, optional): How to combine search terms
  * Values: `"AND"` (default), `"OR"`

#### Filters

**Agency & Organization**

* **`top_level_agency`**: Filter by agency code
  * Example: `{"one_of": ["USAID", "DOC"]}`

**Funding Details**

* **`funding_instrument`**: Type of funding
  * Values: `"cooperative_agreement"`, `"grant"`, etc.
  * Example: `{"one_of": ["grant"]}`
* **`funding_category`**: Category of funding
  * Values: `"recovery_act"`, `"arts"`, `"natural_resources"`, etc.

**Eligibility**

* **`applicant_type`**: Who can apply
  * Values: `"state_governments"`, `"county_governments"`, `"individuals"`, etc.
  * Example: `{"one_of": ["state_governments", "nonprofits"]}`

**Status & Timing**

* **`opportunity_status`**: Current status
  * Values: `"forecasted"`, `"posted"`, `"closed"`, `"archived"`
  * Example: `{"one_of": ["posted", "forecasted"]}`
* **`post_date`**: When opportunity was posted
  * Example: `{"start_date": "2024-01-01", "end_date": "2024-12-31"}`
* **`close_date`**: Application deadline
  * Example: `{"start_date": "2024-06-01"}`

**Financial Filters**

* **`award_floor`**: Minimum award amount
  * Example: `{"min": 10000}`
* **`award_ceiling`**: Maximum award amount
  * Example: `{"max": 1000000}`
* **`expected_number_of_awards`**: Expected number of awards
  * Example: `{"min": 5, "max": 25}`
* **`estimated_total_program_funding`**: Total program funding
  * Example: `{"min": 100000, "max": 250000}`

**Other Filters**

* **`assistance_listing_number`**: Specific CFDA number
  * Format: `##.##` (e.g., "45.C9")
  * Example: `{"one_of": ["45.C9"]}`
  * Format: `##.###` (e.g., "45.1C9")
  * Example: `{"one_of": ["45.1C9"]}`
* **`is_cost_sharing`**: Whether cost sharing is required
  * Example: `{"one_of": [true]}`

#### Pagination & Sorting

*   **`pagination`** (required): Controls result pagination and sorting

    ```json
    {
      "page_offset": 1,
      "page_size": 25,
      "sort_order": [
        {
          "order_by": "opportunity_id",
          "sort_direction": "descending"
        }
      ]
    }
    ```

    **Sort Options**:

    * `relevancy`, `opportunity_id`, `opportunity_number`
    * `opportunity_title`, `post_date`, `close_date`
    * `agency_code`, `agency_name`, `top_level_agency_name`
    * `award_floor`, `award_ceiling`

#### Response Format

* **`format`** (optional): Response format
  * Values: `"json"` (default), `"csv"`
  * CSV format returns a downloadable file

### Code Examples

{% tabs %}
{% tab title="Python" %}


```python
import requests
import json

# Your API configuration
API_KEY = "your_api_key_here"
BASE_URL = "https://api.simpler.grants.gov"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Basic search request
search_payload = {
    "query": "research",
    "filters": {
        "opportunity_status": {"one_of": ["posted", "forecasted"]},
        "funding_instrument": {"one_of": ["grant"]},
        "agency": {"one_of": ["NSF", "NIH"]}
    },
    "pagination": {
        "page_offset": 1,
        "page_size": 25,
        "sort_order": [
            {
                "order_by": "post_date",
                "sort_direction": "descending"
            }
        ]
    }
}

# Make the request
response = requests.post(
    f"{BASE_URL}/v1/opportunities/search",
    headers=headers,
    json=search_payload
)

if response.status_code == 200:
    data = response.json()
    opportunities = data["data"]
    print(f"Found {len(opportunities)} opportunities")
    
    for opp in opportunities:
        print(f"- {opp['opportunity_title']}")
        print(f"  Agency: {opp['agency_name']}")
        print(f"  Deadline: {opp.get('close_date', 'No deadline specified')}")
        print()
else:
    print(f"Error: {response.status_code} - {response.text}")
```
{% endtab %}

{% tab title="JavaScript/Node.js" %}
<pre class="language-javascript"><code class="lang-javascript"><strong>const fetch = require('node-fetch');
</strong>
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.simpler.grants.gov';

async function searchOpportunities() {
    const searchPayload = {
        query: "education",
        filters: {
            opportunity_status: { one_of: ["posted"] },
            applicant_type: { one_of: ["nonprofits", "state_governments"] }
        },
        pagination: {
            page_offset: 1,
            page_size: 10,
            sort_order: [
                {
                    order_by: "close_date",
                    sort_direction: "ascending"
                }
            ]
        }
    };

    try {
        const response = await fetch(`${BASE_URL}/v1/opportunities/search`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchPayload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Found ${data.data.length} opportunities`);
        
        data.data.forEach(opp => {
            console.log(`- ${opp.opportunity_title}`);
            console.log(`  Posted: ${opp.post_date}`);
            console.log(`  Closes: ${opp.close_date || 'No deadline'}`);
        });

        return data;
    } catch (error) {
        console.error('Error searching opportunities:', error);
    }
}

searchOpportunities();
</code></pre>
{% endtab %}

{% tab title="cURL" %}


```bash
# Basic search
curl -X POST "https://api.simpler.grants.gov/v1/opportunities/search" \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "climate",
    "filters": {
      "opportunity_status": {"one_of": ["posted"]},
      "funding_category": {"one_of": ["environment", "natural_resources"]}
    },
    "pagination": {
      "page_offset": 1,
      "page_size": 5,
      "sort_order": [
        {
          "order_by": "relevancy",
          "sort_direction": "descending"
        }
      ]
    }
  }'

# Download results as CSV
curl -X POST "https://api.simpler.grants.gov/v1/opportunities/search" \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -o "opportunities.csv" \
  -d '{
    "format": "csv",
    "filters": {
      "opportunity_status": {"one_of": ["posted"]}
    },
    "pagination": {
      "page_offset": 1,
      "page_size": 100,
      "sort_order": [
        {
          "order_by": "post_date",
          "sort_direction": "descending"
        }
      ]
    }
  }'
```
{% endtab %}
{% endtabs %}

### Response Format

#### JSON Response Structure

```json
{
  "message": "Success",
  "data": [
    {
      "opportunity_id": "12345678-1234-1234-1234-123456789012",
      "opportunity_number": "EPA-R9-SFUND-23-003",
      "opportunity_title": "Superfund Site Remediation Research",
      "agency_code": "EPA",
      "agency_name": "Environmental Protection Agency",
      "post_date": "2024-01-15",
      "close_date": "2024-06-30",
      "opportunity_status": "posted",
      "funding_instrument": "grant",
      "funding_category": "environment",
      "award_floor": 50000,
      "award_ceiling": 500000,
      "estimated_total_program_funding": 2000000,
      "expected_number_of_awards": 4,
      "applicant_types": ["nonprofits", "universities"],
      "summary": "Funding for research into innovative remediation technologies...",
      "is_cost_sharing": false
    }
  ],
  "pagination_info": {
    "page_offset": 1,
    "page_size": 25,
    "total_pages": 15,
    "total_records": 367
  },
  "facet_counts": {
    "agency_name": {
      "EPA": 45,
      "NSF": 32,
      "NIH": 28
    },
    "funding_instrument": {
      "grant": 89,
      "cooperative_agreement": 16
    }
  }
}
```

### Error Handling

#### Common HTTP Status Codes

* **200 OK**: Request successful
* **400 Bad Request**: Invalid request parameters
* **401 Unauthorized**: Missing or invalid API key
* **403 Forbidden**: API key lacks required permissions
* **429 Too Many Requests**: Rate limit exceeded
* **500 Internal Server Error**: Server error

#### Error Response Format

```json
{
  "message": "Error description",
  "status_code": 400,
  "errors": [
    {
      "field": "pagination.page_size",
      "message": "Must be between 1 and 100"
    }
  ]
}
```
