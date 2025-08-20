# API Gateway Adapter

This adapter provides a mock-able interface for AWS API Gateway operations, following the same pattern as the SES adapter.

## Usage

```python
from src.adapters.aws import get_apigateway_client

# Get client (automatically switches between mock and real based on env var)
client = get_apigateway_client()

# Create an API key
api_key = client.create_api_key(
    name="my-api-key",
    description="API key for my application",
    enabled=True,
    tags={"Environment": "production"}
)

# Get API key (with or without value)
key_info = client.get_api_key(api_key.id, include_value=True)

# Update API key
patch_ops = [
    {"op": "replace", "path": "description", "value": "Updated description"}
]
updated_key = client.update_api_key(api_key.id, patch_ops)

# Delete API key
client.delete_api_key(api_key.id)

# Usage plan operations
usage_plans = client.get_usage_plans()
client.create_usage_plan_key(usage_plan_id="plan-123", key_id=api_key.id)
client.delete_usage_plan_key(usage_plan_id="plan-123", key_id=api_key.id)
```

## Configuration

The adapter uses the `USE_MOCK_APIGATEWAY_CLIENT` environment variable to determine whether to use the mock or real client:

- `USE_MOCK_APIGATEWAY_CLIENT=TRUE` - Use mock client (default in local.env)
- `USE_MOCK_APIGATEWAY_CLIENT=FALSE` - Use real AWS API Gateway client (default in production)

## Mock Client Features

The mock client provides:

- Full API key CRUD operations
- Usage plan key associations
- Proper error simulation (e.g., NotFoundException for missing keys)
- Configurable mock data for testing

## Testing

The mock client is particularly useful for:
- Local development without AWS credentials
- Unit testing without external dependencies
- Integration testing with predictable responses

See `test_apigateway_adapter.py` for comprehensive usage examples.
