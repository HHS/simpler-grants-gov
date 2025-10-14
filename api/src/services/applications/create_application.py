import logging
import uuid
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import (
    ApplicationStatus,
    CompetitionOpenToApplicant,
    Privilege,
    SubmissionIssue,
)
from src.constants.static_role_values import APPLICATION_OWNER
from src.db.models.competition_models import Application, ApplicationForm, Competition
from src.db.models.entity_models import Organization
from src.db.models.user_models import ApplicationUser, ApplicationUserRole, User
from src.services.applications.application_logging import add_application_metadata_to_logs
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
    validate_competition_open,
)
from src.util.datetime_util import get_now_us_eastern_date

logger = logging.getLogger(__name__)


def _assign_application_owner_role(
    db_session: db.Session, application_user: ApplicationUser
) -> None:
    """Assign the Application Owner role to an application user."""

    app_user_role = ApplicationUserRole(
        application_user=application_user, role_id=APPLICATION_OWNER.role_id
    )
    db_session.add(app_user_role)
    logger.info(
        "Assigned Application Owner role to application user",
        extra={
            "application_id": application_user.application_id,
            "user_id": application_user.user_id,
        },
    )


def _validate_organization_expiration(organization: Organization) -> None:
    """
    Validate that the organization's SAM.gov entity record is not expired.

    Args:
        organization: Organization to validate

    Raises:
        Flask error with 422 status if organization is expired or has no SAM.gov entity record
    """
    # Check if organization has no sam.gov entity record
    if not organization.sam_gov_entity:
        logger.info(
            "Organization has no SAM.gov entity record",
            extra={"submission_issue": SubmissionIssue.ORG_NO_SAM_GOV_ENTITY},
        )
        raise_flask_error(
            422,
            "This organization has no SAM.gov entity record and cannot be used for applications",
        )

    sam_gov_entity = organization.sam_gov_entity
    current_date = get_now_us_eastern_date()

    # Check if organization is marked as inactive
    if sam_gov_entity.is_inactive is True:
        logger.info(
            "Organization is inactive in SAM.gov",
            extra={"submission_issue": SubmissionIssue.ORG_INACTIVE_IN_SAM_GOV},
        )
        raise_flask_error(
            422,
            "This organization is inactive in SAM.gov and cannot be used for applications",
        )

    # Check if organization's registration has expired
    if sam_gov_entity.expiration_date < current_date:
        logger.info(
            "Organization SAM.gov registration has expired",
            extra={"submission_issue": SubmissionIssue.ORG_SAM_GOV_EXPIRED},
        )
        raise_flask_error(
            422,
            f"This organization's SAM.gov registration expired on {sam_gov_entity.expiration_date.strftime('%B %d, %Y')} and cannot be used for applications",
        )


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
            logger.info(
                "Competition does not allow organization applications",
                extra={"submission_issue": SubmissionIssue.COMPETITION_NO_ORG_APPLICATIONS},
            )
            raise_flask_error(
                422,
                "This competition does not allow organization applications",
            )
    else:
        # Check if individual applications are allowed
        if CompetitionOpenToApplicant.INDIVIDUAL not in allowed_applicant_types:
            logger.info(
                "Competition does not allow individual applications",
                extra={"submission_issue": SubmissionIssue.COMPETITION_NO_INDIVIDUAL_APPLICATIONS},
            )
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
        .options(selectinload(Competition.competition_forms), selectinload(Competition.opportunity))
    ).scalar_one_or_none()

    if not competition:
        logger.info(
            "Competition not found",
            extra={"submission_issue": SubmissionIssue.COMPETITION_NOT_FOUND},
        )
        raise_flask_error(404, "Competition not found")

    # Validate organization if provided
    if organization_id is not None:
        # Fetch the organization with its sam_gov_entity relationship
        organization = db_session.execute(
            select(Organization)
            .where(Organization.organization_id == organization_id)
            .options(
                selectinload(Organization.organization_users),
                selectinload(Organization.sam_gov_entity),
            )
        ).scalar_one_or_none()

        if not organization:
            logger.info(
                "Organization not found",
                extra={"submission_issue": SubmissionIssue.ORGANIZATION_NOT_FOUND},
            )
            raise_flask_error(404, "Organization not found")

        # Check privileges
        if not can_access(user, {Privilege.START_APPLICATION}, organization):
            raise_flask_error(403, "Forbidden")

        # Validate organization status
        _validate_organization_expiration(organization)

    # Verify the competition is open
    validate_competition_open(competition, ApplicationAction.START)

    # Validate applicant type is allowed for this competition
    _validate_applicant_type(competition, organization_id)

    # Get default application name if not provided
    if application_name is None:
        application_name = competition.opportunity.opportunity_number

    # Create a new application
    application = Application(
        application_id=uuid.uuid4(),
        competition=competition,
        application_name=application_name,
        application_status=ApplicationStatus.IN_PROGRESS,
        organization_id=organization_id,  # Set the organization ID if provided
    )
    db_session.add(application)

    application_user = ApplicationUser(
        application=application, user=user, is_application_owner=True
    )
    db_session.add(application_user)

    # Assign the Application Owner role to the user
    _assign_application_owner_role(db_session, application_user)

    # Initialize the competition forms for the application
    for competition_form in competition.competition_forms:
        application_form = ApplicationForm(
            application=application, competition_form=competition_form, application_response={}
        )

        db_session.add(application_form)

        # Validate the application form to trigger pre-population
        validate_application_form(application_form, ApplicationAction.START)

    logger.info(
        "Created new application",
        extra={
            "application_id": application.application_id,
            "competition_id": competition_id,
            "organization_id": organization_id,
        },
    )

    # Add application metadata to logs
    add_application_metadata_to_logs(application)

    return application
