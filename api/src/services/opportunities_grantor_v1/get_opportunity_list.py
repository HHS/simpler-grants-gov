import math
import uuid
from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import select
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
from src.pagination.pagination_models import PaginationInfo, SortOrder, SortOrderParams
from src.services.opportunities_grantor_v1.get_agency import get_agency


class OpportunityFilterSchema(BaseModel):
    """Optional filters for opportunity list"""

    # Placeholder for any required filters
    pass


class OpportunityPaginationParams(BaseModel):
    """Pagination parameters for opportunity list"""

    sort_order: list[SortOrderParams] = Field(
        default_factory=lambda: [
            SortOrderParams(order_by="opportunity_id", sort_direction="ascending")
        ]
    )
    page_size: int = Field(default=25)
    page_offset: int = Field(default=1)


class ListOpportunitiesParams(BaseModel):
    """Parameters for listing opportunities"""

    pagination: OpportunityPaginationParams = Field(default_factory=OpportunityPaginationParams)
    filters: OpportunityFilterSchema | None = Field(default=None)


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
) -> tuple[Sequence[Any], PaginationInfo]:
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

    # Execute query to get all opportunities
    opportunities = db_session.execute(stmt).scalars().all()

    # TODO : Remove if not needed.
    # Apply filters if needed
    # if params.filters:
    #     opportunities = [
    #         opportunity for opportunity in opportunities
    #         if filter_condition(opportunity)
    #     ]

    # Apply sort using Python
    opportunities = apply_sorting_python(opportunities, params.pagination.sort_order)

    # Pagination
    paginated_opportunities, pagination_info = paginate_python(
        opportunities,
        params.pagination.page_offset,
        params.pagination.page_size,
        params.pagination.sort_order,
    )

    return paginated_opportunities, pagination_info


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
