"""Fixture tests for the functions in `harness/`.

`test_forms.py` runs these functions over real forms, where almost everything lines up.
These run them over hand-built `FormInput` dictionaries chosen to break them, so each rule
is visible on its own.

One class per function under test. `TestInputRules` covers `flatten_schema.inputs()`
instead, since the way it canonicalizes a rule decides what `rule_differences()` sees.
"""

import pytest

from tests.src.form_schema.parity.json_schema.harness import compare, flatten_schema
from tests.src.form_schema.parity.json_schema.harness.flatten_schema import FormInput
from tests.src.form_schema.parity.json_schema.harness.form_diff import FormDiff

NOTHING_DECLARED = FormDiff(generated_module="g", handwritten_module="h")


def declaring(**registers) -> FormDiff:
    return FormDiff(generated_module="g", handwritten_module="h", **registers)


def inputs(*names: str) -> dict[tuple[str, ...], FormInput]:
    """Fields with no rules, for the checks that only care which fields exist."""
    return {tuple(name.split(".")): FormInput(required=False, rules={}) for name in names}


def field(required: bool = False, **rules) -> FormInput:
    """One field and its rules. `field(type="string", maxLength=60)`."""
    return FormInput(required=required, rules=rules)


def worded(title: str | None = None, description: str | None = None) -> FormInput:
    """One field and the text beside it. `worded("Email", "Where we will reach you.")`."""
    return FormInput(required=False, rules={}, title=title, description=description)


def matched(diff, generated, handwritten) -> dict[str, str]:
    return {
        ".".join(k): ".".join(v)
        for k, v in compare.match_fields(diff, generated, handwritten).items()
    }


def kinds(discrepancies) -> list[str]:
    return [d.kind for d in discrepancies]


class TestFieldMatching:
    """Which hand-written field `match_fields()` treats each generated field as."""

    def test_matches_identical_paths(self):
        both = inputs("agency_name", "applicant.street1")
        assert matched(NOTHING_DECLARED, both, both) == {
            "agency_name": "agency_name",
            "applicant.street1": "applicant.street1",
        }

    def test_matches_renamed_field_to_declared_target(self):
        """The generated form spells it `p.phone`, the hand-written form `p.phone_number`."""
        diff = declaring(renamed={"p.phone": "p.phone_number"})
        assert matched(diff, inputs("p.phone"), inputs("p.phone_number")) == {
            "p.phone": "p.phone_number"
        }

    def test_refuses_to_match_a_field_two_ways(self):
        """Both forms have `a` and `b`, and the record renames `a` to `b`. Matching `b` to
        itself as well would give `b` two meanings, so only the declared pair is matched."""
        both = inputs("a", "b")
        assert matched(declaring(renamed={"a": "b"}), both, both) == {"a": "b"}


class TestUnmatchedFields:
    """Which fields `unmatched_fields()` reports as accounted for by neither side."""

    def test_reports_nothing_when_every_field_matches(self):
        both = inputs("agency_name", "applicant.street1")
        assert not compare.unmatched_fields(NOTHING_DECLARED, both, both)

    @pytest.mark.parametrize(
        ("generated", "handwritten", "expected"),
        [
            (inputs("a", "extra"), inputs("a"), "generated input is unmapped: extra"),
            (inputs("a"), inputs("a", "legacy"), "handwritten input is unmapped: legacy"),
        ],
        ids=["only-generated-has-it", "only-handwritten-has-it"],
    )
    def test_reports_field_only_one_form_has(self, generated, handwritten, expected):
        """The check the identity default must not weaken."""
        found = compare.unmatched_fields(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [expected]

    def test_ignores_field_declared_absent(self):
        diff = declaring(
            absent_from_source={"extra": "the specification asks for it and the form does not"}
        )
        assert not compare.unmatched_fields(diff, inputs("a", "extra"), inputs("a"))

    def test_ignores_both_ends_of_declared_rename(self):
        diff = declaring(renamed={"p.phone": "p.phone_number"})
        assert not compare.unmatched_fields(diff, inputs("p.phone"), inputs("p.phone_number"))

    def test_reports_both_ends_of_ambiguous_rename(self):
        """The leftovers from `test_refuses_to_match_a_field_two_ways`: generated `b` and
        hand-written `a` matched nothing, so the ambiguity has to be declared."""
        both = inputs("a", "b")
        found = compare.unmatched_fields(declaring(renamed={"a": "b"}), both, both)
        assert [str(d) for d in found] == [
            "generated input is unmapped: b",
            "handwritten input is unmapped: a",
        ]


class TestRuleDifferences:
    """Which matched fields `rule_differences()` reports as governed differently."""

    def test_accepts_fields_with_identical_rules(self):
        both = {("a",): field(type="string", maxLength=60)}
        assert not compare.rule_differences(NOTHING_DECLARED, both, both)

    def test_flags_fields_with_different_types(self):
        generated = {("a",): field(type="string")}
        handwritten = {("a",): field(type="integer")}
        assert kinds(compare.rule_differences(NOTHING_DECLARED, generated, handwritten)) == [
            "type differs"
        ]

    def test_flags_fields_with_different_bounds(self):
        generated = {("a",): field(type="string", maxLength=60)}
        handwritten = {("a",): field(type="string", maxLength=200)}
        assert kinds(compare.rule_differences(NOTHING_DECLARED, generated, handwritten)) == [
            "maxLength differs"
        ]

    def test_flags_bound_declared_on_one_form_only(self):
        """Declaring nothing where the other form declares a limit is a difference: the
        field accepts values the other rejects."""
        generated = {("a",): field(type="string", maxLength=60)}
        handwritten = {("a",): field(type="string")}
        found = compare.rule_differences(NOTHING_DECLARED, generated, handwritten)
        assert kinds(found) == ["maxLength differs"]
        assert found[0].detail == "generated 60, handwritten (absent)"

    def test_flags_field_required_on_one_form_only(self):
        generated = {("a",): field(required=True)}
        handwritten = {("a",): field(required=False)}
        assert kinds(compare.rule_differences(NOTHING_DECLARED, generated, handwritten)) == [
            "requiredness differs"
        ]

    def test_ignores_difference_listed_in_differing_rules(self):
        diff = declaring(
            differing_rules={"a/maxLength": "the hand-written form is the one that is wrong"}
        )
        generated = {("a",): field(type="string", maxLength=60)}
        handwritten = {("a",): field(type="string", maxLength=200)}
        assert not compare.rule_differences(diff, generated, handwritten)

    def test_ignores_fields_that_match_nothing(self):
        """Only matched pairs are compared; a one-sided field is `unmatched_fields`' business."""
        generated = {("a",): field(type="string")}
        handwritten = {("b",): field(type="integer")}
        assert not compare.rule_differences(NOTHING_DECLARED, generated, handwritten)


class TestTextDifferences:
    """Which matched fields `text_differences()` reports as worded differently."""

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
        found = compare.text_differences(
            NOTHING_DECLARED, {("a",): worded(generated)}, {("a",): worded(handwritten)}
        )
        assert not found

    def test_flags_a_change_of_wording(self):
        generated = {("a",): worded("E-mail address")}
        handwritten = {("a",): worded("Email")}
        found = compare.text_differences(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [
            "title differs: a -- generated 'E-mail address', handwritten 'Email'"
        ]

    def test_flags_text_stated_on_one_form_only(self):
        generated = {("a",): worded("Email", "Where we will reach you.")}
        handwritten = {("a",): worded("Email")}
        found = compare.text_differences(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [
            "description differs: a -- generated 'Where we will reach you.', handwritten (absent)"
        ]

    def test_ignores_difference_listed_in_differing_text(self):
        diff = declaring(differing_text={"a/title": "the Grants.gov form labels it E-mail"})
        generated = {("a",): worded("E-mail address")}
        handwritten = {("a",): worded("Email")}
        assert not compare.text_differences(diff, generated, handwritten)

    def test_compares_renamed_fields_under_the_generated_path(self):
        diff = declaring(renamed={"p.phone": "p.phone_number"})
        generated = {("p", "phone"): worded("Phone")}
        handwritten = {("p", "phone_number"): worded("Telephone")}
        assert [d.path for d in compare.text_differences(diff, generated, handwritten)] == [
            "p.phone"
        ]


class TestStaleEntries:
    """Which record entries `stale_entries()` reports as no longer describing anything real."""

    def test_flags_rename_to_field_that_does_not_exist(self):
        diff = declaring(renamed={"p.phone": "p.phone_number"})
        found = compare.stale_entries(diff, inputs("p.phone"), inputs("p.other"))
        assert [str(d) for d in found] == ["no such handwritten input: p.phone_number"]

    def test_flags_rename_to_same_path(self):
        """A redundant entry would imply a difference that is not there."""
        both = inputs("a")
        assert kinds(compare.stale_entries(declaring(renamed={"a": "a"}), both, both)) == [
            "rename to the same path"
        ]

    def test_flags_declared_absence_for_unknown_field(self):
        diff = declaring(absent_from_source={"ghost": "a reason for a field that is not there"})
        both = inputs("a")
        assert kinds(compare.stale_entries(diff, both, both)) == [
            "declared absent but not a generated input"
        ]

    def test_flags_recorded_difference_for_unknown_field(self):
        diff = declaring(differing_rules={"ghost/maxLength": "a citation for a field long gone"})
        both = inputs("a")
        assert kinds(compare.stale_entries(diff, both, both)) == [
            "recorded difference names no such input"
        ]

    def test_flags_recorded_text_difference_for_unknown_field(self):
        diff = declaring(differing_text={"ghost/title": "a reason for a field long gone"})
        both = inputs("a")
        assert kinds(compare.stale_entries(diff, both, both)) == [
            "recorded difference names no such input"
        ]

    def test_flags_recorded_text_difference_that_no_longer_differs(self):
        """The forms now agree, up to case, so the entry describes nothing."""
        diff = declaring(differing_text={"a/title": "the forms used to disagree"})
        generated = {("a",): worded("Email")}
        handwritten = {("a",): worded("EMAIL")}
        assert [str(d) for d in compare.stale_entries(diff, generated, handwritten)] == [
            "recorded text difference no longer differs: a/title -- the forms used to disagree"
        ]

    def test_keeps_recorded_text_difference_that_still_differs(self):
        diff = declaring(differing_text={"a/title": "the Grants.gov form labels it E-mail"})
        generated = {("a",): worded("E-mail address")}
        handwritten = {("a",): worded("Email")}
        assert not compare.stale_entries(diff, generated, handwritten)


class TestInputRules:
    """How `flatten_schema.inputs()` renders a rule, which is what the comparison sees.

    Two spellings that permit exactly the same payloads must flatten to the same rule, or
    two equivalent forms are reported as differing.
    """

    def test_treats_const_and_single_member_enum_as_the_same_rule(self):
        """Simpler Grants writes the enum form because their validator names the keyword
        that failed, and "enum" reads better than "const" in a message."""
        with_const = flatten_schema.inputs({"properties": {"a": {"const": "X"}}})
        with_enum = flatten_schema.inputs({"properties": {"a": {"enum": ["X"]}}})
        assert with_const == with_enum

    def test_ignores_the_order_enum_members_are_declared_in(self):
        """An enum is a set; comparing the lists directly would report a difference that
        no applicant could ever observe."""
        one_way = flatten_schema.inputs({"properties": {"a": {"enum": ["X", "Y"]}}})
        other_way = flatten_schema.inputs({"properties": {"a": {"enum": ["Y", "X"]}}})
        assert one_way == other_way

    def test_keeps_title_and_description_out_of_the_rules(self):
        """They change what an applicant reads, so `text_differences()` compares them, not
        `rule_differences()`."""
        found = flatten_schema.inputs(
            {"properties": {"a": {"type": "string", "title": "A", "description": "About A."}}}
        )
        assert found == {
            ("a",): FormInput(
                required=False, rules={"type": "string"}, title="A", description="About A."
            )
        }
