"""Tests for json_rule_validator."""

import uuid

import pytest

from src.form_schema.rule_processing.json_rule_processor import process_rule_schema_for_context
from src.validation.validation_constants import ValidationErrorType
from tests.src.form_schema.rule_processing.conftest import setup_context


class TestAttachmentIdCollection:
    def test_valid_attachment_id_collected(self, enable_factory_create):
        att_id = str(uuid.uuid4())
        context = setup_context(
            {"att_field": att_id},
            rule_schema={"att_field": {"gg_validation": {"rule": "attachment"}}},
            attachment_ids=[att_id],
        )
        process_rule_schema_for_context(context)
        assert att_id in context.attachment_ids

    def test_invalid_attachment_id_still_collected(self, enable_factory_create):
        """An ID not on the application is still added to attachment_ids (validation adds an error,
        but collection is unconditional)."""
        att_id = str(uuid.uuid4())
        context = setup_context(
            {"att_field": att_id},
            rule_schema={"att_field": {"gg_validation": {"rule": "attachment"}}},
            attachment_ids=[],
        )
        process_rule_schema_for_context(context)
        assert att_id in context.attachment_ids

    def test_none_value_not_collected(self, enable_factory_create):
        context = setup_context(
            {},
            rule_schema={"att_field": {"gg_validation": {"rule": "attachment"}}},
            attachment_ids=[],
        )
        process_rule_schema_for_context(context)
        assert context.attachment_ids == set()

    def test_list_field_all_ids_collected(self, enable_factory_create):
        id1, id2 = str(uuid.uuid4()), str(uuid.uuid4())
        context = setup_context(
            {"att_list_field": [id1, id2]},
            rule_schema={"att_list_field": {"gg_validation": {"rule": "attachment"}}},
            attachment_ids=[id1, id2],
        )
        process_rule_schema_for_context(context)
        assert context.attachment_ids == {id1, id2}

    def test_multiple_fields_all_collected(self, enable_factory_create):
        id1, id2 = str(uuid.uuid4()), str(uuid.uuid4())
        context = setup_context(
            {"att_field": id1, "att_list_field": [id2]},
            rule_schema={
                "att_field": {"gg_validation": {"rule": "attachment"}},
                "att_list_field": {"gg_validation": {"rule": "attachment"}},
            },
            attachment_ids=[id1, id2],
        )
        process_rule_schema_for_context(context)
        assert context.attachment_ids == {id1, id2}

    def test_non_attachment_fields_not_collected(self, enable_factory_create):
        """A UUID in a plain (non-attachment) field is not collected."""
        att_id = str(uuid.uuid4())
        other_id = str(uuid.uuid4())
        context = setup_context(
            {"att_field": att_id, "plain_field": other_id},
            rule_schema={"att_field": {"gg_validation": {"rule": "attachment"}}},
            attachment_ids=[att_id],
        )
        process_rule_schema_for_context(context)
        assert context.attachment_ids == {att_id}
        assert other_id not in context.attachment_ids

    def test_no_rule_schema_empty_collection(self, enable_factory_create):
        att_id = str(uuid.uuid4())
        context = setup_context(
            {"att_field": att_id},
            rule_schema=None,
            attachment_ids=[att_id],
        )
        process_rule_schema_for_context(context)
        assert context.attachment_ids == set()


DATE_RULE_SCHEMA = {"end_date": {"gg_validation": {"rule": "date_after", "field": "start_date"}}}


def _date_issues(json_data: dict, rule_schema: dict = DATE_RULE_SCHEMA, **kwargs) -> list:
    context = setup_context(json_data, rule_schema=rule_schema, **kwargs)
    process_rule_schema_for_context(context)
    return [(issue.field, issue.type, issue.value) for issue in context.validation_issues]


class TestDateAfter:
    @pytest.mark.parametrize("end_date", ["2026-04-30", "2026-05-01"])
    def test_end_date_on_or_before_start_date_is_flagged(self, enable_factory_create, end_date):
        issues = _date_issues({"start_date": "2026-05-01", "end_date": end_date})

        assert issues == [("$.end_date", ValidationErrorType.INVALID_DATE_ORDER, end_date)]

    @pytest.mark.parametrize("end_date", ["2026-05-02", "2027-01-01"])
    def test_end_date_after_start_date_is_valid(self, enable_factory_create, end_date):
        assert _date_issues({"start_date": "2026-05-01", "end_date": end_date}) == []

    @pytest.mark.parametrize(
        "json_data",
        [
            {},
            {"start_date": "2026-05-02"},
            {"end_date": "2026-05-01"},
            # Bad formats are reported by the JSON schema, not by this rule
            {"start_date": "2026-05-02", "end_date": "05/01/2026"},
            {"start_date": "not a date", "end_date": "2026-05-01"},
            {"start_date": 20260502, "end_date": "2026-05-01"},
        ],
    )
    def test_missing_or_invalid_dates_are_skipped(self, enable_factory_create, json_data):
        assert _date_issues(json_data) == []

    def test_relative_field_path(self, enable_factory_create):
        rule_schema = {
            "period": {
                "end_date": {"gg_validation": {"rule": "date_after", "field": "@THIS.start_date"}}
            }
        }
        issues = _date_issues(
            {"period": {"start_date": "2026-05-02", "end_date": "2026-05-01"}}, rule_schema
        )

        assert issues == [
            ("$.period.end_date", ValidationErrorType.INVALID_DATE_ORDER, "2026-05-01")
        ]

    def test_skipped_when_field_validation_is_off(self, enable_factory_create):
        issues = _date_issues(
            {"start_date": "2026-05-02", "end_date": "2026-05-01"}, do_field_validation=False
        )

        assert issues == []

    def test_rule_without_field_config_raises(self, enable_factory_create):
        rule_schema = {"end_date": {"gg_validation": {"rule": "date_after"}}}

        with pytest.raises(ValueError, match="requires a 'field' path"):
            _date_issues({"start_date": "2026-05-02", "end_date": "2026-05-01"}, rule_schema)
