import logging
from typing import Any
from uuid import UUID

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.competition_models import Application
from src.db.models.user_models import User
from src.services.applications.get_application import get_application
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


def update_application(
    db_session: db.Session, application_id: UUID, updates: dict[str, Any], user: User
) -> tuple[Application, list[ValidationErrorDetail]]:
    """
    Update an application with the provided updates.

    Args:
        db_session: Database session
        application_id: UUID of the application to update
        updates: Dictionary of field:value pairs to update on the application
        user: User performing the update

    Returns:
        Tuple containing:
            - Updated Application object
            - List of validation warnings (if any)

    Raises:
        Flask error with appropriate status code if validation fails
    """
    # Get application (this will check if it exists and if user has access)
    application = get_application(db_session, application_id, user)

    # List to collect warnings (non-blocking validation issues)
    warnings: list[ValidationErrorDetail] = []

    # Validate and apply updates
    if "application_name" in updates:
        application_name = updates.get("application_name")
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
        application.application_name = application_name

    logger.info(
        "Updated application",
        extra={
            "application_id": application_id,
        },
    )

    return application, warnings
