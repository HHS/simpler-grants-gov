import logging
from enum import StrEnum

from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, Competition, Form, CompetitionForm
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


class ApplicationAction(StrEnum):
    START = "start"
    SUBMIT = "submit"
    MODIFY = "modify"


def get_required_form_errors(application: Application) -> list[ValidationErrorDetail]:
    """Get validation errors for an application missing required forms"""

    existing_competition_form_ids = [app_form.competition_form_id for app_form in application.application_forms]

    required_form_errors: list[ValidationErrorDetail] = []

    for competition_form in application.competition.competition_forms:
        if competition_form.is_required and competition_form.competition_form_id not in existing_competition_form_ids:
            required_form_errors.append(
                ValidationErrorDetail(
                    message=f"Form {competition_form.form.form_name} is required",
                    type=ValidationErrorType.MISSING_REQUIRED_FORM,
                    field="form_id",
                    value=competition_form.form_id,
                )
            )

    return required_form_errors


def get_application_form_errors(
    application: Application,
) -> tuple[list[ValidationErrorDetail], dict[str, list[ValidationErrorDetail]]]:
    """Get the application form errors from required form + JSON Schema validation"""

    # This map has all the specific errors from a given form
    # rather than adding each individual one to the error list.
    form_error_map: dict[str, list[ValidationErrorDetail]] = {}

    form_errors: list[ValidationErrorDetail] = []

    # Add validation errors for missing required application forms
    form_errors.extend(get_required_form_errors(application))

    # For each application form, verify it passes JSON schema validation
    for application_form in application.application_forms:
        form_validation_errors: list[ValidationErrorDetail] = validate_json_schema_for_form(
            application_form.application_response, application_form.form
        )

        if form_validation_errors:
            form_error_map[str(application_form.application_form_id)] = form_validation_errors

            form_errors.append(
                ValidationErrorDetail(
                    type=ValidationErrorType.APPLICATION_FORM_VALIDATION,
                    message="The application form has outstanding errors.",
                    field="application_form_id",
                    value=application_form.application_form_id,
                )
            )

    return form_errors, form_error_map


def validate_forms(application: Application) -> None:
    """Validate the forms for an application."""

    form_errors, form_error_map = get_application_form_errors(application)

    if len(form_errors) > 0:
        detail = {}
        if form_error_map:
            detail["form_validation_errors"] = form_error_map

        raise_flask_error(
            422,
            "The application has issues in its form responses.",
            detail=detail,
            validation_issues=form_errors,
        )


def validate_application_in_progress(application: Application, action: ApplicationAction) -> None:
    """
    Validate that the application is in the IN_PROGRESS state.

    An application cannot be modified if it is not currently in progress.
    """
    if application.application_status != ApplicationStatus.IN_PROGRESS:
        message = f"Cannot {action} application. It is currently in status: {application.application_status}"
        logger.info(
            f"Cannot {action} application, not currently in progress",
            extra={
                "action": action,
                "application_status": application.application_status,
                "application_action": action,
            },
        )
        raise_flask_error(
            403,
            message,
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.NOT_IN_PROGRESS,
                    message=f"Cannot {action} application, not currently in progress",
                )
            ],
        )


def validate_competition_open(competition: Competition, action: ApplicationAction) -> None:
    """
    Validate that the competition is still open for applications.
    Takes into account the competition closing date and grace period.
    """

    if not competition.is_open:
        message = f"Cannot {action} application - competition is not open"
        logger.info(
            message,
            extra={
                "opening_date": competition.opening_date,
                "closing_date": competition.closing_date,
                "grace_period": competition.grace_period,
                "application_action": action,
            },
        )
        raise_flask_error(
            422,
            message,
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.COMPETITION_NOT_OPEN,
                    message="Competition is not open for application",
                )
            ],
        )
