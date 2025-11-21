import logging
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import asc, case, desc, exists, func, literal, select
from sqlalchemy.engine import Row

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import LegacyUserStatus
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


def list_legacy_users_and_verify_access(
    db_session: db.Session,
    user: User,
    organization_id: UUID,
    request_data: dict,
    profile_type_id: int = 4,
) -> tuple[list[dict], PaginationInfo]:
    """
    List legacy users from Oracle staging tables that can be invited to the organization.

    Uses SQL window function for efficient deduplication by email.
    Computes status based on membership and invitation state.

    Args:
        db_session: Database session
        user: Authenticated user making the request
        organization_id: Organization ID to list users for
        request_data: Request body containing pagination parameters and filters
        profile_type_id: Legacy profile type to filter (default: 4 = Organization Applicant)

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

    # Parse pagination parameters and filters
    params = LegacyUserListParams.model_validate(request_data)

    # Build subqueries to check membership and invitation status

    # Subquery to check if user is a member
    is_member_subquery = (
        exists(
            select(1)
            .select_from(OrganizationUser)
            .join(User, OrganizationUser.user_id == User.user_id)
            .join(LinkExternalUser, User.user_id == LinkExternalUser.user_id)
            .where(
                OrganizationUser.organization_id == organization_id,
                func.lower(LinkExternalUser.email) == func.lower(VuserAccount.email),
            )
        )
    ).label("is_member")

    # Subquery to check if user has pending invitation
    has_pending_invitation_subquery = (
        exists(
            select(1)
            .select_from(OrganizationInvitation)
            .where(
                OrganizationInvitation.organization_id == organization_id,
                func.lower(OrganizationInvitation.invitee_email) == func.lower(VuserAccount.email),
                OrganizationInvitation.accepted_at.is_(None),
                OrganizationInvitation.rejected_at.is_(None),
                OrganizationInvitation.expires_at > func.now(),
            )
        )
    ).label("has_pending_invitation")

    # Build deduplicated query with status computation using window function
    # Use ROW_NUMBER() to rank duplicates by created_date (most recent first)
    ranked_subquery = (
        select(
            VuserAccount.user_account_id,
            VuserAccount.email,
            VuserAccount.full_name,
            VuserAccount.created_date,
            # Compute status with precedence: member > pending_invitation > available
            case(
                (is_member_subquery, literal(LegacyUserStatus.MEMBER)),
                (has_pending_invitation_subquery, literal(LegacyUserStatus.PENDING_INVITATION)),
                else_=literal(LegacyUserStatus.AVAILABLE),
            ).label("status"),
            func.row_number()
            .over(
                partition_by=func.lower(VuserAccount.email),
                order_by=VuserAccount.created_date.desc().nulls_last(),
            )
            .label("duplicate_rank"),
        )
        .join(TuserProfile, VuserAccount.user_account_id == TuserProfile.user_account_id)
        .where(
            TuserProfile.profile_duns == uei,
            TuserProfile.profile_type_id == profile_type_id,
            VuserAccount.is_active == "Y",
            VuserAccount.is_deleted_legacy == "N",
            TuserProfile.is_deleted_legacy == "N",
            # Still exclude ignored users - they should never be returned
            ~exists(
                select(1)
                .select_from(IgnoredLegacyOrganizationUser)
                .where(
                    IgnoredLegacyOrganizationUser.organization_id == organization_id,
                    func.lower(IgnoredLegacyOrganizationUser.email)
                    == func.lower(VuserAccount.email),
                )
            ),
        )
    ).subquery()

    # Get total count of deduplicated users for pagination info (before status filtering)
    count_query = (
        select(func.count())
        .select_from(ranked_subquery)
        .where(ranked_subquery.c.duplicate_rank == 1)
    )

    # Apply status filter to count query if provided
    status_filters = None
    if params.filters and params.filters.get("status") and params.filters["status"].get("one_of"):
        status_filters = params.filters["status"]["one_of"]
        if status_filters:
            count_query = count_query.where(ranked_subquery.c.status.in_(status_filters))

    total_records = db_session.execute(count_query).scalar_one()

    # Build final query with sorting and pagination
    # Map order_by field to column
    order_by_map = {
        "email": ranked_subquery.c.email,
        "full_name": ranked_subquery.c.full_name,
        "created_date": ranked_subquery.c.created_date,
    }

    # Apply sorting from the first sort_order (schema ensures at least one exists via default)
    first_sort = params.pagination.sort_order[0]
    base_order_column = order_by_map.get(first_sort.order_by, ranked_subquery.c.email)

    # Build and execute final query
    final_query = select(ranked_subquery).where(
        ranked_subquery.c.duplicate_rank == 1
    )  # Only get the most recent for each email

    # Apply status filter if provided
    if status_filters:
        final_query = final_query.where(ranked_subquery.c.status.in_(status_filters))

    # Apply sorting and pagination
    if first_sort.sort_direction == "descending":
        final_query = final_query.order_by(desc(base_order_column))
    else:
        final_query = final_query.order_by(asc(base_order_column))

    final_query = final_query.limit(params.pagination.page_size).offset(
        (params.pagination.page_offset - 1) * params.pagination.page_size
    )

    # Execute query
    results = db_session.execute(final_query).all()

    # Create pagination info
    total_pages = (
        (total_records + params.pagination.page_size - 1) // params.pagination.page_size
        if total_records > 0
        else 0
    )
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

    # Format results
    formatted_users = [format_legacy_user_from_row(row) for row in results]

    logger.info(
        "Listed legacy users",
        extra={
            "organization_id": organization_id,
            "total_records": total_records,
            "page_offset": params.pagination.page_offset,
            "page_size": params.pagination.page_size,
            "status_filters": status_filters,
        },
    )

    return formatted_users, pagination_info


def format_legacy_user_from_row(row: Row) -> dict:
    """Format a legacy user row from the subquery into response format."""
    return {"email": row.email, "full_name": row.full_name, "status": row.status}
