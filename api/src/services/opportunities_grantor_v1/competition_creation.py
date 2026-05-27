import logging
import uuid
from datetime import date

from pydantic import BaseModel

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import CompetitionOpenToApplicant, Privilege
from src.db.models.competition_models import Competition
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors

logger = logging.getLogger(__name__)


class CompetitionInstructionCreate(BaseModel):
    file_name: str
    download_path: str


class OpportunityAssistanceListingData(BaseModel):
    assistance_listing_number: str
    program_title: str


class CompetitionCreateItem(BaseModel):
    opportunity_id: uuid.UUID
    competition_title: str
    opening_date: date | None
    closing_date: date | None
    contact_info: str
    open_to_applicants: list[CompetitionOpenToApplicant]


def create_competition(db_session: db.Session, user: User, competition_data: dict) -> Competition:
    # Parse and validate input
    request = CompetitionCreateItem(**competition_data)

    # Check if opportunity exists
    opportunity = get_opportunity_for_grantors(db_session, user, request.opportunity_id)

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Create the competition
    competition = Competition(
        competition_id=uuid.uuid4(),
        opportunity_id=request.opportunity_id,
        competition_title=request.competition_title,
        opening_date=request.opening_date,
        closing_date=request.closing_date,
        contact_info=request.contact_info,
        is_simpler_grants_enabled=True,
    )

    # Explicitly initialize all relationships that will be serialized
    competition.open_to_applicants = set(request.open_to_applicants)
    competition.competition_forms = []
    competition.competition_instructions = []
    competition.opportunity_assistance_listing = None

    db_session.add(competition)
    db_session.flush()

    logger.info(
        "Created competition",
        extra={
            "competition_id": competition.competition_id,
            "opportunity_id": request.opportunity_id,
        },
    )

    return competition
