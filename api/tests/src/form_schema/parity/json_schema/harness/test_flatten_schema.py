"""Tests for `flatten_schema.inputs()` and `flatten_schema.texts()` over hand-built schemas."""

import pytest

from tests.src.form_schema.parity.json_schema.harness import flatten_schema
from tests.src.form_schema.parity.json_schema.harness.flatten_schema import FormInput
from tests.src.form_schema.parity.json_schema.harness.utils import worded


class TestInputs:
    def test_flattens_ref_and_inline_schemas_to_same_fields(self):
        with_ref = {
            "$defs": {"Email": {"type": "string", "maxLength": 60}},
            "properties": {
                "contact": {
                    "allOf": [
                        {"properties": {"email": {"$ref": "#/$defs/Email"}}},
                        {"required": ["email"]},
                    ]
                }
            },
        }
        inline = {
            "properties": {
                "contact": {
                    "required": ["email"],
                    "properties": {"email": {"type": "string", "maxLength": 60}},
                }
            }
        }
        assert (
            flatten_schema.inputs(with_ref)
            == flatten_schema.inputs(inline)
            == {
                ("contact", "email"): FormInput(
                    required=True, rules={"maxLength": 60, "type": "string"}
                )
            }
        )

    def test_treats_const_as_single_member_enum(self):
        with_const = flatten_schema.inputs({"properties": {"a": {"const": "X"}}})
        with_enum = flatten_schema.inputs({"properties": {"a": {"enum": ["X"]}}})
        assert with_const == with_enum

    def test_ignores_enum_member_order(self):
        one_way = flatten_schema.inputs({"properties": {"a": {"enum": ["X", "Y"]}}})
        other_way = flatten_schema.inputs({"properties": {"a": {"enum": ["Y", "X"]}}})
        assert one_way == other_way

    def test_leaves_out_title_and_description(self):
        found = flatten_schema.inputs(
            {"properties": {"a": {"type": "string", "title": "A", "description": "About A."}}}
        )
        assert found == {("a",): FormInput(required=False, rules={"type": "string"})}

    def test_requires_list_items_when_list_sets_min_items(self):
        schema = {
            "properties": {
                "contacts": {"type": "array", "minItems": 1, "items": {"type": "string"}}
            }
        }
        assert flatten_schema.inputs(schema)["contacts", "[]"].required

    def test_raises_on_prefix_items(self):
        schema = {
            "properties": {
                "rows": {
                    "type": "array",
                    "items": {"type": "object"},
                    "allOf": [{"prefixItems": [{"required": ["title"]}]}],
                }
            }
        }
        with pytest.raises(ValueError, match="rows: `prefixItems` is not supported"):
            flatten_schema.inputs(schema)


class TestTexts:
    SCHEMA = {
        "title": "Key Contacts",
        "description": "The form's own introduction.",
        "properties": {
            "contacts": {
                "type": "array",
                "title": "Contacts",
                "description": "Enter up to four.",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "object",
                            "title": "Name",
                            "properties": {"first": {"type": "string", "title": "First"}},
                        },
                        "email": {
                            "allOf": [{"type": "string", "title": "Email"}],
                            "description": "Where we will reach you.",
                        },
                    },
                },
            }
        },
    }

    def test_reads_lists_and_groups_as_well_as_inputs(self):
        assert flatten_schema.texts(self.SCHEMA) == {
            ("contacts",): worded("Contacts", "Enter up to four."),
            ("contacts", "[]"): worded(),
            ("contacts", "[]", "name"): worded("Name"),
            ("contacts", "[]", "name", "first"): worded("First"),
            ("contacts", "[]", "email"): worded("Email", "Where we will reach you."),
        }

    def test_leaves_out_root(self):
        assert () not in flatten_schema.texts(self.SCHEMA)

    def test_covers_every_input(self):
        assert set(flatten_schema.inputs(self.SCHEMA)) <= set(flatten_schema.texts(self.SCHEMA))
