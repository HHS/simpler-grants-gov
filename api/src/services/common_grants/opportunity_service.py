"""CommonGrants Protocol opportunity service."""

import logging
from uuid import UUID

from common_grants_sdk.schemas.pydantic import (
    OppFilters,
    OpportunitiesListResponse,
    OpportunitiesSearchResponse,
    OpportunityResponse,
    OppSortBy,
    OppSorting,
    PaginatedBodyParams,
    PaginatedResultsInfo,
    SortedResultsInfo,
)
from sqlalchemy.orm import Session, selectinload

import src.adapters.search as search
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.services.opportunities_v1.search_opportunities import search_opportunities

from .transformation import (
    build_filter_info,
    transform_opportunity_to_cg,
    transform_search_request_from_cg,
    transform_search_result_to_cg,
)

logger = logging.getLogger(__name__)


class CommonGrantsOpportunityService:
    """Service for managing opportunities in CommonGrants Protocol format."""

    def __init__(self, db_session: Session) -> None:
        """Initialize the service."""
        self.db_session = db_session

    def get_opportunity(self, opportunity_id: str) -> OpportunityResponse | None:
        """Get a specific opportunity by ID."""
        try:
            opportunity_uuid = UUID(opportunity_id)
            opportunity = (
                self.db_session.query(Opportunity)
                .filter(
                    Opportunity.opportunity_id == opportunity_uuid, Opportunity.is_draft.is_(False)
                )
                .options(
                    selectinload(Opportunity.current_opportunity_summary).selectinload(
                        CurrentOpportunitySummary.opportunity_summary
                    )
                )
                .first()
            )

            if not opportunity:
                return None

            opportunity_data = transform_opportunity_to_cg(opportunity)

            return OpportunityResponse(
                status=200,
                message="Success",
                data=opportunity_data,
            )
        except ValueError:
            return None

    def list_opportunities(
        self,
        page: int = 1,
        page_size: int = 10,
    ) -> OpportunitiesListResponse:
        """Get a paginated list of opportunities."""
        # Get total count (excluding drafts)
        total_count = (
            self.db_session.query(Opportunity).filter(Opportunity.is_draft.is_(False)).count()
        )

        # Get paginated opportunities (excluding drafts)
        opportunities = (
            self.db_session.query(Opportunity)
            .filter(Opportunity.is_draft.is_(False))
            .options(
                selectinload(Opportunity.current_opportunity_summary).selectinload(
                    CurrentOpportunitySummary.opportunity_summary
                )
            )
            .order_by(Opportunity.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        # Transform to CommonGrants format
        opportunities_data = [transform_opportunity_to_cg(opp) for opp in opportunities]

        pagination_info = PaginatedResultsInfo(
            page=page,
            page_size=page_size,
            totalItems=total_count,
            totalPages=(total_count + page_size - 1) // page_size,
        )

        return OpportunitiesListResponse(
            status=200,
            message="Opportunities fetched successfully",
            items=opportunities_data,
            pagination_info=pagination_info,
        )

    @staticmethod
    def search_opportunities(
        search_client: search.SearchClient,
        filters: OppFilters | None = None,
        sorting: OppSorting | None = None,
        pagination: PaginatedBodyParams | None = None,
        search_query: str | None = None,
    ) -> OpportunitiesSearchResponse:
        """Search for opportunities based on the provided filters."""

        # Use default values if not provided
        if filters is None:
            filters = OppFilters()
        if sorting is None:
            sorting = OppSorting(sort_by=OppSortBy.LAST_MODIFIED_AT)
        if pagination is None:
            pagination = PaginatedBodyParams()

        # Convert search request to legacy format
        legacy_search_params = transform_search_request_from_cg(
            filters, sorting, pagination, search_query
        )

        # Perform search
        opportunities, aggregations, pagination_info = search_opportunities(
            search_client, legacy_search_params
        )

        # Transform results to CommonGrants format
        items = []
        for opp_data in opportunities:
            opportunity = transform_search_result_to_cg(opp_data)
            if opportunity:
                items.append(opportunity)

        # Build response
        pagination_info_cg = PaginatedResultsInfo(
            page=pagination.page,
            page_size=pagination.page_size,
            totalItems=pagination_info.total_records,
            totalPages=pagination_info.total_pages,
        )

        sorted_info = SortedResultsInfo(
            sort_by=sorting.sort_by.value,
            sort_order=sorting.sort_order,
            errors=[],
        )

        # Build applied filters
        filter_info = build_filter_info(filters)

        return OpportunitiesSearchResponse(
            status=200,
            message="Opportunities searched successfully using search client",
            items=items,
            pagination_info=pagination_info_cg,
            sort_info=sorted_info,
            filter_info=filter_info,
        )
