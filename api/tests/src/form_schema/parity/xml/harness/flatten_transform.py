"""Flatten a form's XML transform rules (`json_to_xml_schema`) into the XML elements they
produce and the form fields that fill them.

    {"applicant": {"xml_transform": {"type": "nested_object", "target": "Applicant"},
                   "street1": {"xml_transform": {"target": "Street1"}}}}
    -> ({("Applicant",): None, ("Applicant", "Street1"): "applicant.street1"}, {})

A container (`nested_object`, `array`) or a `static_value` takes no value from the form, so
its field is None. An attachment's `xml_transform.target` is a placeholder that only fixes
its position; the element it produces is named in `_xml_config.attachment_fields`.
"""

from typing import Any

from ...paths import ARRAY, Path

#: `xml_transform.type` values the checks can read.
CHECKED_TYPES = frozenset({"nested_object", "array", "attribute", "conditional"})

#: `conditional_transform.type` values the checks can read. A `one_to_many` rule declares
#: how many elements it produces; other conditionals derive them from the applicant's data.
CHECKED_CONDITIONALS = frozenset({"one_to_many"})

#: Rule keyword -> the `value_transform` types that can account for a difference in it,
#: e.g. `boolean_to_yes_no` for a boolean field feeding a `YesNoDataType` element. Nothing
#: accounts for a length or range bound.
RECONCILED_BY: dict[str, frozenset[str]] = {
    "enum": frozenset({"map_values", "string_case", "boolean_to_yes_no"}),
    "type": frozenset({"boolean_to_yes_no", "currency_format"}),
    "maxLength": frozenset({"truncate_string"}),
    "minLength": frozenset(),
    "maximum": frozenset(),
    "minimum": frozenset(),
}

# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def read(mapping: dict[str, Any]) -> tuple[dict[Path, str | None], dict[str, str]]:
    """Return the element each rule produces, keyed by element path, with the form field it's
    filled from, and the rules that can't be checked, with the reason.

    The field is None where the element takes no value from the form.
    """
    config = mapping.get("_xml_config", {})
    attachments = config.get("attachment_fields", {})

    targets: dict[Path, str | None] = {}
    unchecked: dict[str, str] = {}

    def descend(node: dict[str, Any], level: Path, prefix: str) -> None:
        for field, rule in node.items():
            if field in ("xml_transform", "items") or not isinstance(rule, dict):
                continue
            transform = rule.get("xml_transform")
            if not isinstance(transform, dict):
                continue

            source = f"{prefix}.{field}" if prefix else field
            kind = transform.get("type")
            target = transform.get("target")

            if kind is not None and kind not in CHECKED_TYPES:
                unchecked[source] = f"xml_transform.type {kind!r}"
                continue

            if kind == "conditional":
                conditional = transform.get("conditional_transform", {})
                shape = conditional.get("type")
                if shape not in CHECKED_CONDITIONALS:
                    unchecked[source] = f"conditional_transform.type {shape!r}"
                    continue
                # The rule names the array, and each numbered element takes one item.
                items = (
                    f"{prefix}.{conditional['source_field']}"
                    if prefix
                    else conditional["source_field"]
                )
                for index in range(1, conditional["max_count"] + 1):
                    name = conditional["target_pattern"].format(index=index)
                    targets[*level, name] = f"{items}.{ARRAY}"
                continue

            if field in attachments:
                # The element and everything under it are built from the upload.
                arity = attachments[field].get("type")
                attachment_source = f"{source}.{ARRAY}" if arity == "multiple" else source
                targets[*level, attachments[field]["xml_element"]] = attachment_source
                continue

            if target is None:
                unchecked[source] = "no xml_transform.target"
                continue

            if kind == "attribute":
                targets[*level, "@" + target] = source
                continue

            container = kind in ("nested_object", "array")
            targets[*level, target] = None if container or "static_value" in transform else source

            if kind == "nested_object":
                descend(rule, (*level, target), source)
            elif kind == "array":
                items_rules = rule.get("items")
                if not isinstance(items_rules, dict):
                    unchecked[source] = "array with no items rules"
                    continue
                # One `[]` path covers every item, as in `flatten_schema.inputs()`.
                descend(items_rules, (*level, target), f"{source}.{ARRAY}")

    descend({k: v for k, v in mapping.items() if k != "_xml_config"}, (), "")
    return targets, unchecked


def root_of(mapping: dict[str, Any]) -> str:
    """Return the name of the XML document's root element."""
    return mapping.get("_xml_config", {}).get("xml_structure", {}).get("root_element", "")


def xsd_of(mapping: dict[str, Any]) -> str:
    """Return the file name of the XSD the mapping targets."""
    return mapping.get("_xml_config", {}).get("xsd_url", "").split("/")[-1]


def attachment_elements(mapping: dict[str, Any]) -> frozenset[str]:
    """Return the elements built from uploaded files rather than from the mapping."""
    attachments = mapping.get("_xml_config", {}).get("attachment_fields", {})
    return frozenset(config["xml_element"] for config in attachments.values())


def transformed(mapping: dict[str, Any]) -> dict[Path, frozenset[str]]:
    """Return the `value_transform` types each element's rule declares, keyed by element path.

        {"state_review": {"xml_transform": {"target": "StateReview",
                                            "value_transform": {"type": "map_values", ...}}}}
        -> {("StateReview",): frozenset({"map_values"})}

    A `one_to_many` rule's `item_value_transform` applies to every element it produces.
    """
    out: dict[Path, frozenset[str]] = {}

    def kinds(*declarations: Any) -> frozenset[str]:
        return frozenset(d["type"] for d in declarations if isinstance(d, dict) and "type" in d)

    def descend(node: dict[str, Any], level: Path) -> None:
        for field, rule in node.items():
            if field in ("xml_transform", "items") or not isinstance(rule, dict):
                continue
            transform = rule.get("xml_transform")
            if not isinstance(transform, dict):
                continue

            conditional = transform.get("conditional_transform", {})
            if conditional.get("type") in CHECKED_CONDITIONALS:
                declared = kinds(
                    conditional.get("item_value_transform"), transform.get("value_transform")
                )
                if declared:
                    pattern = conditional["target_pattern"]
                    for index in range(1, conditional["max_count"] + 1):
                        out[*level, pattern.format(index=index)] = declared
                continue

            target = transform.get("target")
            if target is None:
                continue
            here = (*level, target)
            if declared := kinds(transform.get("value_transform")):
                out[here] = declared
            if transform.get("type") == "nested_object":
                descend(rule, here)
            elif transform.get("type") == "array" and isinstance(rule.get("items"), dict):
                descend(rule["items"], here)

    descend({k: v for k, v in mapping.items() if k != "_xml_config"}, ())
    return out
