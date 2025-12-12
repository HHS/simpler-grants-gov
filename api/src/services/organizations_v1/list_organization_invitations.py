import math
import uuid
from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel, Field
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
from src.pagination.pagination_models import PaginationInfo, SortOrder, SortOrderParams
from src.search.search_models import StrSearchFilter


class OrganizationInvitationFilters(BaseModel):
    status: StrSearchFilter | None = None


class OrganizationInvitationPaginationParams(BaseModel):
    sort_order: list[SortOrderParams] = Field(
        default_factory=lambda: [
            SortOrderParams(order_by="invitee_email", sort_direction="ascending")
        ]
    )
    page_size: int = 25
    page_offset: int = 1


class ListOrganizationsParams(BaseModel):
    pagination: OrganizationInvitationPaginationParams = Field(
        default_factory=OrganizationInvitationPaginationParams
    )
    filters: OrganizationInvitationFilters | None = Field(default=None)


def apply_sorting_python(items: Sequence[Any], sort_order: list[SortOrderParams]) -> Sequence[Any]:
    """
    Generic multi-field sorting for Python objects.

    Args:
        items: A sequence of Python objects
        sort_order: A list of sort rules where each rule contains:
            - order_by: attribute name (supports dotted paths like "user.email")
            - sort_direction: "ascending" | "descending"

    Returns:
        A new, sorted list of items.
    """

    # Apply sorts in reverse order
    for rule in reversed(sort_order):
        attr_path = rule.order_by
        reverse = rule.sort_direction == "descending"

        def get_value(obj: Any, path: str = attr_path) -> Any:
            """Traverse dotted attributes safely (e.g., 'user.profile.email')."""
            value = obj
            for part in path.split("."):
                value = getattr(value, part, None)
                if value is None:
                    break
            return value

        # Sort with safe handling for None (None always goes last)
        items = sorted(
            items,
            key=lambda i: (get_value(i) is None, get_value(i)),
            reverse=reverse,
        )

    return items


def paginate_python(
    items: Sequence[Any], page_offset: int, page_size: int, sort_order: list[SortOrderParams]
) -> tuple[Sequence[OrganizationInvitation], PaginationInfo]:
    """
    Paginate a list of Python objects.

    Args:
        items: A list of Python objects
        page_offset: The offset of the current page
        page_size: The size of the current page
        sort_order: Sorting rules applied

    Returns:
        Paginated list of items
        PaginationInfo Object
    """
    total_records = len(items)
    total_pages = math.ceil(total_records / page_size) if total_records > 0 else 0
    start = (page_offset - 1) * page_size
    end = start + page_size
    page_items = items[start:end]

    return page_items, PaginationInfo(
        total_records=total_records,
        page_offset=page_offset,
        page_size=page_size,
        total_pages=total_pages,
        sort_order=[SortOrder(p.order_by, p.sort_direction) for p in sort_order],
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
    check_user_access(
        db_session,
        user,
        {Privilege.MANAGE_ORG_MEMBERS},
        organization,
    )

    return organization


def list_organization_invitations_with_filters(
    db_session: db.Session,
    organization_id: uuid.UUID,
    params: ListOrganizationsParams,
) -> tuple[Sequence[OrganizationInvitation], PaginationInfo]:
    """
    List organization invitations with filtering, sorting, pagination.

    Args:
        db_session: Database session
        organization_id: Organization ID to list invitations for
        params: Query parameters

    Returns:
        List of OrganizationInvitation objects and pagination_info

    Note:
        Status filtering is done in Python since status is a computed property
        Pagination and sorting also applied in Python
        Filtering on database fields can be applied in SQL
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

    # Execute query to get all invitations
    invitations = db_session.execute(stmt).scalars().all()

    # Apply status filters if provided (already converted to enums by Marshmallow)
    if params.filters and params.filters.status and params.filters.status.one_of:
        invitations = [
            invitation
            for invitation in invitations
            if invitation.status in params.filters.status.one_of
        ]
    # Apply sort using Python
    invitations = apply_sorting_python(invitations, params.pagination.sort_order)

    # Pagination
    paginated_invitations, pagination_info = paginate_python(
        invitations,
        params.pagination.page_offset,
        params.pagination.page_size,
        params.pagination.sort_order,
    )

    return paginated_invitations, pagination_info


def list_organization_invitations_and_verify_access(
    db_session: db.Session,
    user: User,
    organization_id: uuid.UUID,
    json_data: dict,
) -> tuple[Sequence[OrganizationInvitation], PaginationInfo]:
    """
    List organization invitations with access control and filtering.

    Args:
        db_session: Database session
        user: User requesting the invitations
        organization_id: Organization ID to list invitations for
        json_data: Raw request payload containing pagination, sorting, and filters.
    """
    # Validate parameters
    params = ListOrganizationsParams.model_validate(json_data)

    # First verify the user has access to manage organization members
    get_organization_and_verify_access(db_session, user, organization_id)

    # Get the raw invitations with filters and pagination
    invitations, pagination_info = list_organization_invitations_with_filters(
        db_session=db_session,
        organization_id=organization_id,
        params=params,
    )

    # Transform to data classes for proper serialization
    return invitations, pagination_info
