"""Tests for the checks in `compare.unchecked_rules` over hand-built forms."""

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.xml.harness.compare import unchecked_rules
from tests.src.form_schema.parity.xml.harness.utils import declaring, flat

REASON = "conditional_transform.type 'array_decomposition'"


class TestUnrecorded:
    def test_accepts_recorded_rule(self):
        form = flat(
            diff=declaring(unchecked_rules={"budget_sections": REASON}),
            unchecked_rules={"budget_sections": REASON},
        )
        assert not unchecked_rules.unrecorded(form)

    def test_flags_rule_record_omits(self):
        form = flat(unchecked_rules={"budget_sections": REASON})
        assert [d.kind for d in unchecked_rules.unrecorded(form)] == [
            DiscrepancyKind.UNCHECKED_RULE_NOT_RECORDED
        ]


class TestStaleEntries:
    def test_keeps_entry_for_rule_still_unchecked(self):
        form = flat(
            diff=declaring(unchecked_rules={"budget_sections": REASON}),
            unchecked_rules={"budget_sections": REASON},
        )
        assert not unchecked_rules.stale_entries(form)

    def test_flags_entry_for_rule_now_checked(self):
        form = flat(diff=declaring(unchecked_rules={"budget_sections": REASON}))
        assert [d.kind for d in unchecked_rules.stale_entries(form)] == [
            DiscrepancyKind.UNCHECKED_RULE_NOW_CHECKED
        ]
