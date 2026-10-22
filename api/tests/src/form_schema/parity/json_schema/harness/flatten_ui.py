"""Reads a form's UI schema into the paths of its fields, in the order an applicant meets them.

The hand-written forms use the SGG UI schema, a list of nodes; the generated ones use JSON
Forms. These produce the same result:

    # SGG: sections and field lists, each field naming its definition
    [{"type": "section", "label": "Contact", "children": [
        {"type": "fieldList", "name": "contacts", "children": [
            {"type": "field", "definition": "/properties/contacts/items/properties/email"}]}]}]

    # JSON Forms: layouts of controls, a list's entry laid out in `options.detail`
    {"type": "Group", "label": "Contact", "elements": [
        {"type": "Control", "scope": "#/properties/contacts", "options": {"detail": {
            "type": "VerticalLayout", "elements": [
                {"type": "Control", "scope": "#/properties/email"}]}}}]}

    both -> [("contacts", "[]", "email")]

Only the order of the fields is kept. Sections, groups and their labels are dropped, so a
form that groups the same fields differently reads the same here; a path is in the syntax
`flatten_schema.inputs` produces, so the two can be read together.
"""

from typing import Any

from ...paths import ARRAY, Path


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


# The SGG node types read. Any other type raises: a node this does not understand could
# place fields, and leaving them out would hide an order difference.
SGG_CONTAINERS = frozenset({"section", "fieldList"})


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


def _entry_layout(control: dict[str, Any]) -> dict[str, Any] | None:
    """The layout a list control gives each entry, if it gives one."""
    detail = (control.get("options") or {}).get("detail")
    return detail if isinstance(detail, dict) and "type" in detail else None


def _json_forms(element: dict[str, Any], base: str = "") -> list[Path]:
    """`base` is the definition a scope is relative to: none at the top, and a list's
    `<list>/items` inside its entry layout, matching
    `frontend/src/utils/applyForm/jsonFormsUiSchema.ts`."""
    if element.get("type") == "Control":
        scope = element.get("scope", "")
        if not scope.startswith("#/"):
            return []
        definition = f"{base}{scope[1:]}"
        if (detail := _entry_layout(element)) is not None:
            return _json_forms(detail, f"{definition}/items")
        return [_definition_path(definition)]
    return [path for child in element.get("elements", []) for path in _json_forms(child, base)]


def field_order(ui_schema: list[dict[str, Any]] | dict[str, Any]) -> list[Path]:
    """Every field the UI schema places, in reading order, each once.

    A field placed twice keeps its first position.
    """
    found = _sgg(ui_schema) if isinstance(ui_schema, list) else _json_forms(ui_schema)
    return list(dict.fromkeys(found))
