from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application, ApplicationForm
from src.db.models.user_models import ApplicationUser, User
from src.services.applications.auth_utils import check_user_application_access


def get_application(db_session: db.Session, application_id: UUID, user: User) -> Application:
    """
    Get an application by ID, checking if the user has access to it.
    """
    result = db_session.execute(
        select(Application)
        .options(
            selectinload(Application.application_forms).selectinload(
                ApplicationForm.competition_form
            ),
            selectinload(Application.application_users)
            .selectinload(ApplicationUser.user)
            .selectinload(User.linked_login_gov_external_user),
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
