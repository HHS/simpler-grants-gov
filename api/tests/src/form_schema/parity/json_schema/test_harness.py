"""Fixture tests for the functions in `harness/`.

`test_forms.py` runs these functions over real forms, where almost everything lines up.
These run them over hand-built `FormInput` dictionaries chosen to break them, so each rule
is visible on its own.

One class per function under test. `TestInputRules` covers `flatten_schema.inputs()`
instead, since the way it canonicalizes a rule decides what `rule_differences()` sees, and
`TestFieldOrder` covers `flatten_ui.field_order()`, which decides what
`order_differences()` sees.
"""

import pytest

from tests.src.form_schema.parity.json_schema.harness import compare, flatten_schema, flatten_ui
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


def placed(*names: str) -> list[tuple[str, ...]]:
    """Fields in the order a UI schema places them, for the order checks."""
    return [tuple(name.split(".")) for name in names]


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


class TestFieldOrder:
    """How `flatten_ui.field_order()` reads a UI schema, which is what the order check sees.

    Both UI schema formats must flatten to the same paths `flatten_schema.inputs()` uses,
    and grouping must not survive, or regrouping the same fields reads as a difference.
    """

    def test_reads_sgg_fields_in_order_through_sections_and_field_lists(self):
        ui_schema = [
            {
                "type": "section",
                "name": "applicant",
                "label": "Applicant",
                "children": [{"type": "field", "definition": "/properties/organization"}],
            },
            {
                "type": "section",
                "name": "contacts",
                "label": "Contacts",
                "children": [
                    {
                        "type": "fieldList",
                        "name": "contacts",
                        "children": [
                            {
                                "type": "field",
                                "definition": "/properties/contacts/items/properties/name"
                                "/properties/first_name",
                            },
                            {
                                "type": "field",
                                "definition": "/properties/contacts/items/properties/email",
                            },
                        ],
                    }
                ],
            },
        ]
        assert flatten_ui.field_order(ui_schema) == placed(
            "organization", "contacts.[].name.first_name", "contacts.[].email"
        )

    @pytest.mark.parametrize("node_type", ["multiField", "text"])
    def test_refuses_sgg_node_types_it_does_not_read(self, node_type):
        """A node that might place fields is not silently left out of the order."""
        ui_schema = [{"type": "section", "children": [{"type": node_type, "name": "budget"}]}]
        with pytest.raises(ValueError, match=f"'{node_type}' UI node type is not read"):
            flatten_ui.field_order(ui_schema)

    def test_reads_json_forms_controls_in_order_through_layouts(self):
        ui_schema = {
            "type": "Group",
            "label": "Form",
            "elements": [
                {"type": "Control", "scope": "#/properties/organization"},
                {
                    "type": "HorizontalLayout",
                    "elements": [
                        {"type": "Control", "scope": "#/properties/name/properties/first_name"},
                        {"type": "Control", "scope": "#/properties/name/properties/last_name"},
                    ],
                },
            ],
        }
        assert flatten_ui.field_order(ui_schema) == placed(
            "organization", "name.first_name", "name.last_name"
        )

    def test_rebases_a_list_entry_layout_under_the_list_items(self):
        """Scopes in `options.detail` are relative to one entry, as the frontend reads them."""
        ui_schema = {
            "type": "VerticalLayout",
            "elements": [
                {
                    "type": "Control",
                    "scope": "#/properties/contacts",
                    "options": {
                        "detail": {
                            "type": "Group",
                            "label": "Contact",
                            "elements": [
                                {"type": "Control", "scope": "#/properties/name"},
                                {
                                    "type": "Control",
                                    "scope": "#/properties/address/properties/city",
                                },
                            ],
                        }
                    },
                }
            ],
        }
        assert flatten_ui.field_order(ui_schema) == placed(
            "contacts.[].name", "contacts.[].address.city"
        )

    def test_reads_both_formats_the_same_however_they_group(self):
        """The SGG form puts both fields in one section, the JSON Forms one in two groups."""
        sgg = [
            {
                "type": "section",
                "name": "all",
                "children": [
                    {"type": "field", "definition": "/properties/a"},
                    {"type": "field", "definition": "/properties/b"},
                ],
            }
        ]
        json_forms = {
            "type": "VerticalLayout",
            "elements": [
                {
                    "type": "Group",
                    "label": "First",
                    "elements": [{"type": "Control", "scope": "#/properties/a"}],
                },
                {
                    "type": "Group",
                    "label": "Second",
                    "elements": [{"type": "Control", "scope": "#/properties/b"}],
                },
            ],
        }
        assert flatten_ui.field_order(sgg) == flatten_ui.field_order(json_forms)


class TestNeighbors:
    """How `neighbors()` names a field's position: by the fields beside it, never by index."""

    @pytest.mark.parametrize(
        ("at", "expected"),
        [(0, "First · before b"), (1, "After a · before c"), (2, "After b · last")],
        ids=["first", "middle", "last"],
    )
    def test_names_the_fields_either_side(self, at, expected):
        assert compare.neighbors(["a", "b", "c"], at) == expected

    def test_names_an_only_field_first_and_last(self):
        assert compare.neighbors(["a"], 0) == "First · last"


class TestOrderDifferences:
    """Which matched fields `order_differences()` reports as placed differently."""

    def test_accepts_fields_in_the_same_order(self):
        both = placed("a", "b", "c")
        assert not compare.order_differences(NOTHING_DECLARED, both, both)

    def test_reports_only_the_field_that_moved(self):
        """Moving `d` ahead of `b` shifts `b` and `c` too, but only `d` needs to move back."""
        generated = placed("a", "d", "b", "c", "e")
        handwritten = placed("a", "b", "c", "d", "e")
        assert [
            str(d) for d in compare.order_differences(NOTHING_DECLARED, generated, handwritten)
        ] == ["out of order: d -- generated: After a · before b; handwritten: After c · before e"]

    def test_names_neighbors_relative_to_the_moved_field(self):
        """Steps a neighbor shares with the field it describes are left off."""
        generated = placed("c.[].role", "c.[].title", "c.[].name.first", "c.[].name.last")
        handwritten = placed("c.[].role", "c.[].name.first", "c.[].name.last", "c.[].title")
        found = compare.order_differences(NOTHING_DECLARED, generated, handwritten)
        assert [str(d) for d in found] == [
            "out of order: c.[].title -- generated: After role · before name.first; "
            "handwritten: After name.last · last"
        ]

    def test_ignores_a_field_only_one_form_places(self):
        """`extra` has no counterpart, so it cannot be out of order or push others out."""
        generated = placed("extra", "a", "b", "c")
        handwritten = placed("a", "b", "c", "legacy")
        assert not compare.order_differences(NOTHING_DECLARED, generated, handwritten)

    def test_compares_renamed_fields_by_their_counterpart(self):
        diff = declaring(renamed={"phone": "phone_number"})
        generated = placed("phone", "email")
        handwritten = placed("phone_number", "email")
        assert not compare.order_differences(diff, generated, handwritten)

    def test_ignores_field_listed_in_out_of_order(self):
        diff = declaring(out_of_order={"d": "Grants.gov asks for it earlier"})
        generated = placed("a", "d", "b", "c")
        handwritten = placed("a", "b", "c", "d")
        assert not compare.order_differences(diff, generated, handwritten)


class TestStaleOrderEntries:
    """Which `out_of_order` entries `stale_order_entries()` reports as describing nothing."""

    def test_keeps_entry_for_a_field_still_out_of_order(self):
        diff = declaring(out_of_order={"d": "Grants.gov asks for it earlier"})
        generated = placed("a", "d", "b", "c")
        handwritten = placed("a", "b", "c", "d")
        assert not compare.stale_order_entries(diff, generated, handwritten)

    def test_flags_entry_for_a_field_back_in_order(self):
        diff = declaring(out_of_order={"d": "Grants.gov asks for it earlier"})
        both = placed("a", "b", "c", "d")
        assert [str(d) for d in compare.stale_order_entries(diff, both, both)] == [
            "recorded order difference no longer differs: d -- Grants.gov asks for it earlier"
        ]

    def test_flags_entry_for_a_field_neither_form_places(self):
        diff = declaring(out_of_order={"ghost": "a reason for a field long gone"})
        both = placed("a", "b")
        assert kinds(compare.stale_order_entries(diff, both, both)) == [
            "recorded order difference no longer differs"
        ]
