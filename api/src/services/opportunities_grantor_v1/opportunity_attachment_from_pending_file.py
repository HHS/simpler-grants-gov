import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.adapters.aws import S3Config
from grants_shared.util import file_util

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import OpportunityAttachment
from src.db.models.user_models import User
from src.services.files.pending_file_handling_domain_specific import (
    fetch_and_validate_scan_complete_file,
    move_pending_file_to_destination,
)
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import (
    validate_opportunity_created_in_simpler_grants,
)
from src.services.opportunity_attachments.attachment_util import get_s3_attachment_path

logger = logging.getLogger(__name__)


def create_opportunity_attachment_from_pending_file(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
    pending_file_id: uuid.UUID,
) -> OpportunityAttachment:
    """Create an opportunity attachment from a pending (virus-scanned) file.

    Order matters: validate the pending file, create+add the DB record,
    then move the S3 object - so a failed DB write leaves the pending file untouched.
    """
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)
    validate_opportunity_created_in_simpler_grants(opportunity)

    pending_file = fetch_and_validate_scan_complete_file(db_session, pending_file_id, user)

    attachment_id = uuid.uuid4()
    # pending_file.file_location already ends in a secure_filename-sanitized
    # name (applied once at presign time) - reuse it instead of re-sanitizing
    # pending_file.file_name from scratch. The raw name is kept for the DB
    # record's display file_name below.
    secure_file_name = file_util.get_file_name(pending_file.file_location)

    s3_config = S3Config()
    s3_file_location = get_s3_attachment_path(
        file_name=secure_file_name,
        opportunity_attachment_id=attachment_id,
        opportunity=opportunity,
        s3_config=s3_config,
    )
    file_size_bytes = file_util.get_file_length_bytes(pending_file.file_location)

    attachment = OpportunityAttachment(
        attachment_id=attachment_id,
        opportunity_id=opportunity_id,
        file_location=s3_file_location,
        mime_type=pending_file.mime_type,
        file_name=pending_file.file_name,
        file_description="",
        file_size_bytes=file_size_bytes,
        legacy_attachment_id=None,
    )
    db_session.add(attachment)

    # Move after db_session.add - a failed DB write must leave the pending file alone
    move_pending_file_to_destination(pending_file, s3_file_location)

    logger.info(
        "Created opportunity attachment from pending file",
        extra={
            "opportunity_id": opportunity_id,
            "attachment_id": attachment_id,
            "pending_file_id": pending_file_id,
        },
    )

    return attachment
