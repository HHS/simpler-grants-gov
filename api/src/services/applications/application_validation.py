import logging
from enum import StrEnum

from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import (
    ApplicationFormStatus,
    ApplicationStatus,
    CompetitionOpenToApplicant,
    SubmissionIssue,
)
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
    do_pre_population=True,
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
    do_pre_population=True,
    do_post_population=False,
    do_field_validation=True,
)

SUBMISSION_JSON_RULE_CONFIG = JsonRuleConfig(
    # During submission, we do post-population (the only place we ever do)
    # and field validation
    do_pre_population=False,
    do_post_population=True,  # Post-population enabled for submit flow
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


def get_organization_required_errors(application: Application) -> list[ValidationErrorDetail]:
    """Check if application requires an organization but doesn't have one"""
    organization_errors: list[ValidationErrorDetail] = []

    # Check if competition only allows organization applications (not individual)
    allowed_applicant_types = application.competition.open_to_applicants
    requires_organization = (
        CompetitionOpenToApplicant.ORGANIZATION in allowed_applicant_types
        and CompetitionOpenToApplicant.INDIVIDUAL not in allowed_applicant_types
    )

    # If organization is required but application doesn't have one, add error
    if requires_organization and application.organization_id is None:
        organization_errors.append(
            ValidationErrorDetail(
                message="Application requires organization in order to submit",
                type=ValidationErrorType.ORGANIZATION_REQUIRED,
                value=None,
            )
        )

    return organization_errors


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

    # Check if application requires an organization but doesn't have one
    form_errors.extend(get_organization_required_errors(application))

    # For each application form, verify it passes all validation rules
    for application_form in application.application_forms:
        validation_errors = validate_application_form(application_form, action)

        # Separate inclusion errors from other validation errors
        inclusion_errors = [
            e
            for e in validation_errors
            if e.type == ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION
        ]
        other_validation_errors = [
            e
            for e in validation_errors
            if e.type != ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION
        ]

        # Add inclusion errors directly to the main form_errors list
        form_errors.extend(inclusion_errors)

        # Handle other validation errors by wrapping them in APPLICATION_FORM_VALIDATION
        if other_validation_errors:
            form_error_map[str(application_form.application_form_id)] = other_validation_errors

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
    """Validate an application form, and set the current application form status

    Returns:
        list: All validation errors for this form
    """
    form_validation_errors: list[ValidationErrorDetail] = []

    context = JsonRuleContext(application_form, config=_get_json_rule_config_for_action(action))
    process_rule_schema_for_context(context)
    form_validation_errors.extend(context.validation_issues)

    # Apply pre/post-populated changes back to the application form
    application_form.application_response = context.json_data

    # Check if the form is required
    is_required = is_form_required(application_form)

    # Handle validation based on form requirement and is_included_in_submission flag
    should_run_json_schema_validation = True

    # If the form isn't required and we're in the submit endpoint we do two checks:
    # 1. If the form doesn't have is_included_in_submission set, add an error, skip validation
    # 2. If the form has is_included_in_submission=True, skip validation
    #
    # If this is not the submit endpoint, we'll always do validation for the form, although
    # it won't block whatever operation is occurring.
    if not is_required and action == ApplicationAction.SUBMIT:
        # For non-required forms, is_included_in_submission must be set
        if application_form.is_included_in_submission is None:
            # If form hasn't set is_included_in_submission, it's always an error regardless of content
            form_validation_errors.append(
                ValidationErrorDetail(
                    message="is_included_in_submission must be set on all non-required forms",
                    type=ValidationErrorType.MISSING_INCLUDED_IN_SUBMISSION,
                    field="is_included_in_submission",
                    value=application_form.application_form_id,
                )
            )

            should_run_json_schema_validation = False
        elif application_form.is_included_in_submission is False:
            # Don't run JSON schema validation if form is not included in submission
            should_run_json_schema_validation = False
        # If form is_required or is_included_in_submission is True, run validation (default behavior)

    # Run JSON schema validation only if required
    if should_run_json_schema_validation:
        json_validation_errors = validate_json_schema_for_form(
            application_form.application_response, application_form.form
        )
        form_validation_errors.extend(json_validation_errors)

    # If the form has no validation issues, we'll mark it as complete
    if len(form_validation_errors) == 0:
        application_form_status = ApplicationFormStatus.COMPLETE
    else:  # Any validation issues we'll mark as in-progress
        application_form_status = ApplicationFormStatus.IN_PROGRESS

    application_form.application_form_status = application_form_status  # type: ignore[attr-defined]

    return form_validation_errors


def validate_forms(application: Application, action: ApplicationAction) -> None:
    """Validate the forms for an application."""

    form_errors, form_error_map = get_application_form_errors(application, action)

    if len(form_errors) > 0:
        # Log the specific validation issues for metrics
        error_types = [error.type for error in form_errors]
        logger.info(
            "Application has form validation issues preventing submission",
            extra={
                "submission_issue": SubmissionIssue.FORM_VALIDATION_ERRORS,
                "error_types": error_types,
                "error_count": len(form_errors),
            },
        )

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
                "submission_issue": SubmissionIssue.APPLICATION_NOT_IN_PROGRESS,
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
                "submission_issue": SubmissionIssue.COMPETITION_NOT_OPEN,
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
