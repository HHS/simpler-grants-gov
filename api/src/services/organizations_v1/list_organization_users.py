from collections.abc import Sequence
from dataclasses import dataclass
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.selectable import Select

import src.adapters.db as db
from src.constants.lookup_constants import ExternalUserType, Privilege
from src.db.models.entity_models import Organization
from src.db.models.user_models import (
    LinkExternalUser,
    OrganizationUser,
    OrganizationUserRole,
    User,
    UserProfile,
)
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.pagination.sorting_util import apply_sorting
from src.services.organizations_v1.get_organization import get_organization_and_verify_access


@dataclass
class RoleDict:
    """Role information for EnrichedOrganizationUser."""

    role_id: UUID
    role_name: str
    privileges: set[Privilege]


@dataclass
class EnrichedOrganizationUser:
    """OrganizationUser enriched with computed fields for serialization.

    This dataclass provides a simple data container that Marshmallow can
    serialize automatically. All transformation logic is handled in the
    service layer when constructing instances.
    """

    user_id: UUID
    email: str | None
    roles: list[RoleDict]
    first_name: str | None
    last_name: str | None
    is_ebiz_poc: bool


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


def _enrich_org_users_with_ebiz_poc(
    org_users: Sequence[OrganizationUser], organization: Organization
) -> list[EnrichedOrganizationUser]:
    """Enrich organization users with computed fields for serialization.

    Args:
        org_users: Sequence of OrganizationUser objects from database
        organization: Organization object containing SAM.gov entity data

    Returns:
        List of EnrichedOrganizationUser dataclass instances ready for serialization
    """
    ebiz_poc_email = (
        organization.sam_gov_entity.ebiz_poc_email.lower()
        if organization.sam_gov_entity and organization.sam_gov_entity.ebiz_poc_email
        else None
    )

    return [
        EnrichedOrganizationUser(
            user_id=org_user.user.user_id,
            email=org_user.user.email,
            roles=[
                RoleDict(
                    role_id=org_user_role.role_id,
                    role_name=org_user_role.role.role_name,
                    privileges=org_user_role.role.privileges,
                )
                for org_user_role in org_user.organization_user_roles
            ],
            first_name=org_user.user.profile.first_name if org_user.user.profile else None,
            last_name=org_user.user.profile.last_name if org_user.user.profile else None,
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
    organization = get_organization_and_verify_access(
        db_session, user, organization_id, {Privilege.VIEW_ORG_MEMBERSHIP}
    )

    # Build base query with joins for sorting
    stmt = _build_organization_users_query(organization_id)

    # Apply sorting using custom column mapping
    stmt = apply_sorting(
        stmt,
        params.pagination.sort_order,
        {
            "email": LinkExternalUser.email,
            "first_name": UserProfile.first_name,
            "last_name": UserProfile.last_name,
            "created_at": OrganizationUser.created_at,
        },
    )

    # Paginate
    paginator: Paginator[OrganizationUser] = Paginator(
        OrganizationUser, stmt, db_session, page_size=params.pagination.page_size
    )

    org_users = paginator.page_at(page_offset=params.pagination.page_offset)

    # Build pagination info
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    # Enrich organization users with computed fields
    enriched_users = _enrich_org_users_with_ebiz_poc(org_users, organization)

    return enriched_users, pagination_info
