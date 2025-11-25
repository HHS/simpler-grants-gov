import logging
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
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.services.service_utils import apply_sorting
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

    # Build deduplicated user IDs as scalar subquery
    deduplicated_ids_subquery = build_deduplicated_legacy_user_ids_query(
        db_session, organization_id, uei
    )

    # Build main query selecting full VuserAccount model
    stmt = select(VuserAccount).where(VuserAccount.user_account_id.in_(deduplicated_ids_subquery))

    # Apply sorting using standard helper
    stmt = apply_sorting(stmt, VuserAccount, params.pagination.sort_order)

    # Use Paginator for automatic pagination and counting
    paginator: Paginator[VuserAccount] = Paginator(
        VuserAccount, stmt, db_session, page_size=params.pagination.page_size
    )

    paginated_users = paginator.page_at(page_offset=params.pagination.page_offset)

    # Compute status for each user (Python, easy to understand)
    users_with_status = []
    for user_account in paginated_users:
        # Skip users without email (shouldn't happen but be defensive)
        if not user_account.email:
            continue

        status = compute_user_status(user_account.email, member_emails, invitation_emails)

        # Apply status filter if provided
        if status_filters and status not in status_filters:
            continue

        users_with_status.append({
            "email": user_account.email,
            "first_name": user_account.first_name,
            "last_name": user_account.last_name,
            "status": status,
        })

    # Build pagination info using Paginator's attributes
    # Note: total_records and total_pages don't account for status filtering,
    # but this is acceptable since status filtering is done in Python
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    logger.info(
        "Listed legacy users",
        extra={
            "organization_id": organization_id,
            "total_records": paginator.total_records,
            "page_offset": params.pagination.page_offset,
            "page_size": params.pagination.page_size,
            "status_filters": status_filters,
            "results_after_status_filter": len(users_with_status),
        },
    )

    return users_with_status, pagination_info
