"""Tests for `flatten_transform.read()` and `flatten_transform.transformed()` over hand-built
XML mappings."""

from tests.src.form_schema.parity.xml.harness import flatten_transform


def rule(target: str | None = None, type: str | None = None, **transform: object) -> dict:
    """One rule's `xml_transform`. `rule("Street1")`, `rule("Applicant", "nested_object")`."""
    declared = {**({"type": type} if type else {}), **({"target": target} if target else {})}
    return {"xml_transform": {**declared, **transform}}


ONE_TO_MANY = rule(
    type="conditional",
    conditional_transform={
        "type": "one_to_many",
        "source_field": "activities",
        "target_pattern": "Activity{index}",
        "max_count": 2,
        "item_value_transform": {"type": "truncate_string"},
    },
)


class TestRead:
    def test_reads_nested_object_as_container(self):
        mapping = {
            "applicant": {**rule("Applicant", "nested_object"), "street1": rule("Street1")},
        }
        assert flatten_transform.read(mapping) == (
            {("Applicant",): None, ("Applicant", "Street1"): "applicant.street1"},
            {},
        )

    def test_reads_array_items_under_one_path(self):
        mapping = {"contacts": {**rule("Contact", "array"), "items": {"email": rule("Email")}}}
        targets, _ = flatten_transform.read(mapping)
        assert targets == {("Contact",): None, ("Contact", "Email"): "contacts.[].email"}

    def test_reads_attribute_with_at_sign(self):
        targets, _ = flatten_transform.read({"version": rule("FormVersion", "attribute")})
        assert targets == {("@FormVersion",): "version"}

    def test_reads_static_value_without_field(self):
        targets, _ = flatten_transform.read({"code": rule("Code", static_value="X")})
        assert targets == {("Code",): None}

    def test_expands_one_to_many_into_numbered_elements(self):
        targets, _ = flatten_transform.read({"activities": ONE_TO_MANY})
        assert targets == {
            ("Activity1",): "activities.[]",
            ("Activity2",): "activities.[]",
        }

    def test_reads_attachment_as_named_element(self):
        mapping = {
            "_xml_config": {
                "attachment_fields": {"sketch": {"xml_element": "BioSketch", "type": "single"}}
            },
            "sketch": rule("sketch_placeholder"),
        }
        targets, _ = flatten_transform.read(mapping)
        assert targets == {("BioSketch",): "sketch"}

    def test_reads_attachment_without_placeholder_at_root(self):
        mapping = {
            "_xml_config": {
                "attachment_fields": {
                    "upload": {"xml_element": "AttachedFile", "type": "single_with_wrapper"}
                }
            },
            "title": rule("Title"),
        }
        targets, _ = flatten_transform.read(mapping)
        assert targets == {("Title",): "title", ("AttachedFile",): "upload"}

    def test_reports_data_dependent_conditional_unchecked(self):
        mapping = {
            "budget": rule(
                type="conditional", conditional_transform={"type": "array_decomposition"}
            )
        }
        assert flatten_transform.read(mapping) == (
            {},
            {"budget": "conditional_transform.type 'array_decomposition'"},
        )

    def test_reports_unknown_type_unchecked(self):
        _, unchecked = flatten_transform.read({"budget": rule("Budget", "pivot_object")})
        assert unchecked == {"budget": "xml_transform.type 'pivot_object'"}

    def test_reports_rule_without_target_unchecked(self):
        _, unchecked = flatten_transform.read({"budget": rule()})
        assert unchecked == {"budget": "no xml_transform.target"}


class TestTransformed:
    def test_reads_value_transform_types(self):
        mapping = {"review": rule("StateReview", value_transform={"type": "map_values"})}
        assert flatten_transform.transformed(mapping) == {
            ("StateReview",): frozenset({"map_values"})
        }

    def test_applies_item_value_transform_to_each_numbered_element(self):
        assert flatten_transform.transformed({"activities": ONE_TO_MANY}) == {
            ("Activity1",): frozenset({"truncate_string"}),
            ("Activity2",): frozenset({"truncate_string"}),
        }
