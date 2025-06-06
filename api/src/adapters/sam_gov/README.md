# SAM.gov API Client

This module provides a client for interacting with the SAM.gov API, particularly for downloading data extracts.

## Features

- Download data extracts from SAM.gov
- Mock client for local development and testing
- Factory pattern for easy client instantiation
- Detailed error handling and logging
- S3 support for downloading extracts directly to S3 buckets

## Usage

### Basic Extract Download

```python
from src.adapters.sam_gov import create_sam_gov_client, SamExtractRequest

# Create a client (uses environment variables for configuration)
client = create_sam_gov_client()

# Define the extract request
request = SamExtractRequest(
    file_name="SAM_PUBLIC_MONTHLY_V2_20220406.ZIP"
)

# Download the extract to a local file
response = client.download_extract(request, "path/to/output.zip")

print(f"Downloaded file: {response.file_name}")
print(f"Size: {response.file_size} bytes")
print(f"Content type: {response.content_type}")
print(f"Download date: {response.download_date}")
```

### S3 Support

The client supports downloading extracts directly to S3:

```python
# Download the extract to an S3 location
response = client.download_extract(
    request, 
    "s3://your-bucket/path/to/extract.zip"
)
```

### Using the Mock Client

For local development and testing, you can use the mock client:

```python
# Method 1: Environment variable
import os
os.environ["SAM_GOV_USE_MOCK"] = "true"
client = create_sam_gov_client()

# Method 2: Config object
from src.adapters.sam_gov import create_sam_gov_client, SamGovConfig

config = SamGovConfig(use_mock=True)
client = create_sam_gov_client(config=config)
```

### Custom Configuration

```python
from src.adapters.sam_gov import create_sam_gov_client, SamGovConfig

# Create custom configuration
config = SamGovConfig(
    base_url="https://custom-api.sam.gov",
    api_key="your-api-key",
    timeout=10,
    use_mock=False
)

# Create client with custom config
client = create_sam_gov_client(config=config)
```

## Authentication

The SAM.gov API requires an API key for authentication. The client passes this key as a header.

## Environment Variables

The client uses the following environment variables:

- `SAM_GOV_BASE_URL`: Base URL for the SAM.gov API
- `SAM_GOV_API_KEY`: API key for authentication
- `SAM_GOV_API_TIMEOUT`: Timeout in seconds for API requests
- `SAM_GOV_USE_MOCK`: Use mock client if set to "true", "1", or "yes"
- `SAM_GOV_MOCK_DATA_FILE`: Path to a JSON file containing mock extract metadata
- `SAM_GOV_MOCK_EXTRACT_DIR`: Path to a directory containing mock extract files

## Implementation Details

The client handles various error cases:
- Invalid parameters (missing file_name, API key, or API URL)
- HTTP errors (404 Not Found, 500 Internal Server Error)
- Timeout errors
- IO errors when saving files

The mock client simulates the SAM.gov API for testing and development purposes, generating mock files with random content or using pre-defined extract files from a specified directory. It can also load mock data from a JSON file specified by the `mock_data_file` configuration option. 