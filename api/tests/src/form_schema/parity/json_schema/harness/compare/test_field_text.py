"""Tests for the checks in `compare.field_text` over hand-built text."""

import pytest

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.json_schema.harness.compare import field_text
from tests.src.form_schema.parity.json_schema.harness.utils import (
    NOTHING_DECLARED,
    declaring,
    kinds,
    worded,
)


class TestDifferences:
    @pytest.mark.parametrize(
        ("generated", "handwritten"),
        [
            ("First Name", "First Name"),
            ("First Name", "first name"),
            ("First Name", "  First\n   Name "),
            (None, ""),
        ],
        ids=["identical", "case-only", "whitespace-only", "absent-and-empty"],
    )
    def test_ignores_case_and_whitespace(self, generated, handwritten):
        found = field_text.differences(
            NOTHING_DECLARED, {("a",): worded(generated)}, {("a",): worded(handwritten)}
        )
        assert not found

    def test_flags_change_of_wording(self):
        generated = {("a",): worded("E-mail address")}
        handwritten = {("a",): worded("Email")}
        found = field_text.differences(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [
            "title differs: a -- generated 'E-mail address', handwritten 'Email'"
        ]

    def test_flags_text_set_on_one_form_only(self):
        generated = {("a",): worded("Email", "Where we will reach you.")}
        handwritten = {("a",): worded("Email")}
        found = field_text.differences(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [
            "description differs: a -- generated 'Where we will reach you.', handwritten (absent)"
        ]

    def test_ignores_difference_listed_in_differing_text(self):
        diff = declaring(differing_text={"a/title": "the Grants.gov form labels it E-mail"})
        generated = {("a",): worded("E-mail address")}
        handwritten = {("a",): worded("Email")}
        assert not field_text.differences(diff, generated, handwritten)

    def test_reports_mapped_fields_under_generated_path(self):
        diff = declaring(mapped={"p.phone": "p.phone_number"})
        generated = {("p", "phone"): worded("Phone")}
        handwritten = {("p", "phone_number"): worded("Telephone")}
        assert [d.path for d in field_text.differences(diff, generated, handwritten)] == ["p.phone"]


class TestStaleEntries:
    def test_flags_entry_for_missing_field(self):
        diff = declaring(differing_text={"ghost/title": "a reason for a field long gone"})
        both = {("a",): worded("Email")}
        assert kinds(field_text.stale_entries(diff, both, both)) == [
            DiscrepancyKind.TEXT_ENTRY_NAMES_NO_FIELD
        ]

    def test_flags_entry_that_no_longer_differs(self):
        diff = declaring(differing_text={"a/title": "the forms used to disagree"})
        generated = {("a",): worded("Email")}
        handwritten = {("a",): worded("EMAIL")}
        assert [str(d) for d in field_text.stale_entries(diff, generated, handwritten)] == [
            "recorded text difference no longer differs: a/title -- the forms used to disagree"
        ]

    def test_keeps_entry_that_still_differs(self):
        diff = declaring(differing_text={"a/title": "the Grants.gov form labels it E-mail"})
        generated = {("a",): worded("E-mail address")}
        handwritten = {("a",): worded("Email")}
        assert not field_text.stale_entries(diff, generated, handwritten)

    def test_keeps_entry_for_list_heading(self):
        diff = declaring(differing_text={"contacts/description": "Grants.gov words it so"})
        generated = {("contacts",): worded("Contacts", "Up to four.")}
        handwritten = {("contacts",): worded("Contacts", "Between 1 and 4.")}
        assert not field_text.stale_entries(diff, generated, handwritten)
