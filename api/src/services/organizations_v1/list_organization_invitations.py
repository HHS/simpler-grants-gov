import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import (
    LinkOrganizationInvitationToRole,
    Organization,
    OrganizationInvitation,
)
from src.db.models.user_models import User


@dataclass
class InviterData:
    """Data class for inviter user information"""

    user_id: uuid.UUID
    email: str | None
    first_name: str | None
    last_name: str | None


@dataclass
class InviteeData:
    """Data class for invitee user information"""

    user_id: uuid.UUID | None
    email: str | None
    first_name: str | None
    last_name: str | None


@dataclass
class RoleData:
    """Data class for role information"""

    role_id: uuid.UUID
    role_name: str
    privileges: list[str]


@dataclass
class OrganizationInvitationData:
    """Data class for organization invitation response"""

    organization_invitation_id: uuid.UUID
    invitee_email: str
    status: str
    created_at: datetime
    expires_at: datetime
    accepted_at: datetime | None
    rejected_at: datetime | None
    inviter: InviterData
    invitee: InviteeData | None
    roles: list[RoleData]


def transform_invitation_to_data(invitation: OrganizationInvitation) -> OrganizationInvitationData:
    """Transform OrganizationInvitation model to OrganizationInvitationData"""

    return OrganizationInvitationData(
        organization_invitation_id=invitation.organization_invitation_id,
        invitee_email=invitation.invitee_email,
        status=invitation.status,
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
        accepted_at=invitation.accepted_at,
        rejected_at=invitation.rejected_at,
        inviter=InviterData(
            user_id=invitation.inviter_user.user_id,
            email=invitation.inviter_user.email,
            first_name=invitation.inviter_user.first_name,
            last_name=invitation.inviter_user.last_name,
        ),
        invitee=(
            InviteeData(
                user_id=invitation.invitee_user.user_id,
                email=invitation.invitee_user.email,
                first_name=invitation.invitee_user.first_name,
                last_name=invitation.invitee_user.last_name,
            )
            if invitation.invitee_user
            else None
        ),
        roles=[
            RoleData(
                role_id=role.role_id,
                role_name=role.role_name,
                privileges=[privilege for privilege in role.privileges],
            )
            for role in invitation.roles
        ],
    )


def get_organization_and_verify_access(
    db_session: db.Session, user: User, organization_id: uuid.UUID
) -> Organization:
    """Get organization by ID and verify user has MANAGE_ORG_MEMBERS access."""
    # First get the organization
    stmt = select(Organization).where(Organization.organization_id == organization_id)
    organization = db_session.execute(stmt).scalar_one_or_none()

    if organization is None:
        raise_flask_error(404, message=f"Could not find Organization with ID {organization_id}")

    # Check if user has required privilege for this organization
    if not can_access(user, {Privilege.MANAGE_ORG_MEMBERS}, organization):
        raise_flask_error(403, "Forbidden")

    return organization


def list_organization_invitations_with_filters(
    db_session: db.Session,
    organization_id: uuid.UUID,
    status_filters: list[str] | None = None,
) -> Sequence[OrganizationInvitation]:
    """
    List organization invitations with filtering.

    Args:
        db_session: Database session
        organization_id: Organization ID to list invitations for
        status_filters: Optional list of status strings to filter by

    Returns:
        List of OrganizationInvitation objects

    Note:
        Status filtering is done in Python since status is a computed property.
        If pagination is needed in the future, this will need to be refactored
        to implement status filtering in the database query.
    """
    # Build the base query with optimized eager loading using selectinload
    stmt = (
        select(OrganizationInvitation)
        .options(
            # Use selectinload for users to avoid potential cartesian products
            # and to handle the nullable invitee_user more efficiently
            selectinload(OrganizationInvitation.inviter_user).selectinload(User.profile),
            selectinload(OrganizationInvitation.invitee_user).selectinload(User.profile),
            # Use selectinload for roles to avoid cartesian products with the many-to-many relationship
            selectinload(OrganizationInvitation.linked_roles).selectinload(
                LinkOrganizationInvitationToRole.role
            ),
        )
        .where(OrganizationInvitation.organization_id == organization_id)
        .order_by(OrganizationInvitation.created_at.desc())
    )

    # Execute query to get all invitations (we'll filter in Python since status is computed)
    all_invitations = db_session.execute(stmt).scalars().all()

    # Apply status filtering if provided
    if status_filters:
        return [invitation for invitation in all_invitations if invitation.status in status_filters]

    return all_invitations


def list_organization_invitations_and_verify_access(
    db_session: db.Session,
    user: User,
    organization_id: uuid.UUID,
    filters: dict | None = None,
) -> list[OrganizationInvitationData]:
    """
    List organization invitations with access control and filtering.

    Args:
        db_session: Database session
        user: User requesting the invitations
        organization_id: Organization ID to list invitations for
        filters: Optional filters dict from request (already validated by schema)
    """

    # First verify the user has access to manage organization members
    get_organization_and_verify_access(db_session, user, organization_id)

    # Extract status filters if provided (already converted to enums by Marshmallow)
    status_filters = None
    if filters and filters.get("status") and filters["status"].get("one_of"):
        status_filters = filters["status"]["one_of"]

    # Get the raw invitations with filters
    invitations = list_organization_invitations_with_filters(
        db_session=db_session,
        organization_id=organization_id,
        status_filters=status_filters,
    )

    # Transform to data classes for proper serialization
    return [transform_invitation_to_data(invitation) for invitation in invitations]
