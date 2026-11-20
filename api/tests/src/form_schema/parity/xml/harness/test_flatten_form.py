"""Tests for `flatten_form.flatten()` and `flatten_form.load()`.

The mappings target Key Contacts' vendored XSD, since `flatten()` reads the XSD a mapping
names.
"""

from tests.src.form_schema.parity.xml.harness import flatten_form
from tests.src.form_schema.parity.xml.harness.form_diff import FormDiff
from tests.src.form_schema.parity.xml.harness.utils import NOTHING_DECLARED, field

CONFIG = {
    "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd",
    "xml_structure": {"root_element": "Key_Contacts_2_0"},
}

SCHEMA = {
    "type": "object",
    "required": ["applicant_organization_name"],
    "properties": {"applicant_organization_name": {"type": "string", "maxLength": 60}},
}


class TestFlatten:
    def test_reads_mapping_fields_and_xsd(self):
        mapping = {
            "_xml_config": CONFIG,
            "applicant_organization_name": {
                "xml_transform": {"target": "ApplicantOrganizationName"}
            },
        }
        form = flatten_form.flatten(NOTHING_DECLARED, mapping, SCHEMA)
        assert form.targets == {("ApplicantOrganizationName",): "applicant_organization_name"}
        assert form.fields == {
            ("applicant_organization_name",): field(required=True, type="string", maxLength=60)
        }
        assert ("RoleOnProject", "ContactEmail") in form.xsd_elements
        assert form.sources == {"applicant_organization_name"}
        assert form.field_paths == frozenset({"applicant_organization_name"})

    def test_leaves_out_fields_when_rules_are_unchecked(self):
        mapping = {
            "_xml_config": CONFIG,
            "budget": {
                "xml_transform": {
                    "type": "conditional",
                    "conditional_transform": {"type": "array_decomposition"},
                }
            },
        }
        form = flatten_form.flatten(NOTHING_DECLARED, mapping, SCHEMA)
        assert form.unchecked_rules == {
            "budget": "conditional_transform.type 'array_decomposition'"
        }
        assert form.fields == {}


class TestLoad:
    def test_loads_handwritten_form_by_module(self):
        form = flatten_form.load(FormDiff(module="key_contacts"))
        assert form.unchecked_rules == {}
        assert ("key_contacts", "[]", "email") in form.fields
