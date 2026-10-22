"""Whether a form's XML mapping agrees with the Grants.gov schema it targets.

`RecursiveXMLTransformer` iterates over the mapping's rules, not over the applicant's
answers, so a response field with no rule is never visited and does not appear in the
submission. Most Grants.gov elements are `minOccurs="0"`, so the document still validates
and neither `xmllint` nor a snapshot notices.

The comparisons are in `harness/compare.py`, covered by fixtures in `test_harness.py`.
Each form declares a `FormDiff` in `diffs/` recording its known gaps, and
`TestRecordedDifferences` fails if an entry stops describing one.
"""

import pytest

from tests.src.form_schema.parity.xml.diffs import key_contacts
from tests.src.form_schema.parity.xml.harness import compare

DIFFS = [
    key_contacts.DIFF,
]


@pytest.fixture(scope="module", params=DIFFS, ids=lambda d: d.module)
def form(request):
    """One form's mapping, flattened beside the two documents it is held against."""
    return compare.flatten(request.param)


def _skip_unreadable(form) -> None:
    """Skip a form whose mapping builds its structure at run time rather than declaring it."""
    if form.diff.unreadable:
        pytest.skip(
            f"{form.diff.module}: mapping is not read structurally -- "
            + "; ".join(f"{k}: {why}" for k, why in sorted(form.diff.unreadable.items()))
        )


def _report(found) -> str:
    return "\n".join(f"  {d}" for d in found)


class TestMappingVsXsd:
    """Every element the XSD declares, sourced and in sequence order."""

    def test_xml_mapping_does_not_emit_undeclared_elements(self, form):
        """An element Grants.gov never declared would make the whole document invalid."""
        _skip_unreadable(form)

        found = compare.undeclared_targets(form)
        assert not found, (
            f"{form.diff.module}: {len(found)} target(s) name nothing in this form's "
            f"schema:\n" + _report(found)
        )

    def test_xml_mapping_not_missing_required_elements(self, form):
        """Nothing Grants.gov demands is left without a source."""
        _skip_unreadable(form)

        found = compare.unsourced_elements(form)
        assert not found, (
            f"{form.diff.module}: {len(found)} required element(s) have no source, so a "
            f"submission would omit them:\n" + _report(found)
        )

    def test_xml_mapping_follows_xsd_element_order(self, form):
        """Grants.gov declares `xs:sequence`, so order is load-bearing."""
        _skip_unreadable(form)

        found = compare.out_of_order_elements(form)
        assert not found, f"{form.diff.module}: elements are emitted out of order:\n" + _report(
            found
        )


class TestMappingVsFormSchema:
    """Every response field mapped to an element, and every rule reading a real field."""

    def test_no_form_field_is_missing_from_xml_mapping(self, form):
        """Everything an applicant can fill in ends up somewhere in the submission."""
        _skip_unreadable(form)

        found = [d for d in compare.unmatched_fields(form) if d.kind == "form field is unmapped"]
        assert not found, (
            f"{form.diff.module}: {len(found)} response field(s) reach no XML element, so "
            f"an applicant's answer would not be submitted:\n" + _report(found)
        )

    def test_xml_mapping_does_not_read_unknown_form_fields(self, form):
        """A rule reading a field that does not exist contributes nothing, silently."""
        _skip_unreadable(form)

        found = [d for d in compare.unmatched_fields(form) if d.kind == "rule source is unknown"]
        assert not found, (
            f"{form.diff.module}: {len(found)} rule(s) read a field this form does not "
            f"have:\n" + _report(found)
        )


class TestFormSchemaVsXsd:
    """Whether the form is at least as strict as the elements it feeds."""

    def test_form_does_not_offer_values_outside_xsd_enums(self, form):
        """Every option a form lists is a member of the element's enumeration.

        Set comparison settles a 261-member code list at once, where sampling would need
        hundreds of draws to reach any particular member.
        """
        _skip_unreadable(form)

        found = [d for d in compare.rule_differences(form) if d.kind == "enum differs"]
        assert not found, (
            f"{form.diff.module}: {len(found)} field(s) offer a value the element does not "
            f"list, so choosing it would produce a submission Grants.gov rejects:\n"
            + _report(found)
        )

    def test_form_does_not_accept_values_outside_xsd_bounds(self, form):
        """Containment, not equality: a form stricter than the wire is fine.

        A money field holds a decimal as a string, so its range comes from its pattern; a
        pattern the reader cannot parse is reported too, since nothing then checks it.
        """
        _skip_unreadable(form)

        bounds = {f"{keyword} differs" for keyword in compare.LOOSER} | {"range unreadable"}
        found = [d for d in compare.rule_differences(form) if d.kind in bounds]
        assert not found, (
            f"{form.diff.module}: {len(found)} field(s) accept more than the element "
            f"carries, so an applicant could fill in something unsubmittable:\n" + _report(found)
        )

    def test_form_field_types_match_xsd_element_types(self, form):
        """Where a field's JSON type differs from its element's, a transform is declared.

        A boolean reaching a `YesNoDataType` string needs `boolean_to_yes_no`; omitting it
        is invisible until a document is generated with that field populated.
        """
        _skip_unreadable(form)

        found = [d for d in compare.rule_differences(form) if d.kind == "type differs"]
        assert not found, (
            f"{form.diff.module}: {len(found)} field(s) would reach serialization as the "
            f"wrong type:\n" + _report(found)
        )


class TestRecordedDifferences:
    """Whether every register entry is usable and still describes something real."""

    def test_skipped_forms_match_recorded_reasons(self, form):
        """A form is skipped for the reasons its record gives, and no others."""
        found = compare.unrecorded_skips(form)
        assert not found, (
            f"{form.diff.module}: what the reader can derive and what the record claims "
            f"have diverged:\n" + _report(found)
        )

    def test_recorded_differences_are_not_stale(self, form):
        """A recorded gap cannot outlive the problem it describes."""
        _skip_unreadable(form)

        found = compare.stale_entries(form)
        assert (
            not found
        ), f"{form.diff.module}: recorded differences no longer describe real ones:\n" + _report(
            found
        )
