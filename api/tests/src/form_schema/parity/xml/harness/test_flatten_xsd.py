"""Tests for `flatten_xsd.elements()` and `flatten_xsd.implied_range()`.

`elements()` reads a vendored Grants.gov XSD, so its tests use Key Contacts'.
"""

from decimal import Decimal

import pytest
import xmlschema

from tests.src.form_schema.parity.xml.harness import flatten_xsd
from tests.src.form_schema.parity.xml.harness.utils import FOURTEEN_DIGITS

KEY_CONTACTS = ("Key_Contacts_2_0-V2.0.xsd", "Key_Contacts_2_0")


@pytest.fixture(scope="module")
def key_contacts():
    return flatten_xsd.elements(*KEY_CONTACTS)


class TestElements:
    def test_reads_required_status_position_and_constraints(self, key_contacts):
        assert key_contacts["RoleOnProject", "ContactEmail"] == flatten_xsd.Element(
            required=True, position=7, primitive="string", rules={"minLength": 1, "maxLength": 60}
        )

    def test_marks_optional_element_not_required(self, key_contacts):
        assert not key_contacts["RoleOnProject", "ContactName", "PrefixName"].required

    def test_reads_attribute_without_position(self, key_contacts):
        assert key_contacts["@FormVersion",] == flatten_xsd.Element(required=False, position=-1)

    def test_reads_container_without_primitive(self, key_contacts):
        assert key_contacts["RoleOnProject", "ContactName"].primitive is None

    def test_resolves_imported_types(self, key_contacts):
        """`ContactAddress` is a `globLib:AddressDataTypeV3`, declared in another file."""
        country = key_contacts["RoleOnProject", "ContactAddress", "Country"]
        assert "CIV: CÔTE D’IVOIRE" in country.rules["enum"]

    def test_raises_on_xsd_not_vendored(self):
        with pytest.raises(FileNotFoundError, match="is not vendored"):
            flatten_xsd.elements("Missing-V1.0.xsd", "Missing")

    def test_raises_on_undeclared_root(self):
        with pytest.raises(KeyError, match="declares no root element 'Wrong'"):
            flatten_xsd.elements(KEY_CONTACTS[0], "Wrong")


class TestConstraints:
    def test_reads_pattern_facet(self):
        schema = xmlschema.XMLSchema("""<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
              <xs:element name="NsfId">
                <xs:simpleType>
                  <xs:restriction base="xs:string"><xs:pattern value="[0-9A-Z]{9}"/></xs:restriction>
                </xs:simpleType>
              </xs:element>
            </xs:schema>""")
        _, rules = flatten_xsd._constraints(schema.elements["NsfId"])
        assert rules["pattern"] == "[0-9A-Z]{9}"


class TestImpliedRange:
    def test_reads_range_from_money_pattern(self):
        assert flatten_xsd.implied_range(FOURTEEN_DIGITS) == (
            Decimal(0),
            Decimal("99999999999999.99"),
        )

    def test_returns_none_for_other_patterns(self):
        assert flatten_xsd.implied_range("^[A-Z]+$") is None
