import logging
from datetime import timedelta
from uuid import UUID, uuid4

from sqlalchemy import desc, select

from src.adapters import db
from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import OrganizationInvitationStatus, Privilege
from src.db.models.entity_models import (
    LinkOrganizationInvitationToRole,
    Organization,
    OrganizationInvitation,
)
from src.db.models.user_models import LinkExternalUser, OrganizationUser, User
from src.services.organizations_v1.get_organization import get_organization
from src.services.organizations_v1.invitation_email import build_invitation_email
from src.services.organizations_v1.update_user_organization_roles import validate_roles
from src.task.notifications.config import get_email_config
from src.util import datetime_util

logger = logging.getLogger(__name__)

# Invitation expires after 7 days
INVITATION_EXPIRY_DAYS = 7


def _send_invitation_email(
    invitation: OrganizationInvitation,
    organization: Organization,
    invitee_email: str,
) -> None:
    """Send invitation email to the invitee.

    This function handles all email sending logic including configuration,
    error handling, and logging. Email failures do not raise exceptions.

    Args:
        invitation: The created invitation record
        organization: The organization the user is being invited to
        inviter: The user who created the invitation
        invitee_email: Email address of the invitee
    """
    config = get_email_config()
    subject, content = build_invitation_email(invitation, organization)

    # Generate a trace ID for correlating logs with Pinpoint email delivery
    trace_id = str(uuid4())

    logger.info(
        "Sending invitation email",
        extra={
            "invitation_id": invitation.organization_invitation_id,
            "pinpoint_trace_id": trace_id,
        },
    )

    try:
        send_pinpoint_email_raw(
            to_address=invitee_email,
            subject=subject,
            message=content,
            app_id=config.app_id,
            trace_id=trace_id,
        )
        logger.info(
            "Invitation email sent successfully",
            extra={"invitation_id": invitation.organization_invitation_id},
        )
    except Exception:
        logger.exception(
            "Failed to send invitation email",
            extra={"invitation_id": invitation.organization_invitation_id},
        )
        # Don't raise - email failure should not block invitation creation


def check_duplicate_invitation(
    db_session: db.Session, organization_id: UUID, invitee_email: str
) -> None:
    """Check for existing active invitations for the same email and organization.

    Raises 422 error if an active invitation already exists.
    Active invitations are those with status 'pending' or 'accepted'.
    """
    stmt = (
        select(OrganizationInvitation)
        .where(OrganizationInvitation.organization_id == organization_id)
        .where(OrganizationInvitation.invitee_email == invitee_email)
        .order_by(desc(OrganizationInvitation.created_at))  # latest first
        .limit(1)
    )

    existing_invitation = db_session.execute(stmt).scalar_one_or_none()
    if existing_invitation:
        if existing_invitation.status in (
            OrganizationInvitationStatus.PENDING,
            OrganizationInvitationStatus.ACCEPTED,
        ):
            raise_flask_error(
                422, message=f"An active invitation already exists for {invitee_email}"
            )


def check_user_already_member(
    db_session: db.Session, organization_id: UUID, invitee_email: str
) -> None:
    """Check if the invitee is already a member of the organization.

    Raises 422 error if user is already a member.
    """
    # Find user by email through their linked login.gov external user

    stmt = (
        select(OrganizationUser)
        .join(User, OrganizationUser.user_id == User.user_id)
        .join(LinkExternalUser, User.user_id == LinkExternalUser.user_id)
        .where(OrganizationUser.organization_id == organization_id)
        .where(LinkExternalUser.email == invitee_email)
    )

    existing_member = db_session.execute(stmt).scalar_one_or_none()

    if existing_member:
        raise_flask_error(
            422, message=f"User {invitee_email} is already a member of this organization"
        )


def create_organization_invitation(
    db_session: db.Session, user: User, organization_id: UUID, data: dict
) -> OrganizationInvitation:
    """Create an organization invitation with the specified roles.

    Args:
        db_session: Database session
        user: User creating the invitation (must have MANAGE_ORG_MEMBERS privilege)
        organization_id: UUID of the organization
        data: Request data containing invitee_email and role_ids

    Returns:
        OrganizationInvitation: The created invitation

    Raises:
        FlaskError: Various HTTP errors for validation failures
    """
    logger.info("Creating organization invitation")
    invitee_email = data["invitee_email"].lower().strip()
    role_ids = set(data["role_ids"])

    # Get organization and verify user has access
    organization = get_organization(db_session, organization_id)

    # Check if user has permission to manage org members
    check_user_access(
        db_session,
        user,
        {Privilege.MANAGE_ORG_MEMBERS},
        organization,
    )

    # Validate roles exist and are organization roles - get roles back from validation
    roles = validate_roles(db_session, role_ids)

    # Check for duplicate active invitations
    check_duplicate_invitation(db_session, organization_id, invitee_email)

    # Check if user is already a member
    check_user_already_member(db_session, organization_id, invitee_email)

    # Calculate expiration date
    expires_at = datetime_util.utcnow() + timedelta(days=INVITATION_EXPIRY_DAYS)

    # Create invitation record with explicit ID and created_at for response
    invitation = OrganizationInvitation(
        organization_invitation_id=uuid4(),
        organization_id=organization_id,
        inviter_user_id=user.user_id,
        invitee_email=invitee_email,
        expires_at=expires_at,
        created_at=datetime_util.utcnow(),
        invitee_user_id=None,  # Will be set when invitation is accepted/rejected
        linked_roles=[
            LinkOrganizationInvitationToRole(role_id=role_id, role=role)
            for role_id, role in zip(role_ids, roles, strict=False)
        ],
    )

    db_session.add(invitation)

    # Send invitation email (failures won't block invitation creation)
    _send_invitation_email(invitation, organization, invitee_email)

    logger.info("Successfully created organization invitation")
    return invitation
