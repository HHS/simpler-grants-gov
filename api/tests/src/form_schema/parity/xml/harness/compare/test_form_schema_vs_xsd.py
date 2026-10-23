"""Tests for the checks in `compare.form_schema_vs_xsd` over hand-built forms."""

from decimal import Decimal
from typing import Any

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.xml.harness.compare import form_schema_vs_xsd
from tests.src.form_schema.parity.xml.harness.flatten_form import FlatForm
from tests.src.form_schema.parity.xml.harness.utils import (
    FOURTEEN_DIGITS,
    declaring,
    element,
    field,
    flat,
    labels,
)


def one_field(
    field_rules: dict[str, Any], element_rules: dict[str, Any], **overrides: Any
) -> FlatForm:
    """A form with one field, `value`, filling one element, `Value`."""
    parts: dict[str, Any] = {
        "targets": {("Value",): "value"},
        "fields": {("value",): field(**field_rules)},
        "xsd_elements": {("Value",): element(**element_rules)},
    }
    return flat(**{**parts, **overrides})


class TestRuleDifferences:
    def test_accepts_field_stricter_than_element(self):
        form = one_field({"type": "string", "maxLength": 30}, {"maxLength": 60})
        assert not form_schema_vs_xsd.rule_differences(form)

    def test_flags_option_element_does_not_list(self):
        """The two values differ only in their apostrophe."""
        form = one_field(
            {"type": "string", "enum": ["CIV: CÔTE D'IVOIRE"]},
            {"enum": frozenset({"CIV: CÔTE D’IVOIRE"})},
        )
        assert labels(form_schema_vs_xsd.rule_differences(form)) == ["enum differs"]

    def test_flags_bound_looser_than_element(self):
        form = one_field({"type": "string", "maxLength": 200}, {"maxLength": 60})
        assert labels(form_schema_vs_xsd.rule_differences(form)) == ["maxLength differs"]

    def test_flags_missing_bound_element_sets(self):
        form = one_field({"type": "string"}, {"maxLength": 60})
        found = form_schema_vs_xsd.rule_differences(form)
        assert [str(d) for d in found] == ["maxLength differs: Value -- <- value: none, element 60"]

    def test_accepts_missing_min_length_when_element_allows_empty(self):
        form = one_field({"type": "string"}, {"minLength": 0})
        assert not form_schema_vs_xsd.rule_differences(form)

    def test_reads_money_range_from_pattern(self):
        form = one_field(
            {"type": "string", "pattern": FOURTEEN_DIGITS},
            {"maximum": Decimal("999999999999.99")},
        )
        assert labels(form_schema_vs_xsd.rule_differences(form)) == ["maximum differs"]

    def test_flags_money_pattern_without_range(self):
        form = one_field(
            {"type": "string", "pattern": "^[A-Z]+$"},
            {"maximum": Decimal("999999999999.99")},
        )
        assert [d.kind for d in form_schema_vs_xsd.rule_differences(form)] == [
            DiscrepancyKind.RANGE_UNREADABLE
        ]

    def test_flags_type_element_does_not_expect(self):
        form = one_field({"type": "boolean"}, {"primitive": "string"})
        assert labels(form_schema_vs_xsd.rule_differences(form)) == ["type differs"]

    def test_ignores_difference_value_transform_accounts_for(self):
        form = one_field(
            {"type": "boolean"},
            {"primitive": "string"},
            transformed={("Value",): frozenset({"boolean_to_yes_no"})},
        )
        assert not form_schema_vs_xsd.rule_differences(form)

    def test_ignores_difference_listed_in_differing_rules(self):
        form = one_field(
            {"type": "string", "maxLength": 200},
            {"maxLength": 60},
            diff=declaring(differing_rules={"Value/maxLength": "a recorded difference"}),
        )
        assert not form_schema_vs_xsd.rule_differences(form)

    def test_ignores_container_element(self):
        form = flat(
            targets={("Applicant",): None},
            xsd_elements={("Applicant",): element(maxLength=60)},
        )
        assert not form_schema_vs_xsd.rule_differences(form)


class TestStaleEntries:
    def test_keeps_entry_field_still_breaks(self):
        form = one_field(
            {"type": "string"},
            {"maxLength": 60},
            diff=declaring(differing_rules={"Value/maxLength": "the form sets no maxLength"}),
        )
        assert not form_schema_vs_xsd.stale_entries(form)

    def test_flags_entry_field_now_satisfies(self):
        form = one_field(
            {"type": "string", "maxLength": 60},
            {"maxLength": 60},
            diff=declaring(differing_rules={"Value/maxLength": "the form sets no maxLength"}),
        )
        assert [d.kind for d in form_schema_vs_xsd.stale_entries(form)] == [
            DiscrepancyKind.RULE_NO_LONGER_DIFFERS
        ]

    def test_flags_entry_for_missing_element(self):
        form = flat(diff=declaring(differing_rules={"Ghost/maxLength": "an element long gone"}))
        assert [d.kind for d in form_schema_vs_xsd.stale_entries(form)] == [
            DiscrepancyKind.RULE_ENTRY_NAMES_NO_ELEMENT
        ]

    def test_flags_entry_for_keyword_element_does_not_set(self):
        form = flat(
            diff=declaring(differing_rules={"Value/maxLength": "a limit that isn't there"}),
            xsd_elements={("Value",): element(minLength=1)},
        )
        assert [d.kind for d in form_schema_vs_xsd.stale_entries(form)] == [
            DiscrepancyKind.RULE_ENTRY_KEYWORD_NOT_DECLARED
        ]

    def test_flags_type_entry_for_element_without_type(self):
        form = flat(
            diff=declaring(differing_rules={"Value/type": "a container element"}),
            xsd_elements={("Value",): element(primitive=None)},
        )
        assert [d.kind for d in form_schema_vs_xsd.stale_entries(form)] == [
            DiscrepancyKind.RULE_ENTRY_ELEMENT_HAS_NO_TYPE
        ]
