import logging
import uuid

from sqlalchemy import select
from werkzeug.datastructures import FileStorage

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import OpportunityAttachment
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import validate_opportunity_is_draft

logger = logging.getLogger(__name__)


def upload_opportunity_attachments(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
    files: list[FileStorage],
) -> list[str]:
    """Upload attachments to an opportunity"""
    # Get the opportunity and verify it exists
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Verify opportunity is in draft state
    validate_opportunity_is_draft(opportunity)

    attachment_ids = []

    try:
        for file_data in files:
            attachment_id = uuid.uuid4()

            # Extract file metadata
            file_name = file_data.filename
            file_content = file_data.read()
            mime_type = file_data.mimetype or "application/octet-stream"
            file_description = ""
            file_size_bytes = len(file_content)

            # Create S3 path for the file
            file_path = f"s3://local-mock-public-bucket/opportunities/{opportunity_id}/attachments/{attachment_id}/{file_name}"

            # Write the file to S3
            # with file_util.open_stream(file_path, "wb", content_type=mime_type) as f:
            #    f.write(file_content)

            attachment = OpportunityAttachment(
                attachment_id=attachment_id,
                opportunity_id=opportunity_id,
                file_location=file_path,
                mime_type=mime_type,
                file_name=file_name,
                file_description=file_description,
                file_size_bytes=file_size_bytes,
                legacy_attachment_id=0,
            )

            db_session.add(attachment)
            attachment_ids.append(str(attachment_id))

            logger.info(
                f"Added attachment {file_name} to opportunity",
                extra={
                    "opportunity_id": opportunity_id,
                    "attachment_id": attachment_id,
                    "file_size": file_size_bytes,
                },
            )
    except Exception as e:
        logger.error(f"Error uploading attachments: {str(e)}")
        db_session.rollback()
        raise

    return attachment_ids


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

    logger.info(
        "Deleted opportunity attachment",
        extra={"opportunity_id": opportunity_id, "attachment_id": opportunity_attachment_id},
    )
