"""CommonGrants Protocol routes."""

import logging
from http import HTTPStatus
from uuid import UUID

from common_grants_sdk.schemas.pydantic import (
    OppFilters,
    OpportunitiesListResponse,
    OpportunitiesSearchResponse,
    OpportunityResponse,
    OpportunitySearchRequest,
    OppSortBy,
    OppSorting,
    PaginatedBodyParams,
    SortedResultsInfo,
)

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
from src.api.common_grants.common_grants_blueprint import common_grants_blueprint
from src.api.common_grants.common_grants_schemas import (
    OpportunitiesListResponse as OpportunitiesListResponseSchema,
)
from src.api.common_grants.common_grants_schemas import (
    OpportunitiesSearchResponse as OpportunitiesSearchResponseSchema,
)
from src.api.common_grants.common_grants_schemas import (
    OpportunityResponse as OpportunityResponseSchema,
)
from src.api.common_grants.common_grants_schemas import (
    OpportunitySearchRequest as OpportunitySearchRequestSchema,
)
from src.api.common_grants.common_grants_schemas import (
    PaginatedQueryParams as PaginatedQueryParamsSchema,
)
from src.api.common_grants.common_grants_utils import with_cg_error_handler
from src.auth.api_user_key_auth import api_user_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.common_grants.opportunity_service import CommonGrantsOpportunityService
from src.services.common_grants.transformation import build_filter_info
from src.util.dict_util import flatten_dict

logger = logging.getLogger(__name__)


@common_grants_blueprint.get("/opportunities")
@common_grants_blueprint.input(PaginatedQueryParamsSchema, location="query")
@common_grants_blueprint.output(OpportunitiesListResponseSchema)
@common_grants_blueprint.auth_required(api_user_key_auth)
@common_grants_blueprint.doc(
    summary="List opportunities",
    description="Get a paginated list of opportunities, sorted by `lastModifiedAt` with most recent first.",
    responses=[HTTPStatus.OK],
)
@with_cg_error_handler()
@flask_opensearch.with_search_client()
def list_opportunities(
    search_client: search.SearchClient, query_data: dict
) -> tuple[OpportunitiesListResponseSchema, HTTPStatus]:
    """Get a paginated list of opportunities."""

    add_extra_data_to_current_request_logs(query_data)
    logger.info("GET /common-grants/opportunities/")

    # Fetch data from service
    pagination_params = PaginatedBodyParams.model_validate(query_data)
    opportunity_data, pagination_data = CommonGrantsOpportunityService.list_opportunities(
        search_client=search_client,
        pagination=pagination_params,
    )

    # Define response data
    opportunities_list_response = OpportunitiesListResponse(
        status=HTTPStatus.OK,
        message="Opportunities fetched successfully",
        items=opportunity_data,
        pagination_info=pagination_data,
    )

    # Transform response data from CG pydantic to CG marshmallow
    response_json = opportunities_list_response.model_dump(by_alias=True, mode="json")
    response_schema = OpportunitiesListResponseSchema()
    validated_schema = response_schema.load(response_json)

    return validated_schema, HTTPStatus.OK


@common_grants_blueprint.get("/opportunities/<uuid:oppId>")
@common_grants_blueprint.output(OpportunityResponseSchema)
@common_grants_blueprint.auth_required(api_user_key_auth)
@common_grants_blueprint.doc(
    summary="View opportunity details",
    description="View details about an opportunity",
    responses=[HTTPStatus.OK, HTTPStatus.NOT_FOUND],
)
@with_cg_error_handler()
@flask_db.with_db_session()
def get_opportunity(
    db_session: db.Session, oppId: UUID
) -> tuple[OpportunityResponseSchema, HTTPStatus]:
    """Get a specific opportunity by ID."""

    add_extra_data_to_current_request_logs({"oppId": oppId})
    logger.info("GET /common-grants/opportunities/{oppId}")

    # Fetch data from service
    with db_session.begin():
        opportunity_data = CommonGrantsOpportunityService.get_opportunity(db_session, oppId)

    # Define response data
    opportunity_response = OpportunityResponse(
        status=HTTPStatus.OK,
        message="Success",
        data=opportunity_data,
    )

    # Transform response data from CG pydantic to CG marshmallow
    response_json = opportunity_response.model_dump(by_alias=True, mode="json")
    response_schema = OpportunityResponseSchema()
    validated_schema = response_schema.load(response_json)

    return validated_schema, HTTPStatus.OK


@common_grants_blueprint.post("/opportunities/search")
@common_grants_blueprint.input(OpportunitySearchRequestSchema)
@common_grants_blueprint.output(OpportunitiesSearchResponseSchema)
@common_grants_blueprint.auth_required(api_user_key_auth)
@common_grants_blueprint.doc(
    summary="Search opportunities",
    description="Search for opportunities based on the provided filters",
    responses=[HTTPStatus.OK],
)
@with_cg_error_handler()
@flask_opensearch.with_search_client()
def search_opportunities(
    search_client: search.SearchClient, json_data: dict
) -> tuple[OpportunitiesSearchResponseSchema, HTTPStatus]:
    """Search for opportunities based on the provided filters."""

    add_extra_data_to_current_request_logs(flatten_dict(json_data))
    logger.info("POST /common-grants/opportunities/search")

    # Fetch data from service
    search_request = OpportunitySearchRequest.model_validate(json_data)
    opportunity_data, pagination_data = CommonGrantsOpportunityService.search_opportunities(
        search_client,
        search_request,
    )

    # Define response data
    sorting_data = search_request.sorting or OppSorting(sort_by=OppSortBy.LAST_MODIFIED_AT)
    filter_data = search_request.filters or OppFilters()
    opportunities_search_response = OpportunitiesSearchResponse(
        status=HTTPStatus.OK,
        message="Opportunities searched successfully using search client",
        items=opportunity_data,
        pagination_info=pagination_data,
        sort_info=SortedResultsInfo(
            sort_by=sorting_data.sort_by.value,
            sort_order=sorting_data.sort_order,
            errors=[],
        ),
        filter_info=build_filter_info(filter_data),
    )

    # Transform response data from CG pydantic to CG marshmallow
    response_json = opportunities_search_response.model_dump(by_alias=True, mode="json")
    response_schema = OpportunitiesSearchResponseSchema()
    validated_schema = response_schema.load(response_json)

    return validated_schema, HTTPStatus.OK
