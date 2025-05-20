import logging
from datetime import timedelta
from uuid import UUID

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.db.models.user_models import User
from src.services.applications.application_validation import validate_forms, validate_application_in_progress, ApplicationAction
from src.services.applications.get_application import get_application
from src.util.datetime_util import get_now_us_eastern_date
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


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


def submit_application(db_session: db.Session, application_id: UUID, user: User) -> Application:
    """
    Submit an application for a competition.
    """

    logger.info("Processing application submit")

    application = get_application(db_session, application_id, user)

    # Run validations
    validate_application_in_progress(application, ApplicationAction.SUBMIT)
    validate_competition_open(application)
    validate_forms(application)

    # Update application status
    application.application_status = ApplicationStatus.SUBMITTED
    logger.info("Application successfully submitted")

    return application
