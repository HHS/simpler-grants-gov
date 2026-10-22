"""Reads a form's `json_to_xml_schema` into `{element path: response field}`.

    {"applicant": {"xml_transform": {"type": "nested_object", "target": "Applicant"},
                   "street1": {"xml_transform": {"target": "Street1"}}}}
    -> ({("Applicant",): None, ("Applicant", "Street1"): "applicant.street1"}, {})

Three details of the format:

- A container takes no value, so `nested_object`, `array` and `static_value` map to None.
- An attachment is named twice. `xml_transform.target` holds a lowercase placeholder that
  only fixes sequence position; the element emitted is in `_xml_config.attachment_fields`.
- Not every mapping is tree-shaped. SF-424A builds structure from data at run time, so
  those rules come back in the second return value and the checks skip the form.
"""

from typing import Any

from ...paths import ARRAY, Path

#: `xml_transform.type` values whose wire structure follows from the declaration.
READABLE = frozenset({"nested_object", "array", "attribute", "conditional"})

#: The one `conditional_transform` shape whose element count is declared rather than
#: derived from the applicant's data.
READABLE_CONDITIONALS = frozenset({"one_to_many"})

#: Which of the five registered transforms can reconcile a difference in which rule.
#: The empty entries matter: nothing clamps a number into a range, so a form accepting an
#: amount the wire cannot carry is a finding whatever transform is declared.
RECONCILED_BY: dict[str, frozenset[str]] = {
    "enum": frozenset({"map_values", "string_case", "boolean_to_yes_no"}),
    "type": frozenset({"boolean_to_yes_no", "currency_format"}),
    "maxLength": frozenset({"truncate_string"}),
    "minLength": frozenset(),
    "maximum": frozenset(),
    "minimum": frozenset(),
}


def read(mapping: dict[str, Any]) -> tuple[dict[Path, str | None], dict[str, str]]:
    """Flatten one mapping into `({element path: response field}, {rule: why not read})`.

    The response field is None where the element takes no value from the applicant.
    """
    config = mapping.get("_xml_config", {})
    attachments = config.get("attachment_fields", {})

    targets: dict[Path, str | None] = {}
    unreadable: dict[str, str] = {}

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

            if kind is not None and kind not in READABLE:
                unreadable[source] = f"xml_transform.type {kind!r}"
                continue

            if kind == "conditional":
                conditional = transform.get("conditional_transform", {})
                shape = conditional.get("type")
                if shape not in READABLE_CONDITIONALS:
                    unreadable[source] = f"conditional_transform.type {shape!r}"
                    continue
                # The declaration names the array; the values come from its items.
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
                # The transformer builds the subtree from the upload, so the field is the
                # source for the element and everything under it.
                arity = attachments[field].get("type")
                held = f"{source}.{ARRAY}" if arity == "multiple" else source
                targets[*level, attachments[field]["xml_element"]] = held
                continue

            if target is None:
                unreadable[source] = "no xml_transform.target"
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
                    unreadable[source] = "array with no items rules"
                    continue
                # One path describes every item, using the shared `[]` step so this
                # lines up with what `json_schema/flatten_schema.py` produces.
                descend(items_rules, (*level, target), f"{source}.{ARRAY}")

    descend({k: v for k, v in mapping.items() if k != "_xml_config"}, (), "")
    return targets, unreadable


def root_of(mapping: dict[str, Any]) -> str:
    return mapping.get("_xml_config", {}).get("xml_structure", {}).get("root_element", "")


def xsd_of(mapping: dict[str, Any]) -> str:
    return mapping.get("_xml_config", {}).get("xsd_url", "").split("/")[-1]


def attachment_elements(mapping: dict[str, Any]) -> frozenset[str]:
    """Elements the attachment transformer builds. Their children come from the uploaded
    file rather than the mapping, so the checks stop at the element itself."""
    attachments = mapping.get("_xml_config", {}).get("attachment_fields", {})
    return frozenset(config["xml_element"] for config in attachments.values())


def transformed(mapping: dict[str, Any]) -> dict[Path, frozenset[str]]:
    """Which `value_transform` types each element's rule declares.

    A declared transform is what makes a difference between the two sides legitimate.
    SF-424 Short's `application_certification` is a form boolean and a `YesNoDataType`
    string on the wire, and it works only because the rule says `boolean_to_yes_no`;
    SF-424's `state_review` offers three options the XSD spells with a capital S, and a
    `map_values` transform corrects them on the way out. Omit either declaration and the
    wrong value reaches serialization.

    The type is returned rather than a bare "yes" so a caller can ask whether the declared
    transform is the kind that could account for the difference it is looking at -- see
    `RECONCILED_BY`.

    `item_value_transform` counts too: a `one_to_many` expansion declares it once for the
    items it distributes across the numbered elements.
    """
    out: dict[Path, frozenset[str]] = {}

    def kinds(*declarations) -> frozenset[str]:
        return frozenset(d["type"] for d in declarations if isinstance(d, dict) and "type" in d)

    def descend(node: dict[str, Any], level: Path) -> None:
        for field, rule in node.items():
            if field in ("xml_transform", "items") or not isinstance(rule, dict):
                continue
            transform = rule.get("xml_transform")
            if not isinstance(transform, dict):
                continue

            conditional = transform.get("conditional_transform", {})
            if conditional.get("type") in READABLE_CONDITIONALS:
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
