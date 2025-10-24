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
from src.services.organizations_v1.organization_invitation_response_utils import (
    OrganizationInvitationData,
    transform_invitation_to_response,
)


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


def list_user_invitations(
    db_session: db.Session, user_id: UUID
) -> list[OrganizationInvitationData]:
    """Get all invitations for a user by matching their login.gov email.

    Args:
        db_session: Database session
        user_id: UUID of the user to get invitations for

    Returns:
        list[OrganizationInvitationData]: List of invitation data with organization, inviter, and role information
    """
    # Fetch invitations by joining with user's external email
    invitations = _fetch_user_invitations_by_user_id(db_session, user_id)

    # Early exit: if no invitations found
    if not invitations:
        return []

    # Transform to API response format
    return [transform_invitation_to_response(invitation) for invitation in invitations]
