"""Unit tests for attachment_mapping utility functions."""

import logging
import uuid
from unittest.mock import MagicMock, patch

import pytest

from src.services.xml_generation.utils.attachment_mapping import (
    _collect_referenced_attachment_ids,
    create_attachment_mapping,
)


def make_attachment(attachment_id: uuid.UUID, file_name: str = "file.pdf") -> MagicMock:
    """Create a mock ApplicationAttachment."""
    att = MagicMock()
    att.application_attachment_id = attachment_id
    att.file_name = file_name
    att.mime_type = "application/pdf"
    att.file_location = f"s3://bucket/applications/{attachment_id}/{file_name}"
    return att


def make_form(
    application_response: dict,
    attachment_fields: dict | None = None,
) -> MagicMock:
    """Create a mock ApplicationForm with optional attachment_fields schema config.

    attachment_fields should be a dict of field_name -> config, matching the
    _xml_config.attachment_fields structure used in json_to_xml_schema.
    """
    form = MagicMock()
    form.application_response = application_response
    form.form.json_to_xml_schema = (
        {"_xml_config": {"attachment_fields": attachment_fields}} if attachment_fields else None
    )
    return form


def make_application(
    attachments: list[MagicMock],
    forms: list[MagicMock],
    application_id: uuid.UUID | None = None,
) -> MagicMock:
    """Create a mock Application."""
    app = MagicMock()
    app.application_id = application_id or uuid.uuid4()
    app.application_attachments = attachments
    app.application_forms = forms
    return app


class TestCollectReferencedAttachmentIds:
    def test_single_form_single_field(self) -> None:
        uid = str(uuid.uuid4())
        form = make_form({"att1": uid}, attachment_fields={"att1": {}})
        app = make_application([], [form])
        assert _collect_referenced_attachment_ids(app) == {uid}

    def test_multiple_forms(self) -> None:
        uid1 = str(uuid.uuid4())
        uid2 = str(uuid.uuid4())
        forms = [
            make_form({"att1": uid1}, attachment_fields={"att1": {}}),
            make_form({"att2": uid2}, attachment_fields={"att2": {}}),
        ]
        app = make_application([], forms)
        assert _collect_referenced_attachment_ids(app) == {uid1, uid2}

    def test_no_forms(self) -> None:
        app = make_application([], [])
        assert _collect_referenced_attachment_ids(app) == set()

    def test_list_field(self) -> None:
        uid1, uid2 = str(uuid.uuid4()), str(uuid.uuid4())
        form = make_form({"multi": [uid1, uid2]}, attachment_fields={"multi": {}})
        app = make_application([], [form])
        assert _collect_referenced_attachment_ids(app) == {uid1, uid2}

    def test_non_attachment_fields_are_ignored(self) -> None:
        """A UUID-like string in a non-attachment field should NOT be collected."""
        uid = str(uuid.uuid4())
        # "name" is not in attachment_fields, so its value should be ignored
        form = make_form({"name": uid, "att1": "real-att-uuid"}, attachment_fields={"att1": {}})
        app = make_application([], [form])
        assert _collect_referenced_attachment_ids(app) == {"real-att-uuid"}
        assert uid not in _collect_referenced_attachment_ids(app)

    def test_form_without_xml_schema_is_skipped(self) -> None:
        """Forms with no json_to_xml_schema (None) contribute nothing."""
        uid = str(uuid.uuid4())
        form = make_form({"att1": uid}, attachment_fields=None)  # no schema → None
        app = make_application([], [form])
        assert _collect_referenced_attachment_ids(app) == set()


FAKE_HASH = "ZmFrZWhhc2g="  # base64 of "fakehash"


@pytest.fixture
def patch_hash():
    """Patch AttachmentFile.compute_base64_sha1 to return a stable fake hash."""
    with patch(
        "src.services.xml_generation.utils.attachment_mapping.AttachmentFile.compute_base64_sha1",
        return_value=FAKE_HASH,
    ) as mock_hash:
        yield mock_hash


class TestCreateAttachmentMapping:
    def test_referenced_attachment_included(self, patch_hash: MagicMock) -> None:
        """An attachment UUID referenced in a form's response is included."""
        att_id = uuid.uuid4()
        att = make_attachment(att_id, "report.pdf")
        form = make_form({"att1": str(att_id)}, attachment_fields={"att1": {}})
        app = make_application([att], [form])

        mapping = create_attachment_mapping(app)

        assert str(att_id) in mapping
        assert mapping[str(att_id)].filename == "report.pdf"
        assert mapping[str(att_id)].hash_value == FAKE_HASH

    def test_orphaned_attachment_excluded(
        self, patch_hash: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """An attachment UUID NOT in any form's attachment fields is excluded with a warning."""
        att_id = uuid.uuid4()
        att = make_attachment(att_id, "orphan.pdf")
        # Form's att1 references a different UUID – att_id is orphaned
        form = make_form({"att1": str(uuid.uuid4())}, attachment_fields={"att1": {}})
        app = make_application([att], [form])

        with caplog.at_level(logging.WARNING):
            mapping = create_attachment_mapping(app)

        assert str(att_id) not in mapping
        assert len(mapping) == 0
        assert "Orphaned attachment detected" in caplog.text
        assert "orphan.pdf" in caplog.text

    def test_mix_referenced_and_orphaned(
        self, patch_hash: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Only referenced attachments appear in the mapping; orphans are logged."""
        ref_id = uuid.uuid4()
        orphan_id = uuid.uuid4()

        ref_att = make_attachment(ref_id, "referenced.pdf")
        orphan_att = make_attachment(orphan_id, "orphaned.pdf")

        form = make_form({"att1": str(ref_id)}, attachment_fields={"att1": {}})
        app = make_application([ref_att, orphan_att], [form])

        with caplog.at_level(logging.WARNING):
            mapping = create_attachment_mapping(app)

        assert str(ref_id) in mapping
        assert str(orphan_id) not in mapping
        assert "orphaned.pdf" in caplog.text
        assert "referenced.pdf" not in caplog.text

    def test_all_orphans_returns_empty_mapping(
        self, patch_hash: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """When all attachments are orphaned the mapping is empty."""
        att1 = make_attachment(uuid.uuid4(), "a.pdf")
        att2 = make_attachment(uuid.uuid4(), "b.pdf")
        form = make_form({"att1": str(uuid.uuid4())}, attachment_fields={"att1": {}})
        app = make_application([att1, att2], [form])

        with caplog.at_level(logging.WARNING):
            mapping = create_attachment_mapping(app)

        assert mapping == {}
        assert caplog.text.count("Orphaned attachment detected") == 2
        assert "Excluded 2 orphaned attachment(s)" in caplog.text

    def test_no_attachments_returns_empty_mapping(self, patch_hash: MagicMock) -> None:
        """Application with no attachments yields an empty mapping."""
        form = make_form({"att1": str(uuid.uuid4())}, attachment_fields={"att1": {}})
        app = make_application([], [form])

        mapping = create_attachment_mapping(app)

        assert mapping == {}

    def test_filename_override_applied(self, patch_hash: MagicMock) -> None:
        """filename_overrides is honoured for referenced attachments."""
        att_id = uuid.uuid4()
        att = make_attachment(att_id, "original.pdf")
        form = make_form({"att1": str(att_id)}, attachment_fields={"att1": {}})
        app = make_application([att], [form])

        mapping = create_attachment_mapping(app, filename_overrides={str(att_id): "renamed.pdf"})

        assert mapping[str(att_id)].filename == "renamed.pdf"

