import logging
import uuid
from typing import cast

from werkzeug.datastructures import FileStorage

import src.adapters.db as db
import src.util.file_util as file_util
from src.adapters.aws import S3Config
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import ApplicationAuditEvent, Privilege, SubmissionIssue
from src.db.models.competition_models import Application, ApplicationAttachment
from src.db.models.user_models import User
from src.services.applications.application_audit import add_audit_event
from src.services.applications.get_application import get_application

logger = logging.getLogger(__name__)


def create_application_attachment(
    db_session: db.Session, application_id: uuid.UUID, user: User, form_and_files_data: dict
) -> ApplicationAttachment:
    # Fetch the application - handles checking if application exists & user can access
    application = get_application(db_session, application_id, user)

    # Check privileges
    check_user_access(db_session, user, {Privilege.MODIFY_APPLICATION}, application)

    application_attachment = upsert_application_attachment(
        db_session=db_session,
        application_id=application_id,
        user=user,
        form_and_files_data=form_and_files_data,
        application=application,
        application_attachment=None,
    )

    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.ATTACHMENT_ADDED,
        target_attachment=application_attachment,
    )
    return application_attachment


def upsert_application_attachment(
    db_session: db.Session,
    application_id: uuid.UUID,
    user: User,
    form_and_files_data: dict,
    application: Application,
    application_attachment: ApplicationAttachment | None = None,
) -> ApplicationAttachment:
    """Create or update an application attachment."""
    # This uses a werkzeug FileStorage object for managing the file operations
    # Mimetype is set if the user specifies it when uploading the file which
    # if it's done via a standard HTML file box would include it.
    file_attachment: FileStorage = cast(FileStorage, form_and_files_data.get("file_attachment"))

    # This should only ever happen if someone had a filename that Werkzeug could
    # not parse or interpreted as a file stream.
    if file_attachment.filename is None:
        logger.info(
            "Invalid file name, cannot parse",
            extra={"submission_issue": SubmissionIssue.INVALID_FILE_NAME},
        )
        raise_flask_error(422, "Invalid file name, cannot parse")

    # secure_filename makes the file safe in path operations and removes non-ascii characters
    secure_file_name = file_util.get_secure_file_name(file_attachment.filename)

    # For new attachments, generate a new ID. For updates, use the existing ID.
    if application_attachment is None:
        application_attachment_id = uuid.uuid4()
        application_attachment = ApplicationAttachment(
            application_attachment_id=application_attachment_id
        )
    else:
        application_attachment_id = application_attachment.application_attachment_id

    # Build the s3 path
    s3_file_location = build_s3_application_attachment_path(
        secure_file_name, application_id, application_attachment_id
    )

    # Upload the file to s3
    logger.info(
        "Uploading application attachment to s3",
        extra={"application_attachment_id": application_attachment_id},
    )
    with file_util.open_stream(
        s3_file_location, mode="wb", content_type=file_attachment.mimetype
    ) as writefile:
        file_attachment.save(writefile)

    # The content length is not set in most cases on the FileStorage object (needs to be done explicitly by user)
    # so instead get the content-length from the file on s3 after we upload it.
    file_size_bytes = file_util.get_file_length_bytes(s3_file_location)

    # If we don't do this, we see `Can't attach instance of 'User' to session` errors.
    user = db_session.merge(user)

    # Set or update the application attachment properties
    application_attachment.application = application
    application_attachment.file_location = s3_file_location
    # In the file_name column we store the users actual file name unmodified
    # so when we display it on the UI it matches whatever they uploaded.
    application_attachment.file_name = file_util.get_file_name(file_attachment.filename)
    application_attachment.mime_type = file_attachment.mimetype
    application_attachment.file_size_bytes = file_size_bytes
    application_attachment.user = user

    db_session.add(application_attachment)

    logger.info(
        "Created/updated application attachment",
        extra={"application_attachment_id": application_attachment_id},
    )
    return application_attachment


def build_s3_application_attachment_path(
    file_name: str, application_id: uuid.UUID, application_attachment_id: uuid.UUID
) -> str:
    """Construct a path to the application attachments on s3

    Will be formatted like:

        s3://<bucket>/applications/<application_id>/attachments/<attachment_id>/<file_name>

    We store each file in a separate folder as we don't require file names to be unique.
    """
    # We store files on the draft (non-public) s3 bucket, they are never public.
    s3_config = S3Config()
    base_path = s3_config.draft_files_bucket_path

    return file_util.join(
        base_path,
        "applications",
        str(application_id),
        "attachments",
        str(application_attachment_id),
        file_name,
    )
