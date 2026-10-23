"""Tests for `match.match_fields()` over hand-built fields."""

from tests.src.form_schema.parity.json_schema.harness.utils import (
    NOTHING_DECLARED,
    declaring,
    matched,
    named_inputs,
)


class TestMatchFields:
    def test_matches_identical_paths(self):
        both = named_inputs("agency_name", "applicant.street1")
        assert matched(NOTHING_DECLARED, both, both) == {
            "agency_name": "agency_name",
            "applicant.street1": "applicant.street1",
        }

    def test_matches_mapped_field_to_declared_target(self):
        diff = declaring(mapped={"p.phone": "p.phone_number"})
        assert matched(diff, named_inputs("p.phone"), named_inputs("p.phone_number")) == {
            "p.phone": "p.phone_number"
        }

    def test_matches_mapping_target_only_once(self):
        """Both forms have `a` and `b`, and `a` is mapped to `b`, so `b` doesn't also match
        itself."""
        both = named_inputs("a", "b")
        assert matched(declaring(mapped={"a": "b"}), both, both) == {"a": "b"}
