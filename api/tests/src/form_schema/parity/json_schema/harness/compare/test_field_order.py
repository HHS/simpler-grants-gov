"""Tests for the checks in `compare.field_order` over hand-built field orders."""

import pytest

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.json_schema.harness.compare import field_order
from tests.src.form_schema.parity.json_schema.harness.utils import (
    NOTHING_DECLARED,
    declaring,
    kinds,
    placed,
)


class TestNeighbors:
    @pytest.mark.parametrize(
        ("at", "expected"),
        [(0, "First · before b"), (1, "After a · before c"), (2, "After b · last")],
        ids=["first", "middle", "last"],
    )
    def test_names_entries_on_either_side(self, at, expected):
        assert field_order.neighbors(["a", "b", "c"], at) == expected

    def test_names_only_entry_first_and_last(self):
        assert field_order.neighbors(["a"], 0) == "First · last"


class TestDifferences:
    def test_accepts_fields_in_same_order(self):
        both = placed("a", "b", "c")
        assert not field_order.differences(NOTHING_DECLARED, both, both)

    def test_reports_only_moved_field(self):
        """Moving `d` ahead of `b` shifts `b` and `c` too, but only `d` needs to move back."""
        generated = placed("a", "d", "b", "c", "e")
        handwritten = placed("a", "b", "c", "d", "e")
        found = field_order.differences(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [
            "out of order: d -- generated: After a · before b; handwritten: After c · before e"
        ]

    def test_names_neighbors_relative_to_moved_field(self):
        generated = placed("c.[].role", "c.[].title", "c.[].name.first", "c.[].name.last")
        handwritten = placed("c.[].role", "c.[].name.first", "c.[].name.last", "c.[].title")
        found = field_order.differences(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [
            "out of order: c.[].title -- generated: After role · before name.first; "
            "handwritten: After name.last · last"
        ]

    def test_ignores_field_only_one_form_shows(self):
        generated = placed("extra", "a", "b", "c")
        handwritten = placed("a", "b", "c", "legacy")
        assert not field_order.differences(NOTHING_DECLARED, generated, handwritten)

    def test_compares_mapped_fields_by_counterpart(self):
        diff = declaring(mapped={"phone": "phone_number"})
        generated = placed("phone", "email")
        handwritten = placed("phone_number", "email")
        assert not field_order.differences(diff, generated, handwritten)

    def test_ignores_field_listed_in_out_of_order(self):
        diff = declaring(out_of_order={"d": "Grants.gov asks for it earlier"})
        generated = placed("a", "d", "b", "c")
        handwritten = placed("a", "b", "c", "d")
        assert not field_order.differences(diff, generated, handwritten)


class TestStaleEntries:
    def test_keeps_entry_for_field_still_out_of_order(self):
        diff = declaring(out_of_order={"d": "Grants.gov asks for it earlier"})
        generated = placed("a", "d", "b", "c")
        handwritten = placed("a", "b", "c", "d")
        assert not field_order.stale_entries(diff, generated, handwritten)

    def test_flags_entry_for_field_back_in_order(self):
        diff = declaring(out_of_order={"d": "Grants.gov asks for it earlier"})
        both = placed("a", "b", "c", "d")
        assert [str(d) for d in field_order.stale_entries(diff, both, both)] == [
            "recorded order difference no longer differs: d -- Grants.gov asks for it earlier"
        ]

    def test_flags_entry_for_field_neither_form_shows(self):
        diff = declaring(out_of_order={"ghost": "a reason for a field long gone"})
        both = placed("a", "b")
        assert kinds(field_order.stale_entries(diff, both, both)) == [
            DiscrepancyKind.ORDER_NO_LONGER_DIFFERS
        ]
