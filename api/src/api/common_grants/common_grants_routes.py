"""CommonGrants Protocol routes."""

import logging
from uuid import UUID

from apiflask import HTTPError
from common_grants_sdk.schemas.pydantic import OpportunityResponse, OpportunitySearchRequest, PaginatedQueryParams

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.api.common_grants.common_grants_blueprint import common_grants_blueprint
from src.services.common_grants.opportunity_service import CommonGrantsOpportunityService
import common_grants_sdk.schemas.marshmallow as cgmm


logger = logging.getLogger(__name__)


@common_grants_blueprint.get("/opportunities")
@common_grants_blueprint.input(cgmm.CGPaginatedBodyParams, location="query")
@common_grants_blueprint.output(cgmm.CGOpportunitiesListResponse)
@common_grants_blueprint.doc(
    summary="List opportunities",
    description="Get a paginated list of opportunities, sorted by `lastModifiedAt` with most recent first.",
)
@flask_db.with_db_session()
def list_opportunities(db_session: db.Session, query_data: dict) -> tuple[dict, int]:
    """Get a paginated list of opportunities."""
    # Parse pagination parameters using PySDK classes
    try:
        pagination_params = PaginatedQueryParams.model_validate({
            "page": query_data.get("page", 1),
            "pageSize": query_data.get("pageSize", 10),
        })
    except Exception as e:
        raise HTTPError(400, message=f"Invalid pagination parameters: {str(e)}") from e

    # Create service and get opportunities
    opportunity_service = CommonGrantsOpportunityService(db_session)
    pydantic_response = opportunity_service.list_opportunities(
        page=pagination_params.page, 
        page_size=pagination_params.page_size
    )
    
    # Convert Pydantic response to JSON
    json_data = pydantic_response.model_dump(by_alias=True, mode="json")
    
    # Hydrate marshmallow schema
    schema = cgmm.CGOpportunitiesListResponse()
    marshmallow_data = schema.load(json_data)
    
    # Dump marshmallow data to JSON-serializable format
    return schema.dump(marshmallow_data), 200
    

@common_grants_blueprint.get("/opportunities/<oppId>")
@common_grants_blueprint.output(cgmm.CGOpportunityResponse)
@common_grants_blueprint.doc(
    summary="View opportunity",
    description="View additional details about an opportunity",
    responses={
        200: "Success",
        404: "Opportunity not found",
    },
)
@flask_db.with_db_session()
def get_opportunity(db_session: db.Session, oppId: str) -> tuple[dict, int]:
    """Get a specific opportunity by ID."""
    try:
        # Validate UUID format
        UUID(oppId)
    except ValueError as err:
        raise HTTPError(400, message="Invalid opportunity ID format") from err

    # Create service and get opportunity
    opportunity_service = CommonGrantsOpportunityService(db_session)
    opportunity = opportunity_service.get_opportunity(oppId)

    if not opportunity:
        raise HTTPError(404, message="Opportunity not found")

    response = OpportunityResponse(
        status=200,
        message="Success",
        data=opportunity,
    )
    
    # Convert Pydantic response to JSON
    json_data = response.model_dump(by_alias=True, mode="json")
    
    # Hydrate marshmallow schema
    schema = cgmm.CGOpportunityResponse()
    marshmallow_data = schema.load(json_data)
    
    # Dump marshmallow data to JSON-serializable format
    return schema.dump(marshmallow_data), 200


@common_grants_blueprint.post("/opportunities/search")
@common_grants_blueprint.input(cgmm.CGOpportunitySearchRequest)
@common_grants_blueprint.output(cgmm.CGOpportunitiesSearchResponse)
@common_grants_blueprint.doc(
    summary="Search opportunities",
    description="Search for opportunities based on the provided filters",
    responses={
        200: "Success",
        400: "Bad request",
    },
)
@flask_db.with_db_session()
def search_opportunities(db_session: db.Session, json_data: dict) -> tuple[dict, int]:
    """Search for opportunities based on the provided filters."""
    # Parse request body
    try:
        request_data = json_data if json_data else {}

        # Create search request object
        search_request = OpportunitySearchRequest.model_validate(request_data)
    except Exception as e:
        raise HTTPError(400, message=f"Invalid request format: {str(e)}") from e

    # Create service and search opportunities
    opportunity_service = CommonGrantsOpportunityService(db_session)
    response = opportunity_service.search_opportunities(
        filters=search_request.filters,
        sorting=search_request.sorting,
        pagination=search_request.pagination,
        search=search_request.search,
    )
    
    # Convert Pydantic response to JSON
    json_data = response.model_dump(by_alias=True, mode="json")
    
    # Hydrate marshmallow schema
    schema = cgmm.CGOpportunitiesSearchResponse()
    marshmallow_data = schema.load(json_data)
    
    # Dump marshmallow data to JSON-serializable format
    return schema.dump(marshmallow_data), 200
