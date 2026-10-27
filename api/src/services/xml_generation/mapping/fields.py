"""Which of a form's response fields a mapping reads, without resolving it."""

from typing import Any

from .paths import root_of


def mapped_root_fields(mapping: dict[str, Any]) -> set[str]:
    """The response's top-level fields the mapping reads, wherever they're written. Inside
    ``$each``, paths are relative to the item, so only the list itself counts."""
    fields: set[str] = set()

    def visit(node: Any) -> None:
        if not isinstance(node, dict):
            return  # a literal, e.g. a ``case`` entry
        if "$field" in node:
            fields.add(root_of(node["$field"]))
        elif "$attachment" in node:
            fields.add(root_of(node["$attachment"]))
        elif "$each" in node:
            visit(node["$each"]["items"])
        elif "$match" in node:
            visit(node["$match"]["value"])
            for branch in [*node["$match"]["case"].values(), node["$match"].get("default")]:
                visit(branch)
        elif "$transform" in node:
            visit(node["$transform"]["value"])
        elif "$when" in node:
            fields.add(root_of(node["$when"]["condition"].get("field", "")))
            visit(node["$when"]["then"])
            visit(node["$when"].get("else"))
        elif "$const" not in node:
            for child in node.values():
                visit(child)

    for content in mapping["root"].values():
        visit(content)
    fields.discard("")
    return fields
