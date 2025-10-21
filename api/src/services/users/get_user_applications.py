import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.db.models.competition_models import Application, Competition
from src.db.models.entity_models import Organization
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import ApplicationUser

logger = logging.getLogger(__name__)


def get_user_applications(db_session: db.Session, user_id: UUID) -> list[Application]:
    """
    Get all applications for a user
    """
    logger.info(f"Getting applications for user {user_id}")

    # Query for applications where the user is associated via ApplicationUser
    result = db_session.execute(
        select(Application)
        .join(ApplicationUser, ApplicationUser.application_id == Application.application_id)
        .where(ApplicationUser.user_id == user_id)
        .options(
            # Load the competition data
            selectinload(Application.competition)
            .selectinload(Competition.opportunity)
            .selectinload(Opportunity.agency_record),
            # Load organization and its sam_gov_entity
            selectinload(Application.organization).selectinload(Organization.sam_gov_entity),
        )
    )

    applications = list(result.scalars().all())

    logger.info(f"Retrieved {len(applications)} applications for user {user_id}")

    return applications
