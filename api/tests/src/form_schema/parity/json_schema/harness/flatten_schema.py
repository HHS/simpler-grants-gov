"""Flatten a form's JSON Schema into a map of its fields.

Functionally equivalent JSON Schemas (schemas that validate the same JSON shape with the
same types and constraints) can be written very differently using `$ref`, `$defs` and
`allOf`. This module makes two schemas comparable by resolving `$ref`, merging `allOf`
and flattening the nested schema into fields that keep their path, type and constraints.

These two schemas flatten to the same fields:

    {"$defs": {"Email": {"type": "string", "maxLength": 60}},
     "properties": {"contact": {"allOf": [
         {"properties": {"email": {"$ref": "#/$defs/Email"}}},
         {"required": ["email"]}]}}}

    {"properties": {"contact": {
         "required": ["email"],
         "properties": {"email": {"type": "string", "maxLength": 60}}}}}

    -> {("contact", "email"): FormInput(required=True, rules={"maxLength": 60, "type": "string"})}
"""

import dataclasses
from typing import Any

from src.form_schema.jsonschema_resolver import resolve_jsonschema

from ...paths import ARRAY, Path
from .merge_schema import merge_allof

# Every keyword that can make a response invalid.
VALIDATION_KEYWORDS = frozenset({
    "type",
    "enum",
    "const",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maximum",
    "minimum",
    "exclusiveMaximum",
    "exclusiveMinimum",
    "multipleOf",
    "maxItems",
    "minItems",
    "uniqueItems",
    "maxProperties",
    "minProperties",
    "dependentRequired",
})


@dataclasses.dataclass(frozen=True)
class FormInput:
    """A flattened form field that accepts user input, with its required status and
    constraints (e.g. type, maxLength, minLength).

    Its path in the output JSON is the key `inputs()` stores it under.

        FormInput(required=True, rules={"maxLength": 60, "type": "string"})
    """

    required: bool
    rules: dict[str, Any]


@dataclasses.dataclass(frozen=True)
class FieldText:
    """The title and description of a field, list or group.

    FieldText(title="Email", description="Where we will reach you.")
    """

    title: str | None = None
    description: str | None = None


# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def inputs(schema: dict[str, Any]) -> dict[Path, FormInput]:
    """Return every field in `schema` that accepts user input, keyed by path.

        {"properties": {"email": {"type": "string", "maxLength": 60}}, "required": ["email"]}
        -> {("email",): FormInput(required=True, rules={"maxLength": 60, "type": "string"})}

    Items in a list are required if the list sets `minItems`.

    Raises `ValueError` if the schema uses `prefixItems`.
    """
    out: dict[Path, FormInput] = {}

    def walk(node: dict[str, Any], prefix: Path, required: bool) -> None:
        merged = _merge(node, prefix)
        if properties := merged.get("properties"):
            demanded = set(merged.get("required", ()))
            for name, sub in properties.items():
                walk(sub, (*prefix, name), name in demanded)
            return
        items = merged.get("items")
        if isinstance(items, dict):
            walk(items, (*prefix, ARRAY), bool(merged.get("minItems")))
            return
        if prefix:
            out[prefix] = FormInput(required=required, rules=_rules(merged))

    walk(resolve_jsonschema(schema), (), False)
    return out


def texts(schema: dict[str, Any]) -> dict[Path, FieldText]:
    """Return the title and description of every field, list and group in `schema`, keyed
    by path.

        {"properties": {"contacts": {"title": "Contacts", "type": "array", "items": {
            "properties": {"email": {"title": "Email"}}}}}}
        -> {("contacts",): FieldText(title="Contacts"),
            ("contacts", "[]"): FieldText(),
            ("contacts", "[]", "email"): FieldText(title="Email")}

    The root is left out, since its title and description belong to the form.

    Raises `ValueError` if the schema uses `prefixItems`.
    """
    out: dict[Path, FieldText] = {}

    def walk(node: dict[str, Any], prefix: Path) -> None:
        merged = _merge(node, prefix)
        if prefix:
            out[prefix] = FieldText(
                title=merged.get("title"), description=merged.get("description")
            )
        if properties := merged.get("properties"):
            for name, sub in properties.items():
                walk(sub, (*prefix, name))
            return
        items = merged.get("items")
        if isinstance(items, dict):
            walk(items, (*prefix, ARRAY))

    walk(resolve_jsonschema(schema), ())
    return out


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _merge(node: dict[str, Any], prefix: Path) -> dict[str, Any]:
    """Merge a node's `allOf` branches, refusing keywords the flattening can't represent."""
    merged = merge_allof(node)
    # TODO: Support `prefixItems`, which sets rules for items at specific positions.
    # Every item is flattened to one `[]` path today, so SF-424A's requirement that the
    # first row have an `activity_title` would read as optional.
    if "prefixItems" in merged:
        raise ValueError(f"{'.'.join(prefix) or '<root>'}: `prefixItems` is not supported")
    return merged


def _rules(node: dict[str, Any]) -> dict[str, Any]:
    """Return a node's validation keywords in a canonical form, so equivalent nodes compare
    equal.

        {"enum": ["Y", "X"]}   -> {"enum": ["X", "Y"]}
        {"const": "X"}         -> {"enum": ["X"]}
        {"title": "Email"}     -> {}
    """
    node = dict(node)
    if "const" in node:
        node.setdefault("enum", [node.pop("const")])
        node.pop("const", None)

    return {
        key: sorted(node[key], key=repr) if isinstance(node[key], list) else node[key]
        for key in sorted(VALIDATION_KEYWORDS & set(node))
    }
