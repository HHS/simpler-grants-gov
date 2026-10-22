"""Reads a form's JSON Schema into `{path: FormInput}`.

Two forms that ask for the same things can be written as very different documents. The
generated SF-424 hoists 50 shared questions into `$defs` and composes with `allOf`; the
hand-written one declares no `$defs` at all and inlines everything. The two share no
definition name, so a structural diff of the documents is all noise -- and resolving the
refs makes it worse, since `resolve_jsonschema` expands each one in place while keeping
`$defs`, leaving the country code list in the generated schema four times over.

Flattening keeps only the path an answer lives at and the rules that decide whether it is
valid, which makes the two comparable. These produce the same result:

    # hoisted behind a $ref, composed with allOf
    {"$defs": {"Email": {"type": "string", "format": "email", "maxLength": 60}},
     "properties": {"contact": {"allOf": [
         {"type": "object", "properties": {"email": {"$ref": "#/$defs/Email"}}},
         {"required": ["email"]}]}}}

    # inlined, and annotated
    {"properties": {"contact": {
         "type": "object",
         "required": ["email"],
         "properties": {"email": {"title": "Email address",
                                  "description": "Where we will reach you.",
                                  "type": "string", "format": "email", "maxLength": 60}}}}}

    both -> {("contact", "email"): FormInput(
                 required=True,
                 rules={"format": "email", "maxLength": 60, "type": "string"}, ...)}

`$ref` is resolved upstream by `src.form_schema.jsonschema_resolver`; `allOf` is folded by
`merge_schema.py`; titles and descriptions are kept apart from the rules, because they
change what an applicant reads, not what they may submit.

Where two forms spell one field differently -- `p.phone` against `p.phone_number` -- the
`FormInput` values match and only the path differs. `FormDiff.renamed` pairs those up.

One array keyword is not read: `prefixItems`, which gives item 0 a different shape from
items 1+. A path ends in one `[]` step describing every item, so a positional difference
has nowhere to go. `sf424a` is the only form using it, and the requiredness it declares
there is invisible here.
"""

import dataclasses
from typing import Any

from ...paths import ARRAY, Path
from .merge_schema import merge_allof

# Every keyword that can make a payload invalid. Anything else a schema carries (title,
# description, examples, $comment) changes what an applicant reads, not what they may
# submit, and is compared separately if at all.
VALIDATION_KEYWORDS = frozenset(
    {
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
    }
)


@dataclasses.dataclass(frozen=True)
class FormInput:
    """One field an applicant can fill in, and the rules deciding what they may put in it.

        FormInput(required=True, rules={"maxLength": 60, "type": "string"}, title="Email")

    `rules` holds `VALIDATION_KEYWORDS` with their values canonicalized, so two fields
    declared differently but permitting the same values compare with `==`. `title` and
    `description` are what the applicant reads beside the field, as the schema states them.
    """

    required: bool
    rules: dict[str, Any]
    title: str | None = None
    description: str | None = None


def _rules(node: dict[str, Any]) -> dict[str, Any]:
    """A node's validation keywords, canonicalized so two equivalent nodes compare equal.

        {"enum": ["Y", "X"]}   -> {"enum": ["X", "Y"]}
        {"const": "X"}         -> {"enum": ["X"]}
        {"title": "Email"}     -> {}

    Enum members are sorted because their order permits the same payloads, and `const` is
    rewritten as a single-member enum because the two spellings do too. Anything outside
    `VALIDATION_KEYWORDS` is dropped.
    """
    node = dict(node)
    # `const: x` and `enum: [x]` permit exactly one value and reject the same payloads.
    # Simpler Grants writes the enum form because their validator names the keyword that
    # failed and "enum" reads better than "const" in a message, so the two spellings are
    # normalized here rather than reported as a difference.
    if "const" in node:
        node.setdefault("enum", [node.pop("const")])
        node.pop("const", None)

    return {
        key: sorted(node[key], key=repr) if isinstance(node[key], list) else node[key]
        for key in sorted(VALIDATION_KEYWORDS & set(node))
    }


def inputs(schema: dict[str, Any]) -> dict[Path, FormInput]:
    """Every input a form has, with the rules that govern it.

    Expects a resolved schema -- every `$ref` already replaced -- because a path can only
    be followed through a schema that has no indirection left in it.
    """
    out: dict[Path, FormInput] = {}

    def walk(node: dict[str, Any], prefix: Path, required: bool) -> None:
        merged = merge_allof(node)
        if properties := merged.get("properties"):
            demanded = set(merged.get("required", ()))
            for name, sub in properties.items():
                walk(sub, (*prefix, name), name in demanded)
            return
        items = merged.get("items")
        if isinstance(items, dict):
            # An item is required if the list demands a minimum, which is the only sense
            # in which a repeatable section's contents can be mandatory.
            walk(items, (*prefix, ARRAY), bool(merged.get("minItems")))
            return
        if prefix:
            out[prefix] = FormInput(
                required=required,
                rules=_rules(merged),
                title=merged.get("title"),
                description=merged.get("description"),
            )

    walk(schema, (), False)
    return out
