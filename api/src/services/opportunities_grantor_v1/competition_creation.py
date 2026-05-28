import logging
import uuid

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import Competition
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors

logger = logging.getLogger(__name__)


def create_competition(
    db_session: db.Session, user: User, competition_data: dict, opportunity_id: uuid.UUID
) -> Competition:

    # Check if opportunity exists
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Create the competition
    competition = Competition(
        competition_id=uuid.uuid4(),
        opportunity_id=opportunity_id,
        is_simpler_grants_enabled=True,
        **competition_data
    )

    # Explicitly initialize all relationships that will be serialized
    competition.open_to_applicants = set(competition_data["open_to_applicants"])
    competition.competition_forms = []
    competition.competition_instructions = []
    competition.opportunity_assistance_listing = None

    db_session.add(competition)
    db_session.flush()

    logger.info(
        "Created competition",
        extra={
            "competition_id": competition.competition_id,
            "opportunity_id": opportunity_id,
        },
    )

    return competition
