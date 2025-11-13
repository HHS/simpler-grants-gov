import logging
import uuid
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import (
    ApplicationAuditEvent,
    ApplicationStatus,
    CompetitionOpenToApplicant,
    Privilege,
    SubmissionIssue,
)
from src.constants.static_role_values import APPLICATION_OWNER
from src.db.models.competition_models import Application, ApplicationForm, Competition
from src.db.models.entity_models import Organization
from src.db.models.user_models import ApplicationUser, ApplicationUserRole, User
from src.services.applications.application_audit import add_audit_event
from src.services.applications.application_logging import add_application_metadata_to_logs
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
    validate_competition_open,
)

logger = logging.getLogger(__name__)


def _assign_application_owner_role(
    db_session: db.Session, user: User, application: Application
) -> None:
    """Assign the Application Owner role to an application user."""
    application_user = ApplicationUser(
        application=application,
        user=user,
    )
    db_session.add(application_user)
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
    # Add an audit event for the user being added as part of app creation
    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.USER_ADDED,
        target_user=user,
    )


def _validate_applicant_type(competition: Competition, organization_id: UUID | None) -> None:
    """
    Validate that the applicant type (individual or organization) is allowed for this competition.

    Note: Individuals are allowed to start applications even for org-only competitions,
    as they can add an organization later.
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
    add_audit_event(
        db_session=db_session,
        application=application,
        user=user,
        audit_event=ApplicationAuditEvent.APPLICATION_CREATED,
    )

    # Assign the Application Owner role to the user if application is not owned by organization
    if not organization_id:
        _assign_application_owner_role(db_session, user, application)

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
