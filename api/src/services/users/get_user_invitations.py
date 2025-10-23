from dataclasses import dataclass
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.entity_models import (
    LinkOrganizationInvitationToRole,
    Organization,
    OrganizationInvitation,
)
from src.db.models.user_models import LinkExternalUser, User


@dataclass
class InvitationOrganizationData:
    organization_id: UUID
    organization_name: str | None


@dataclass
class InvitationInviterData:
    user_id: UUID
    first_name: str | None
    last_name: str | None
    email: str | None


@dataclass
class InvitationRoleData:
    role_id: UUID
    role_name: str
    privileges: list[str]


@dataclass
class InvitationItemData:
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
            # Load organization data with sam_entity for legal_business_name
            selectinload(OrganizationInvitation.organization).selectinload(
                Organization.sam_gov_entity
            ),
            # Load inviter user data with profile
            selectinload(OrganizationInvitation.inviter_user).selectinload(User.profile),
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
        invitation_item = InvitationItemData(
            organization_invitation_id=invitation.organization_invitation_id,
            status=invitation.status.value,
            created_at=invitation.created_at,
            expires_at=invitation.expires_at,
            organization=InvitationOrganizationData(
                organization_id=invitation.organization.organization_id,
                organization_name=(
                    invitation.organization.sam_gov_entity.legal_business_name
                    if invitation.organization.sam_gov_entity
                    else None
                ),
            ),
            inviter=InvitationInviterData(
                user_id=invitation.inviter_user.user_id,
                first_name=invitation.inviter_user.first_name,
                last_name=invitation.inviter_user.last_name,
                email=invitation.inviter_user.email,
            ),
            roles=[
                InvitationRoleData(
                    role_id=role.role_id,
                    role_name=role.role_name,
                    privileges=list(role.privileges),
                )
                for role in invitation.roles
            ],
        )

        invitation_data.append(invitation_item)

    return invitation_data
