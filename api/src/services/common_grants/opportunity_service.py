"""CommonGrants Protocol opportunity service."""

import logging
from uuid import UUID

from common_grants_sdk.schemas.pydantic import (
    OppFilters,
    OpportunityBase,
    OpportunitySearchRequest,
    OppSortBy,
    OppSorting,
    PaginatedBodyParams,
    PaginatedResultsInfo,
)

import src.adapters.db as db
import src.adapters.search as search
from src.services.opportunities_v1.get_opportunity import get_opportunity
from src.services.opportunities_v1.search_opportunities import search_opportunities

from .transformation import (
    transform_opportunity_to_cg,
    transform_search_request_from_cg,
    transform_search_result_to_cg,
)

logger = logging.getLogger(__name__)


class CommonGrantsOpportunityService:
    """Service for managing opportunities in CommonGrants Protocol format."""

    def __init__(self) -> None:
        """Initialize the service."""
        return

    @staticmethod
    def get_opportunity(db_session: db.Session, opportunity_id: UUID) -> OpportunityBase:
        """Get a specific opportunity by ID."""

        # Get response data from v1 service
        opportunity_data_v1 = get_opportunity(db_session, opportunity_id)

        # Transform response data to CG model
        return transform_opportunity_to_cg(opportunity_data_v1)

    @staticmethod
    def list_opportunities(
        search_client: search.SearchClient,
        pagination: PaginatedBodyParams,
    ) -> tuple[list[OpportunityBase], PaginatedResultsInfo]:
        """Get a paginated list of opportunities."""

        # Set empty search params
        filters = OppFilters()
        sorting = OppSorting(sort_by=OppSortBy.LAST_MODIFIED_AT)

        # Convert search request to v1 format
        v1_search_params = transform_search_request_from_cg(filters, sorting, pagination, "")

        # Get response data from v1 service
        opportunity_data_v1, _aggregations, pagination_data_v1 = search_opportunities(
            search_client, v1_search_params
        )

        # Transform response data to CG model
        opportunity_data_cg: list[OpportunityBase] = []
        for item in opportunity_data_v1:
            opportunity = transform_search_result_to_cg(item)
            if opportunity:
                opportunity_data_cg.append(opportunity)

        # Transform pagination data to CG model
        paginated_results_info_cg = PaginatedResultsInfo(
            page=pagination_data_v1.page_offset,
            page_size=pagination_data_v1.page_size,
            totalItems=pagination_data_v1.total_records,
            totalPages=pagination_data_v1.total_pages,
        )

        return opportunity_data_cg, paginated_results_info_cg

    @staticmethod
    def search_opportunities(
        search_client: search.SearchClient,
        search_request: OpportunitySearchRequest,
    ) -> tuple[list[OpportunityBase], PaginatedResultsInfo]:
        """Search for opportunities based on the provided search request."""

        # Extract components from search request for response building
        filters = search_request.filters or OppFilters()
        sorting = search_request.sorting or OppSorting(sort_by=OppSortBy.LAST_MODIFIED_AT)
        pagination = search_request.pagination or PaginatedBodyParams()

        # Convert search request to v1 format
        v1_search_params = transform_search_request_from_cg(
            filters, sorting, pagination, search_request.search
        )

        # Get response data from v1 service
        opportunity_data_v1, _aggregations, pagination_data_v1 = search_opportunities(
            search_client, v1_search_params
        )

        # Transform response data to CG model
        opportunity_data_cg: list[OpportunityBase] = []
        for item in opportunity_data_v1:
            opportunity = transform_search_result_to_cg(item)
            if opportunity:
                opportunity_data_cg.append(opportunity)

        # Transform pagination data to CG model
        paginated_results_info_cg = PaginatedResultsInfo(
            page=pagination_data_v1.page_offset,
            page_size=pagination_data_v1.page_size,
            totalItems=pagination_data_v1.total_records,
            totalPages=pagination_data_v1.total_pages,
        )

        return opportunity_data_cg, paginated_results_info_cg
