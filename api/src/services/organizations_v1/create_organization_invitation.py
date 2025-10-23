import logging
from datetime import timedelta
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import OrganizationInvitationStatus, Privilege
from src.db.models.entity_models import LinkOrganizationInvitationToRole, OrganizationInvitation
from src.db.models.user_models import LinkExternalUser, OrganizationUser, Role, User
from src.services.organizations_v1.get_organization import get_organization
from src.services.organizations_v1.update_user_organization_roles import validate_roles
from src.util import datetime_util

logger = logging.getLogger(__name__)

# Invitation expires after 7 days
INVITATION_EXPIRY_DAYS = 7


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
        .where(OrganizationInvitation.invitee_email == invitee_email.lower())
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
        .where(LinkExternalUser.email.lower() == invitee_email.lower())
    )

    existing_member = db_session.execute(stmt).scalar_one_or_none()

    if existing_member:
        raise_flask_error(
            422, message=f"User {invitee_email} is already a member of this organization"
        )


def create_organization_invitation(
    db_session: db.Session, user: User, organization_id: UUID, data: dict
) -> dict[str, Any]:
    """Create an organization invitation with the specified roles.

    Args:
        db_session: Database session
        user: User creating the invitation (must have MANAGE_ORG_MEMBERS privilege)
        organization_id: UUID of the organization
        data: Request data containing invitee_email and role_ids

    Returns:
        dict: Formatted invitation data for response

    Raises:
        FlaskError: Various HTTP errors for validation failures
    """
    logger.info("Creating organization invitation")

    invitee_email = data["invitee_email"].lower().strip()
    role_ids = set(data["role_ids"])

    # Get organization and verify user has access
    organization = get_organization(db_session, organization_id)

    # Check if user has permission to manage org members
    if not can_access(user, {Privilege.MANAGE_ORG_MEMBERS}, organization):
        raise_flask_error(403, "Forbidden")

    # Validate roles exist and are organization roles
    validate_roles(db_session, role_ids)

    # Check for duplicate active invitations
    check_duplicate_invitation(db_session, organization_id, invitee_email)

    # Check if user is already a member
    check_user_already_member(db_session, organization_id, invitee_email)

    # Calculate expiration date
    expires_at = datetime_util.utcnow() + timedelta(days=INVITATION_EXPIRY_DAYS)

    # Query the roles to get their details for the response
    roles_stmt = select(Role).where(Role.role_id.in_(role_ids))
    roles = db_session.execute(roles_stmt).scalars().all()

    # Create invitation record with explicit ID and created_at for response
    invitation = OrganizationInvitation(
        organization_invitation_id=uuid4(),
        organization_id=organization_id,
        inviter_user_id=user.user_id,
        invitee_email=invitee_email,
        expires_at=expires_at,
        created_at=datetime_util.utcnow(),
        invitee_user_id=None,  # Will be set when invitation is accepted/rejected
        linked_roles=[LinkOrganizationInvitationToRole(role_id=role_id) for role_id in role_ids],
    )

    db_session.add(invitation)

    # Format response data
    invitation_data = {
        "organization_invitation_id": invitation.organization_invitation_id,
        "organization_id": invitation.organization_id,
        "invitee_email": invitation.invitee_email,
        "status": invitation.status.value,
        "expires_at": invitation.expires_at,
        "roles": [
            {
                "role_id": role.role_id,
                "role_name": role.role_name,
            }
            for role in roles
        ],
        "created_at": invitation.created_at,
    }

    logger.info("Successfully created organization invitation")
    return invitation_data
