import uuid

import grants_shared.util.file_util as file_util
from sqlalchemy import select

from src.constants.lookup_constants import ApplicationAuditEvent
from src.db.models.competition_models import ApplicationAudit
from src.services.applications.process_application_attachment_changes import (
    collect_attachment_ids,
    get_attachment_field_paths,
    process_application_attachment_changes,
)
from tests.src.db.models.factories import ApplicationAttachmentFactory, ApplicationFactory

# A UI schema exercising both single and multi attachment widgets, nested in sections,
# alongside non-attachment fields that should be ignored.
UI_SCHEMA = [
    {
        "type": "section",
        "label": "Attachments",
        "children": [
            {"type": "field", "definition": "/properties/att1", "widget": "Attachment"},
            {"type": "field", "definition": "/properties/name", "widget": "Text"},
            {
                "type": "field",
                "definition": "/properties/attachments",
                "widget": "AttachmentArray",
            },
        ],
    },
]


def _make_form(create_test_form, form_ui_schema=UI_SCHEMA):
    return create_test_form(form_ui_schema=form_ui_schema)


def _get_audits(db_session, application):
    return (
        db_session.execute(
            select(ApplicationAudit).where(
                ApplicationAudit.application_id == application.application_id
            )
        )
        .scalars()
        .all()
    )


def test_get_attachment_field_paths(create_test_form):
    form = _make_form(create_test_form)
    paths = get_attachment_field_paths(form)
    assert sorted(paths) == [["att1"], ["attachments"]]


def test_get_attachment_field_paths_nested_definition(create_test_form):
    form = _make_form(
        create_test_form,
        form_ui_schema=[
            {
                "type": "field",
                "definition": "/properties/group/properties/att",
                "widget": "Attachment",
            }
        ],
    )
    assert get_attachment_field_paths(form) == [["group", "att"]]


def test_get_attachment_field_paths_no_attachments(create_test_form):
    form = _make_form(
        create_test_form,
        form_ui_schema=[{"type": "field", "definition": "/properties/name", "widget": "Text"}],
    )
    assert get_attachment_field_paths(form) == []


def test_collect_attachment_ids_single_and_array():
    paths = [["att1"], ["attachments"]]
    response = {
        "att1": "id-a",
        "attachments": ["id-b", "id-c"],
        "name": "ignored",
    }
    assert collect_attachment_ids(response, paths) == {"id-a", "id-b", "id-c"}


def test_collect_attachment_ids_handles_missing_and_non_string():
    paths = [["att1"], ["attachments"]]
    response = {"attachments": ["id-b", None, 5]}
    assert collect_attachment_ids(response, paths) == {"id-b"}


def test_process_added_attachment_emits_audit(enable_factory_create, db_session, create_test_form):
    application = ApplicationFactory.create()
    attachment = ApplicationAttachmentFactory.create(application=application)
    user = attachment.user
    form = _make_form(create_test_form)

    with db_session.begin():
        process_application_attachment_changes(
            db_session=db_session,
            application=application,
            form=form,
            user=user,
            old_application_response={},
            new_application_response={"att1": str(attachment.application_attachment_id)},
        )

    audits = _get_audits(db_session, application)
    assert len(audits) == 1
    assert audits[0].application_audit_event == ApplicationAuditEvent.ATTACHMENT_ADDED
    assert audits[0].target_attachment_id == attachment.application_attachment_id
    assert audits[0].user_id == user.user_id


def test_process_added_attachment_array(enable_factory_create, db_session, create_test_form):
    application = ApplicationFactory.create()
    attachment_1 = ApplicationAttachmentFactory.create(application=application)
    attachment_2 = ApplicationAttachmentFactory.create(application=application)
    user = attachment_1.user
    form = _make_form(create_test_form)

    with db_session.begin():
        process_application_attachment_changes(
            db_session=db_session,
            application=application,
            form=form,
            user=user,
            old_application_response={},
            new_application_response={
                "attachments": [
                    str(attachment_1.application_attachment_id),
                    str(attachment_2.application_attachment_id),
                ]
            },
        )

    audits = _get_audits(db_session, application)
    assert len(audits) == 2
    assert {a.target_attachment_id for a in audits} == {
        attachment_1.application_attachment_id,
        attachment_2.application_attachment_id,
    }
    assert all(a.application_audit_event == ApplicationAuditEvent.ATTACHMENT_ADDED for a in audits)


def test_process_deleted_attachment_removes_file_and_audits(
    enable_factory_create, db_session, s3_config, create_test_form
):
    application = ApplicationFactory.create()
    attachment = ApplicationAttachmentFactory.create(application=application)
    user = attachment.user
    form = _make_form(create_test_form)

    assert file_util.file_exists(attachment.file_location) is True

    with db_session.begin():
        process_application_attachment_changes(
            db_session=db_session,
            application=application,
            form=form,
            user=user,
            old_application_response={"att1": str(attachment.application_attachment_id)},
            new_application_response={},
        )

    db_session.refresh(attachment)
    assert attachment.is_deleted is True
    assert attachment.file_location == "DELETED"

    audits = _get_audits(db_session, application)
    assert len(audits) == 1
    assert audits[0].application_audit_event == ApplicationAuditEvent.ATTACHMENT_DELETED
    assert audits[0].target_attachment_id == attachment.application_attachment_id


def test_process_deleted_attachment_already_deleted_audits_only(
    enable_factory_create, db_session, s3_config, create_test_form
):
    application = ApplicationFactory.create()
    attachment = ApplicationAttachmentFactory.create(application=application, setup_deleted=True)
    user = attachment.user
    form = _make_form(create_test_form)

    with db_session.begin():
        process_application_attachment_changes(
            db_session=db_session,
            application=application,
            form=form,
            user=user,
            old_application_response={"att1": str(attachment.application_attachment_id)},
            new_application_response={},
        )

    db_session.refresh(attachment)
    # Still deleted, and file_location remains untouched.
    assert attachment.is_deleted is True
    assert attachment.file_location == "DELETED"

    audits = _get_audits(db_session, application)
    assert len(audits) == 1
    assert audits[0].application_audit_event == ApplicationAuditEvent.ATTACHMENT_DELETED


def test_process_no_change_no_audits(enable_factory_create, db_session, create_test_form):
    application = ApplicationFactory.create()
    attachment = ApplicationAttachmentFactory.create(application=application)
    user = attachment.user
    form = _make_form(create_test_form)

    response = {"att1": str(attachment.application_attachment_id)}
    with db_session.begin():
        process_application_attachment_changes(
            db_session=db_session,
            application=application,
            form=form,
            user=user,
            old_application_response=response,
            new_application_response=response,
        )

    assert _get_audits(db_session, application) == []


def test_process_form_without_attachment_fields_is_noop(
    enable_factory_create, db_session, create_test_form
):
    application = ApplicationFactory.create()
    attachment = ApplicationAttachmentFactory.create(application=application)
    user = attachment.user
    form = _make_form(
        create_test_form,
        form_ui_schema=[{"type": "field", "definition": "/properties/name", "widget": "Text"}],
    )

    with db_session.begin():
        process_application_attachment_changes(
            db_session=db_session,
            application=application,
            form=form,
            user=user,
            old_application_response={},
            new_application_response={"att1": str(attachment.application_attachment_id)},
        )

    assert _get_audits(db_session, application) == []


def test_process_unknown_attachment_id_is_skipped(
    enable_factory_create, db_session, create_test_form
):
    application = ApplicationFactory.create()
    user = ApplicationAttachmentFactory.create(application=application).user
    form = _make_form(create_test_form)

    with db_session.begin():
        process_application_attachment_changes(
            db_session=db_session,
            application=application,
            form=form,
            user=user,
            old_application_response={},
            new_application_response={"att1": str(uuid.uuid4())},
        )

    assert _get_audits(db_session, application) == []
