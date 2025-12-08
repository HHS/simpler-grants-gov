import logging
import math
from collections.abc import Sequence
from typing import Any
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import func, select
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
    """Model for parsing request parameters"""

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


def filter_and_paginate_users(
    all_users: Sequence[VuserAccount],
    member_emails: set[str],
    invitation_emails: set[str],
    status_filters: set[LegacyUserStatus] | None,
    pagination_params: PaginationParams,
) -> tuple[list[dict], PaginationInfo]:
    """
    Filter users by computed status and apply pagination in Python.

    Computes status for each user, filters by status if requested, sorts, and paginates
    manually to ensure accurate pagination counts.

    Cannot use Paginator here because:
    - Status is computed in Python after fetching users from the database
    - Filtering must happen before pagination for accurate counts
    - Paginating first would give incorrect total_records

    Given the scale (typical orgs: 1-5 users, large orgs: 50-100 users, rare outliers: 500+),
    fetching all and filtering in Python performs well.

    Args:
        all_users: All legacy users for the organization
        member_emails: Set of emails for existing organization members
        invitation_emails: Set of emails with pending invitations
        status_filters: Optional set of statuses to filter by
        pagination_params: Pagination parameters (page size, offset, sorting)

    Returns:
        Tuple of (paginated results list, pagination info with accurate counts)
    """
    # Compute status for all users and apply status filtering
    users_with_status = []
    for user_account in all_users:
        if not user_account.email:
            continue

        status = compute_user_status(user_account.email, member_emails, invitation_emails)

        # Apply status filter if provided
        if status_filters and status not in status_filters:
            continue

        users_with_status.append(
            {
                "email": user_account.email,
                "first_name": user_account.first_name,
                "last_name": user_account.last_name,
                "status": status,
            }
        )

    # Sort results based on requested sort order
    if pagination_params.sort_order:
        # Apply sorts in reverse so the first sort takes priority
        for sort_param in reversed(pagination_params.sort_order):
            reverse = sort_param.sort_direction == "descending"
            # Use empty string as fallback for None values
            users_with_status.sort(key=lambda u: u[sort_param.order_by] or "", reverse=reverse)

    # Calculate pagination info based on filtered results
    total_records = len(users_with_status)
    total_pages = math.ceil(total_records / pagination_params.page_size) if total_records > 0 else 0

    # Apply pagination by slicing the list
    start_idx = (pagination_params.page_offset - 1) * pagination_params.page_size
    end_idx = start_idx + pagination_params.page_size
    page_results = users_with_status[start_idx:end_idx]

    # Build pagination info with accurate counts
    pagination_info = PaginationInfo(
        page_offset=pagination_params.page_offset,
        page_size=pagination_params.page_size,
        total_records=total_records,
        total_pages=total_pages,
        sort_order=[SortOrder(p.order_by, p.sort_direction) for p in pagination_params.sort_order],
    )

    return page_results, pagination_info


def build_deduplicated_legacy_user_ids_query(
    db_session: db.Session, organization_id: UUID, uei: str
) -> Select[Any]:
    """
    Build a scalar subquery that returns deduplicated user_account_ids.

    Uses window function to deduplicate by email (case-insensitive),
    keeping the most recent record based on created_date.
    Excludes inactive, deleted, and ignored users.

    Returns:
        Scalar subquery of user_account_ids for use in WHERE IN clause
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

    # Return scalar subquery of user_account_ids where row_num = 1
    return select(deduplicated_cte.c.user_account_id).where(deduplicated_cte.c.row_num == 1)


def list_legacy_users_and_verify_access(
    db_session: db.Session,
    user: User,
    organization_id: UUID,
    request_data: dict,
) -> tuple[list[dict], PaginationInfo]:
    """
    List legacy users from Oracle staging tables that can be invited to the organization.

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

    # Fetch member and invitation emails (these are small datasets, queried once)
    member_emails = get_member_emails_for_organization(db_session, organization_id)
    invitation_emails = get_pending_invitation_emails_for_organization(db_session, organization_id)

    # Build deduplicated user IDs as scalar subquery
    deduplicated_ids_subquery = build_deduplicated_legacy_user_ids_query(
        db_session, organization_id, uei
    )

    # Fetch all users and apply manual pagination with status filtering
    # Note: Cannot use Paginator because status is computed in Python after fetch.
    all_users = (
        db_session.execute(
            select(VuserAccount).where(VuserAccount.user_account_id.in_(deduplicated_ids_subquery))
        )
        .scalars()
        .all()
    )
    page_results, pagination_info = filter_and_paginate_users(
        all_users, member_emails, invitation_emails, status_filters, params.pagination
    )

    logger.info(
        "Listed legacy users",
        extra={
            "organization_id": organization_id,
            "total_records": pagination_info.total_records,
            "page_offset": pagination_info.page_offset,
            "page_size": pagination_info.page_size,
            "status_filters": status_filters,
            "results_on_page": len(page_results),
        },
    )

    return page_results, pagination_info
