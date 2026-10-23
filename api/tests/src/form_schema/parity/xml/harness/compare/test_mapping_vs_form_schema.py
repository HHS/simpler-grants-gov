"""Tests for the checks in `compare.mapping_vs_form_schema` over hand-built forms."""

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.xml.harness.compare import mapping_vs_form_schema
from tests.src.form_schema.parity.xml.harness.utils import declaring, flat, named_fields


class TestUnmatchedFields:
    def test_accepts_field_rule_reads(self):
        form = flat(targets={("Applicant",): "applicant"}, fields=named_fields("applicant"))
        assert not mapping_vs_form_schema.unmatched_fields(form)

    def test_accepts_field_rule_reads_through_parent(self):
        """An attachment rule reads the whole subtree."""
        form = flat(
            targets={("Attachment",): "attachments"},
            fields=named_fields("attachments.file_name"),
        )
        assert not mapping_vs_form_schema.unmatched_fields(form)

    def test_flags_field_no_rule_reads(self):
        form = flat(fields=named_fields("applicant_id"))
        found = mapping_vs_form_schema.unmatched_fields(form)
        assert [(d.kind, d.path) for d in found] == [
            (DiscrepancyKind.UNMAPPED_FORM_FIELD, "applicant_id")
        ]

    def test_flags_rule_reading_missing_field(self):
        """The rule reads `fax_number`, but the form's field is `fax`."""
        form = flat(targets={("Fax",): "fax_number"}, fields=named_fields("fax"))
        found = mapping_vs_form_schema.unmatched_fields(form)
        assert [(d.kind, d.path) for d in found] == [
            (DiscrepancyKind.UNMAPPED_FORM_FIELD, "fax"),
            (DiscrepancyKind.UNKNOWN_RULE_SOURCE, "fax_number"),
        ]

    def test_ignores_field_listed_in_unmapped_fields(self):
        form = flat(
            diff=declaring(unmapped_fields={"applicant_id": "no rule targets ApplicantID"}),
            fields=named_fields("applicant_id"),
        )
        assert not mapping_vs_form_schema.unmatched_fields(form)

    def test_ignores_source_listed_in_unknown_sources(self):
        form = flat(
            diff=declaring(unknown_sources={"fax_number": "the form's field is `fax`"}),
            targets={("Fax",): "fax_number"},
        )
        assert not mapping_vs_form_schema.unmatched_fields(form)


class TestStaleEntries:
    def test_keeps_entry_still_unmapped(self):
        form = flat(
            diff=declaring(unmapped_fields={"applicant_id": "no rule targets ApplicantID"}),
            fields=named_fields("applicant_id"),
        )
        assert not mapping_vs_form_schema.stale_entries(form)

    def test_flags_unmapped_field_now_mapped(self):
        form = flat(
            diff=declaring(unmapped_fields={"applicant_id": "no rule targets ApplicantID"}),
            targets={("ApplicantID",): "applicant_id"},
            fields=named_fields("applicant_id"),
        )
        assert [d.kind for d in mapping_vs_form_schema.stale_entries(form)] == [
            DiscrepancyKind.UNMAPPED_FIELD_NOW_MAPPED
        ]

    def test_flags_unmapped_field_no_longer_on_form(self):
        form = flat(diff=declaring(unmapped_fields={"applicant_id": "no rule targets it"}))
        assert [d.kind for d in mapping_vs_form_schema.stale_entries(form)] == [
            DiscrepancyKind.UNMAPPED_FIELD_NOT_ON_FORM
        ]

    def test_flags_unknown_source_now_on_form(self):
        form = flat(
            diff=declaring(unknown_sources={"fax_number": "the form's field is `fax`"}),
            targets={("Fax",): "fax_number"},
            fields=named_fields("fax_number"),
        )
        assert [d.kind for d in mapping_vs_form_schema.stale_entries(form)] == [
            DiscrepancyKind.UNKNOWN_SOURCE_NOW_ON_FORM
        ]

    def test_flags_unknown_source_no_rule_reads(self):
        form = flat(diff=declaring(unknown_sources={"fax_number": "the form's field is `fax`"}))
        assert [d.kind for d in mapping_vs_form_schema.stale_entries(form)] == [
            DiscrepancyKind.UNKNOWN_SOURCE_NOT_READ
        ]
