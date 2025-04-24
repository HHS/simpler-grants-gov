# SAM.gov API Client

This module provides a client for interacting with the SAM.gov Entity Extracts API (https://open.gsa.gov/api/sam-entity-extracts-api/).

## Features

- Retrieve entity information from SAM.gov using Unique Entity IDs (UEIs)
- Mock client for local development and testing
- Factory pattern for easy client instantiation
- Detailed error handling and logging

## Usage

### Basic Usage

```python
from src.adapters.sam_gov import create_sam_gov_client, SamEntityRequest

# Create a client (uses environment variables for configuration)
client = create_sam_gov_client()

# Look up an entity by UEI
entity = client.get_entity(SamEntityRequest(uei="ABCDEFGHIJK1"))

if entity:
    print(f"Found entity: {entity.legal_business_name}")
    print(f"Status: {entity.entity_status}")
    print(f"Type: {entity.entity_type}")
else:
    print("Entity not found")
```

### Using the Mock Client

For local development and testing, you can use the mock client:

```python
# Method 1: Explicit
from src.adapters.sam_gov import create_sam_gov_client

client = create_sam_gov_client(use_mock=True)

# Method 2: Environment variable
import os
os.environ["SAM_GOV_USE_MOCK"] = "true"
client = create_sam_gov_client()
```

### Custom Configuration

```python
from src.adapters.sam_gov import create_sam_gov_client, SamGovConfig

# Create custom configuration
config = SamGovConfig(
    base_url="https://custom-api.sam.gov",
    api_key="your-api-key",
    timeout=10,
)

# Create client with custom config
client = create_sam_gov_client(config=config)
```

## Environment Variables

The client uses the following environment variables:

- `SAM_GOV_API_BASE_URL`: Base URL for the SAM.gov API (default: `https://open.gsa.gov/api/sam-entity-extracts-api`)
- `SAM_GOV_API_KEY`: API key for authentication
- `SAM_GOV_API_TIMEOUT`: Request timeout in seconds (default: `30`)
- `SAM_GOV_USE_MOCK`: Use mock client if set to "true", "1", or "yes"
- `SAM_GOV_MOCK_DATA_FILE`: Path to a JSON file containing mock entity data

## Example Script

See `src/examples/sam_gov_client_example.py` for a complete example of using the client.

Run it with:

```bash
# Using the real client
python -m src.examples.sam_gov_client_example --uei ABCDEFGHIJK1

# Using the mock client
python -m src.examples.sam_gov_client_example --uei ABCDEFGHIJK1 --use-mock
``` 