"""Folds `allOf` branches into one schema, or raises.

    {"allOf": [{"type": "string"}, {"maxLength": 60}]}
    -> {"type": "string", "maxLength": 60}

    {"allOf": [{"maxLength": 60}, {"maxLength": 200}]}
    -> ConflictingKeywordsError

A validator applies every branch, so two `maxLength` values behave as the smaller. A
flattener has no payload and would have to pick one; picking 200 silently accepts values
the schema rejects. Rather than implement precedence, this raises. No form in `diffs/`
declares a keyword twice, so nothing currently raises.

`if`/`then`/`else` branches are left in place, since which applies depends on the payload.

`allof-merge` and `json-schema-merge-allof` do this off the shelf. They resolve a conflict
by choosing a winner, which is the behavior this cannot have.
"""

from typing import Any

CONDITIONAL = frozenset({"if", "then", "else"})

# Keywords whose values combine rather than collide, so seeing them twice is not ambiguous.
COMBINING = frozenset({"properties", "required", "allOf", "$defs", "definitions"})

# Keywords that describe rather than constrain, so two values are not a contradiction.
# The node's own wins: a form overriding a shared question's label is the ordinary case.
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
    """Two branches declare the same constraining keyword with different values."""


def _is_conditional(branch: Any) -> bool:
    return isinstance(branch, dict) and bool(CONDITIONAL & set(branch))


def merge_allof(schema: Any, path: str = "") -> Any:
    """The schema with its non-conditional `allOf` branches folded in, recursively.

    `path` is used only to locate a conflict in the raised message.

    Raises `ConflictingKeywordsError` if two branches, or a branch and the node itself, declare
    the same constraining keyword with different values.
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
                # Per property, not per properties-object: a form adding a description to
                # one member of a composed question must not replace that member.
                for name, sub in value.items():
                    merged[key][name] = (
                        merge_allof({"allOf": [sub, merged[key][name]]}, f"{path}.{name}")
                        if name in merged[key]
                        else sub
                    )
            elif key == "required":
                merged[key] = sorted({*merged[key], *value})
            elif key == "allOf":
                # Conditionals both branches kept back. They are a conjunction, so the two
                # lists concatenate; treating them as mappings assumes a shape `allOf` never
                # has. Reached when a question carries an `if`/`then` of its own and the
                # occurrence composing it adds another, as an address does when the question
                # and the form each make a field conditionally required.
                merged[key] = [*merged[key], *value]
            elif key in ANNOTATION:
                pass  # the node's own already sits in `merged`, and it wins
            elif key in COMBINING:
                merged[key] = {**value, **merged[key]}
            elif merged[key] != value:
                raise ConflictingKeywordsError(
                    f"{path or '<root>'}: `{key}` is declared as {merged[key]!r} and {value!r}. "
                    "Flattening would have to choose, and choosing wrong changes what is valid. "
                    "The validator does not choose -- it applies both."
                )

    if conditional:
        merged["allOf"] = conditional
    return merged
