import logging
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import exists, func, select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.entity_models import IgnoredLegacyOrganizationUser, OrganizationInvitation
from src.db.models.staging.user import TuserProfile, VuserAccount
from src.db.models.user_models import LinkExternalUser, OrganizationUser, User
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.services.organizations_v1.list_organization_invitations import (
    get_organization_and_verify_access,
)

logger = logging.getLogger(__name__)


class LegacyUserListParams(BaseModel):
    """Pydantic model for parsing request parameters"""

    pagination: PaginationParams


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

    Args:
        db_session: Database session
        user: Authenticated user making the request
        organization_id: Organization ID to list users for
        request_data: Request body containing pagination parameters
        profile_type_id: Legacy profile type to filter (default: 4 = Organization Applicant)

    Returns:
        Tuple of (list of legacy user dicts, pagination info)

    Raises:
        403: User lacks MANAGE_ORG_MEMBERS privilege
        404: Organization not found
        400: Organization does not have a UEI
    """
    # 1. Get organization and verify access
    organization = get_organization_and_verify_access(db_session, user, organization_id)

    # 2. Get organization UEI from SAM.gov entity
    uei = organization.sam_gov_entity.uei if organization.sam_gov_entity else None
    if not uei:
        raise_flask_error(400, "Organization does not have a UEI")

    # 3. Parse pagination parameters
    params = LegacyUserListParams.model_validate(request_data)

    # 4. Build deduplicated query using window function
    # Use ROW_NUMBER() to rank duplicates by created_date (most recent first)
    ranked_subquery = (
        select(
            VuserAccount.user_account_id,
            VuserAccount.email,
            VuserAccount.full_name,
            VuserAccount.created_date,
            func.row_number()
            .over(
                partition_by=func.lower(VuserAccount.email),
                order_by=VuserAccount.created_date.desc().nulls_last(),
            )
            .label("rn"),
        )
        .join(TuserProfile, VuserAccount.user_account_id == TuserProfile.user_account_id)
        .where(
            TuserProfile.profile_duns == uei,
            TuserProfile.profile_type_id == profile_type_id,
            VuserAccount.is_active == "Y",
            VuserAccount.is_deleted_legacy == "N",
            TuserProfile.is_deleted_legacy == "N",
            # Exclude existing members
            ~exists(
                select(1)
                .select_from(OrganizationUser)
                .join(User, OrganizationUser.user_id == User.user_id)
                .join(LinkExternalUser, User.user_id == LinkExternalUser.user_id)
                .where(
                    OrganizationUser.organization_id == organization_id,
                    func.lower(LinkExternalUser.email) == func.lower(VuserAccount.email),
                )
            ),
            # Exclude pending invitations
            ~exists(
                select(1)
                .select_from(OrganizationInvitation)
                .where(
                    OrganizationInvitation.organization_id == organization_id,
                    func.lower(OrganizationInvitation.invitee_email)
                    == func.lower(VuserAccount.email),
                    OrganizationInvitation.accepted_at.is_(None),
                    OrganizationInvitation.rejected_at.is_(None),
                    OrganizationInvitation.expires_at > func.now(),
                )
            ),
            # Exclude ignored users
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

    # 5. Get total count of deduplicated users for pagination info
    count_query = select(func.count()).select_from(ranked_subquery).where(ranked_subquery.c.rn == 1)
    total_records = db_session.execute(count_query).scalar()

    # 6. Build final query with sorting and pagination
    # Map order_by field to column
    order_by_map = {
        "email": ranked_subquery.c.email,
        "full_name": ranked_subquery.c.full_name,
        "created_date": ranked_subquery.c.created_date,
    }
    order_column = order_by_map.get(params.pagination.order_by, ranked_subquery.c.email)

    # Apply sort direction
    if params.pagination.sort_direction == "descending":
        order_column = order_column.desc()
    else:
        order_column = order_column.asc()

    # 7. Apply pagination
    final_query = (
        select(ranked_subquery)
        .where(ranked_subquery.c.rn == 1)  # Only get the most recent for each email
        .order_by(order_column)
        .limit(params.pagination.page_size)
        .offset((params.pagination.page_offset - 1) * params.pagination.page_size)
    )

    # 8. Execute query
    results = db_session.execute(final_query).all()

    # 9. Create pagination info
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
        order_by=params.pagination.order_by,
        sort_direction=params.pagination.sort_direction,
    )

    # 10. Format results
    formatted_users = [format_legacy_user_from_row(row) for row in results]

    logger.info(
        "Listed legacy users",
        extra={
            "organization_id": organization_id,
            "total_records": total_records,
            "page_offset": params.pagination.page_offset,
            "page_size": params.pagination.page_size,
        },
    )

    return formatted_users, pagination_info


def format_legacy_user_from_row(row) -> dict:
    """Format a legacy user row from the subquery into response format."""
    return {"email": row.email, "full_name": row.full_name}
