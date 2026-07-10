import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import Competition
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors

logger = logging.getLogger(__name__)


def update_competition(
    db_session: db.Session,
    user: User,
    competition_data: dict,
    opportunity_id: uuid.UUID,
    competition_id: uuid.UUID,
) -> Competition:
    # Check if opportunity exists
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Get the competition with all relationships loaded
    stmt = (
        select(Competition)
        .where(Competition.competition_id == competition_id)
        .options(
            selectinload(Competition.opportunity_assistance_listing),
            selectinload(Competition.competition_forms),
            selectinload(Competition.competition_instructions),
        )
    )
    competition = db_session.execute(stmt).scalar_one_or_none()
    if competition is None:
        raise_flask_error(404, message=f"Competition {competition_id} not found")

    # Verify competition belongs to the opportunity
    if competition.opportunity_id != opportunity_id:
        raise_flask_error(
            404, message=f"Competition {competition_id} not found for opportunity {opportunity_id}"
        )

    # Update fields
    competition.competition_title = competition_data["competition_title"]
    competition.opening_date = competition_data["opening_date"]
    competition.closing_date = competition_data["closing_date"]
    competition.contact_info = competition_data["contact_info"]
    competition.open_to_applicants = set(competition_data["open_to_applicants"])

    logger.info(
        "Updated competition",
        extra={"competition_id": competition_id, "opportunity_id": opportunity_id},
    )

    return competition
