"""Tests for the checks in `compare.field_validation` over hand-built fields."""

import pytest

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.json_schema.harness.compare import field_validation
from tests.src.form_schema.parity.json_schema.harness.utils import (
    NOTHING_DECLARED,
    declaring,
    field,
    kinds,
    named_inputs,
)


class TestUnmatchedFields:
    def test_reports_nothing_when_every_field_matches(self):
        both = named_inputs("agency_name", "applicant.street1")
        assert not field_validation.unmatched_fields(NOTHING_DECLARED, both, both)

    @pytest.mark.parametrize(
        ("generated", "handwritten", "expected"),
        [
            (named_inputs("a", "extra"), named_inputs("a"), "generated input is unmapped: extra"),
            (
                named_inputs("a"),
                named_inputs("a", "legacy"),
                "handwritten input is unmapped: legacy",
            ),
        ],
        ids=["only-generated-has-it", "only-handwritten-has-it"],
    )
    def test_reports_field_only_one_form_has(self, generated, handwritten, expected):
        found = field_validation.unmatched_fields(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [expected]

    def test_ignores_field_declared_absent(self):
        diff = declaring(absent_from_source={"extra": "the specification asks for it"})
        assert not field_validation.unmatched_fields(
            diff, named_inputs("a", "extra"), named_inputs("a")
        )

    def test_ignores_both_ends_of_mapping(self):
        diff = declaring(mapped={"p.phone": "p.phone_number"})
        assert not field_validation.unmatched_fields(
            diff, named_inputs("p.phone"), named_inputs("p.phone_number")
        )

    def test_reports_fields_left_over_by_mapping(self):
        """Both forms have `a` and `b`, and `a` is mapped to `b`, so generated `b` and
        hand-written `a` match nothing."""
        both = named_inputs("a", "b")
        found = field_validation.unmatched_fields(declaring(mapped={"a": "b"}), both, both)
        assert [str(d) for d in found] == [
            "generated input is unmapped: b",
            "handwritten input is unmapped: a",
        ]


class TestRuleDifferences:
    def test_accepts_fields_with_identical_rules(self):
        both = {("a",): field(type="string", maxLength=60)}
        assert not field_validation.rule_differences(NOTHING_DECLARED, both, both)

    @pytest.mark.parametrize(
        ("generated", "handwritten", "keyword"),
        [
            (field(type="string"), field(type="integer"), "type"),
            (field(type="string", maxLength=60), field(type="string", maxLength=200), "maxLength"),
        ],
        ids=["type", "bound"],
    )
    def test_flags_differing_keyword(self, generated, handwritten, keyword):
        found = field_validation.rule_differences(
            NOTHING_DECLARED, {("a",): generated}, {("a",): handwritten}
        )
        assert [(d.kind, d.keyword) for d in found] == [(DiscrepancyKind.RULE_DIFFERS, keyword)]

    def test_flags_keyword_set_on_one_form_only(self):
        generated = {("a",): field(type="string", maxLength=60)}
        handwritten = {("a",): field(type="string")}
        found = field_validation.rule_differences(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [
            "maxLength differs: a -- generated 60, handwritten (absent)"
        ]

    def test_flags_field_required_on_one_form_only(self):
        generated = {("a",): field(required=True)}
        handwritten = {("a",): field(required=False)}
        found = field_validation.rule_differences(NOTHING_DECLARED, generated, handwritten)
        assert kinds(found) == [DiscrepancyKind.REQUIREDNESS_DIFFERS]

    def test_ignores_difference_listed_in_differing_rules(self):
        diff = declaring(differing_rules={"a/maxLength": "the hand-written form is wrong"})
        generated = {("a",): field(type="string", maxLength=60)}
        handwritten = {("a",): field(type="string", maxLength=200)}
        assert not field_validation.rule_differences(diff, generated, handwritten)

    def test_ignores_unmatched_fields(self):
        generated = {("a",): field(type="string")}
        handwritten = {("b",): field(type="integer")}
        assert not field_validation.rule_differences(NOTHING_DECLARED, generated, handwritten)


class TestStaleEntries:
    def test_flags_mapping_to_missing_field(self):
        diff = declaring(mapped={"p.phone": "p.phone_number"})
        found = field_validation.stale_entries(
            diff, named_inputs("p.phone"), named_inputs("p.other")
        )
        assert [str(d) for d in found] == ["no such handwritten input: p.phone_number"]

    def test_flags_mapping_to_same_path(self):
        both = named_inputs("a")
        found = field_validation.stale_entries(declaring(mapped={"a": "a"}), both, both)
        assert kinds(found) == [DiscrepancyKind.MAPPED_TO_SAME_PATH]

    def test_flags_declared_absence_for_missing_field(self):
        diff = declaring(absent_from_source={"ghost": "a reason for a field that isn't there"})
        both = named_inputs("a")
        assert kinds(field_validation.stale_entries(diff, both, both)) == [
            DiscrepancyKind.ABSENT_FIELD_NOT_GENERATED
        ]

    def test_flags_rule_difference_for_missing_field(self):
        diff = declaring(differing_rules={"ghost/maxLength": "a citation for a field long gone"})
        both = named_inputs("a")
        assert kinds(field_validation.stale_entries(diff, both, both)) == [
            DiscrepancyKind.RULE_ENTRY_NAMES_NO_INPUT
        ]
