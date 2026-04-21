import logging
import uuid

from sqlalchemy import select
from werkzeug.datastructures import FileStorage

import src.adapters.db as db
from src.adapters.aws import S3Config
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import OpportunityAttachment
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import validate_opportunity_is_draft
from src.services.opportunity_attachments.attachment_util import (
    adjust_legacy_file_name,
    get_s3_attachment_path,
)
from src.util import file_util

logger = logging.getLogger(__name__)


def upload_opportunity_attachment(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
    file_data: FileStorage,
    file_description: str = "",
) -> str:
    """Upload an attachment to an opportunity"""
    # Get the opportunity and verify it exists
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Verify opportunity is in draft state
    validate_opportunity_is_draft(opportunity)

    attachment_id = uuid.uuid4()

    # Extract file metadata
    if not file_data.filename:
        raise_flask_error(422, "File must have a filename")

    file_name = adjust_legacy_file_name(file_data.filename)
    mime_type = file_data.mimetype or "application/octet-stream"

    # Create S3 path for the file
    s3_config = S3Config()
    file_path = get_s3_attachment_path(
        file_name=file_name,
        opportunity_attachment_id=attachment_id,
        opportunity=opportunity,
        s3_config=s3_config,
    )

    # Write the file to S3
    with file_util.open_stream(file_path, "wb", content_type=mime_type) as f:
        file_data.save(f)

    # Get the file size from S3
    file_size_bytes = file_util.get_file_length_bytes(file_path)

    attachment = OpportunityAttachment(
        attachment_id=attachment_id,
        opportunity_id=opportunity_id,
        file_location=file_path,
        mime_type=mime_type,
        file_name=file_name,
        file_description=file_description,
        file_size_bytes=file_size_bytes,
        legacy_attachment_id=None,
    )

    db_session.add(attachment)

    logger.info(
        "Added attachment to opportunity",
        extra={
            "opportunity_id": opportunity_id,
            "attachment_id": attachment_id,
            "file_size": file_size_bytes,
            "file_name": file_name,
            "file_description": file_description,
        },
    )

    return str(attachment_id)


def delete_opportunity_attachment(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
    opportunity_attachment_id: str,
) -> None:
    """Delete an attachment from an opportunity"""
    # Get the opportunity and verify it exists
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Verify opportunity is in draft state
    validate_opportunity_is_draft(opportunity)

    # Find the attachment
    attachment = db_session.execute(
        select(OpportunityAttachment).where(
            OpportunityAttachment.opportunity_id == opportunity_id,
            OpportunityAttachment.attachment_id == opportunity_attachment_id,
        )
    ).scalar_one_or_none()

    if not attachment:
        raise_flask_error(404, "Attachment not found")

    db_session.delete(attachment)
    file_util.delete_file(attachment.file_location)

    logger.info(
        "Deleted opportunity attachment",
        extra={"opportunity_id": opportunity_id, "attachment_id": opportunity_attachment_id},
    )
