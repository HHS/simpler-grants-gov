import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import CompetitionOpenToApplicant, Privilege, SubmissionIssue
from src.db.models.competition_models import Application
from src.db.models.user_models import User
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
    validate_application_in_progress,
)
from src.services.organizations_v1.get_organization import get_organization

logger = logging.getLogger(__name__)


def add_organization_to_application(
    db_session: db.Session,
    application_id: UUID,
    organization_id: UUID,
    user: User,
) -> Application:
    """Add an organization to an application."""
    # Get the application with necessary relationships loaded
    application = db_session.execute(
        select(Application)
        .where(Application.application_id == application_id)
        .options(
            selectinload(Application.competition).selectinload(
                Application.competition.property.mapper.class_.opportunity
            ),
            selectinload(Application.application_users),
            selectinload(Application.application_forms),
        )
    ).scalar_one_or_none()

    if application is None:
        logger.info("Application not found")
        raise_flask_error(404, "Application not found")

    # Check user has MODIFY_APPLICATION privilege for the application
    if not can_access(user, {Privilege.MODIFY_APPLICATION}, application):
        logger.info(
            "User does not have MODIFY_APPLICATION privilege",
            extra={
                "user_id": user.user_id,
                "application_id": application_id,
            },
        )
        raise_flask_error(403, "Forbidden")

    # Validate application is in progress
    validate_application_in_progress(application, ApplicationAction.MODIFY)

    # Validate application doesn't already have an organization
    if application.organization_id is not None:
        logger.info(
            "Application already has an organization",
            extra={
                "application_id": application_id,
                "existing_organization_id": application.organization_id,
            },
        )
        raise_flask_error(422, "Application already has an organization")

    # Get the organization
    organization = get_organization(db_session, organization_id)

    # Check user has START_APPLICATION privilege for the organization
    if not can_access(user, {Privilege.START_APPLICATION}, organization):
        logger.info(
            "User does not have START_APPLICATION privilege for organization",
            extra={
                "user_id": user.user_id,
                "organization_id": organization_id,
            },
        )
        raise_flask_error(403, "Forbidden")

    # Validate competition allows organization applications
    allowed_applicant_types = application.competition.open_to_applicants
    if CompetitionOpenToApplicant.ORGANIZATION not in allowed_applicant_types:
        logger.info(
            "Competition only accepts individual applications",
            extra={
                "application_id": application_id,
                "competition_id": application.competition.competition_id,
                "submission_issue": SubmissionIssue.COMPETITION_NO_ORG_APPLICATIONS,
            },
        )
        raise_flask_error(422, "This competition only accepts individual applications")

    # Delete all application user records
    for app_user in application.application_users:
        db_session.delete(app_user)

    logger.info(
        "Removed all application users",
        extra={
            "application_id": application_id,
            "removed_count": len(application.application_users),
        },
    )

    # Update application with organization
    application.organization_id = organization_id

    # Re-run pre-population logic on all application forms
    for application_form in application.application_forms:
        validate_application_form(application_form, ApplicationAction.START)

    logger.info(
        "Added organization to application and re-populated forms",
        extra={
            "application_id": application_id,
            "organization_id": organization_id,
            "form_count": len(application.application_forms),
        },
    )

    return application
