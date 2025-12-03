from typing import Any, Sequence
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import and_, asc, desc, select
from sqlalchemy.sql.selectable import Select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
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
            # Keep selectinload for eager loading data
            selectinload(OrganizationUser.user).selectinload(User.linked_login_gov_external_user),
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


def get_organization_users_and_verify_access(
    db_session: db.Session, user: User, organization_id: UUID, request_data: dict
) -> tuple[list[dict[str, Any]], PaginationInfo]:
    """Get organization users with pagination and verify user has access.

    Args:
        db_session: Database session
        user: User requesting access
        organization_id: UUID of the organization
        request_data: Request data containing pagination params

    Returns:
        tuple: (list of user dicts, pagination info)

    Raises:
        FlaskError: 404 if organization not found, 403 if access denied
    """
    # Validate and parse request parameters
    params = OrganizationUsersListParams.model_validate(request_data)

    # Check if user has VIEW_ORG_MEMBERSHIP privilege for this organization
    organization = get_organization_and_verify_access(db_session, user, organization_id)

    # Build base query with joins for sorting
    stmt = _build_organization_users_query(organization_id)

    # Apply sorting with NULLS LAST handling
    stmt = _apply_organization_users_sorting(stmt, params.pagination.sort_order)

    # Paginate
    paginator = Paginator(
        OrganizationUser, stmt, db_session, page_size=params.pagination.page_size
    )

    org_users = paginator.page_at(page_offset=params.pagination.page_offset)

    # Build pagination info
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    # Transform to response format
    users_data = get_organization_users(db_session, organization, org_users)

    return users_data, pagination_info


def get_organization_users(
    db_session: db.Session, organization: Organization, org_users: Sequence[OrganizationUser]
) -> list[dict[str, Any]]:
    """Transform organization users to response format.

    Args:
        db_session: Database session
        organization: Organization object with sam_gov_entity eagerly loaded
        org_users: Already-fetched OrganizationUser objects

    Returns:
        list[dict]: List of user data with roles and privileges
    """
    # Get ebiz_poc_email once for comparison
    ebiz_poc_email = (
        organization.sam_gov_entity.ebiz_poc_email.lower()
        if organization.sam_gov_entity and organization.sam_gov_entity.ebiz_poc_email
        else None
    )

    return [
        {
            "user_id": org_user.user.user_id,
            "email": org_user.user.email,
            "roles": [
                {
                    "role_id": org_user_role.role.role_id,
                    "role_name": org_user_role.role.role_name,
                    "privileges": [priv.value for priv in org_user_role.role.privileges],
                }
                for org_user_role in org_user.organization_user_roles
            ],
            "first_name": org_user.user.profile.first_name if org_user.user.profile else None,
            "last_name": org_user.user.profile.last_name if org_user.user.profile else None,
            "is_ebiz_poc": (
                ebiz_poc_email is not None
                and org_user.user.email is not None
                and org_user.user.email.lower() == ebiz_poc_email
            ),
        }
        for org_user in org_users
    ]
