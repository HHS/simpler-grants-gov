from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import (
    Application,
    ApplicationForm,
    Competition,
    CompetitionForm,
    Form,
)
from src.db.models.entity_models import Organization
from src.db.models.user_models import ApplicationUser, User
from src.services.applications.application_logging import add_application_metadata_to_logs
from src.services.applications.application_validation import (
    ApplicationAction,
    get_application_form_errors,
    is_form_required,
)
from src.services.applications.auth_utils import check_user_application_access


def get_application(
    db_session: db.Session,
    application_id: UUID,
    user: User | None = None,
    is_internal_user: bool = False,
) -> Application:
    """
    Get an application by ID, checking if the user has access to it.
    """
    result = db_session.execute(
        select(Application)
        .options(
            # Load organization and its sam_gov_entity
            selectinload(Application.organization).selectinload(Organization.sam_gov_entity),
            selectinload(Application.organization).selectinload(Organization.organization_users),
            # Load Application forms through to the form instructions
            selectinload(Application.application_forms)
            .selectinload(ApplicationForm.competition_form)
            .selectinload(CompetitionForm.form)
            .selectinload(Form.form_instruction),
            # Load application forms app (which is the app we're fetching) to make sure it's connected
            selectinload(Application.application_forms).selectinload(ApplicationForm.application),
            # Load attachments
            selectinload(Application.application_attachments),
            # Load application users
            selectinload(Application.application_users)
            .selectinload(ApplicationUser.user)
            .selectinload(User.linked_login_gov_external_user),
            # Load competition and its forms, instructions, assistance listing, and who can apply
            selectinload(Application.competition)
            .selectinload(Competition.competition_forms)
            .selectinload(CompetitionForm.form)
            .selectinload(Form.form_instruction),
            selectinload(Application.competition).selectinload(
                Competition.competition_instructions
            ),
            selectinload(Application.competition).selectinload(
                Competition.opportunity_assistance_listing
            ),
            selectinload(Application.competition).selectinload(
                Competition.link_competition_open_to_applicant
            ),
            # Load opportunity for agency_code access
            selectinload(Application.competition).selectinload(Competition.opportunity),
        )
        .where(Application.application_id == application_id)
    )

    # Get the single application
    application = result.scalar_one_or_none()

    if not application:
        raise_flask_error(404, f"Application with ID {application_id} not found")

    # To make sure the UI displays forms in a consistent order, sort the application_forms list
    # NOTE: Trying to put this in an order_by in the relationship doesn't work as we can't sort on a joined value
    #       Haven't found a way to sort this when querying above that doesn't break the query
    application.application_forms.sort(key=lambda app_form: app_form.form.form_name)

    # Check if the user has access to the application (skip for internal users or when user is None)
    if not is_internal_user and user is not None:
        check_user_application_access(application, user)

    # Add application metadata to logs
    add_application_metadata_to_logs(application)

    return application


def get_application_with_warnings(
    db_session: db.Session,
    application_id: UUID,
    user: User | None = None,
    is_internal_user: bool = False,
) -> tuple[Application, list[ValidationErrorDetail]]:
    """
    Fetch an application along with validation warnings
    """
    # Fetch an application, handles the auth checks as well
    application = get_application(db_session, application_id, user, is_internal_user)
    # Check privileges
    if not can_access(user, {Privilege.VIEW_APPLICATION}, application):
        raise_flask_error(403, "Forbidden")

    # See what validation issues remain on the application's forms
    form_warnings, form_warning_map = get_application_form_errors(
        application, ApplicationAction.GET
    )

    # Attach the form warning map to the application so it appears
    # in the response object
    application.form_validation_warnings = form_warning_map  # type: ignore[attr-defined]

    # Set the is_required field on all application forms
    for application_form in application.application_forms:
        application_form.is_required = is_form_required(application_form)  # type: ignore[attr-defined]

    return application, form_warnings
