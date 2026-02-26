import math
import uuid
from collections.abc import Sequence

from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.db.models.user_models import User
from src.pagination.pagination_models import (
    PaginationInfo,
    PaginationParams,
    SortOrder,
)
from src.services.opportunities_grantor_v1.get_agency import get_agency
from src.services.service_utils import apply_sorting


class OpportunityFilterSchema(BaseModel):
    """Optional filters for opportunity list"""

    # Placeholder for any required filters
    pass


class ListOpportunitiesParams(BaseModel):
    """Parameters for listing opportunities"""

    pagination: PaginationParams = Field(
        default_factory=lambda: PaginationParams(page_offset=1, page_size=25)
    )
    filters: OpportunityFilterSchema | None = Field(default=None)


def list_opportunities_with_filters(
    db_session: db.Session,
    agency_id: uuid.UUID,
    params: ListOpportunitiesParams,
) -> tuple[Sequence[Opportunity], PaginationInfo]:
    """
    List opportunities with filtering, sorting, pagination.

    Args:
        db_session: Database session
        agency_id: Agency ID to list opportunities for
        params: Query parameters

    Returns:
        List of Opportunity objects and pagination_info
    """
    # Build the base query with optimized eager loading
    stmt = (
        select(Opportunity)
        .options(
            selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
            selectinload(Opportunity.opportunity_assistance_listings),
            selectinload(Opportunity.all_opportunity_summaries).options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            selectinload(Opportunity.current_opportunity_summary).selectinload(
                CurrentOpportunitySummary.opportunity_summary
            ),
        )
        .where(Opportunity.agency_id == agency_id)
    )

    # Apply sorting in the database query
    stmt = apply_sorting(stmt, Opportunity, params.pagination.sort_order)

    # Get total count for pagination
    count_stmt = select(func.count()).select_from(
        select(Opportunity.opportunity_id).where(Opportunity.agency_id == agency_id).subquery()
    )
    total_records = db_session.execute(count_stmt).scalar_one()

    # Apply pagination
    offset = (params.pagination.page_offset - 1) * params.pagination.page_size
    stmt = stmt.offset(offset).limit(params.pagination.page_size)

    # Execute query to get all opportunities
    opportunities = db_session.execute(stmt).scalars().all()

    # Placeholder to apply filters if needed
    # if params.filters:
    #     opportunities = [
    #         opportunity for opportunity in opportunities
    #         if filter_condition(opportunity)
    #     ]

    # Pagination
    total_pages = math.ceil(total_records / params.pagination.page_size) if total_records > 0 else 0
    pagination_info = PaginationInfo(
        total_records=total_records,
        page_offset=params.pagination.page_offset,
        page_size=params.pagination.page_size,
        total_pages=total_pages,
        sort_order=[SortOrder(p.order_by, p.sort_direction) for p in params.pagination.sort_order],
    )

    return opportunities, pagination_info


def get_opportunity_list_for_grantors(
    db_session: db.Session,
    user: User,
    agency_id: uuid.UUID,
    json_data: dict,
) -> tuple[Sequence[Opportunity], PaginationInfo]:
    """
    Get a paginated list of opportunities for grantors

    Args:
        db_session: Database session
        user: User making the request
        agency_id: Agency ID to get opportunities for
        json_data: Request JSON data

    Returns:
        Tuple of (opportunities, pagination_info)
    """
    # Validate parameters
    params = ListOpportunitiesParams.model_validate(json_data)

    # Get agency and verify it exists
    agency = get_agency(db_session, agency_id)

    # Verify user has VIEW_PRIVILEGE for the agency
    verify_access(user, {Privilege.VIEW_OPPORTUNITY}, agency)

    # Get opportunities with filters and pagination
    opportunities, pagination_info = list_opportunities_with_filters(
        db_session=db_session,
        agency_id=agency_id,
        params=params,
    )

    return opportunities, pagination_info
