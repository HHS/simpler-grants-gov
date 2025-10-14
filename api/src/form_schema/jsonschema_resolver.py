from typing import Any
import jsonref

from src.form_schema.shared import get_shared_schemas

def _get_shared_schemas_map():
    """Get a mapping of shared schema URI to the shared schema itself."""
    return {shared_schema.schema_uri: shared_schema for shared_schema in get_shared_schemas()}

def _loader(uri: str, **kwargs) -> Any:
    """Handle mapping of URIs to specific shared schemas

       For example, if the $ref in the JSON schema is https://example/schemas/my-schema.json#my_field
       then this function would receive all but the "#my_field" bit.
    """
    shared_schema_map = _get_shared_schemas_map()
    if uri in shared_schema_map:
        return shared_schema_map[uri].json_schema

    return jsonref.jsonloader(uri, **kwargs)

def resolve_jsonschema(unresolved_schema: dict[str, Any]) -> dict[str, Any]:
    return jsonref.replace_refs(
        unresolved_schema,
        loader=_loader,  # Tell it how to resolve URIs to avoid network calls
        lazy_load=False, # Tell it to actually do the resolution and not defer it
        proxies=False    # Tell it to use python dicts, not its own internal jsonref types
    )