import logging
from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import ApplicationForm, CompetitionForm
from src.db.models.user_models import User
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
    validate_application_in_progress,
)
from src.services.applications.get_application import get_application

logger = logging.getLogger(__name__)


def update_application_form(
    db_session: db.Session,
    application_id: UUID,
    form_id: UUID,
    user: User,
    application_response: dict | None = None,
    is_included_in_submission: bool | None = None,
) -> tuple[ApplicationForm, list[ValidationErrorDetail]]:
    """
    Update an application form response and/or inclusion status.

    Args:
        db_session: Database session
        application_id: UUID of the application
        form_id: UUID of the form
        user: User attempting to update the application form
        application_response: The form response data (optional for inclusion-only updates)
        is_included_in_submission: Whether this form should be included in submission

    Returns:
        Tuple of (ApplicationForm, warnings list)

    Raises:
        Flask error with 404 status if application or form doesn't exist
        Flask error with 403 status if user is not authorized to access the application
        Flask error with 400 status if neither application_response nor is_included_in_submission provided
    """
    # Validate that at least one update is being made
    if application_response is None and is_included_in_submission is None:
        raise_flask_error(
            400,
            "Either application_response or is_included_in_submission must be provided",
        )

    # Check if application exists
    application = get_application(db_session, application_id, user)

    # Validate the application is in progress and can be modified
    validate_application_in_progress(application, ApplicationAction.MODIFY)

    # Check if form exists and is attached to the competition
    competition_form = db_session.execute(
        select(CompetitionForm).where(
            CompetitionForm.competition_id == application.competition_id,
            CompetitionForm.form_id == form_id,
        )
    ).scalar_one_or_none()

    if not competition_form:
        raise_flask_error(
            404,
            f"Form with ID {form_id} not found or not attached to this application's competition",
        )

    # Find existing application form or create a new one
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application_id,
            ApplicationForm.competition_form_id == competition_form.competition_form_id,
        )
    ).scalar_one_or_none()

    if application_form:
        # Update existing application form
        if application_response is not None:
            application_form.application_response = application_response
        if is_included_in_submission is not None:
            application_form.is_included_in_submission = is_included_in_submission
    else:
        # Create new application form (requires application_response)
        if application_response is None:
            raise_flask_error(
                404,
                f"Application form not found for application {application_id} and form {form_id}",
            )

        application_form = ApplicationForm(
            application=application,
            competition_form=competition_form,
            application_response=application_response,
            is_included_in_submission=is_included_in_submission,
        )
        db_session.add(application_form)

    # Get a list of validation warnings (also sets form status)
    # Always validate because inclusion status affects validation requirements
    warnings: list[ValidationErrorDetail] = validate_application_form(
        application_form, ApplicationAction.MODIFY
    )

    operation_type = []
    if application_response is not None:
        operation_type.append("form response")
    if is_included_in_submission is not None:
        operation_type.append("inclusion status")

    logger.info(
        f"Updated application {' and '.join(operation_type)}",
        extra={
            "application_id": str(application_id),
            "form_id": str(form_id),
        },
    )

    return application_form, warnings
