from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import lazyload, selectinload

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application, ApplicationForm, Competition
from src.db.models.entity_models import Organization
from src.db.models.user_models import ApplicationUser, User
from src.services.applications.application_validation import (
    get_application_form_errors,
    is_form_required,
)
from src.services.applications.auth_utils import check_user_application_access


def get_application(db_session: db.Session, application_id: UUID, user: User) -> Application:
    """
    Get an application by ID, checking if the user has access to it.
    """
    result = db_session.execute(
        select(Application)
        .options(
            selectinload("*"),
            # Explicitly load organization and its sam_gov_entity
            selectinload(Application.organization).selectinload(Organization.sam_gov_entity),
            # Explicitly load application relationships for application forms to prevent DetachedInstanceError
            selectinload(Application.application_forms).selectinload(ApplicationForm.application),
            # Explicitly don't load these
            lazyload(Application.competition, Competition.opportunity),
            lazyload(Application.competition, Competition.applications),
            lazyload(Application.application_users, ApplicationUser.user, User.saved_opportunities),
            lazyload(Application.application_users, ApplicationUser.user, User.saved_searches),
        )
        .where(Application.application_id == application_id)
    )

    # Get the single application
    application = result.scalar_one_or_none()

    if not application:
        raise_flask_error(404, f"Application with ID {application_id} not found")

    # Check if the user has access to the application
    check_user_application_access(application, user)

    return application


def get_application_with_warnings(
    db_session: db.Session, application_id: UUID, user: User
) -> tuple[Application, list[ValidationErrorDetail]]:
    """
    Fetch an application along with validation warnings
    """
    # Fetch an application, handles the auth checks as well
    application = get_application(db_session, application_id, user)

    # See what validation issues remain on the application's forms
    form_warnings, form_warning_map = get_application_form_errors(application)

    # Attach the form warning map to the application so it appears
    # in the response object
    application.form_validation_warnings = form_warning_map  # type: ignore[attr-defined]

    # Set the is_required field on all application forms
    for application_form in application.application_forms:
        application_form.is_required = is_form_required(application_form)  # type: ignore[attr-defined]

    return application, form_warnings
