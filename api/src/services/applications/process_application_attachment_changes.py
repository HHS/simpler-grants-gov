import logging
import uuid

import grants_shared.adapters.db as db
import grants_shared.util.file_util as file_util
from grants_shared.util.dict_util import get_nested_value
from sqlalchemy import select

from src.constants.lookup_constants import ApplicationAuditEvent
from src.db.models.competition_models import Application, ApplicationAttachment, Form
from src.db.models.user_models import User
from src.services.applications.application_audit import add_audit_event

logger = logging.getLogger(__name__)

# UI schema widgets that indicate a form field holds one or more attachments
ATTACHMENT_WIDGETS = {"Attachment", "AttachmentArray"}


def _definition_to_path(definition: str) -> list[str]:
    """Convert a UI schema field definition JSON pointer into a response path.

    For example ``/properties/att1`` becomes ``["att1"]`` and a nested
    ``/properties/foo/properties/bar`` becomes ``["foo", "bar"]``.
    """
    return [token for token in definition.split("/") if token and token != "properties"]


def _collect_attachment_field_paths(ui_schema_node: object, paths: list[list[str]]) -> None:
    """Recursively walk a form UI schema collecting attachment field paths."""
    if isinstance(ui_schema_node, list):
        for child in ui_schema_node:
            _collect_attachment_field_paths(child, paths)
        return

    if isinstance(ui_schema_node, dict):
        definition = ui_schema_node.get("definition")
        if ui_schema_node.get("widget") in ATTACHMENT_WIDGETS and isinstance(definition, str):
            paths.append(_definition_to_path(definition))
        _collect_attachment_field_paths(ui_schema_node.get("children"), paths)


def get_attachment_field_paths(form: Form) -> list[list[str]]:
    """Determine which form fields contain attachment data from the UI schema.

    Attachment fields are identified by their ``Attachment`` (single) or
    ``AttachmentArray`` (multi) widget in the form's UI schema.
    """
    paths: list[list[str]] = []
    _collect_attachment_field_paths(form.form_ui_schema, paths)
    return paths


def collect_attachment_ids(
    application_response: dict, attachment_field_paths: list[list[str]]
) -> set[str]:
    """Gather every attachment UUID referenced by the attachment fields in a response."""
    attachment_ids: set[str] = set()
    for path in attachment_field_paths:
        value = get_nested_value(application_response, path)
        if value is None:
            continue
        # Multi-attachment fields store a list of UUIDs, single fields a lone UUID
        values = value if isinstance(value, list) else [value]
        attachment_ids.update(v for v in values if isinstance(v, str))
    return attachment_ids


def _get_application_attachment(
    db_session: db.Session, application: Application, attachment_id: str
) -> ApplicationAttachment | None:
    """Fetch an attachment (including deleted ones) by its string UUID."""
    try:
        attachment_uuid = uuid.UUID(attachment_id)
    except ValueError:
        logger.info(
            "Attachment field references a value that is not a valid UUID",
            extra={"application_id": application.application_id, "attachment_id": attachment_id},
        )
        return None

    return db_session.execute(
        select(ApplicationAttachment).where(
            ApplicationAttachment.application_id == application.application_id,
            ApplicationAttachment.application_attachment_id == attachment_uuid,
        )
    ).scalar_one_or_none()


def _process_added_attachment(
    db_session: db.Session, application: Application, user: User, attachment_id: str
) -> None:
    application_attachment = _get_application_attachment(db_session, application, attachment_id)
    if application_attachment is None:
        logger.warning(
            "Added attachment identified in form diff does not exist on the application",
            extra={"application_id": application.application_id, "attachment_id": attachment_id},
        )
        return

    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.ATTACHMENT_ADDED,
        target_attachment=application_attachment,
    )


def _process_deleted_attachment(
    db_session: db.Session, application: Application, user: User, attachment_id: str
) -> None:
    application_attachment = _get_application_attachment(db_session, application, attachment_id)
    if application_attachment is None:
        logger.warning(
            "Deleted attachment identified in form diff does not exist on the application",
            extra={"application_id": application.application_id, "attachment_id": attachment_id},
        )
        return

    # If the attachment has already been deleted (e.g. via the delete endpoint)
    # there is nothing left to clean up, otherwise remove the underlying file.
    if application_attachment.is_deleted:
        logger.info(
            "Attachment identified as deleted in form diff was already deleted",
            extra={
                "application_id": application.application_id,
                "application_attachment_id": application_attachment.application_attachment_id,
            },
        )
    else:
        logger.info(
            "Attachment identified as deleted in form diff but not yet deleted, deleting now",
            extra={
                "application_id": application.application_id,
                "application_attachment_id": application_attachment.application_attachment_id,
            },
        )
        # Delete the file from s3
        file_util.delete_file(application_attachment.file_location)
        # Mark the attachment as deleted, keeping the record for auditing purposes
        application_attachment.is_deleted = True
        # Remove the s3 path to make clear it's gone.
        application_attachment.file_location = "DELETED"

    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.ATTACHMENT_DELETED,
        target_attachment=application_attachment,
    )


def process_application_attachment_changes(
    db_session: db.Session,
    application: Application,
    form: Form,
    user: User,
    old_application_response: dict | None,
    new_application_response: dict | None,
) -> None:
    """Diff the attachment fields of a form response and audit added/deleted attachments.

    Determines which attachment form fields exist for the form, then compares the
    attachment UUIDs referenced before and after the update. Newly referenced
    attachments generate an ``ATTACHMENT_ADDED`` audit event, and no-longer-referenced
    attachments are deleted (if not already) and generate an ``ATTACHMENT_DELETED``
    audit event.
    """
    attachment_field_paths = get_attachment_field_paths(form)
    if not attachment_field_paths:
        return

    old_ids = collect_attachment_ids(old_application_response or {}, attachment_field_paths)
    new_ids = collect_attachment_ids(new_application_response or {}, attachment_field_paths)

    added_ids = new_ids - old_ids
    deleted_ids = old_ids - new_ids

    for attachment_id in added_ids:
        _process_added_attachment(db_session, application, user, attachment_id)

    for attachment_id in deleted_ids:
        _process_deleted_attachment(db_session, application, user, attachment_id)
