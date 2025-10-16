---
description: Updated 9/17/2025 see our OpenAPI doc for most recent changes.
---

# Extracts

### Core Endpoints

**List Extract Metadata**

**Endpoint**: `POST /v1/extracts`

Retrieve metadata about available data extracts, including file information, creation dates, and download URLs.

### Extract Types

The system provides the following types of data extracts:

#### Available Extract Types

* **`opportunities_json`**: Complete opportunity data in JSON format
* **`opportunities_csv`**: Complete opportunity data in CSV format

### Extract Metadata API

#### Request Parameters

The extract metadata endpoint accepts the following parameters:

**Filters**

* **`extract_type`** (enum, optional): Filter by specific extract type
  * Values: `"opportunities_json"`, `"opportunities_csv"`
  * Example: `"opportunities_json"`
*   **`created_at`** (date range, optional): Filter by extract creation date

    ```json
    {
      "start_date": "2024-01-01",
      "end_date": "2024-12-31"
    }
    ```

**Pagination (Required)**

*   **`pagination`**: Controls result pagination and sorting

    ```json
    {
      "page_offset": 1,
      "page_size": 25,
      "sort_order": [
        {
          "order_by": "created_at",
          "sort_direction": "descending"
        }
      ]
    }
    ```

    **Sort Options**:

    * `created_at`: When the extract was created

### Code Examples

{% tabs %}
{% tab title="Python" %}


```python
import requests
import json
from datetime import datetime, timedelta

# Your API configuration
API_KEY = "your_api_key_here"
BASE_URL = "https://api.simpler.grants.gov"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

def get_latest_extracts(extract_type=None, days_back=30):
    """Get extract metadata for the last N days"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    filters = {
        "created_at": {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        }
    }
    
    if extract_type:
        filters["extract_type"] = extract_type
    
    payload = {
        "filters": filters,
        "pagination": {
            "page_offset": 1,
            "page_size": 50,
            "sort_order": [
                {
                    "order_by": "created_at",
                    "sort_direction": "descending"
                }
            ]
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/v1/extracts",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        data = response.json()
        extracts = data["data"]
        print(f"Found {len(extracts)} extracts")
        
        for extract in extracts:
            print(f"- {extract['extract_type']} created {extract['created_at']}")
            print(f"  File: {extract.get('file_name', 'N/A')}")
            print(f"  Size: {extract.get('file_size', 'Unknown')} bytes")
            if extract.get('download_url'):
                print(f"  Download: {extract['download_url']}")
            print()
        
        return extracts
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return []

def download_extract_file(extract_metadata, local_filename):
    """Download an extract file to local storage"""
    download_url = extract_metadata.get('download_url')
    if not download_url:
        print("No download URL available for this extract")
        return False
    
    try:
        # Note: Download URLs may be pre-signed and not require API key
        response = requests.get(download_url, stream=True)
        response.raise_for_status()
        
        with open(local_filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded {local_filename}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error downloading file: {e}")
        return False

# Usage examples
print("Getting latest opportunity JSON extracts...")
json_extracts = get_latest_extracts(extract_type="opportunities_json", days_back=7)

if json_extracts:
    latest_extract = json_extracts[0]
    filename = f"opportunities_{latest_extract['created_at'][:10]}.json"
    download_extract_file(latest_extract, filename)

print("\nGetting all recent extracts...")
all_extracts = get_latest_extracts(days_back=14)
```
{% endtab %}

{% tab title="JavaScript/Node.js" %}


```javascript
const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.simpler.grants.gov';

async function getExtractMetadata(extractType = null, daysBack = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    const filters = {
        created_at: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
        }
    };

    if (extractType) {
        filters.extract_type = extractType;
    }

    const payload = {
        filters: filters,
        pagination: {
            page_offset: 1,
            page_size: 50,
            sort_order: [
                {
                    order_by: "created_at",
                    sort_direction: "descending"
                }
            ]
        }
    };

    try {
        const response = await fetch(`${BASE_URL}/v1/extracts`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Found ${data.data.length} extracts`);
        
        data.data.forEach(extract => {
            console.log(`- ${extract.extract_type} created ${extract.created_at}`);
            console.log(`  File: ${extract.file_name || 'N/A'}`);
            if (extract.download_url) {
                console.log(`  Download available`);
            }
        });

        return data.data;
    } catch (error) {
        console.error('Error fetching extract metadata:', error);
        return [];
    }
}

async function downloadExtract(extractMetadata, localFilename) {
    const downloadUrl = extractMetadata.download_url;
    if (!downloadUrl) {
        console.log('No download URL available for this extract');
        return false;
    }

    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const fileStream = fs.createWriteStream(localFilename);
        response.body.pipe(fileStream);

        return new Promise((resolve, reject) => {
            fileStream.on('finish', () => {
                console.log(`Downloaded ${localFilename}`);
                resolve(true);
            });
            fileStream.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading extract:', error);
        return false;
    }
}

// Usage
async function main() {
    console.log('Getting latest CSV extracts...');
    const csvExtracts = await getExtractMetadata('opportunities_csv', 7);
    
    if (csvExtracts.length > 0) {
        const latestExtract = csvExtracts[0];
        const filename = `opportunities_${latestExtract.created_at.split('T')[0]}.csv`;
        await downloadExtract(latestExtract, filename);
    }

    console.log('\nGetting all recent extracts...');
    const allExtracts = await getExtractMetadata(null, 14);
}

main();
```
{% endtab %}

{% tab title="cURL" %}


```bash
# Get metadata for all extracts from the last 7 days
curl -X POST "https://api.simpler.grants.gov/v1/extracts" \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "created_at": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-08"
      }
    },
    "pagination": {
      "page_offset": 1,
      "page_size": 25,
      "sort_order": [
        {
          "order_by": "created_at",
          "sort_direction": "descending"
        }
      ]
    }
  }'

# Get metadata for JSON extracts only
curl -X POST "https://api.simpler.grants.gov/v1/extracts" \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "extract_type": "opportunities_json"
    },
    "pagination": {
      "page_offset": 1,
      "page_size": 10,
      "sort_order": [
        {
          "order_by": "created_at",
          "sort_direction": "descending"
        }
      ]
    }
  }'

# Download an extract file (replace URL with actual download URL from metadata response)
curl -o "opportunities_2024-01-01.json" \
  "https://example-bucket.s3.amazonaws.com/extracts/opportunities_2024-01-01.json?signature=..."
```
{% endtab %}
{% endtabs %}

### Response Format

#### Extract Metadata Response Structure

```json
{
  "message": "Success",
  "data": [
    {
      "extract_metadata_id": "12345678-1234-1234-1234-123456789012",
      "extract_type": "opportunities_json",
      "file_name": "opportunities_2024-01-15.json",
      "file_size": 15728640,
      "download_url": "https://example-bucket.s3.amazonaws.com/extracts/opportunities_2024-01-15.json?signature=...",
      "created_at": "2024-01-15T02:30:00Z",
      "updated_at": "2024-01-15T02:35:00Z"
    },
    {
      "extract_metadata_id": "87654321-4321-4321-4321-210987654321",
      "extract_type": "opportunities_csv",
      "file_name": "opportunities_2024-01-15.csv",
      "file_size": 8294400,
      "download_url": "https://example-bucket.s3.amazonaws.com/extracts/opportunities_2024-01-15.csv?signature=...",
      "created_at": "2024-01-15T02:30:00Z",
      "updated_at": "2024-01-15T02:35:00Z"
    }
  ],
  "pagination_info": {
    "page_offset": 1,
    "page_size": 25,
    "total_pages": 3,
    "total_records": 67
  }
}
```

#### Extract File Formats

**JSON Extract Structure**

The opportunities JSON extract contains an array of opportunity objects with complete data:

```json
[
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
    "is_cost_sharing": false,
    "attachments": [
      {
        "attachment_id": "attachment-123",
        "file_name": "funding_announcement.pdf",
        "download_url": "https://example.com/attachments/funding_announcement.pdf"
      }
    ]
  }
]
```

**CSV Extract Structure**

The opportunities CSV extract contains the same data as the JSON output in tabular format with the following columns:

* `opportunity_id`
* `opportunity_number`
* `opportunity_title`
* `agency_code`
* `agency_name`
* `post_date`
* `close_date`
* `opportunity_status`
* `funding_instrument`
* `funding_category`
* `award_floor`
* `award_ceiling`
* `estimated_total_program_funding`
* `expected_number_of_awards`
* `applicant_types` (pipe-separated values)
* `summary`
* `is_cost_sharing`

### Error Handling

#### Common HTTP Status Codes

* **200 OK**: Request successful
* **400 Bad Request**: Invalid request parameters
* **401 Unauthorized**: Missing or invalid API key
* **403 Forbidden**: API key lacks required permissions
* **404 Not Found**: Extract not found
* **429 Too Many Requests**: Rate limit exceeded
* **500 Internal Server Error**: Server error

#### Error Response Format

```json
{
  "message": "Error description",
  "status_code": 400,
  "errors": [
    {
      "field": "filters.extract_type",
      "message": "Must be one of: opportunities_json, opportunities_csv"
    }
  ]
}
```
