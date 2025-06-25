import logging
from enum import StrEnum

from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationFormStatus, ApplicationStatus
from src.db.models.competition_models import Application, ApplicationForm, Competition
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.form_schema.rule_processing.json_rule_context import JsonRuleConfig, JsonRuleContext
from src.form_schema.rule_processing.json_rule_processor import process_rule_schema_for_context
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


class ApplicationAction(StrEnum):
    START = "start"
    SUBMIT = "submit"
    MODIFY = "modify"
    GET = "get"


START_JSON_RULE_CONFIG = JsonRuleConfig(
    # When starting an application, we only do pre-population
    do_pre_population=False,  # TODO - when we enable pre-population, flip this to True
    do_post_population=False,
    do_field_validation=False,
)

GET_JSON_RULE_CONFIG = JsonRuleConfig(
    # When fetching an application, we only do field validation
    # as fetching shouldn't ever modify the values
    do_pre_population=False,
    do_post_population=False,
    do_field_validation=True,
)

UPDATE_JSON_RULE_CONFIG = JsonRuleConfig(
    # When updating, we do pre-population + validate. If a user
    # changed any values, we want to make sure any pre-populated fields
    # stay as the automatically generated ones.
    do_pre_population=False,  # TODO - when we enable pre-population, flip this to True
    do_post_population=False,
    do_field_validation=True,
)

SUBMISSION_JSON_RULE_CONFIG = JsonRuleConfig(
    # During submission, we do post-population (the only place we ever do)
    # and field validation
    do_pre_population=False,
    do_post_population=False,  # TODO - when we enable post-population, flip this to True
    do_field_validation=True,
)

ACTION_RULE_CONFIG_MAP = {
    ApplicationAction.START: START_JSON_RULE_CONFIG,
    ApplicationAction.GET: GET_JSON_RULE_CONFIG,
    ApplicationAction.MODIFY: UPDATE_JSON_RULE_CONFIG,
    ApplicationAction.SUBMIT: SUBMISSION_JSON_RULE_CONFIG,
}


def get_missing_app_form_errors(application: Application) -> list[ValidationErrorDetail]:
    """Get any errors for an application form missing

    Under normal circumstances this shouldn't be possible as we create
    all of the application forms when we start the application, but just
    in case that does happen, we'll flag it here. This would require the
    user to add at least an empty application form object for the given form.
    """

    existing_competition_form_ids = [
        app_form.competition_form_id for app_form in application.application_forms
    ]

    missing_form_errors: list[ValidationErrorDetail] = []
    for competition_form in application.competition.competition_forms:
        if competition_form.competition_form_id not in existing_competition_form_ids:
            missing_form_errors.append(
                ValidationErrorDetail(
                    message=f"Form {competition_form.form.form_name} is missing",
                    type=ValidationErrorType.MISSING_APPLICATION_FORM,
                    field="form_id",
                    value=competition_form.form_id,
                )
            )

    return missing_form_errors


def is_form_required(application_form: ApplicationForm) -> bool:
    """Get whether a form is required"""
    # This is very simple at the moment, but in the future this might
    # be calculated based on a users answers on another form.
    return application_form.competition_form.is_required


def get_application_form_errors(
    application: Application, action: ApplicationAction
) -> tuple[list[ValidationErrorDetail], dict[str, list[ValidationErrorDetail]]]:
    """Get the application form errors from required form + JSON Schema validation"""

    # This map has all the specific errors from a given form
    # rather than adding each individual one to the error list.
    form_error_map: dict[str, list[ValidationErrorDetail]] = {}

    form_errors: list[ValidationErrorDetail] = []

    # Add validation errors for any application forms that are missing
    # regardless of whether or not they are required
    # This acts as a guardrail and lets us find any other issues by
    # just iterating over the application forms below
    form_errors.extend(get_missing_app_form_errors(application))

    # For each application form, verify it passes all validation rules
    for application_form in application.application_forms:
        form_validation_errors: list[ValidationErrorDetail] = validate_application_form(
            application_form, action
        )

        is_app_form_required = is_form_required(application_form)

        # If the user has not yet started, we don't want to put
        # every error message and instead just want a "form is required error"
        # If the form is not required, then if they haven't started it
        # we effectively just want to ignore it.
        if len(application_form.application_response) == 0:
            if is_app_form_required:
                form_errors.append(
                    ValidationErrorDetail(
                        message=f"Form {application_form.form.form_name} is required",
                        type=ValidationErrorType.MISSING_REQUIRED_FORM,
                        field="form_id",
                        value=application_form.form_id,
                    )
                )
            # Don't add the form validation errors below if they haven't started yet
            continue

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


def _get_json_rule_config_for_action(action: ApplicationAction) -> JsonRuleConfig:
    config = ACTION_RULE_CONFIG_MAP.get(action, None)
    if config is None:
        raise Exception(
            f"Action {action} does not have a configured JsonRuleConfig - cannot validate."
        )

    return config


def validate_application_form(
    application_form: ApplicationForm, action: ApplicationAction
) -> list[ValidationErrorDetail]:
    """Validate an application form, and set the current application form status"""
    form_validation_errors: list[ValidationErrorDetail] = []

    context = JsonRuleContext(application_form, config=_get_json_rule_config_for_action(action))
    process_rule_schema_for_context(context)
    form_validation_errors.extend(context.validation_issues)

    # TODO pre/post-populate should update the value here

    form_validation_errors.extend(
        validate_json_schema_for_form(application_form.application_response, application_form.form)
    )

    # If there are no issues, we consider the form complete
    if len(form_validation_errors) == 0:
        application_form_status = ApplicationFormStatus.COMPLETE
    # If the form has no answers, we assume it has not been started
    elif len(application_form.application_response) == 0:
        application_form_status = ApplicationFormStatus.NOT_STARTED
    # If the form has been started, but has validation issues, assume it is in-progress
    else:
        application_form_status = ApplicationFormStatus.IN_PROGRESS

    application_form.application_form_status = application_form_status  # type: ignore[attr-defined]

    return form_validation_errors


def validate_forms(application: Application, action: ApplicationAction) -> None:
    """Validate the forms for an application."""

    form_errors, form_error_map = get_application_form_errors(application, action)

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
