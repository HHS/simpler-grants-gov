"""OpenAPI spec post-processing utilities for CommonGrants protocol compliance.

PROBLEM
-------
The CommonGrants CLI validation tool expects OpenAPI specs to follow specific composition patterns that are compatible with the CommonGrants protocol base specification. However, APIFlask (our web framework) generates OpenAPI specs with different composition patterns that cause spec validation to fail.

Specifically, APIFlask generates schemas like this:
```yaml
paginationInfo:
  type: [object]          # ← Problem: unnecessary type field
  allOf:
  - $ref: '#/components/schemas/PaginatedResultsInfo'
```

But the CommonGrants protocol expects:
```yaml
paginationInfo:
  allOf:                  # ← Expected: just allOf, no type field
  - $ref: '#/components/schemas/CommonGrants.Pagination.PaginatedResultsInfo'
```

This causes opaque validation errors like:
"Type mismatch. Base is 'object', impl is 'object'"

SOLUTION
--------
Post-process the generated OpenAPI spec to transform the composition patterns from APIFlask's format to the CommonGrants protocol's expected format. This is done by:

1. **Schema Inlining**: Replace `$ref` references in response schemas with the actual schema definitions to enable composition pattern fixes.

2. **Composition Pattern Fixing**: Recursively find and fix the problematic pattern:
   - Find: `type: [object]` + `allOf` (or `type: "object"` + `allOf`)
   - Fix: Remove the `type` field, keep only `allOf`

3. **Generic Pattern Detection**: Use recursive traversal to find and fix the pattern anywhere in the schema structure, regardless of property names or nesting levels.

IMPLEMENTATION
--------------
- `transform_spec_composition_to_cg()`: Main function that orchestrates the post-processing
- `fix_schema_composition()`: Generic recursive function that fixes composition patterns
"""

from typing import Any


def transform_spec_composition_to_cg(spec: dict[str, Any]) -> dict[str, Any]:
    """Post-process the OpenAPI spec to match CommonGrants composition patterns."""

    # Fix response schema composition patterns
    paths = spec.get("paths", {})
    for _path, path_obj in paths.items():
        for _method, operation in path_obj.items():
            responses = operation.get("responses", {})
            for _status_code, response in responses.items():
                content = response.get("content", {})
                for _media_type, media_obj in content.items():
                    schema = media_obj.get("schema", {})
                    if "$ref" in schema:
                        # This is a separate response schema - we need to inline it
                        schema_ref = schema["$ref"]
                        schema_name = schema_ref.split("/")[-1]

                        # Get the actual schema from components
                        components = spec.get("components", {})
                        schemas = components.get("schemas", {})
                        actual_schema = schemas.get(schema_name, {})

                        # Replace the $ref with the actual schema
                        media_obj["schema"] = actual_schema

                        # Fix the composition patterns
                        media_obj["schema"] = fix_schema_composition(media_obj["schema"], schemas)

    # Also fix composition patterns in component schemas
    components = spec.get("components", {})
    schemas = components.get("schemas", {})
    for schema_name, schema_def in schemas.items():
        schemas[schema_name] = fix_schema_composition(schema_def, schemas)

    return spec


def fix_schema_composition(schema: dict[str, Any], all_schemas: dict[str, Any]) -> dict[str, Any]:
    """
    Fix schema composition to match CommonGrants patterns.
    Recursively finds and fixes the problematic pattern: `type: [object] + allOf`
    """
    if not isinstance(schema, dict):
        return schema  # type: ignore[unreachable]

    # Fix the problematic pattern: type: [object] + allOf -> just allOf
    if "type" in schema and "allOf" in schema:
        # Check if type is [object] or just "object"
        type_value = schema["type"]
        if (isinstance(type_value, list) and "object" in type_value) or type_value == "object":
            # Remove the type field, keep only allOf
            schema.pop("type", None)

    # Recursively process nested objects
    for key, value in schema.items():
        if isinstance(value, dict):
            schema[key] = fix_schema_composition(value, all_schemas)
        elif isinstance(value, list):
            schema[key] = [
                fix_schema_composition(item, all_schemas) if isinstance(item, dict) else item
                for item in value
            ]

    return schema
