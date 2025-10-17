# Overview
This folder contains our shared schemas, JSON schemas
that contain common types (eg. address or person name)
that we will use in our JSON schemas across forms.

# Usage

You can reference a field from a shared schema by using it
in a JSON schema definition by doing:

```python
from api.src.form_schema.shared import address_shared

MY_FORM_SCHEMA = {
  "type": "object",
  "properties": {
    "my_field": { "allOf": [{"$ref": address_shared.field_ref("simple_address") }] }
  }
}
```

The `field_ref` function will handle constructing the format properly
and will output something like: `https://files.simpler.grants.gov/schemas/address_shared_v1.json#simple_address`

# Creating a new shared schema
A shared schema contains a group of related field/object definitions
and has a name + URI.

After defining the fields within your schema, define the shared schema object:

```py
from src.form_schema.shared.shared_schema import SharedSchema

EXAMPLE_SHARED_JSON_SCHEMA_V1 = {
    "my_example": {
        "type": "string"
    }
}

EXAMPLE_SHARED_V1 = SharedSchema(
    schema_name="example_shared_v1",
    json_schema=EXAMPLE_SHARED_JSON_SCHEMA_V1
)
```

Then make sure to add this schema to `get_shared_schemas` in
the `__init__.py` file in this folder.
