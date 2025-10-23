from datetime import date
from typing import TypedDict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import LinkOrganizationInvitationToRole, OrganizationInvitation
from src.db.models.user_models import LinkExternalUser, User


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


def _fetch_user_invitations_by_user_id(
    db_session: db.Session, user_id: UUID
) -> list[OrganizationInvitation]:
    """Fetch all invitations for a user by joining with their external user email."""
    stmt = (
        select(OrganizationInvitation)
        .join(LinkExternalUser, OrganizationInvitation.invitee_email == LinkExternalUser.email)
        .options(
            # Load organization data
            selectinload(OrganizationInvitation.organization),
            # Load inviter user data with profile
            selectinload(OrganizationInvitation.inviter_user).selectinload(User.profile),
            # Load inviter user's external user data (for email)
            selectinload(OrganizationInvitation.inviter_user).selectinload(
                User.linked_login_gov_external_user
            ),
            # Load roles through the link table
            selectinload(OrganizationInvitation.linked_roles).selectinload(
                LinkOrganizationInvitationToRole.role
            ),
        )
        .where(LinkExternalUser.user_id == user_id)
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
    # Fetch invitations by joining with user's external email - single query!
    invitations = _fetch_user_invitations_by_user_id(db_session, user_id)

    # Early exit: if no invitations found
    if not invitations:
        return []

    # Transform to API response format
    invitation_data: list[InvitationItemData] = []
    for invitation in invitations:
        # Get organization name - for now we'll use the organization_id as name
        # since Organization model doesn't have a name field in the current schema
        organization_data: InvitationOrganizationData = {
            "organization_id": str(invitation.organization.organization_id),
            "organization_name": f"Organization {invitation.organization.organization_id}",
        }

        # Get inviter information - now using eagerly loaded data (no additional query!)
        inviter_data: InvitationInviterData = {
            "user_id": str(invitation.inviter_user.user_id),
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
            "email": (
                invitation.inviter_user.linked_login_gov_external_user.email
                if invitation.inviter_user.linked_login_gov_external_user
                else None
            ),
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
