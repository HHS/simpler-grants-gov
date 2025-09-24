"""CommonGrants Protocol opportunity service."""

import logging
from uuid import UUID

from common_grants_sdk.schemas.marshmallow import (
    OpportunitiesListResponse as OpportunitiesListResponseSchema,
)
from common_grants_sdk.schemas.marshmallow import (
    OpportunitiesSearchResponse as OpportunitiesSearchResponseSchema,
)
from common_grants_sdk.schemas.marshmallow import OpportunityResponse as OpportunityResponseSchema
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

import src.adapters.db as db
import src.adapters.search as search
from src.services.opportunities_v1.get_opportunity import get_opportunity
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

    def __init__(self) -> None:
        """Initialize the service."""
        return

    @staticmethod
    def get_opportunity(
        db_session: db.Session, opportunity_id: str
    ) -> OpportunityResponseSchema | None:
        """Get a specific opportunity by ID."""
        try:
            # Get response data from v1 service
            opportunity_uuid = UUID(opportunity_id)
            opportunity_data = get_opportunity(db_session, opportunity_uuid)

            # Handle not-found condition
            if not opportunity_data:
                return None

            # Transform response data to CG format
            opportunity_data_cg = transform_opportunity_to_cg(opportunity_data)
            opportunity_response = OpportunityResponse(
                status=200,
                message="Success",
                data=opportunity_data_cg,
            )

            # Transform response data from pydantic to marshmallow
            response_object = OpportunityResponseSchema()
            opportunity_json = opportunity_response.model_dump(by_alias=True, mode="json")
            validated_response = response_object.load(opportunity_json)

            return validated_response

        except ValueError:
            return None

    @staticmethod
    def list_opportunities(
        search_client: search.SearchClient,
        page: int = 1,
        page_size: int = 10,
    ) -> OpportunitiesListResponseSchema:
        """Get a paginated list of opportunities."""

        # Set empty search params
        filters = OppFilters()
        pagination = PaginatedBodyParams(page=page, page_size=page_size)
        sorting = OppSorting(sort_by=OppSortBy.LAST_MODIFIED_AT)

        # Convert search request to v1 format
        v1_search_params = transform_search_request_from_cg(filters, sorting, pagination, "")

        # Get response data
        opportunity_data, aggregations, pagination_data = search_opportunities(
            search_client, v1_search_params
        )

        # Transform response data to CG format
        opportunity_data_cg = []
        for item in opportunity_data:
            opportunity = transform_search_result_to_cg(item)
            if opportunity:
                opportunity_data_cg.append(opportunity)
        opportunity_response = OpportunitiesListResponse(
            status=200,
            message="Opportunities fetched successfully",
            items=opportunity_data_cg,
            pagination_info=PaginatedResultsInfo(
                page=pagination_data.page_offset,
                page_size=pagination_data.page_size,
                totalItems=pagination_data.total_records,
                totalPages=pagination_data.total_pages,
            ),
        )

        # Transform response data from pydantic to marshmallow
        response_object = OpportunitiesListResponseSchema()
        opportunity_json = opportunity_response.model_dump(by_alias=True, mode="json")
        validated_response = response_object.load(opportunity_json)

        return validated_response

    @staticmethod
    def search_opportunities(
        search_client: search.SearchClient,
        filters: OppFilters | None = None,
        sorting: OppSorting | None = None,
        pagination: PaginatedBodyParams | None = None,
        search_query: str | None = None,
    ) -> OpportunitiesSearchResponseSchema:
        """Search for opportunities based on the provided filters."""

        # Set search params
        filters = filters or OppFilters()
        sorting = sorting or OppSorting(sort_by=OppSortBy.LAST_MODIFIED_AT)
        pagination = pagination or PaginatedBodyParams()

        # Convert search request to v1 format
        v1_search_params = transform_search_request_from_cg(
            filters, sorting, pagination, search_query
        )

        # Get response data
        opportunity_data, aggregations, pagination_data = search_opportunities(
            search_client, v1_search_params
        )

        # Transform response data to CG format
        opportunity_data_cg = []
        for item in opportunity_data:
            opportunity = transform_search_result_to_cg(item)
            if opportunity:
                opportunity_data_cg.append(opportunity)
        opportunity_response = OpportunitiesSearchResponse(
            status=200,
            message="Opportunities searched successfully using search client",
            items=opportunity_data_cg,
            pagination_info=PaginatedResultsInfo(
                page=pagination.page,
                page_size=pagination.page_size,
                totalItems=pagination_data.total_records,
                totalPages=pagination_data.total_pages,
            ),
            sort_info=SortedResultsInfo(
                sort_by=sorting.sort_by.value,
                sort_order=sorting.sort_order,
                errors=[],
            ),
            filter_info=build_filter_info(filters),
        )

        # Transform response data from pydantic to marshmallow
        response_object = OpportunitiesSearchResponseSchema()
        opportunity_json = opportunity_response.model_dump(by_alias=True, mode="json")
        validated_response = response_object.load(opportunity_json)

        return validated_response
