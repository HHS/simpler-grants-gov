import logging
import uuid

from sqlalchemy import select

from src.constants.lookup_constants import ApplicationAuditEvent
from src.db.models.competition_models import ApplicationAudit
from src.services.applications.application_audit import add_audit_event, add_audit_event_by_id
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    UserFactory,
)

AUDIT_LOG_MESSAGE = "Added application audit event"


def get_audit_log_record(caplog):
    """Pull the single audit-event log record emitted during a test"""
    records = [record for record in caplog.records if record.message == AUDIT_LOG_MESSAGE]
    assert len(records) == 1
    return records[0]


# ========================================
# add_audit_event
# ========================================


def test_add_audit_event_logs_ids_without_flush(db_session, enable_factory_create, caplog):
    """The audit log carries real IDs even though the audit record has not been flushed

    The audit record is built from relationships, and SQLAlchemy does not copy those
    into the foreign key columns until flush - so reading them off the record would
    log nulls.
    """
    caplog.set_level(logging.INFO)
    application = ApplicationFactory.create()
    user = UserFactory.create()

    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.APPLICATION_CREATED,
    )

    record = get_audit_log_record(caplog)
    assert record.application_id == application.application_id
    assert record.user_id == user.user_id
    assert record.application_audit_event == ApplicationAuditEvent.APPLICATION_CREATED
    assert record.target_user_id is None
    assert record.target_application_form_id is None
    assert record.target_attachment_id is None


def test_add_audit_event_logs_target_ids(db_session, enable_factory_create, caplog):
    """Target IDs are logged as flat scalars when target objects are provided"""
    caplog.set_level(logging.INFO)
    application = ApplicationFactory.create()
    user = UserFactory.create()
    target_user = UserFactory.create()
    target_application_form = ApplicationFormFactory.create(application=application)
    target_attachment = ApplicationAttachmentFactory.create(application=application)

    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.FORM_UPDATED,
        target_user=target_user,
        target_application_form=target_application_form,
        target_attachment=target_attachment,
    )

    record = get_audit_log_record(caplog)
    assert record.application_id == application.application_id
    assert record.target_user_id == target_user.user_id
    assert record.target_application_form_id == target_application_form.application_form_id
    assert record.target_attachment_id == target_attachment.application_attachment_id


def test_add_audit_event_persists_foreign_keys(db_session, enable_factory_create, caplog):
    """The logged IDs match what actually lands in the database after flush"""
    caplog.set_level(logging.INFO)
    application = ApplicationFactory.create()
    user = UserFactory.create()

    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.APPLICATION_CREATED,
    )
    db_session.flush()

    audit = db_session.execute(
        select(ApplicationAudit).where(
            ApplicationAudit.application_id == application.application_id
        )
    ).scalar_one()
    record = get_audit_log_record(caplog)
    assert record.application_id == audit.application_id
    assert record.user_id == audit.user_id


# ========================================
# add_audit_event_by_id
# ========================================


def test_add_audit_event_by_id_logs_ids(db_session, enable_factory_create, caplog):
    """IDs passed in are logged back out as flat scalars"""
    caplog.set_level(logging.INFO)
    application = ApplicationFactory.create()
    user = UserFactory.create()
    target_user = UserFactory.create()

    add_audit_event_by_id(
        db_session=db_session,
        application_id=application.application_id,
        user_id=user.user_id,
        audit_event=ApplicationAuditEvent.APPLICATION_SUBMIT_REJECTED,
        target_user_id=target_user.user_id,
    )

    record = get_audit_log_record(caplog)
    assert record.application_id == application.application_id
    assert record.user_id == user.user_id
    assert record.application_audit_event == ApplicationAuditEvent.APPLICATION_SUBMIT_REJECTED
    assert record.target_user_id == target_user.user_id


def test_add_audit_event_by_id_assigns_target_foreign_keys(
    db_session, enable_factory_create, caplog
):
    """Target UUIDs land on the foreign key columns, not on the relationship attributes

    Previously target_application_form_id / target_attachment_id were assigned to the
    relationship attributes instead, so the UUIDs never reached the columns.
    """
    caplog.set_level(logging.INFO)
    application = ApplicationFactory.create()
    user = UserFactory.create()
    target_application_form = ApplicationFormFactory.create(application=application)
    target_attachment = ApplicationAttachmentFactory.create(application=application)

    add_audit_event_by_id(
        db_session=db_session,
        application_id=application.application_id,
        user_id=user.user_id,
        audit_event=ApplicationAuditEvent.FORM_UPDATED,
        target_application_form_id=target_application_form.application_form_id,
        target_attachment_id=target_attachment.application_attachment_id,
    )
    db_session.flush()

    audit = db_session.execute(
        select(ApplicationAudit).where(
            ApplicationAudit.application_id == application.application_id
        )
    ).scalar_one()
    assert audit.target_application_form_id == target_application_form.application_form_id
    assert audit.target_attachment_id == target_attachment.application_attachment_id

    record = get_audit_log_record(caplog)
    assert record.target_application_form_id == target_application_form.application_form_id
    assert record.target_attachment_id == target_attachment.application_attachment_id


def test_add_audit_event_by_id_logs_ids_for_unpersisted_ids(db_session, caplog):
    """IDs are logged straight through without needing the rows to exist yet"""
    caplog.set_level(logging.INFO)
    application_id = uuid.uuid4()
    user_id = uuid.uuid4()

    add_audit_event_by_id(
        db_session=db_session,
        application_id=application_id,
        user_id=user_id,
        audit_event=ApplicationAuditEvent.APPLICATION_SUBMIT_REJECTED,
    )

    record = get_audit_log_record(caplog)
    assert record.application_id == application_id
    assert record.user_id == user_id
