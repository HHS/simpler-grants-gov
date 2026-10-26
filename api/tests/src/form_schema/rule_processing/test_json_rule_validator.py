"""Tests for json_rule_validator, focusing on attachment ID collection."""

import uuid

from src.form_schema.rule_processing.json_rule_processor import process_rule_schema_for_context
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
