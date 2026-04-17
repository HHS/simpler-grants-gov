import logging
import uuid
from typing import Optional

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import Opportunity, OpportunityAttachment
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import validate_opportunity_is_draft
from src.util import file_util

logger = logging.getLogger(__name__)


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

    # Remove the attachment from the database
    db_session.delete(attachment)

    logger.info(
        "Deleted opportunity attachment",
        extra={"opportunity_id": opportunity_id, "attachment_id": opportunity_attachment_id},
    )
