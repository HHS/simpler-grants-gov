import logging
import uuid
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, Competition, ApplicationForm
from src.db.models.user_models import ApplicationUser, User
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_competition_open,
)

logger = logging.getLogger(__name__)


def create_application(
    db_session: db.Session, competition_id: UUID, user: User, application_name: str | None = None
) -> Application:
    """
    Create a new application for a competition.
    """
    # Check if competition exists
    competition = db_session.execute(
        select(Competition).where(Competition.competition_id == competition_id)
        .options(selectinload(Competition.competition_forms))
    ).scalar_one_or_none()

    if not competition:
        raise_flask_error(404, "Competition not found")

    # Verify the competition is open
    validate_competition_open(competition, ApplicationAction.START)

    # Get default application name if not provided
    if application_name is None:
        application_name = competition.opportunity.opportunity_number
    # Create a new application
    application = Application(
        application_id=uuid.uuid4(),
        competition_id=competition_id,
        application_name=application_name,
        application_status=ApplicationStatus.IN_PROGRESS,
    )
    db_session.add(application)

    application_user = ApplicationUser(application=application, user=user)
    db_session.add(application_user)

    # Initialize the competition forms for the application
    for competition_form in competition.competition_forms:
        application_form = ApplicationForm(application=application, competition_form=competition_form, application_response={})

        db_session.add(application_form)

    logger.info(
        "Created new application",
        extra={
            "application_id": application.application_id,
            "competition_id": competition_id,
        },
    )

    return application
