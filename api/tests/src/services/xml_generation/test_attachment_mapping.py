"""Unit tests for attachment_mapping utility functions."""

import logging
from unittest.mock import patch

import pytest

from src.services.xml_generation.utils.attachment_mapping import (
    _collect_referenced_attachment_ids,
    create_attachment_mapping,
)
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
)


def make_form(application_response: dict, attachment_fields: list[str] | None = None):
    """Build an ApplicationForm with a controlled application_response.

    attachment_fields is a list of field names that should be treated as
    attachment fields (marked with gg_validation: attachment in the rule schema).
    """
    form = ApplicationFormFactory.build(application_response=application_response)
    form.form.form_rule_schema = (
        {field: {"gg_validation": {"rule": "attachment"}} for field in attachment_fields}
        if attachment_fields
        else None
    )
    return form


def make_application(attachments=None, forms=None):
    """Build an Application with explicit attachment and form lists.

    Wires each form's .application back-reference to the app so that the
    JsonRuleContext can access application_attachments during rule processing.
    """
    app = ApplicationFactory.build()
    app.application_attachments = attachments or []
    app.application_forms = forms or []
    for form in app.application_forms:
        form.application = app
    return app


FAKE_HASH = "ZmFrZWhhc2g="  # base64 of "fakehash"


@pytest.fixture
def patch_hash():
    """Patch AttachmentFile.compute_base64_sha1 to return a stable fake hash."""
    with patch(
        "src.services.xml_generation.utils.attachment_mapping.AttachmentFile.compute_base64_sha1",
        return_value=FAKE_HASH,
    ) as mock_hash:
        yield mock_hash


class TestCollectReferencedAttachmentIds:
    def test_single_form_single_field(self) -> None:
        att = ApplicationAttachmentFactory.build()
        uid = str(att.application_attachment_id)
        form = make_form({"att1": uid}, attachment_fields=["att1"])
        app = make_application(attachments=[att], forms=[form])
        assert _collect_referenced_attachment_ids(app) == {uid}

    def test_multiple_forms(self) -> None:
        att1 = ApplicationAttachmentFactory.build()
        att2 = ApplicationAttachmentFactory.build()
        uid1, uid2 = str(att1.application_attachment_id), str(att2.application_attachment_id)
        forms = [
            make_form({"att1": uid1}, attachment_fields=["att1"]),
            make_form({"att2": uid2}, attachment_fields=["att2"]),
        ]
        app = make_application(attachments=[att1, att2], forms=forms)
        assert _collect_referenced_attachment_ids(app) == {uid1, uid2}

    def test_no_forms(self) -> None:
        app = make_application()
        assert _collect_referenced_attachment_ids(app) == set()

    def test_list_field(self) -> None:
        att1 = ApplicationAttachmentFactory.build()
        att2 = ApplicationAttachmentFactory.build()
        uid1, uid2 = str(att1.application_attachment_id), str(att2.application_attachment_id)
        form = make_form({"multi": [uid1, uid2]}, attachment_fields=["multi"])
        app = make_application(attachments=[att1, att2], forms=[form])
        assert _collect_referenced_attachment_ids(app) == {uid1, uid2}

    def test_non_attachment_fields_are_ignored(self) -> None:
        """A UUID-like string in a non-attachment field should NOT be collected."""
        att = ApplicationAttachmentFactory.build()
        other_uid = str(ApplicationAttachmentFactory.build().application_attachment_id)
        uid = str(att.application_attachment_id)
        # "name" is not in attachment_fields, so its value should be ignored
        form = make_form({"name": other_uid, "att1": uid}, attachment_fields=["att1"])
        app = make_application(attachments=[att], forms=[form])
        result = _collect_referenced_attachment_ids(app)
        assert result == {uid}
        assert other_uid not in result

    def test_form_without_rule_schema_is_skipped(self) -> None:
        """Forms with no form_rule_schema (None) contribute nothing."""
        att = ApplicationAttachmentFactory.build()
        uid = str(att.application_attachment_id)
        form = make_form({"att1": uid}, attachment_fields=None)  # no schema → None
        app = make_application(attachments=[att], forms=[form])
        assert _collect_referenced_attachment_ids(app) == set()

    def test_excluded_form_is_skipped(self) -> None:
        """Non-required forms with is_included_in_submission=False are not scanned."""
        att = ApplicationAttachmentFactory.build()
        uid = str(att.application_attachment_id)
        form = make_form({"att1": uid}, attachment_fields=["att1"])
        form.competition_form.is_required = False
        form.is_included_in_submission = False
        app = make_application(attachments=[att], forms=[form])
        assert _collect_referenced_attachment_ids(app) == set()

    def test_excluded_form_with_none_inclusion_is_skipped(self) -> None:
        """Non-required forms where is_included_in_submission is None are not scanned."""
        att = ApplicationAttachmentFactory.build()
        uid = str(att.application_attachment_id)
        form = make_form({"att1": uid}, attachment_fields=["att1"])
        form.competition_form.is_required = False
        form.is_included_in_submission = None
        app = make_application(attachments=[att], forms=[form])
        assert _collect_referenced_attachment_ids(app) == set()

    def test_included_non_required_form_is_scanned(self) -> None:
        """Non-required forms with is_included_in_submission=True are included."""
        att = ApplicationAttachmentFactory.build()
        uid = str(att.application_attachment_id)
        form = make_form({"att1": uid}, attachment_fields=["att1"])
        form.competition_form.is_required = False
        form.is_included_in_submission = True
        app = make_application(attachments=[att], forms=[form])
        assert _collect_referenced_attachment_ids(app) == {uid}


class TestCreateAttachmentMapping:
    def test_referenced_attachment_included(self, patch_hash) -> None:
        """An attachment UUID referenced in a form's response is included."""
        att = ApplicationAttachmentFactory.build()
        uid = str(att.application_attachment_id)
        form = make_form({"att1": uid}, attachment_fields=["att1"])
        app = make_application(attachments=[att], forms=[form])

        mapping = create_attachment_mapping(app)

        assert uid in mapping
        assert mapping[uid].filename == att.file_name
        assert mapping[uid].hash_value == FAKE_HASH

    def test_orphaned_attachment_excluded(
        self, patch_hash, caplog: pytest.LogCaptureFixture
    ) -> None:
        """An attachment UUID NOT in any form's attachment fields is excluded with a warning."""
        att = ApplicationAttachmentFactory.build()
        # Form's att1 references a different UUID – att is orphaned
        other_uid = str(ApplicationAttachmentFactory.build().application_attachment_id)
        form = make_form({"att1": other_uid}, attachment_fields=["att1"])
        app = make_application(attachments=[att], forms=[form])

        with caplog.at_level(logging.WARNING):
            mapping = create_attachment_mapping(app)

        assert str(att.application_attachment_id) not in mapping
        assert len(mapping) == 0
        assert "Orphaned attachment detected" in caplog.text
        assert att.file_name in caplog.text

    def test_mix_referenced_and_orphaned(
        self, patch_hash, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Only referenced attachments appear in the mapping; orphans are logged."""
        ref_att = ApplicationAttachmentFactory.build()
        orphan_att = ApplicationAttachmentFactory.build()
        ref_uid = str(ref_att.application_attachment_id)

        form = make_form({"att1": ref_uid}, attachment_fields=["att1"])
        app = make_application(attachments=[ref_att, orphan_att], forms=[form])

        with caplog.at_level(logging.WARNING):
            mapping = create_attachment_mapping(app)

        assert ref_uid in mapping
        assert str(orphan_att.application_attachment_id) not in mapping
        assert orphan_att.file_name in caplog.text
        assert ref_att.file_name not in caplog.text

    def test_all_orphans_returns_empty_mapping(
        self, patch_hash, caplog: pytest.LogCaptureFixture
    ) -> None:
        """When all attachments are orphaned the mapping is empty."""
        att1 = ApplicationAttachmentFactory.build()
        att2 = ApplicationAttachmentFactory.build()
        other_uid = str(ApplicationAttachmentFactory.build().application_attachment_id)
        form = make_form({"att1": other_uid}, attachment_fields=["att1"])
        app = make_application(attachments=[att1, att2], forms=[form])

        with caplog.at_level(logging.WARNING):
            mapping = create_attachment_mapping(app)

        assert mapping == {}
        assert caplog.text.count("Orphaned attachment detected") == 2
        assert "Excluded 2 orphaned attachment(s)" in caplog.text

    def test_no_attachments_returns_empty_mapping(self, patch_hash) -> None:
        """Application with no attachments yields an empty mapping."""
        att = ApplicationAttachmentFactory.build()
        form = make_form({"att1": str(att.application_attachment_id)}, attachment_fields=["att1"])
        app = make_application(forms=[form])

        mapping = create_attachment_mapping(app)

        assert mapping == {}

    def test_filename_override_applied(self, patch_hash) -> None:
        """filename_overrides is honoured for referenced attachments."""
        att = ApplicationAttachmentFactory.build()
        uid = str(att.application_attachment_id)
        form = make_form({"att1": uid}, attachment_fields=["att1"])
        app = make_application(attachments=[att], forms=[form])

        mapping = create_attachment_mapping(app, filename_overrides={uid: "renamed.pdf"})

        assert mapping[uid].filename == "renamed.pdf"
