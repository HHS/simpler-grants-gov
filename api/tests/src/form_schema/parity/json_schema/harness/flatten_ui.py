"""Flatten a form's UI schema into the paths of its fields, in the order they're shown.

Hand-written forms use the SGG UI schema, and generated forms use JSON Forms. These two
UI schemas flatten to the same order:

    # SGG: sections and field lists, each field naming its definition
    [{"type": "section", "label": "Contact", "children": [
        {"type": "fieldList", "name": "contacts", "children": [
            {"type": "field", "definition": "/properties/contacts/items/properties/email"}]}]}]

    # JSON Forms: layouts of controls, with a list's entry laid out in `options.detail`
    {"type": "Group", "label": "Contact", "elements": [
        {"type": "Control", "scope": "#/properties/contacts", "options": {"detail": {
            "type": "VerticalLayout", "elements": [
                {"type": "Control", "scope": "#/properties/email"}]}}}]}

    -> [("contacts", "[]", "email")]

Sections, groups and their labels are dropped, so grouping the same fields differently
doesn't change the result. Paths match the ones `flatten_schema.inputs()` returns.
"""

from typing import Any

from ...paths import ARRAY, Path

# The SGG node types that hold other nodes. Any type other than these and `field` raises,
# since an unknown node could hold fields and leaving them out would hide an order
# difference.
SGG_CONTAINERS = frozenset({"section", "fieldList"})


# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def field_order(ui_schema: list[dict[str, Any]] | dict[str, Any]) -> list[Path]:
    """Return the path of every field the UI schema shows, in order, each once.

    A field shown twice keeps its first position. Reads an SGG UI schema (a list) or a
    JSON Forms UI schema (a dict).
    """
    found = _sgg(ui_schema) if isinstance(ui_schema, list) else _json_forms(ui_schema)
    return list(dict.fromkeys(found))


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _sgg(nodes: list[dict[str, Any]]) -> list[Path]:
    out = []
    for node in nodes:
        kind = node.get("type")
        if kind == "field":
            out.append(_definition_path(node["definition"]))
        elif kind in SGG_CONTAINERS:
            out.extend(_sgg(node.get("children", [])))
        else:
            raise ValueError(
                f"{node.get('name', '<unnamed>')}: the {kind!r} UI node type is not read, "
                "only section, fieldList and field"
            )
    return out


def _json_forms(element: dict[str, Any], base: str = "") -> list[Path]:
    """Read the fields under a JSON Forms element.

    `base` is the definition a scope is relative to: empty at the top level, and
    `<list>/items` inside a list's entry layout, as in
    `frontend/src/utils/applyForm/jsonFormsUiSchema.ts`.
    """
    if element.get("type") == "Control":
        scope = element.get("scope", "")
        if not scope.startswith("#/"):
            return []
        definition = f"{base}{scope[1:]}"
        if (detail := _entry_layout(element)) is not None:
            return _json_forms(detail, f"{definition}/items")
        return [_definition_path(definition)]
    return [path for child in element.get("elements", []) for path in _json_forms(child, base)]


def _entry_layout(control: dict[str, Any]) -> dict[str, Any] | None:
    """Return the layout a list control gives each entry, if any."""
    detail = (control.get("options") or {}).get("detail")
    return detail if isinstance(detail, dict) and "type" in detail else None


def _definition_path(definition: str) -> Path:
    """`"/properties/contacts/items/properties/email"` -> `("contacts", "[]", "email")`."""
    steps = iter(definition.strip("/").split("/"))
    out: list[str] = []
    for step in steps:
        if step == "properties":
            out.append(next(steps))
        elif step == "items":
            out.append(ARRAY)
        else:
            raise ValueError(f"{definition}: cannot read the step {step!r} as a field path")
    return tuple(out)
