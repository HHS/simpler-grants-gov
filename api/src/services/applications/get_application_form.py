from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import Application, ApplicationForm
from src.db.models.user_models import User
from src.form_schema.jsonschema_validator import ValidationErrorDetail
from src.services.applications.application_validation import (
    ApplicationAction,
    is_form_required,
    validate_application_form,
)
from src.services.applications.get_application import get_application
from tests.src.services.xml_generation.test_header_generator import application


def get_application_form(
    db_session: db.Session, application_id: UUID, app_form_id: UUID, user: User | None = None
) -> tuple[ApplicationForm, list[ValidationErrorDetail]]:
    """
    Get an application form by ID, optionally checking if the user has access to it.

    If user is None (for internal JWT tokens), access checks are bypassed.
    """
    # Determine if this is an internal user request (user is None)
    is_internal_user = user is None

    # Ensure the application exists and user has access (if not internal)
    application = get_application(db_session, application_id, user, is_internal_user)
    # Check privileges
    if user and not can_access(user, {Privilege.VIEW_APPLICATION}, application):
        raise_flask_error(403, "Forbidden")

    # Get the application form with eagerly loaded application and its attachments
    application_form = db_session.execute(
        select(ApplicationForm)
        .options(
            selectinload(ApplicationForm.application).selectinload(
                Application.application_attachments
            )
        )
        .where(
            ApplicationForm.application_id == application_id,
            ApplicationForm.application_form_id == app_form_id,
        )
    ).scalar_one_or_none()

    if not application_form:
        raise_flask_error(404, f"Application form with ID {app_form_id} not found")

    # Get a list of validation warnings (also sets form status)
    warnings = validate_application_form(application_form, ApplicationAction.GET)

    # Set the is_required field on the application form object
    application_form.is_required = is_form_required(application_form)  # type: ignore[attr-defined]

    return application_form, warnings
