import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import (
    LinkOrganizationInvitationToRole,
    Organization,
    OrganizationInvitation,
)
from src.db.models.user_models import User


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
    check_user_access(
        db_session, user, {Privilege.MANAGE_ORG_MEMBERS}, organization, organization_id
    )

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
            selectinload(OrganizationInvitation.inviter_user).options(
                selectinload(User.profile),
                selectinload(User.linked_login_gov_external_user),
            ),
            selectinload(OrganizationInvitation.invitee_user).options(
                selectinload(User.profile),
                selectinload(User.linked_login_gov_external_user),
            ),
            # Use selectinload for roles to avoid cartesian products with the many-to-many relationship
            selectinload(OrganizationInvitation.linked_roles).selectinload(
                LinkOrganizationInvitationToRole.role
            ),
            # Load organization and its sam_gov_entity for user invitations
            selectinload(OrganizationInvitation.organization).selectinload(
                Organization.sam_gov_entity
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
) -> Sequence[OrganizationInvitation]:
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
    return invitations
