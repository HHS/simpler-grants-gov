import logging
from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application
from src.db.models.user_models import User
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


def update_application(
    db_session: db.Session, application_id: UUID, application_name: str, user: User
) -> Application:
    """
    Update an application.

    Args:
        db_session: Database session
        application_id: UUID of the application to update
        application_name: New name for the application
        user: User performing the update

    Returns:
        Updated Application object

    Raises:
        Flask error with appropriate status code if validation fails
    """
    # Check if application exists
    application = db_session.execute(
        select(Application).where(Application.application_id == application_id)
    ).scalar_one_or_none()

    if not application:
        raise_flask_error(404, f"Application with ID {application_id} not found")

    # Check if the user has access to the application
    user_has_access = any(
        app_user.user_id == user.user_id for app_user in application.application_users
    )

    if not user_has_access:
        logger.info(
            "User attempted to access an application they are not associated with",
            extra={
                "user_id": user.user_id,
                "application_id": application.application_id,
            },
        )
        raise_flask_error(
            403,
            "Unauthorized",
            validation_issues=[
                ValidationErrorDetail(
                    type="unauthorized_application_access",
                    message="Unauthorized",
                    field="application_id",
                )
            ],
        )

    # Validate application_name is not None or empty
    if not application_name or application_name.strip() == "":
        raise_flask_error(
            422,
            "Application name cannot be empty",
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.REQUIRED,
                    message="Application name is required",
                    field="application_name",
                )
            ],
        )

    # Update the application_name
    application.application_name = application_name

    return application
