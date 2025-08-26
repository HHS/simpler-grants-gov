"""Generated Marshmallow schemas for CommonGrants Protocol models."""

# Import all marshmallow schemas from the PySDK
from common_grants_sdk.schemas_marshmallow import *

# Dynamically export all schemas that end with "Schema"
import common_grants_sdk.schemas_marshmallow.generated_schema as generated_schema

# Get all schema classes from the generated_schema module
schema_classes = [
    name for name in dir(generated_schema) 
    if name.endswith("Schema") and not name.startswith("_")
]

# Export all schema classes
__all__ = schema_classes
