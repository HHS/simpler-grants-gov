from datetime import date
from typing import TypedDict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import LinkOrganizationInvitationToRole, OrganizationInvitation
from src.db.models.user_models import User


class InvitationOrganizationData(TypedDict):
    organization_id: UUID
    organization_name: str


class InvitationInviterData(TypedDict):
    user_id: UUID
    first_name: str | None
    last_name: str | None
    email: str | None


class InvitationRoleData(TypedDict):
    role_id: UUID
    role_name: str
    privileges: list[Privilege]


class InvitationItemData(TypedDict):
    organization_invitation_id: UUID
    organization: InvitationOrganizationData
    status: str
    created_at: date
    expires_at: date
    inviter: InvitationInviterData
    roles: list[InvitationRoleData]


def _fetch_user_invitations(
    db_session: db.Session, user_email: str
) -> list[OrganizationInvitation]:
    """Fetch all pending invitations for a user by their email with related data eagerly loaded."""
    stmt = (
        select(OrganizationInvitation)
        .options(
            # Load organization data
            selectinload(OrganizationInvitation.organization),
            # Load inviter user data with profile
            selectinload(OrganizationInvitation.inviter_user).selectinload(User.profile),
            # Load roles through the link table
            selectinload(OrganizationInvitation.linked_roles).selectinload(
                LinkOrganizationInvitationToRole.role
            ),
        )
        .where(OrganizationInvitation.invitee_email == user_email)
    )

    invitations = db_session.execute(stmt).scalars().all()
    return list(invitations)


def get_user_invitations(db_session: db.Session, user_id: UUID) -> list[InvitationItemData]:
    """Get all invitations for a user by matching their login.gov email.

    Args:
        db_session: Database session
        user_id: UUID of the user to get invitations for

    Returns:
        list[InvitationItemData]: List of invitation data with organization, inviter, and role information
    """
    # First get the user to access their email
    user = db_session.get(User, user_id)
    if not user or not user.email:
        return []

    # Fetch invitations by email
    invitations = _fetch_user_invitations(db_session, user.email)

    # Transform to API response format
    invitation_data: list[InvitationItemData] = []
    for invitation in invitations:
        # Get organization name - for now we'll use the organization_id as name
        # since Organization model doesn't have a name field in the current schema
        organization_data: InvitationOrganizationData = {
            "organization_id": str(invitation.organization.organization_id),
            "organization_name": f"Organization {invitation.organization.organization_id}",
        }

        # Get inviter information
        inviter_data: InvitationInviterData = {
            "user_id": str(invitation.invitee_user_id),
            "first_name": (
                invitation.inviter_user.profile.first_name
                if invitation.inviter_user.profile
                else None
            ),
            "last_name": (
                invitation.inviter_user.profile.last_name
                if invitation.inviter_user.profile
                else None
            ),
            "email": invitation.inviter_user.email,
        }

        # Get roles information
        roles_data: list[InvitationRoleData] = [
            {
                "role_id": str(role.role_id),
                "role_name": role.role_name,
                "privileges": [priv.value for priv in role.privileges],
            }
            for role in invitation.roles
        ]

        invitation_item: InvitationItemData = {
            "organization_invitation_id": str(invitation.organization_invitation_id),
            "organization": organization_data,
            "status": invitation.status.value,
            "created_at": invitation.created_at,
            "expires_at": invitation.expires_at,
            "inviter": inviter_data,
            "roles": roles_data,
        }

        invitation_data.append(invitation_item)

    return invitation_data
