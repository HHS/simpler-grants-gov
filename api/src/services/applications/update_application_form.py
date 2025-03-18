import logging
from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application, ApplicationForm, CompetitionForm, Form

logger = logging.getLogger(__name__)


def update_application_form(
    db_session: db.Session, application_id: UUID, form_id: UUID, application_response: dict
) -> tuple[ApplicationForm, list[ValidationErrorDetail]]:
    """
    Update an application form response.

    Args:
        db_session: Database session
        application_id: UUID of the application
        form_id: UUID of the form
        application_response: The form response data

    Returns:
        Tuple of (ApplicationForm, warnings list)

    Raises:
        Flask error with 404 status if application or form doesn't exist
    """
    # Check if application exists
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    if not application:
        raise_flask_error(404, f"Application with ID {application_id} not found")

    # Check if form exists and is attached to the competition
    competition_form = db_session.execute(
        select(Form)
        .join(CompetitionForm, Form.form_id == CompetitionForm.form_id)
        .where(CompetitionForm.competition_id == application.competition_id)
        .where(Form.form_id == form_id)
    ).scalar_one_or_none()

    if not competition_form:
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
            application_id=application_id,
            form_id=form_id,
            application_response=application_response,
        )
        db_session.add(application_form)

    db_session.commit()

    # In a future PR, validation will be added here
    warnings: list[ValidationErrorDetail] = []

    logger.info(
        "Updated application form response",
        extra={
            "application_id": str(application_id),
            "form_id": str(form_id),
        },
    )

    return application_form, warnings
