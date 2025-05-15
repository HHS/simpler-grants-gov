import logging
from datetime import timedelta
from uuid import UUID

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.services.applications.get_application import get_application
from src.util.datetime_util import get_now_us_eastern_date
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


def validate_application_in_progress(application: Application) -> None:
    """
    Validate that the application is in the IN_PROGRESS state.
    """
    if application.application_status != ApplicationStatus.IN_PROGRESS:
        message = f"Application cannot be submitted. It is currently in status: {application.application_status}"
        logger.info(
            "Application cannot be submitted, not currently in progress",
            extra={"application_status": application.application_status},
        )
        raise_flask_error(
            403,
            message,
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.NOT_IN_PROGRESS,
                    message="Application cannot be submitted, not currently in progress",
                )
            ],
        )


def validate_competition_open(application: Application) -> None:
    """
    Validate that the competition is still open for submissions.
    Takes into account the competition closing date and grace period.
    """
    competition = application.competition
    current_date = get_now_us_eastern_date()

    if competition.closing_date is not None:
        actual_closing_date = competition.closing_date

        # If grace_period is not null, add that many days to the closing date
        if competition.grace_period is not None and competition.grace_period > 0:
            actual_closing_date = competition.closing_date + timedelta(
                days=competition.grace_period
            )

        if current_date > actual_closing_date:
            message = "Cannot submit application - competition is closed"
            logger.info(
                message,
                extra={
                    "application_id": application.application_id,
                    "closing_date": competition.closing_date,
                    "grace_period": competition.grace_period,
                },
            )
            raise_flask_error(
                422,
                message,
                validation_issues=[
                    ValidationErrorDetail(
                        type=ValidationErrorType.COMPETITION_ALREADY_CLOSED,
                        message="Competition is closed for submissions",
                        field="closing_date",
                    )
                ],
            )


def submit_application(db_session: db.Session, application_id: UUID) -> Application:
    """
    Submit an application for a competition.
    """

    logger.info("Processing application submit")

    application = get_application(db_session, application_id)

    # Run validations
    validate_application_in_progress(application)
    validate_competition_open(application)

    # Update application status
    application.application_status = ApplicationStatus.SUBMITTED
    logger.info("Application successfully submitted")

    return application
