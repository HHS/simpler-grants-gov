from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import lazyload, selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application, Competition
from src.db.models.user_models import ApplicationUser, User
from src.services.applications.auth_utils import check_user_application_access


def get_application(db_session: db.Session, application_id: UUID, user: User) -> Application:
    """
    Get an application by ID, checking if the user has access to it.
    """
    result = db_session.execute(
        select(Application)
        .options(
            selectinload("*"),
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
