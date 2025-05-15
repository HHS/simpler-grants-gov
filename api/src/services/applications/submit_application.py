import logging
import uuid
from datetime import timedelta
from uuid import UUID

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, Form
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
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

"""
{
  "data": {
    "form_validation_errors": {
      "uuid-1": [
        {
         "type": "type",
         "message": "None is not of type 'string'",
         "field": "$.StrField",
        }
      ],
      "uuid-2": [
        {
         "type": "maxLength",
         "message": "1005 is greater than the maximum of 1000",
         "field": "$.IntField",
        }
      ],
    }
  },
  "errors": [
    {
      "type": "application_form_validation",
      "message": "The application form has outstanding errors.",
      "field": "uuid-1",
    },
    {
      "type": "application_form_validation",
      "message": "The application form has outstanding errors.",
      "field": "uuid-2",
    }
  ],
  "message": "Error"
}
"""

def get_required_forms_for_application(application: Application) -> list[Form]:
    competition_forms = application.competition.competition_forms
    required_competition_forms: list[Form] = []

    for competition_form in competition_forms:
        if competition_form.is_required:
            required_competition_forms.append(competition_form.form)

        # In the future some forms may be considered required based
        # on a users answers (you said yes to X, form ABC is now required)
        # but for now we'll only consider the always-required forms.

    return required_competition_forms

def validate_required_forms(application: Application) -> None:
    """Validate that required forms have been started"""

    required_forms: list[Form] = get_required_forms_for_application(application)

    application_forms = application.application_forms


    existing_application_forms = [app_form.form for app_form in application_forms]



def validate_forms(application: Application) -> None:
    """Validate the forms for an application.

    TODO - will be need to reuse any of this logic later in another endpoint?
    """



    form_error_map: dict[uuid.UUID, list[ValidationErrorDetail]] = {}

    form_errors: list[ValidationErrorDetail] = []

    for application_form in application.application_forms:
        form_validation_errors: list[ValidationErrorDetail] = validate_json_schema_for_form(
            application_form.application_response, application_form.form
        )

        if form_validation_errors:
            form_error_map[application_form.application_form_id] = form_validation_errors

            form_errors.append(ValidationErrorDetail(
                type=ValidationErrorType.APPLICATION_FORM_VALIDATION,
                message="The application form has outstanding errors.",
                field=str(application_form.application_form_id),
            ))


    if len(form_errors) > 0:
        raise_flask_error(422, "The application has issues in its form responses.", detail={"form_validation_errors": form_error_map}, validation_issues=form_errors)



def submit_application(db_session: db.Session, application_id: UUID) -> Application:
    """
    Submit an application for a competition.
    """

    logger.info("Processing application submit")

    application = get_application(db_session, application_id)

    # Run validations
    validate_application_in_progress(application)
    validate_competition_open(application)
    validate_forms(application)

    # Update application status
    application.application_status = ApplicationStatus.SUBMITTED
    logger.info("Application successfully submitted")

    return application
