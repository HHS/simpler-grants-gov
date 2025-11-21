import logging
from typing import Any
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import asc, desc, func, select
from sqlalchemy.sql import Select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import LegacyProfileType, LegacyUserStatus
from src.db.models.entity_models import IgnoredLegacyOrganizationUser, OrganizationInvitation
from src.db.models.staging.user import TuserProfile, VuserAccount
from src.db.models.user_models import LinkExternalUser, OrganizationUser, User
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortOrder
from src.services.organizations_v1.list_organization_invitations import (
    get_organization_and_verify_access,
)

logger = logging.getLogger(__name__)


class LegacyUserListParams(BaseModel):
    """Pydantic model for parsing request parameters"""

    pagination: PaginationParams
    filters: dict | None = None  # Optional filters from request schema


def get_member_emails_for_organization(db_session: db.Session, organization_id: UUID) -> set[str]:
    """
    Fetch all member email addresses for an organization.

    Returns a set of lowercase email addresses for efficient lookup.
    """
    query = (
        select(func.lower(LinkExternalUser.email))
        .select_from(OrganizationUser)
        .join(User, OrganizationUser.user_id == User.user_id)
        .join(LinkExternalUser, User.user_id == LinkExternalUser.user_id)
        .where(OrganizationUser.organization_id == organization_id)
    )

    results = db_session.execute(query).scalars().all()
    return set(results)


def get_pending_invitation_emails_for_organization(
    db_session: db.Session, organization_id: UUID
) -> set[str]:
    """
    Fetch all pending invitation email addresses for an organization.

    Returns a set of lowercase email addresses for efficient lookup.
    Only includes non-expired invitations that haven't been accepted or rejected.
    """
    query = select(func.lower(OrganizationInvitation.invitee_email)).where(
        OrganizationInvitation.organization_id == organization_id,
        OrganizationInvitation.accepted_at.is_(None),
        OrganizationInvitation.rejected_at.is_(None),
        OrganizationInvitation.expires_at > func.now(),
    )

    results = db_session.execute(query).scalars().all()
    return set(results)


def compute_user_status(
    email: str, member_emails: set[str], invitation_emails: set[str]
) -> LegacyUserStatus:
    """
    Compute the status of a legacy user based on their email.

    Status precedence: member > pending_invitation > available
    """
    email_lower = email.lower() if email else ""

    if email_lower in member_emails:
        return LegacyUserStatus.MEMBER
    elif email_lower in invitation_emails:
        return LegacyUserStatus.PENDING_INVITATION
    else:
        return LegacyUserStatus.AVAILABLE


def build_deduplicated_legacy_user_query(
    db_session: db.Session, organization_id: UUID, uei: str
) -> tuple[Select[Any], dict[str, Any]]:
    """
    Build a query for deduplicated legacy users.

    Uses window function to deduplicate by email (case-insensitive),
    keeping the most recent record based on created_date.
    Excludes inactive, deleted, and ignored users.

    Returns:
        Tuple of (query, column_map) where column_map maps field names to CTE columns
    """
    # Build subquery with ignored user emails for exclusion
    ignored_emails_subquery = (
        select(func.lower(IgnoredLegacyOrganizationUser.email))
        .where(IgnoredLegacyOrganizationUser.organization_id == organization_id)
        .scalar_subquery()
    )

    # Use CTE with window function for deduplication
    deduplicated_cte = (
        select(
            VuserAccount.user_account_id,
            VuserAccount.email,
            VuserAccount.first_name,
            VuserAccount.last_name,
            VuserAccount.created_date,
            func.row_number()
            .over(
                partition_by=func.lower(VuserAccount.email),
                order_by=VuserAccount.created_date.desc().nulls_last(),
            )
            .label("row_num"),
        )
        .join(TuserProfile, VuserAccount.user_account_id == TuserProfile.user_account_id)
        .where(
            TuserProfile.profile_duns == uei,
            TuserProfile.profile_type_id == LegacyProfileType.ORGANIZATION_APPLICANT,
            VuserAccount.is_active == "Y",
            VuserAccount.is_deleted_legacy == "N",
            TuserProfile.is_deleted_legacy == "N",
            func.lower(VuserAccount.email).not_in(ignored_emails_subquery),
        )
    ).cte("deduplicated_users")

    # Select from CTE where row_num = 1 (most recent for each email)
    query = select(
        deduplicated_cte.c.user_account_id,
        deduplicated_cte.c.email,
        deduplicated_cte.c.first_name,
        deduplicated_cte.c.last_name,
        deduplicated_cte.c.created_date,
    ).where(deduplicated_cte.c.row_num == 1)

    # Map of field names to CTE columns for sorting
    column_map = {
        "email": deduplicated_cte.c.email,
        "first_name": deduplicated_cte.c.first_name,
        "last_name": deduplicated_cte.c.last_name,
        "created_date": deduplicated_cte.c.created_date,
    }

    return query, column_map


def list_legacy_users_and_verify_access(
    db_session: db.Session,
    user: User,
    organization_id: UUID,
    request_data: dict,
) -> tuple[list[dict], PaginationInfo]:
    """
    List legacy users from Oracle staging tables that can be invited to the organization.

    Hybrid approach:
    - Uses SQL window function for efficient deduplication by email
    - Fetches member/invitation data separately (small datasets)
    - Computes status in Python for maintainability
    - Uses standard Paginator for pagination

    Args:
        db_session: Database session
        user: Authenticated user making the request
        organization_id: Organization ID to list users for
        request_data: Request body containing pagination parameters and filters

    Returns:
        Tuple of (list of legacy user dicts with status, pagination info)

    Raises:
        403: User lacks MANAGE_ORG_MEMBERS privilege
        404: Organization not found
        400: Organization does not have a UEI
    """
    # Get organization and verify access
    organization = get_organization_and_verify_access(db_session, user, organization_id)

    # Get organization UEI from SAM.gov entity
    uei = organization.sam_gov_entity.uei if organization.sam_gov_entity else None
    if not uei:
        raise_flask_error(400, "Organization does not have a UEI")

    # Parse request parameters
    params = LegacyUserListParams.model_validate(request_data)
    status_filters = None
    if params.filters and params.filters.get("status") and params.filters["status"].get("one_of"):
        status_filters = set(params.filters["status"]["one_of"])

    # Fetch member and invitation emails (small datasets, queried once)
    member_emails = get_member_emails_for_organization(db_session, organization_id)
    invitation_emails = get_pending_invitation_emails_for_organization(db_session, organization_id)

    # Build deduplicated query using CTE with window function
    base_query: Select[Any]
    base_query, column_map = build_deduplicated_legacy_user_query(db_session, organization_id, uei)

    # Apply sorting
    first_sort = params.pagination.sort_order[0]
    order_by_column = column_map.get(first_sort.order_by, column_map["email"])
    if first_sort.sort_direction == "descending":
        base_query = base_query.order_by(desc(order_by_column))
    else:
        base_query = base_query.order_by(asc(order_by_column))

    # Execute query with pagination
    total_count_query = select(func.count()).select_from(base_query.subquery())
    total_records = db_session.execute(total_count_query).scalar_one()

    offset = (params.pagination.page_offset - 1) * params.pagination.page_size
    paginated_query = base_query.offset(offset).limit(params.pagination.page_size)
    users = db_session.execute(paginated_query).all()

    # Compute status for each user (Python, easy to understand)
    users_with_status = []
    for user_record in users:
        status = compute_user_status(user_record.email, member_emails, invitation_emails)

        # Apply status filter if provided
        if status_filters and status not in status_filters:
            continue

        users_with_status.append(
            {
                "email": user_record.email,
                "first_name": user_record.first_name,
                "last_name": user_record.last_name,
                "status": status,
            }
        )

    # Build pagination info
    # Note: total_records and total_pages don't account for status filtering,
    # but this is acceptable since status filtering is done in Python
    total_pages = (total_records + params.pagination.page_size - 1) // params.pagination.page_size
    pagination_info = PaginationInfo(
        page_offset=params.pagination.page_offset,
        page_size=params.pagination.page_size,
        total_pages=total_pages,
        total_records=total_records,
        sort_order=[
            SortOrder(order_by=sort_param.order_by, sort_direction=sort_param.sort_direction)
            for sort_param in params.pagination.sort_order
        ],
    )

    logger.info(
        "Listed legacy users",
        extra={
            "organization_id": organization_id,
            "total_records": total_records,
            "page_offset": params.pagination.page_offset,
            "page_size": params.pagination.page_size,
            "status_filters": status_filters,
            "results_after_status_filter": len(users_with_status),
        },
    )

    return users_with_status, pagination_info
