from enum import StrEnum

from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, Form
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.validation.validation_constants import ValidationErrorType
import logging

logger = logging.getLogger(__name__)

class ApplicationAction(StrEnum):
    SUBMIT = "submit"
    MODIFY = "modify"

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


def get_required_form_errors(application: Application) -> list[ValidationErrorDetail]:
    """Get validation errors for an application missing required forms"""

    required_forms: list[Form] = get_required_forms_for_application(application)

    existing_application_form_ids = [app_form.form_id for app_form in application.application_forms]

    required_form_errors: list[ValidationErrorDetail] = []

    for required_form in required_forms:
        if required_form.form_id not in existing_application_form_ids:
            required_form_errors.append(
                ValidationErrorDetail(
                    message=f"Form {required_form.form_name} is required",
                    type=ValidationErrorType.MISSING_REQUIRED_FORM,
                    field="form_id",
                    value=required_form.form_id,
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
                "application_status": application.application_status
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