from collections.abc import Sequence
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import and_, asc, desc, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.selectable import Select

import src.adapters.db as db
from src.api.organizations_v1.organization_schemas import EnrichedOrganizationUser
from src.constants.lookup_constants import ExternalUserType
from src.db.models.entity_models import Organization
from src.db.models.user_models import (
    LinkExternalUser,
    OrganizationUser,
    OrganizationUserRole,
    User,
    UserProfile,
)
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortDirection
from src.pagination.paginator import Paginator
from src.services.organizations_v1.get_organization import get_organization_and_verify_access


class OrganizationUsersListParams(BaseModel):
    """Parameters for listing organization users with pagination."""

    pagination: PaginationParams


def _build_organization_users_query(organization_id: UUID) -> Select:
    """Build query for organization users with joins for sortable fields.

    Args:
        organization_id: UUID of the organization

    Returns:
        Select statement with joins and eager loading
    """
    stmt = (
        select(OrganizationUser)
        .join(User, OrganizationUser.user_id == User.user_id)
        .outerjoin(
            LinkExternalUser,
            and_(
                LinkExternalUser.user_id == User.user_id,
                LinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV,
            ),
        )
        .outerjoin(UserProfile, UserProfile.user_id == User.user_id)
        .options(
            # Eager load user and related data
            selectinload(OrganizationUser.user).selectinload(User.linked_login_gov_external_user),
            selectinload(OrganizationUser.user).selectinload(User.profile),
            selectinload(OrganizationUser.organization_user_roles).selectinload(
                OrganizationUserRole.role
            ),
        )
        .where(OrganizationUser.organization_id == organization_id)
    )

    return stmt


def _apply_organization_users_sorting(stmt: Select, sort_order: list) -> Select:
    """Apply sorting to organization users query with support for joined table columns.

    Args:
        stmt: The SQLAlchemy query statement
        sort_order: List of SortOrderParams describing the sorting order

    Returns:
        The modified query statement with applied sorting
    """
    # Map sort field names to actual column objects
    sort_mappings = {
        "email": LinkExternalUser.email,
        "first_name": UserProfile.first_name,
        "last_name": UserProfile.last_name,
        "created_at": OrganizationUser.created_at,
    }

    order_cols = []
    for order in sort_order:
        column = sort_mappings.get(order.order_by)
        if column is None:
            # This shouldn't happen due to schema validation, but handle gracefully
            continue

        if order.sort_direction == SortDirection.ASCENDING:
            order_cols.append(asc(column).nulls_last())
        elif order.sort_direction == SortDirection.DESCENDING:
            order_cols.append(desc(column).nulls_last())

    return stmt.order_by(*order_cols)


def _enrich_org_users_with_ebiz_poc(
    org_users: Sequence[OrganizationUser], organization: Organization
) -> list[EnrichedOrganizationUser]:
    """Enrich OrganizationUser objects with is_ebiz_poc computed field.

    Wraps each OrganizationUser in an EnrichedOrganizationUser dataclass that
    includes is_ebiz_poc=True for the user whose email matches the organization's
    SAM.gov entity ebiz_poc_email (case-insensitive).

    Args:
        org_users: List of OrganizationUser objects to enrich
        organization: Organization with sam_gov_entity eagerly loaded

    Returns:
        List of EnrichedOrganizationUser objects ready for serialization
    """
    # Get ebiz_poc_email for comparison
    ebiz_poc_email = (
        organization.sam_gov_entity.ebiz_poc_email.lower()
        if organization.sam_gov_entity and organization.sam_gov_entity.ebiz_poc_email
        else None
    )

    # Wrap each OrganizationUser with is_ebiz_poc flag
    return [
        EnrichedOrganizationUser(
            org_user=org_user,
            is_ebiz_poc=(
                ebiz_poc_email is not None
                and org_user.user.email is not None
                and org_user.user.email.lower() == ebiz_poc_email
            ),
        )
        for org_user in org_users
    ]


def get_organization_users_and_verify_access(
    db_session: db.Session, user: User, organization_id: UUID, request_data: dict
) -> tuple[list[EnrichedOrganizationUser], PaginationInfo]:
    """Get organization users with pagination and verify user has access.

    Args:
        db_session: Database session
        user: User requesting access
        organization_id: UUID of the organization
        request_data: Request data containing pagination params

    Returns:
        tuple: (list of EnrichedOrganizationUser objects, pagination info)

    Raises:
        FlaskError: 404 if organization not found, 403 if access denied
    """
    # Validate and parse request parameters
    params = OrganizationUsersListParams.model_validate(request_data)

    # Check if user has VIEW_ORG_MEMBERSHIP privilege for this organization
    organization = get_organization_and_verify_access(db_session, user, organization_id)

    # Build base query with joins for sorting
    stmt = _build_organization_users_query(organization_id)

    # Apply sorting
    stmt = _apply_organization_users_sorting(stmt, params.pagination.sort_order)

    # Paginate
    paginator: Paginator[OrganizationUser] = Paginator(
        OrganizationUser, stmt, db_session, page_size=params.pagination.page_size
    )

    org_users = paginator.page_at(page_offset=params.pagination.page_offset)

    # Build pagination info
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    # Enrich organization users with is_ebiz_poc computed field
    enriched_users = _enrich_org_users_with_ebiz_poc(org_users, organization)

    return enriched_users, pagination_info
