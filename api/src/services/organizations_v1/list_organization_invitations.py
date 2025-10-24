import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import OrganizationInvitationStatus, Privilege
from src.db.models.entity_models import (
    LinkOrganizationInvitationToRole,
    Organization,
    OrganizationInvitation,
)
from src.db.models.user_models import User


@dataclass
class StatusFilter:
    """Type-safe data class for status filter"""

    one_of: List[OrganizationInvitationStatus]


@dataclass
class InvitationFilters:
    """Type-safe data class for invitation filters"""

    status: Optional[StatusFilter] = None


@dataclass
class OrganizationInvitationListRequest:
    """Type-safe data class for organization invitation list request"""

    filters: Optional[InvitationFilters] = None


@dataclass
class InviterData:
    """Data class for inviter user information"""

    user_id: uuid.UUID
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]


@dataclass
class InviteeData:
    """Data class for invitee user information"""

    user_id: Optional[uuid.UUID]
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]


@dataclass
class RoleData:
    """Data class for role information"""

    role_id: uuid.UUID
    role_name: str
    privileges: List[str]


@dataclass
class OrganizationInvitationData:
    """Data class for organization invitation response"""

    organization_invitation_id: uuid.UUID
    invitee_email: str
    status: str
    created_at: Any  # datetime
    expires_at: Any  # datetime
    accepted_at: Optional[Any]  # datetime
    rejected_at: Optional[Any]  # datetime
    inviter: InviterData
    invitee: Optional[InviteeData]
    roles: List[RoleData]


def parse_request_data(data: Dict[str, Any]) -> OrganizationInvitationListRequest:
    """Parse dictionary data into typed request object"""
    filters_data = data.get("filters")
    filters = None

    if filters_data:
        status_data = filters_data.get("status")
        status_filter = None

        if status_data and "one_of" in status_data:
            # Convert string status values to enum values
            status_values = [
                OrganizationInvitationStatus(status) for status in status_data["one_of"]
            ]
            status_filter = StatusFilter(one_of=status_values)

        filters = InvitationFilters(status=status_filter)

    return OrganizationInvitationListRequest(filters=filters)


def transform_invitation_to_data(invitation: OrganizationInvitation) -> OrganizationInvitationData:
    """Transform OrganizationInvitation model to OrganizationInvitationData"""

    # Transform inviter data
    inviter_data = InviterData(
        user_id=invitation.inviter_user.user_id,
        email=invitation.inviter_user.email,
        first_name=(
            invitation.inviter_user.profile.first_name if invitation.inviter_user.profile else None
        ),
        last_name=(
            invitation.inviter_user.profile.last_name if invitation.inviter_user.profile else None
        ),
    )

    # Transform invitee data (may be None)
    invitee_data = None
    if invitation.invitee_user:
        invitee_data = InviteeData(
            user_id=invitation.invitee_user.user_id,
            email=invitation.invitee_user.email,
            first_name=(
                invitation.invitee_user.profile.first_name
                if invitation.invitee_user.profile
                else None
            ),
            last_name=(
                invitation.invitee_user.profile.last_name
                if invitation.invitee_user.profile
                else None
            ),
        )

    # Transform roles data
    roles_data = [
        RoleData(
            role_id=role.role_id,
            role_name=role.role_name,
            privileges=[str(privilege) for privilege in role.privileges],
        )
        for role in invitation.roles
    ]

    return OrganizationInvitationData(
        organization_invitation_id=invitation.organization_invitation_id,
        invitee_email=invitation.invitee_email,
        status=str(invitation.status),
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
        accepted_at=invitation.accepted_at,
        rejected_at=invitation.rejected_at,
        inviter=inviter_data,
        invitee=invitee_data,
        roles=roles_data,
    )


def get_organization_and_verify_view_membership_access(
    db_session: db.Session, user: User, organization_id: uuid.UUID
) -> Organization:
    """Get organization by ID and verify user has VIEW_ORG_MEMBERSHIP access."""
    # First get the organization
    stmt = select(Organization).where(Organization.organization_id == organization_id)
    organization = db_session.execute(stmt).scalar_one_or_none()

    if organization is None:
        raise_flask_error(404, message=f"Could not find Organization with ID {organization_id}")

    # Check if user has required privilege for this organization
    if not can_access(user, {Privilege.VIEW_ORG_MEMBERSHIP}, organization):
        raise_flask_error(403, "Forbidden")

    return organization


def list_organization_invitations_with_filters(
    db_session: db.Session,
    organization_id: uuid.UUID,
    filters: Optional[InvitationFilters] = None,
) -> Sequence[OrganizationInvitation]:
    """
    List organization invitations with filtering.

    Args:
        db_session: Database session
        organization_id: Organization ID to list invitations for
        filters: Typed filters to apply

    Returns:
        List of OrganizationInvitation objects
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
    filtered_invitations = all_invitations
    if filters and filters.status and filters.status.one_of:
        status_filters = filters.status.one_of
        filtered_invitations = [
            invitation for invitation in all_invitations if invitation.status in status_filters
        ]

    return filtered_invitations


def list_organization_invitations_and_verify_access(
    db_session: db.Session,
    user: User,
    organization_id: uuid.UUID,
    request_data: Dict[str, Any],
) -> List[OrganizationInvitationData]:
    """
    List organization invitations with access control and filtering.

    Args:
        request_data: Raw request data dictionary from the route layer
    """

    # First verify the user has access to view organization membership
    get_organization_and_verify_view_membership_access(db_session, user, organization_id)

    # Parse the request data into typed objects for type safety
    typed_request = parse_request_data(request_data)

    # Get the raw invitations with filters
    invitations = list_organization_invitations_with_filters(
        db_session=db_session,
        organization_id=organization_id,
        filters=typed_request.filters,
    )

    # Transform to data classes for proper serialization
    return [transform_invitation_to_data(invitation) for invitation in invitations]
