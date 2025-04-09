from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application, ApplicationForm
from src.form_schema.jsonschema_validator import (
    ValidationErrorDetail,
    validate_json_schema_for_form,
)


def get_application_form(
    db_session: db.Session, application_id: UUID, app_form_id: UUID
) -> tuple[ApplicationForm, list[ValidationErrorDetail]]:
    # Check if application exists
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    if not application:
        raise_flask_error(404, f"Application with ID {application_id} not found")

    # Get the application form
    application_form = db_session.execute(
        select(ApplicationForm).where(
            ApplicationForm.application_id == application_id,
            ApplicationForm.application_form_id == app_form_id,
        )
    ).scalar_one_or_none()

    if not application_form:
        raise_flask_error(404, f"Application form with ID {app_form_id} not found")

    warnings: list[ValidationErrorDetail] = validate_json_schema_for_form(
        application_form.application_response, application_form.form
    )

    return application_form, warnings
