"""Validates whether a form's XML mapping produces XML that matches the Grants.gov XSD and
includes every answer, which includes:

- Mapping vs XSD: Does the mapping produce only elements the XSD declares, every required
  element, and each parent's children in the XSD's order?
- Mapping vs form schema: Does the mapping read every form field, and only fields the form
  has?
- Form schema vs XSD: Does each field only accept values its element allows?
- Recorded differences: Does the `FormDiff` list every rule the checks can't read, and
  does every difference it records still exist?
"""

import pytest

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.xml.diffs import key_contacts, key_contacts_generated
from tests.src.form_schema.parity.xml.harness import flatten_form
from tests.src.form_schema.parity.xml.harness.compare import (
    form_schema_vs_xsd,
    mapping_vs_form_schema,
    mapping_vs_xsd,
    unchecked_rules,
)

DIFFS = [
    key_contacts.DIFF,
    key_contacts_generated.DIFF,
]


@pytest.fixture(scope="module", params=DIFFS, ids=lambda d: d.module)
def form(request):
    """One form, flattened. Module-scoped, so each form is read once."""
    return flatten_form.load(request.param)


def _skip_unchecked(form) -> None:
    """Skip a check for a form with rules the checks can't read."""
    if form.diff.unchecked_rules:
        pytest.skip(
            f"{form.diff.module} has unchecked rules: "
            + "; ".join(f"{k}: {why}" for k, why in sorted(form.diff.unchecked_rules.items()))
        )


def _report(found) -> str:
    return "\n".join(f"  {d}" for d in found)


class TestMappingVsXsd:
    """Does the mapping produce only declared elements, every required one, in order?"""

    def test_xml_mapping_does_not_emit_undeclared_elements(self, form):
        _skip_unchecked(form)
        found = mapping_vs_xsd.undeclared_targets(form)
        assert not found, (
            f"{form.diff.module}: the mapping produces elements the XSD doesn't declare:\n"
            + _report(found)
        )

    def test_xml_mapping_not_missing_required_elements(self, form):
        _skip_unchecked(form)
        found = mapping_vs_xsd.unsourced_elements(form)
        assert (
            not found
        ), f"{form.diff.module}: the mapping doesn't produce these required elements:\n" + _report(
            found
        )

    def test_xml_mapping_follows_xsd_element_order(self, form):
        _skip_unchecked(form)
        found = mapping_vs_xsd.out_of_order_elements(form)
        assert (
            not found
        ), f"{form.diff.module}: the mapping produces elements out of order:\n" + _report(found)


class TestMappingVsFormSchema:
    """Does the mapping read every form field, and only fields the form has?"""

    def test_no_form_field_is_missing_from_xml_mapping(self, form):
        _skip_unchecked(form)
        found = [
            d
            for d in mapping_vs_form_schema.unmatched_fields(form)
            if d.kind == DiscrepancyKind.UNMAPPED_FORM_FIELD
        ]
        assert not found, (
            f"{form.diff.module}: the mapping doesn't read these fields, so their answers aren't "
            f"submitted:\n" + _report(found)
        )

    def test_xml_mapping_does_not_read_unknown_form_fields(self, form):
        _skip_unchecked(form)
        found = [
            d
            for d in mapping_vs_form_schema.unmatched_fields(form)
            if d.kind == DiscrepancyKind.UNKNOWN_RULE_SOURCE
        ]
        assert (
            not found
        ), f"{form.diff.module}: rules read fields the form doesn't have:\n" + _report(found)


class TestFormSchemaVsXsd:
    """Does each field only accept values its XSD element allows?"""

    def test_form_does_not_offer_values_outside_xsd_enums(self, form):
        _skip_unchecked(form)
        found = [d for d in form_schema_vs_xsd.rule_differences(form) if d.keyword == "enum"]
        assert (
            not found
        ), f"{form.diff.module}: fields offer values their elements don't list:\n" + _report(found)

    def test_form_does_not_accept_values_outside_xsd_bounds(self, form):
        _skip_unchecked(form)
        found = [
            d
            for d in form_schema_vs_xsd.rule_differences(form)
            if d.keyword in form_schema_vs_xsd.LOOSER
            or d.kind == DiscrepancyKind.RANGE_NOT_IN_PATTERN
        ]
        assert not found, (
            f"{form.diff.module}: fields accept lengths or amounts their elements don't "
            f"allow:\n" + _report(found)
        )

    def test_form_field_types_match_xsd_element_types(self, form):
        _skip_unchecked(form)
        found = [d for d in form_schema_vs_xsd.rule_differences(form) if d.keyword == "type"]
        assert not found, (
            f"{form.diff.module}: fields have a different type from their elements, with no "
            f"value_transform to convert them:\n" + _report(found)
        )


class TestRecordedDifferences:
    """Does the `FormDiff` match what the checks find?"""

    def test_unchecked_rules_are_recorded(self, form):
        """Runs for every form, including those that skip the other checks."""
        found = unchecked_rules.unrecorded(form) + unchecked_rules.stale_entries(form)
        assert not found, (
            f"{form.diff.module}: the rules the checks can't read don't match "
            f"`unchecked_rules`:\n" + _report(found)
        )

    def test_recorded_differences_are_not_stale(self, form):
        _skip_unchecked(form)
        found = mapping_vs_form_schema.stale_entries(form) + form_schema_vs_xsd.stale_entries(form)
        assert not found, f"{form.diff.module}: recorded differences no longer exist:\n" + _report(
            found
        )
