from collections.abc import Callable, Mapping, Sequence
from typing import Any

import jsonref

from src.form_schema.shared import SharedSchema, get_shared_schemas

"""
HACKY FIX

The jsonref library has a bug when resolving references that
can cause it to resolve them incorrectly. This was fixed in
https://github.com/gazpachoking/jsonref/commit/e827f232cdbef2f7f49d3ccc6e93bc43868ae96b
but the library hasn't made a new release available in PyPi
more than a year after the fix was made. As an alternative
to changing our poetry to install directly from GitHub, we
have copied the change here and swap out the function in the jsonref library.
"""


def _walk_refs(
    obj: Any, func: Callable[[Any], Any], replace: bool = False, _processed: dict | None = None
) -> Any:
    # Keep track of already processed items to prevent recursion
    _processed = _processed or {}
    if type(obj) is jsonref.JsonRef:
        oid = id(obj)
        if oid in _processed:
            return _processed[oid]
        r = func(obj)
        obj = r if replace else obj
        _processed[oid] = obj
    if isinstance(obj, Mapping):
        for k, v in obj.items():
            r = _walk_refs(v, func, replace=replace, _processed=_processed)
            if replace:
                obj[k] = r  # type: ignore[index]
    elif isinstance(obj, Sequence) and not isinstance(obj, str):
        for i, v in enumerate(obj):
            r = _walk_refs(v, func, replace=replace, _processed=_processed)
            if replace:
                obj[i] = r  # type: ignore[index]
    return obj


# Replace the _walk_refs function with the updated one
jsonref._walk_refs = _walk_refs
"""
END hacky fix
"""


def _get_shared_schemas_map() -> dict[str, SharedSchema]:
    """Get a mapping of shared schema URI to the shared schema itself."""
    return {shared_schema.schema_uri: shared_schema for shared_schema in get_shared_schemas()}


def _loader(uri: str, **kwargs: dict) -> Any:
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
        lazy_load=False,  # Tell it to actually do the resolution and not defer it
        proxies=False,  # Tell it to use python dicts, not its own internal jsonref types
    )
