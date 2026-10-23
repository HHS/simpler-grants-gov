"""Tests for `flatten_ui.field_order()` over hand-built UI schemas."""

import pytest

from tests.src.form_schema.parity.json_schema.harness import flatten_ui
from tests.src.form_schema.parity.json_schema.harness.utils import placed


class TestFieldOrder:
    def test_reads_sgg_fields_through_sections_and_field_lists(self):
        ui_schema = [
            {
                "type": "section",
                "name": "applicant",
                "label": "Applicant",
                "children": [{"type": "field", "definition": "/properties/organization"}],
            },
            {
                "type": "section",
                "name": "contacts",
                "label": "Contacts",
                "children": [
                    {
                        "type": "fieldList",
                        "name": "contacts",
                        "children": [
                            {
                                "type": "field",
                                "definition": "/properties/contacts/items/properties/name"
                                "/properties/first_name",
                            },
                            {
                                "type": "field",
                                "definition": "/properties/contacts/items/properties/email",
                            },
                        ],
                    }
                ],
            },
        ]
        assert flatten_ui.field_order(ui_schema) == placed(
            "organization", "contacts.[].name.first_name", "contacts.[].email"
        )

    @pytest.mark.parametrize("node_type", ["multiField", "text"])
    def test_raises_on_unknown_sgg_node_types(self, node_type):
        ui_schema = [{"type": "section", "children": [{"type": node_type, "name": "budget"}]}]
        with pytest.raises(ValueError, match=f"'{node_type}' UI node type is not read"):
            flatten_ui.field_order(ui_schema)

    def test_reads_json_forms_controls_through_layouts(self):
        ui_schema = {
            "type": "Group",
            "label": "Form",
            "elements": [
                {"type": "Control", "scope": "#/properties/organization"},
                {
                    "type": "HorizontalLayout",
                    "elements": [
                        {"type": "Control", "scope": "#/properties/name/properties/first_name"},
                        {"type": "Control", "scope": "#/properties/name/properties/last_name"},
                    ],
                },
            ],
        }
        assert flatten_ui.field_order(ui_schema) == placed(
            "organization", "name.first_name", "name.last_name"
        )

    def test_reads_list_entry_scopes_relative_to_list_items(self):
        ui_schema = {
            "type": "VerticalLayout",
            "elements": [
                {
                    "type": "Control",
                    "scope": "#/properties/contacts",
                    "options": {
                        "detail": {
                            "type": "Group",
                            "label": "Contact",
                            "elements": [
                                {"type": "Control", "scope": "#/properties/name"},
                                {
                                    "type": "Control",
                                    "scope": "#/properties/address/properties/city",
                                },
                            ],
                        }
                    },
                }
            ],
        }
        assert flatten_ui.field_order(ui_schema) == placed(
            "contacts.[].name", "contacts.[].address.city"
        )

    def test_reads_both_formats_same_regardless_of_grouping(self):
        sgg = [
            {
                "type": "section",
                "name": "all",
                "children": [
                    {"type": "field", "definition": "/properties/a"},
                    {"type": "field", "definition": "/properties/b"},
                ],
            }
        ]
        json_forms = {
            "type": "VerticalLayout",
            "elements": [
                {
                    "type": "Group",
                    "label": "First",
                    "elements": [{"type": "Control", "scope": "#/properties/a"}],
                },
                {
                    "type": "Group",
                    "label": "Second",
                    "elements": [{"type": "Control", "scope": "#/properties/b"}],
                },
            ],
        }
        assert flatten_ui.field_order(sgg) == flatten_ui.field_order(json_forms)
