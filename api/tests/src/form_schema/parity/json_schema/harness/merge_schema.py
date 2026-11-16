"""Merge the `allOf` branches of a JSON Schema into a single schema.

    {"allOf": [{"type": "string"}, {"maxLength": 60}]}
    -> {"type": "string", "maxLength": 60}

    {"allOf": [{"maxLength": 60}, {"maxLength": 200}]}
    -> raises ConflictingKeywordsError

Conditional branches (`if`/`then`/`else`) are left in `allOf`, since which one applies
depends on the response.
"""

from typing import Any

CONDITIONAL = frozenset({"if", "then", "else"})

# Keywords whose values from several branches are combined.
COMBINING = frozenset({"properties", "required", "allOf", "$defs", "definitions"})

# Keywords that describe a field rather than constrain it. When branches disagree, the
# node's own value wins, e.g. a form overriding the label of a shared question.
ANNOTATION = frozenset(
    {
        "title",
        "description",
        "examples",
        "default",
        "$comment",
        "deprecated",
        "readOnly",
        "writeOnly",
    }
)


class ConflictingKeywordsError(Exception):
    """Two `allOf` branches give the same validation keyword different values."""


# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def merge_allof(schema: Any, path: str = "") -> Any:
    """Return `schema` with its non-conditional `allOf` branches merged in, recursively.

    `path` locates a conflict in the error message.

    Raises `ConflictingKeywordsError` if two branches, or a branch and the node itself,
    give the same validation keyword different values.
    """
    if isinstance(schema, list):
        return [merge_allof(item, path) for item in schema]
    if not isinstance(schema, dict):
        return schema

    merged: dict[str, Any] = {}
    for key, value in schema.items():
        if key == "allOf":
            continue
        merged[key] = merge_allof(value, f"{path}.{key}" if path else key)

    branches = schema.get("allOf")
    if not isinstance(branches, list):
        return merged

    conditional = [b for b in branches if _is_conditional(b)]
    for branch in (b for b in branches if not _is_conditional(b)):
        folded = merge_allof(branch, path)
        if not isinstance(folded, dict):
            continue
        for key, value in folded.items():
            if key not in merged:
                merged[key] = value
            elif key == "properties":
                # Merge each property rather than replacing the whole object, so a branch
                # that only adds a description to one property keeps the rest of it.
                for name, sub in value.items():
                    merged[key][name] = (
                        merge_allof({"allOf": [sub, merged[key][name]]}, f"{path}.{name}")
                        if name in merged[key]
                        else sub
                    )
            elif key == "required":
                merged[key] = sorted({*merged[key], *value})
            elif key == "allOf":
                # Conditionals kept back by both sides, e.g. an address question and the
                # form using it each making a field conditionally required. All of them
                # apply, so the lists are concatenated.
                merged[key] = [*merged[key], *value]
            elif key in ANNOTATION:
                pass  # the node's own value is already in `merged`
            elif key in COMBINING:
                merged[key] = {**value, **merged[key]}
            elif merged[key] != value:
                raise ConflictingKeywordsError(
                    f"{path or '<root>'}: `{key}` is declared as {merged[key]!r} and {value!r}"
                )

    if conditional:
        merged["allOf"] = conditional
    return merged


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _is_conditional(branch: Any) -> bool:
    return isinstance(branch, dict) and bool(CONDITIONAL & set(branch))
