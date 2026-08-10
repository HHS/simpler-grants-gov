import logging
import uuid

import grants_shared.adapters.db as db

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import (
    validate_opportunity_created_in_simpler_grants,
    validate_opportunity_is_draft,
    validate_opportunity_not_deleted,
)

logger = logging.getLogger(__name__)


def delete_opportunity(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
) -> None:
    """Delete an opportunity (soft delete by setting is_deleted=True)"""
    # Get the opportunity and verify it exists
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to delete opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Verify opportunity was created in Simpler Grants
    validate_opportunity_created_in_simpler_grants(opportunity)

    # Prevent repeated delete attempts against already deleted records
    validate_opportunity_not_deleted(opportunity)

    # Check if the opportunity is published - published opportunities cannot be deleted
    validate_opportunity_is_draft(opportunity)

    # Soft delete the opportunity
    opportunity.is_deleted = True
    db_session.commit()

    logger.info(
        "Deleted opportunity",
        extra={"opportunity_id": opportunity_id},
    )
