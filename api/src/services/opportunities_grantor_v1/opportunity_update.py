import logging
import uuid

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import _get_opportunity_for_grantors

logger = logging.getLogger(__name__)


def update_opportunity(
    db_session: db.Session, user: User, opportunity_id: uuid.UUID, opportunity_data: dict
) -> Opportunity:
    opportunity = _get_opportunity_for_grantors(db_session, opportunity_id)

    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Only draft opportunities can be updated
    if not opportunity.is_draft:
        raise_flask_error(422, message="Only draft opportunities can be updated")

    # PUT endpoint — always update all fields
    for field, value in opportunity_data.items():
        setattr(opportunity, field, value)

    logger.info(
        "Updated opportunity",
        extra={"opportunity_id": opportunity_id},
    )

    return opportunity
