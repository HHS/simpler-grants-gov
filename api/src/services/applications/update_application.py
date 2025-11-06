import logging
from typing import Any
from uuid import UUID

import src.adapters.db as db
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import Application
from src.db.models.user_models import User
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_in_progress,
)
from src.services.applications.get_application import get_application

logger = logging.getLogger(__name__)


def update_application(
    db_session: db.Session, application_id: UUID, updates: dict[str, Any], user: User
) -> Application:
    """
    Update an application with the provided updates.

    Args:
        db_session: Database session
        application_id: UUID of the application to update
        updates: Dictionary of field:value pairs to update on the application
        user: User performing the update

    Returns:
        Updated Application object

    Raises:
        Flask error with appropriate status code if validation fails
    """
    # Get application (this will check if it exists and if user has access)
    application = get_application(db_session, application_id, user)
    # Check privileges
    check_user_access(db_session, user, {Privilege.MODIFY_APPLICATION}, application, application_id)

    # Don't let a user update an existing application
    validate_application_in_progress(application, ApplicationAction.MODIFY)

    # Apply updates
    if "application_name" in updates:
        application_name = updates.get("application_name")
        application.application_name = application_name

    logger.info(
        "Updated application",
        extra={
            "application_id": application_id,
        },
    )

    return application
