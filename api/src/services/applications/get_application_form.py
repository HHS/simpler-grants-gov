from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import ApplicationForm
from src.db.models.user_models import User
from src.form_schema.jsonschema_validator import (
    ValidationErrorDetail,
    validate_json_schema_for_form,
)
from src.services.applications.auth_utils import check_user_application_access
from src.services.applications.get_application import get_application


def get_application_form(
    db_session: db.Session, application_id: UUID, app_form_id: UUID, user: User
) -> tuple[ApplicationForm, list[ValidationErrorDetail]]:
    """
    Get an application form by ID, checking if the user has access to it.
    """
    # Get the application
    application = get_application(db_session, application_id, user)

    # Get the application form
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application_id,
            ApplicationForm.application_form_id == app_form_id,
        )
    ).scalar_one_or_none()

    if not application_form:
        raise_flask_error(404, f"Application form with ID {app_form_id} not found")

    # Check if the user has access to the application
    check_user_application_access(application, user)

    # TODO - move this to the validation util?
    warnings: list[ValidationErrorDetail] = validate_json_schema_for_form(
        application_form.application_response, application_form.form
    )

    return application_form, warnings
