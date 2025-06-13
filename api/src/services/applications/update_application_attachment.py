import logging
import uuid
from typing import cast

from werkzeug.datastructures import FileStorage

import src.adapters.db as db
import src.util.file_util as file_util
from src.db.models.competition_models import ApplicationAttachment
from src.db.models.user_models import User
from src.services.applications.create_application_attachment import (
    build_s3_application_attachment_path,
)
from src.services.applications.get_application_attachment import get_application_attachment

logger = logging.getLogger(__name__)


def update_application_attachment(
    db_session: db.Session,
    application_id: uuid.UUID,
    application_attachment_id: uuid.UUID,
    user: User,
    form_and_files_data: dict,
) -> ApplicationAttachment:
    # Fetch the application attachment, handles verifying
    # it exists, and that the user has access attachment.
    application_attachment = get_application_attachment(
        db_session, application_id, application_attachment_id, user
    )

    # This uses a werkzeug FileStorage object for managing the file operations
    # Mimetype is set if the user specifies it when uploading the file which
    # if it's done via a standard HTML file box would include it.
    file_attachment: FileStorage = cast(FileStorage, form_and_files_data.get("file_attachment"))

    # secure_filename makes the file safe in path operations and removes non-ascii characters
    secure_file_name = file_util.get_secure_file_name(file_attachment.filename)

    # Build the new s3 path
    new_s3_file_location = build_s3_application_attachment_path(
        secure_file_name, application_id, application_attachment_id
    )

    # Store the old file location before updating
    old_s3_file_location = application_attachment.file_location

    # Upload the file to s3
    logger.info(
        "Uploading application attachment to s3",
        extra={"application_attachment_id": application_attachment_id},
    )
    with file_util.open_stream(
        new_s3_file_location, mode="wb", content_type=file_attachment.mimetype
    ) as writefile:
        file_attachment.save(writefile)

    # The content length is not set in most cases on the FileStorage object (needs to be done explicitly by user)
    # so instead get the content-length from the file on s3 after we upload it.
    file_size_bytes = file_util.get_file_length_bytes(new_s3_file_location)

    # Update the application attachment record
    application_attachment.file_location = new_s3_file_location
    # In the file_name column we store the users actual file name unmodified
    # so when we display it on the UI it matches whatever they uploaded.
    application_attachment.file_name = file_util.get_file_name(file_attachment.filename)
    application_attachment.mime_type = file_attachment.mimetype
    application_attachment.file_size_bytes = file_size_bytes

    # IF the filepath on s3 is different than before, delete the old file from s3
    if old_s3_file_location != new_s3_file_location:
        logger.info(
            "Deleting old application attachment from s3",
            extra={
                "application_attachment_id": application_attachment_id,
                "old_file_location": old_s3_file_location,
            },
        )
        file_util.delete_file(old_s3_file_location)

    logger.info(
        "Updated application attachment",
        extra={"application_attachment_id": application_attachment_id},
    )
    return application_attachment
