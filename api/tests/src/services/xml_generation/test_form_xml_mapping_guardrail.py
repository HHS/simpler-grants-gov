"""Guardrail: every field in a form's JSON schema has to be picked up by its XML transform rules.

A schema field with no transform rule is silently left out of the generated XML, and nothing
else catches it when the matching XSD element is optional (this is how the SF-424 fields were
lost). This runs once per form package, so new forms are covered as soon as they define
FORM_XML_TRANSFORM_RULES.

It only checks that each top-level field is mapped somewhere. It does not replace the
per-form XML and XSD tests, which check what each field actually produces.
"""

import importlib
import pkgutil
from types import ModuleType
from typing import Any

import pytest

import src.form_schema.forms as forms_pkg
from src.form_schema.forms.sf424 import FORM_JSON_SCHEMA, FORM_XML_TRANSFORM_RULES

# Schema fields that are intentionally not written to the XML, keyed by form package name.
# Every entry needs a reason, and test_fields_not_in_xml_are_real keeps this list honest.
FIELDS_NOT_IN_XML: dict[str, dict[str, str]] = {
    "sf424a": {
        "confirmation": "'Is this form complete?' checkbox only exists in our UI, "
        "the XSD has no element for it",
    },
}


def _form_packages() -> list[ModuleType]:
    """Every form package under src/form_schema/forms (sf424, sf424a, ...)."""
    return [
        importlib.import_module(f"{forms_pkg.__name__}.{module_info.name}")
        for module_info in pkgutil.iter_modules(forms_pkg.__path__)
        if module_info.ispkg
    ]


def _form_params() -> list:
    return [
        pytest.param(package, id=package.__name__.rsplit(".", 1)[-1])
        for package in _form_packages()
    ]


def _root_field(path: Any) -> set[str]:
    """Top-level schema field of a dotted source path, e.g. "applicant.city" -> applicant."""
    return {path.split(".", 1)[0]} if isinstance(path, str) and path else set()


def _conditional_source_fields(transform: dict, from_root: bool) -> set[str]:
    """Top-level fields a conditional_transform reads.

    These are resolved against the root of the application data. Paths inside an item or
    sub-object (pivot_object field_mapping, array_decomposition item_field, ...) are
    relative to that object, so only the source path itself counts.

    `from_root` is set when the rule's key isn't a schema field, the only case where a
    conditional_structure branch reads its fields from the root data.
    """
    transform_type = transform.get("type")
    fields: set[str] = set()

    if transform_type in ("one_to_many", "pivot_object"):
        fields |= _root_field(transform.get("source_field"))
    elif transform_type == "field_grouping":
        for path in transform.get("source_fields", []):
            fields |= _root_field(path)
    elif transform_type == "compose_object":
        paths = [*transform.get("field_mapping", {}).values()]
        paths += transform.get("attributes", {}).values()
        for path in paths:
            fields |= _root_field(path)
    elif transform_type == "array_decomposition":
        fields |= _root_field(transform.get("source_array_field"))
        for mapping in transform.get("field_mappings", {}).values():
            if isinstance(mapping, dict):
                fields |= _root_field(mapping.get("total_field"))
    elif transform_type == "conditional_structure":
        # On a wrapper that isn't a schema field the selected branch reads these fields
        # from the root data (e.g. SF-LLL MaterialChangeSupplement)
        for branch in (transform.get("if_true"), transform.get("if_false")):
            if from_root and isinstance(branch, dict):
                fields |= set(branch.get("source_fields", {}))
                fields |= set(branch.get("nested_fields", {}))
    else:
        raise ValueError(
            f"Unknown conditional_transform type {transform_type!r}: "
            "add it to _conditional_source_fields"
        )

    return fields


def _mapped_fields(rules: dict, schema_fields: set[str]) -> set[str]:
    """Top-level schema fields that the transform rules read from."""
    mapped = {key for key in rules if not key.startswith("_")}
    mapped |= set(rules.get("_xml_config", {}).get("attachment_fields", {}))

    def walk(node: Any, from_root: bool) -> None:
        if isinstance(node, dict):
            transform = node.get("conditional_transform")
            if isinstance(transform, dict):
                mapped.update(_conditional_source_fields(transform, from_root))
            for value in node.values():
                walk(value, from_root)
        elif isinstance(node, list):
            for value in node:
                walk(value, from_root)

    for key, rule in rules.items():
        if key.startswith("_") or not isinstance(rule, dict):
            continue
        from_root = key not in schema_fields
        # A nested_object wrapper that isn't a schema field (e.g. SF-LLL
        # federal_program_wrapper) has no source object, so its child rules read
        # straight from the root data
        if from_root and rule.get("xml_transform", {}).get("type") == "nested_object":
            mapped |= {child for child in rule if child != "xml_transform"}
        walk(rule, from_root)

    return mapped


def _unmapped_fields(schema: dict, rules: dict) -> set[str]:
    schema_fields = set(schema["properties"])
    return schema_fields - _mapped_fields(rules, schema_fields)


@pytest.mark.parametrize("form_package", _form_params())
def test_all_schema_fields_have_xml_mapping(form_package):
    form_name = form_package.__name__.rsplit(".", 1)[-1]
    rules = getattr(form_package, "FORM_XML_TRANSFORM_RULES", None)
    if not rules:
        pytest.skip(f"{form_name} has no FORM_XML_TRANSFORM_RULES yet")

    unmapped = _unmapped_fields(form_package.FORM_JSON_SCHEMA, rules)
    unmapped -= set(FIELDS_NOT_IN_XML.get(form_name, {}))

    assert not unmapped, (
        f"{form_name}: these schema fields have no XML mapping and would be dropped from "
        f"the generated XML: {sorted(unmapped)}. Add a transform rule, or add them to "
        "FIELDS_NOT_IN_XML with a reason if they really don't belong in the XML."
    )


def test_fields_not_in_xml_are_real():
    """Each exception has to point at a real field that really has no mapping."""
    packages = {package.__name__.rsplit(".", 1)[-1]: package for package in _form_packages()}

    for form_name, fields in FIELDS_NOT_IN_XML.items():
        assert form_name in packages, f"{form_name} is not a form package"
        package = packages[form_name]
        assert set(fields) <= set(package.FORM_JSON_SCHEMA["properties"]), form_name
        unmapped = _unmapped_fields(package.FORM_JSON_SCHEMA, package.FORM_XML_TRANSFORM_RULES)
        assert set(fields) <= unmapped, f"{form_name}: remove mapped fields from the list"


def test_removed_mapping_is_reported():
    rules = {key: rule for key, rule in FORM_XML_TRANSFORM_RULES.items() if key != "fax"}

    assert _unmapped_fields(FORM_JSON_SCHEMA, rules) == {"fax"}


def test_unknown_conditional_transform_type_fails():
    rules = {"field": {"xml_transform": {"conditional_transform": {"type": "something_new"}}}}

    with pytest.raises(ValueError, match="something_new"):
        _unmapped_fields({"properties": {"field": {}}}, rules)


def test_form_without_transform_rules_is_skipped():
    form_package = ModuleType("src.form_schema.forms.new_form")
    form_package.FORM_JSON_SCHEMA = {"properties": {"field": {}}}

    with pytest.raises(pytest.skip.Exception, match="new_form"):
        test_all_schema_fields_have_xml_mapping(form_package)
