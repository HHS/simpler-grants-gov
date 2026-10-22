"""Fixture tests for the functions in `harness/compare.py`.

`test_forms.py` runs these functions over real forms, where a check either passes or
reports a defect that takes a Grants.gov schema to interpret. These build a `FlatForm`
directly -- a few elements, a few fields, one record -- so each rule is visible on its own.

One class per function under test.
"""

from decimal import Decimal

from tests.src.form_schema.parity.json_schema.harness.flatten_schema import FormInput
from tests.src.form_schema.parity.xml.harness import compare, flatten_xsd
from tests.src.form_schema.parity.xml.harness.form_diff import FormDiff

NOTHING_DECLARED = FormDiff(module="a_form")

#: A money pattern `flatten_xsd.implied_range` can read: up to 14 digits and two decimals.
FOURTEEN_DIGITS = r"^\d{1,14}([.]\d{2})?$"


def declaring(**registers) -> FormDiff:
    return FormDiff(module="a_form", **registers)


def flat(**overrides) -> compare.FlatForm:
    """A form with nothing in it, so each test declares only what it is about."""
    return compare.FlatForm(
        **{
            "diff": NOTHING_DECLARED,
            "targets": {},
            "unreadable": {},
            "declared": {},
            "attachments": frozenset(),
            "by_path": {},
            "inputs": frozenset(),
            "transformed": {},
            **overrides,
        }
    )


def element(required=False, position=0, primitive=None, **rules) -> flatten_xsd.Element:
    return flatten_xsd.Element(
        required=required, position=position, primitive=primitive, rules=rules
    )


def field(required: bool = False, **rules) -> FormInput:
    """One form field and its rules. `field(type="string", maxLength=60)`."""
    return FormInput(required=required, rules=rules)


def kinds(found) -> list[str]:
    return [d.kind for d in found]


class TestUndeclaredTargets:
    """Which targets `undeclared_targets()` reports as naming nothing in the schema."""

    def test_accepts_target_the_schema_declares(self):
        form = flat(targets={("Applicant",): "applicant"}, declared={("Applicant",): element()})
        assert not compare.undeclared_targets(form)

    def test_flags_target_the_schema_does_not_declare(self):
        form = flat(targets={("Aplicant",): "applicant"}, declared={("Applicant",): element()})
        assert [d.path for d in compare.undeclared_targets(form)] == ["Aplicant"]

    def test_flags_target_at_the_wrong_nesting_level(self):
        """The element exists -- one level up from where the mapping puts it."""
        form = flat(
            targets={("Street1",): "street1"},
            declared={("Applicant", "Street1"): element()},
        )
        assert [d.path for d in compare.undeclared_targets(form)] == ["Street1"]


class TestUnsourcedElements:
    """Which elements `unsourced_elements()` reports as required and fed by nothing."""

    def test_accepts_required_element_with_a_source(self):
        form = flat(
            targets={("Applicant",): "applicant"},
            declared={("Applicant",): element(required=True)},
        )
        assert not compare.unsourced_elements(form)

    def test_flags_required_element_with_no_source(self):
        form = flat(declared={("Applicant",): element(required=True)})
        assert [d.path for d in compare.unsourced_elements(form)] == ["Applicant"]

    def test_accepts_optional_element_with_no_source(self):
        """Most Grants.gov elements are `minOccurs="0"`, which is why this suite exists."""
        form = flat(declared={("Applicant",): element(required=False)})
        assert not compare.unsourced_elements(form)

    def test_accepts_attachment_child_with_no_source(self):
        """An attachment subtree is built from the uploaded file, not from the mapping."""
        form = flat(
            declared={("Attachments", "FileName"): element(required=True)},
            attachments=frozenset({"Attachments"}),
        )
        assert not compare.unsourced_elements(form)


class TestElementOrder:
    """Which parents `out_of_order_elements()` reports as emitting children out of order."""

    def test_accepts_elements_in_schema_order(self):
        form = flat(
            targets={("A",): "a", ("B",): "b"},
            declared={("A",): element(position=0), ("B",): element(position=1)},
        )
        assert not compare.out_of_order_elements(form)

    def test_flags_siblings_in_the_wrong_order(self):
        """The transformer emits in mapping order, so this would produce invalid XML."""
        form = flat(
            targets={("B",): "b", ("A",): "a"},
            declared={("A",): element(position=0), ("B",): element(position=1)},
        )
        found = compare.out_of_order_elements(form)
        assert kinds(found) == ["elements out of sequence"]
        assert found[0].path == "(root)"

    def test_ignores_order_between_different_parents(self):
        """`xs:sequence` orders siblings; it says nothing across two parents."""
        form = flat(
            targets={("Y", "B"): "b", ("X", "A"): "a"},
            declared={
                ("X", "A"): element(position=0),
                ("Y", "B"): element(position=0),
            },
        )
        assert not compare.out_of_order_elements(form)

    def test_ignores_attributes(self):
        """An attribute carries position -1 because attributes are unordered."""
        form = flat(
            targets={("B",): "b", ("@id",): "identifier"},
            declared={("@id",): element(position=-1), ("B",): element(position=0)},
        )
        assert not compare.out_of_order_elements(form)


class TestUnmatchedFields:
    """Which fields and rule sources `unmatched_fields()` reports as accounted for by neither."""

    def test_accepts_field_a_rule_reads(self):
        form = flat(targets={("Applicant",): "applicant"}, inputs=frozenset({"applicant"}))
        assert not compare.unmatched_fields(form)

    def test_accepts_field_reached_through_its_parent(self):
        """An attachment rule names the subtree, and everything under it is submitted."""
        form = flat(
            targets={("Attachment",): "attachments"},
            inputs=frozenset({"attachments.file_name"}),
        )
        assert not compare.unmatched_fields(form)

    def test_flags_field_no_rule_reads(self):
        """The answer is stored and simply never appears in the submission."""
        form = flat(inputs=frozenset({"applicant_id"}))
        found = compare.unmatched_fields(form)
        assert kinds(found) == ["form field is unmapped"]
        assert found[0].path == "applicant_id"

    def test_flags_rule_reading_unknown_field(self):
        """The `fax_number`/`fax` case: the element is mapped, from a field that is not there."""
        form = flat(targets={("Fax",): "fax_number"}, inputs=frozenset({"fax"}))
        found = compare.unmatched_fields(form)
        assert kinds(found) == ["form field is unmapped", "rule source is unknown"]
        assert [d.path for d in found] == ["fax", "fax_number"]

    def test_ignores_field_declared_absent_from_definition(self):
        form = flat(
            diff=declaring(
                absent_from_definition={"applicant_id": "no rule targets ApplicantID at all"}
            ),
            inputs=frozenset({"applicant_id"}),
        )
        assert not compare.unmatched_fields(form)

    def test_ignores_source_declared_absent_from_source(self):
        form = flat(
            diff=declaring(
                absent_from_source={"fax_number": "no such field on this form -- it is `fax`"}
            ),
            targets={("Fax",): "fax_number"},
            inputs=frozenset(),
        )
        assert not compare.unmatched_fields(form)


class TestRuleDifferences:
    """Which fields `rule_differences()` reports as accepting more than their element carries."""

    @staticmethod
    def _one_field(form_rules, element_rules, **overrides):
        return flat(
            targets={("Value",): "value"},
            by_path={("value",): field(**form_rules)},
            declared={("Value",): element(**element_rules)},
            **overrides,
        )

    def test_accepts_form_stricter_than_element(self):
        """Containment, not equality."""
        form = self._one_field({"type": "string", "maxLength": 30}, {"maxLength": 60})
        assert not compare.rule_differences(form)

    def test_flags_option_the_element_does_not_list(self):
        """One character apart is enough: the straight apostrophe against the typographic one."""
        form = self._one_field(
            {"type": "string", "enum": ["CIV: CÔTE D'IVOIRE"]},
            {"enum": frozenset({"CIV: CÔTE D’IVOIRE"})},
        )
        assert kinds(compare.rule_differences(form)) == ["enum differs"]

    def test_flags_form_bound_looser_than_element(self):
        form = self._one_field({"type": "string", "maxLength": 200}, {"maxLength": 60})
        assert kinds(compare.rule_differences(form)) == ["maxLength differs"]

    def test_flags_missing_bound_where_element_declares_one(self):
        """Declaring nothing is looser than declaring a limit -- the SF-424 email case."""
        form = self._one_field({"type": "string"}, {"maxLength": 60})
        found = compare.rule_differences(form)
        assert kinds(found) == ["maxLength differs"]
        assert "none, element 60" in found[0].detail

    def test_accepts_missing_min_length_when_element_allows_empty(self):
        """A `minLength` of 0 asks nothing of anyone."""
        form = self._one_field({"type": "string"}, {"minLength": 0})
        assert not compare.rule_differences(form)

    def test_reads_a_money_range_out_of_the_pattern(self):
        """A money field is a string, so `maximum` cannot be declared and the pattern carries it."""
        form = self._one_field(
            {"type": "string", "pattern": FOURTEEN_DIGITS},
            {"maximum": Decimal("999999999999.99")},
        )
        assert kinds(compare.rule_differences(form)) == ["maximum differs"]

    def test_flags_money_pattern_it_cannot_read(self):
        """Reporting "nobody has checked" matters as much as reporting a difference."""
        form = self._one_field(
            {"type": "string", "pattern": "^[A-Z]+$"},
            {"maximum": Decimal("999999999999.99")},
        )
        assert kinds(compare.rule_differences(form)) == ["range unreadable"]

    def test_flags_type_the_element_does_not_expect(self):
        """A boolean reaching a `YesNoDataType` string, with no transform declared."""
        form = self._one_field({"type": "boolean"}, {"primitive": "string"})
        assert kinds(compare.rule_differences(form)) == ["type differs"]

    def test_ignores_difference_a_value_transform_reconciles(self):
        """`boolean_to_yes_no` is exactly what makes that difference legitimate."""
        form = self._one_field(
            {"type": "boolean"},
            {"primitive": "string"},
            transformed={("Value",): frozenset({"boolean_to_yes_no"})},
        )
        assert not compare.rule_differences(form)

    def test_ignores_difference_listed_in_differing_rules(self):
        form = self._one_field(
            {"type": "string", "maxLength": 200},
            {"maxLength": 60},
            diff=declaring(
                differing_rules={"Value/maxLength": "globLib:EmailDataType caps at 60 characters"}
            ),
        )
        assert not compare.rule_differences(form)

    def test_ignores_element_no_single_field_feeds(self):
        """A container takes no value, so there are no rules to compare."""
        form = flat(
            targets={("Applicant",): None},
            declared={("Applicant",): element(maxLength=60)},
        )
        assert not compare.rule_differences(form)


class TestStaleEntries:
    """Which record entries `stale_entries()` reports as no longer describing a real gap."""

    def test_accepts_entries_that_still_describe_real_gaps(self):
        form = flat(
            diff=declaring(
                absent_from_definition={"applicant_id": "no rule targets ApplicantID at all"}
            ),
            inputs=frozenset({"applicant_id"}),
        )
        assert not compare.stale_entries(form)

    def test_flags_dropped_field_that_is_now_mapped(self):
        form = flat(
            diff=declaring(
                absent_from_definition={"applicant_id": "no rule targets ApplicantID at all"}
            ),
            targets={("ApplicantID",): "applicant_id"},
            inputs=frozenset({"applicant_id"}),
        )
        assert kinds(compare.stale_entries(form)) == ["now mapped"]

    def test_flags_dropped_field_the_form_no_longer_has(self):
        form = flat(
            diff=declaring(
                absent_from_definition={"applicant_id": "no rule targets ApplicantID at all"}
            ),
            inputs=frozenset(),
        )
        assert kinds(compare.stale_entries(form)) == ["no longer a field on this form"]

    def test_flags_unknown_source_that_now_names_a_real_field(self):
        form = flat(
            diff=declaring(
                absent_from_source={"fax_number": "no such field on this form -- it is `fax`"}
            ),
            targets={("Fax",): "fax_number"},
            inputs=frozenset({"fax_number"}),
        )
        assert kinds(compare.stale_entries(form)) == ["now names a real field"]

    def test_flags_unknown_source_no_rule_reads_any_more(self):
        form = flat(
            diff=declaring(
                absent_from_source={"fax_number": "no such field on this form -- it is `fax`"}
            ),
            inputs=frozenset(),
        )
        assert kinds(compare.stale_entries(form)) == ["no longer a rule source"]

    def test_flags_recorded_rule_for_an_element_that_is_gone(self):
        form = flat(
            diff=declaring(
                differing_rules={"Ghost/maxLength": "a citation for an element long removed"}
            )
        )
        assert kinds(compare.stale_entries(form)) == ["no such element"]

    def test_flags_recorded_rule_the_element_does_not_declare(self):
        form = flat(
            diff=declaring(
                differing_rules={"Value/maxLength": "a citation for a limit that is not there"}
            ),
            declared={("Value",): element(minLength=1)},
        )
        assert kinds(compare.stale_entries(form)) == ["element declares no maxLength"]

    def test_accepts_recorded_rule_the_form_still_breaks(self):
        form = flat(
            diff=declaring(differing_rules={"Value/maxLength": "the form sets no maxLength"}),
            targets={("Value",): "value"},
            by_path={("value",): field(type="string")},
            declared={("Value",): element(maxLength=60)},
        )
        assert not compare.stale_entries(form)

    def test_flags_recorded_rule_the_form_now_satisfies(self):
        form = flat(
            diff=declaring(differing_rules={"Value/maxLength": "the form sets no maxLength"}),
            targets={("Value",): "value"},
            by_path={("value",): field(type="string", maxLength=60)},
            declared={("Value",): element(maxLength=60)},
        )
        assert kinds(compare.stale_entries(form)) == ["no longer differs"]

    def test_flags_recorded_type_rule_for_an_element_with_no_simple_type(self):
        form = flat(
            diff=declaring(differing_rules={"Value/type": "a citation for a container element"}),
            declared={("Value",): element(primitive=None)},
        )
        assert kinds(compare.stale_entries(form)) == ["element has no simple type"]


class TestUnrecordedSkips:
    """Whether `unrecorded_skips()` holds a form's skip reasons to what the reader finds."""

    def test_accepts_record_that_matches_what_the_reader_finds(self):
        form = flat(
            diff=declaring(unreadable={"budget_sections": "array_decomposition"}),
            unreadable={"budget_sections": "conditional_transform.type 'array_decomposition'"},
        )
        assert not compare.unrecorded_skips(form)

    def test_flags_underivable_rule_the_record_omits(self):
        """Without this a form could quietly become unreadable and skip everything below."""
        form = flat(unreadable={"budget_sections": "conditional_transform.type 'pivot_object'"})
        assert kinds(compare.unrecorded_skips(form)) == ["underivable and unrecorded"]

    def test_flags_recorded_rule_that_now_reads_fine(self):
        form = flat(diff=declaring(unreadable={"budget_sections": "array_decomposition"}))
        assert kinds(compare.unrecorded_skips(form)) == ["recorded but now reads fine"]
