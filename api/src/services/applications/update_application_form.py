import logging
from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import ApplicationForm, CompetitionForm, Form
from src.db.models.user_models import User
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.get_application import get_application
from src.services.applications.application_validation import validate_application_in_progress, ApplicationAction

logger = logging.getLogger(__name__)


def update_application_form(
    db_session: db.Session,
    application_id: UUID,
    form_id: UUID,
    application_response: dict,
    user: User,
) -> tuple[ApplicationForm, list[ValidationErrorDetail]]:
    """
    Update an application form response.

    Args:
        db_session: Database session
        application_id: UUID of the application
        form_id: UUID of the form
        application_response: The form response data
        user: User attempting to update the application form

    Returns:
        Tuple of (ApplicationForm, warnings list)

    Raises:
        Flask error with 404 status if application or form doesn't exist
        Flask error with 403 status if user is not authorized to access the application
    """
    # Check if application exists
    application = get_application(db_session, application_id, user)

    # Validate the application is in progress and can be modified
    validate_application_in_progress(application, ApplicationAction.MODIFY)

    # Check if form exists and is attached to the competition
    form = db_session.execute(
        select(Form)
        .join(CompetitionForm, Form.form_id == CompetitionForm.form_id)
        .where(CompetitionForm.competition_id == application.competition_id)
        .where(Form.form_id == form_id)
    ).scalar_one_or_none()

    if not form:
        raise_flask_error(
            404,
            f"Form with ID {form_id} not found or not attached to this application's competition",
        )

    # Find existing application form or create a new one
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application_id, ApplicationForm.form_id == form_id
        )
    ).scalar_one_or_none()

    if application_form:
        # Update existing application form
        application_form.application_response = application_response
    else:
        # Create new application form
        application_form = ApplicationForm(
            application=application,
            form=form,
            application_response=application_response,
        )
        db_session.add(application_form)

    # In a future PR, validation will be added here
    warnings: list[ValidationErrorDetail] = validate_json_schema_for_form(
        application_response, form
    )

    logger.info(
        "Updated application form response",
        extra={
            "application_id": str(application_id),
            "form_id": str(form_id),
        },
    )

    return application_form, warnings
