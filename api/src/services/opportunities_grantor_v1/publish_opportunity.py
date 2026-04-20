import logging
import uuid

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import (
    Privilege,
)
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import (
    validate_opportunity_created_in_simpler_grants,
)

logger = logging.getLogger(__name__)


def publish_opportunity(
    db_session: db.Session, user: User, opportunity_id: uuid.UUID
) -> Opportunity:
    """Publish an opportunity by queuing it for the opportunity publish workflow."""
    # Get the opportunity and verify access
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to publish opportunities for this agency
    verify_access(user, {Privilege.PUBLISH_OPPORTUNITY}, opportunity.agency_record)

    # Validate that the opportunity was created in Simpler Grants
    validate_opportunity_created_in_simpler_grants(opportunity)

    # Check if the opportunity is already published
    if not opportunity.is_draft:
        from src.api.route_utils import raise_flask_error

        raise_flask_error(422, message="Opportunity is already published")

    # Not Needed?
    # opportunity.is_draft = False

    # TODO Logic for queueing Opportunity to be published goes here.

    logger.info(
        "Published opportunity",
        extra={"opportunity_id": opportunity_id},
    )

    return opportunity
