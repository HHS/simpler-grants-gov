import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import Agency, User

logger = logging.getLogger(__name__)


def get_opportunity(db_session: db.Session, opportunity_id: uuid.UUID) -> Opportunity:
    stmt = select(Opportunity).where(Opportunity.opportunity_id == opportunity_id)
    opportunity = db_session.execute(stmt).scalar_one_or_none()

    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    return opportunity


def update_opportunity(
    db_session: db.Session, user: User, opportunity_id: uuid.UUID, opportunity_data: dict
) -> Opportunity:
    opportunity = get_opportunity(db_session, opportunity_id)

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Only draft opportunities can be updated
    if not opportunity.is_draft:
        raise_flask_error(422, message="Only draft opportunities can be updated")

    # PUT endpoint — always update all fields
    for field, value in opportunity_data.items():
        setattr(opportunity, field, value)

    db_session.add(opportunity)
    db_session.flush()

    # Reload with all necessary relationships
    # selectinload("*") eagerly loads all relationships to avoid DetachedInstanceError
    stmt = (
        select(Opportunity)
        .options(
            selectinload("*"),
            selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
        )
        .filter(Opportunity.opportunity_id == opportunity_id)
    )
    opportunity = db_session.execute(stmt).scalar_one()

    logger.info(
        "Updated opportunity",
        extra={"opportunity_id": opportunity_id},
    )

    return opportunity
