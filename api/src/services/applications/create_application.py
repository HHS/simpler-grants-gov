import logging
import uuid
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import ApplicationStatus, CompetitionOpenToApplicant
from src.db.models.competition_models import Application, ApplicationForm, Competition
from src.db.models.entity_models import Organization
from src.db.models.user_models import ApplicationUser, OrganizationUser, User
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_competition_open,
)

logger = logging.getLogger(__name__)


def _validate_organization_membership(
    db_session: db.Session, organization_id: UUID, user: User
) -> Organization:
    # Fetch the organization
    organization = db_session.execute(
        select(Organization)
        .where(Organization.organization_id == organization_id)
        .options(selectinload(Organization.organization_users))
    ).scalar_one_or_none()

    if not organization:
        raise_flask_error(404, "Organization not found")

    # Check if the user is a member of the organization
    is_member = db_session.execute(
        select(OrganizationUser)
        .where(OrganizationUser.organization_id == organization_id)
        .where(OrganizationUser.user_id == user.user_id)
    ).scalar_one_or_none()

    if not is_member:
        raise_flask_error(403, "User is not a member of the organization")

    return organization


def _validate_applicant_type(competition: Competition, organization_id: UUID | None) -> None:
    """
    Validate that the applicant type (individual or organization) is allowed for this competition.
    """
    # Determine if applying as an organization or individual
    is_applying_as_organization = organization_id is not None

    # Get the allowed applicant types for this competition
    allowed_applicant_types = competition.open_to_applicants

    if is_applying_as_organization:
        # Check if organization applications are allowed
        if CompetitionOpenToApplicant.ORGANIZATION not in allowed_applicant_types:
            raise_flask_error(
                422,
                "This competition does not allow organization applications",
            )
    else:
        # Check if individual applications are allowed
        if CompetitionOpenToApplicant.INDIVIDUAL not in allowed_applicant_types:
            raise_flask_error(
                422,
                "This competition does not allow individual applications",
            )


def create_application(
    db_session: db.Session,
    competition_id: UUID,
    user: User,
    application_name: str | None = None,
    organization_id: UUID | None = None,
) -> Application:
    """
    Create a new application for a competition.
    """
    # Check if competition exists
    competition = db_session.execute(
        select(Competition)
        .where(Competition.competition_id == competition_id)
        .options(selectinload(Competition.competition_forms))
    ).scalar_one_or_none()

    if not competition:
        raise_flask_error(404, "Competition not found")

    # Verify the competition is open
    validate_competition_open(competition, ApplicationAction.START)

    # Validate applicant type is allowed for this competition
    _validate_applicant_type(competition, organization_id)

    # Validate organization if provided
    if organization_id is not None:
        _validate_organization_membership(db_session, organization_id, user)

    # Get default application name if not provided
    if application_name is None:
        application_name = competition.opportunity.opportunity_number

    # Create a new application
    application = Application(
        application_id=uuid.uuid4(),
        competition_id=competition_id,
        application_name=application_name,
        application_status=ApplicationStatus.IN_PROGRESS,
        organization_id=organization_id,  # Set the organization ID if provided
    )
    db_session.add(application)

    application_user = ApplicationUser(
        application=application, user=user, is_application_owner=True
    )
    db_session.add(application_user)

    # Initialize the competition forms for the application
    for competition_form in competition.competition_forms:
        application_form = ApplicationForm(
            application=application, competition_form=competition_form, application_response={}
        )

        db_session.add(application_form)

    logger.info(
        "Created new application",
        extra={
            "application_id": application.application_id,
            "competition_id": competition_id,
            "organization_id": organization_id,
        },
    )

    return application
