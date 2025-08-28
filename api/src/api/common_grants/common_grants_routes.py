"""CommonGrants Protocol routes."""

import logging
from uuid import UUID

from apiflask import HTTPError
from common_grants_sdk.schemas.pydantic import OpportunityResponse, OpportunitySearchRequest, PaginatedQueryParams
from common_grants_sdk.schemas.marshmallow import (
    Error, HTTPValidationError, OpportunitiesListResponse, OpportunitiesSearchResponse,
    OpportunityResponse as OpportunityResponseSchema, PaginatedQueryParams as PaginatedQueryParamsSchema,
    OpportunitySearchRequest as OpportunitySearchRequestSchema
)

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.api.common_grants.common_grants_blueprint import common_grants_blueprint
from src.services.common_grants.opportunity_service import CommonGrantsOpportunityService


logger = logging.getLogger(__name__)


@common_grants_blueprint.get("/opportunities")
@common_grants_blueprint.input(PaginatedQueryParamsSchema, location="query")
@common_grants_blueprint.output(OpportunitiesListResponse)
@common_grants_blueprint.doc(
    summary="List opportunities",
    description="Get a paginated list of opportunities, sorted by `lastModifiedAt` with most recent first.",
    responses={
        200: {"model": OpportunitiesListResponse, "description": "Success"},
        422: {"model": HTTPValidationError, "description": "Validation error"},
    },
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
        # Return proper CommonGrants error format
        error_response = {
            "status": 400,
            "message": f"Invalid pagination parameters: {str(e)}",
            "errors": [{"field": "pagination", "message": str(e), "type": "validation_error"}]
        }
        return error_response, 400

    # Create service and get opportunities
    opportunity_service = CommonGrantsOpportunityService(db_session)
    pydantic_response = opportunity_service.list_opportunities(
        page=pagination_params.page, 
        page_size=pagination_params.page_size
    )
    
    # Convert Pydantic response to JSON
    json_data = pydantic_response.model_dump(by_alias=True, mode="json")
    
    # Hydrate marshmallow schema
    schema = OpportunitiesListResponse()
    marshmallow_data = schema.load(json_data)
    
    # Dump marshmallow data to JSON-serializable format
    return schema.dump(marshmallow_data), 200
    

@common_grants_blueprint.get("/opportunities/<oppId>")
@common_grants_blueprint.output(OpportunityResponseSchema)
@common_grants_blueprint.doc(
    summary="View opportunity",
    description="View additional details about an opportunity",
    responses={
        200: {"model": OpportunityResponseSchema, "description": "Success"},
        404: {"model": Error, "description": "Opportunity not found"},
        400: {"model": Error, "description": "Bad request"},
        422: {"model": HTTPValidationError, "description": "Validation error"},
    },
)
@flask_db.with_db_session()
def get_opportunity(db_session: db.Session, oppId: str) -> tuple[dict, int]:
    """Get a specific opportunity by ID."""
    try:
        # Validate UUID format
        UUID(oppId)
    except ValueError as err:
        # Return proper CommonGrants error format
        error_response = {
            "status": 400,
            "message": "Invalid opportunity ID format",
            "errors": [{"field": "oppId", "message": "Invalid UUID format", "type": "invalid"}]
        }
        return error_response, 400

    # Create service and get opportunity
    opportunity_service = CommonGrantsOpportunityService(db_session)
    opportunity = opportunity_service.get_opportunity(oppId)

    if not opportunity:
        # Return proper CommonGrants error format
        error_response = {
            "status": 404,
            "message": "Opportunity not found",
            "errors": [{"field": "oppId", "message": "Opportunity not found", "type": "not_found"}]
        }
        return error_response, 404

    response = OpportunityResponse(
        status=200,
        message="Success",
        data=opportunity,
    )
    
    # Convert Pydantic response to JSON
    json_data = response.model_dump(by_alias=True, mode="json")
    
    # Hydrate marshmallow schema
    schema = OpportunityResponseSchema()
    marshmallow_data = schema.load(json_data)
    
    # Dump marshmallow data to JSON-serializable format
    return schema.dump(marshmallow_data), 200


@common_grants_blueprint.post("/opportunities/search")
@common_grants_blueprint.input(OpportunitySearchRequestSchema)
@common_grants_blueprint.output(OpportunitiesSearchResponse)
@common_grants_blueprint.doc(
    summary="Search opportunities",
    description="Search for opportunities based on the provided filters",
    responses={
        200: {"model": OpportunitiesSearchResponse, "description": "Success"},
        400: {"model": Error, "description": "Bad request"},
        422: {"model": HTTPValidationError, "description": "Validation error"},
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
        # Return proper CommonGrants error format
        error_response = {
            "status": 400,
            "message": f"Invalid request format: {str(e)}",
            "errors": [{"field": "request", "message": str(e), "type": "validation_error"}]
        }
        return error_response, 400

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
    schema = OpportunitiesSearchResponse()
    marshmallow_data = schema.load(json_data)
    
    # Dump marshmallow data to JSON-serializable format
    return schema.dump(marshmallow_data), 200
