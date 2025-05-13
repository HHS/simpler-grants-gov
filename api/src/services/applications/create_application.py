import logging
import uuid
from datetime import timedelta
from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application, Competition
from src.db.models.user_models import ApplicationUser, User
from src.util.datetime_util import get_now_us_eastern_date
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


def create_application(
    db_session: db.Session, competition_id: UUID, user_id: UUID = None
) -> Application:
    """
    Create a new application for a competition.
    """
    # Check if competition exists
    competition = db_session.execute(
        select(Competition).where(Competition.competition_id == competition_id)
    ).scalar_one_or_none()

    if not competition:
        raise_flask_error(404, "Competition not found")

    current_date = get_now_us_eastern_date()

    # Check if current date is before opening date
    if competition.opening_date is not None and current_date < competition.opening_date:
        raise_flask_error(
            422,
            "Cannot start application - competition is not yet open for applications",
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.COMPETITION_NOT_YET_OPEN,
                    message="Competition is not yet open for applications",
                    field="opening_date",
                )
            ],
        )

    # If closing_date is not null, check if current date is after closing date
    if competition.closing_date is not None:
        actual_closing_date = competition.closing_date

        # If grace_period is not null, add that many days to the closing date
        if competition.grace_period is not None and competition.grace_period > 0:
            actual_closing_date = competition.closing_date + timedelta(
                days=competition.grace_period
            )

        if current_date >= actual_closing_date:
            raise_flask_error(
                422,
                "Cannot start application - competition is already closed for applications",
                validation_issues=[
                    ValidationErrorDetail(
                        type=ValidationErrorType.COMPETITION_ALREADY_CLOSED,
                        message="Competition is already closed for applications",
                        field="closing_date",
                    )
                ],
            )

    # Create a new application
    application = Application(application_id=uuid.uuid4(), competition_id=competition_id)
    db_session.add(application)

    # Associate user with application if provided
    if user_id:
        # Check if the user-application association already exists
        existing_association = db_session.execute(
            select(ApplicationUser).where(
                ApplicationUser.application_id == application.application_id,
                ApplicationUser.user_id == user_id,
            )
        ).scalar_one_or_none()

        # Only create the association if it doesn't already exist
        if not existing_association:
            application_user = ApplicationUser(
                application_id=application.application_id, user_id=user_id
            )
            db_session.add(application_user)

            logger.info(
                "Associated user with application",
                extra={
                    "application_id": application.application_id,
                    "user_id": user_id,
                },
            )
        else:
            logger.info(
                "User already associated with application",
                extra={
                    "application_id": application.application_id,
                    "user_id": user_id,
                },
            )

    logger.info(
        "Created new application",
        extra={
            "application_id": application.application_id,
            "competition_id": competition_id,
        },
    )

    return application
