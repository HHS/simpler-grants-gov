"""CommonGrants Protocol routes."""

import logging

from common_grants_sdk.schemas.pydantic.requests.opportunity import OpportunitySearchRequest
from common_grants_sdk.schemas.marshmallow import (
    Error as ErrorSchema, 
    OpportunitiesListResponse as OpportunitiesListResponseSchema, 
    OpportunitiesSearchResponse as OpportunitiesSearchResponseSchema,
    OpportunityResponse as OpportunityResponseSchema, 
    PaginatedQueryParams as PaginatedQueryParamsSchema,
    OpportunitySearchRequest as OpportunitySearchRequestSchema
)

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.api.common_grants.common_grants_blueprint import common_grants_blueprint
from src.services.common_grants.opportunity_service import CommonGrantsOpportunityService


logger = logging.getLogger(__name__)


def generate_422_error(e: Exception) -> tuple[dict, int]:
    """Generate a 422 error response for validation failures."""
    error_schema = ErrorSchema()
    return error_schema.dump({
        "status": 422,
        "message": "The server cannot parse the request",
        "errors": [{"field": "request", "message": str(e)}]
    }), 422


@common_grants_blueprint.get("/opportunities")
@common_grants_blueprint.input(PaginatedQueryParamsSchema, location="query")
@common_grants_blueprint.output(OpportunitiesListResponseSchema)
@common_grants_blueprint.doc(
    summary="List opportunities",
    description="Get a paginated list of opportunities, sorted by `lastModifiedAt` with most recent first.",
    responses={
        200: {"model": OpportunitiesListResponseSchema, "description": "Success"},
    },
)
@flask_db.with_db_session()
def list_opportunities(db_session: db.Session, query_data: dict) -> tuple[dict, int]:
    """Get a paginated list of opportunities."""

    # Create service and get query result
    service = CommonGrantsOpportunityService(db_session)
    response_object = service.list_opportunities(
        page=int(query_data.get("page", 1)),
        page_size=int(query_data.get("pageSize", 10))
    )
    
    # Hydrate response model
    response_json = response_object.model_dump(by_alias=True, mode="json")
    response_schema = OpportunitiesListResponseSchema()
    validated_data = response_schema.load(response_json)
    return validated_data, 200


@common_grants_blueprint.get("/opportunities/<oppId>")
@common_grants_blueprint.output(OpportunityResponseSchema)
@common_grants_blueprint.doc(
    summary="View opportunity details",
    description="View details about an opportunity",
    responses={
        200: {"model": OpportunityResponseSchema, "description": "Success"},
        404: {"model": ErrorSchema, "description": "The server cannot find the requested resource"},
    },
)
@flask_db.with_db_session()
def get_opportunity(db_session: db.Session, oppId: str) -> tuple[dict, int]:
    """Get a specific opportunity by ID."""

    # Create service and get query result
    service = CommonGrantsOpportunityService(db_session)
    response_object = service.get_opportunity(oppId)

    # Check for not found condition
    if not response_object:
        message = "The server cannot find the requested resource"
        error_schema = ErrorSchema()
        return error_schema.dump({
            "status": 404,
            "message": message,
            "errors": [{"field": "oppId", "message": message}]
        }), 404

    # Hydrate response model
    response_json = response_object.model_dump(by_alias=True, mode="json")
    response_schema = OpportunityResponseSchema()
    validated_data = response_schema.load(response_json)
    return validated_data, 200


@common_grants_blueprint.post("/opportunities/search")
@common_grants_blueprint.input(OpportunitySearchRequestSchema)
@common_grants_blueprint.output(OpportunitiesSearchResponseSchema)
@common_grants_blueprint.doc(
    summary="Search opportunities",
    description="Search for opportunities based on the provided filters",
    responses={
        200: {"model": OpportunitiesSearchResponseSchema, "description": "Success"},
        422: {"model": ErrorSchema, "description": "The server cannot parse the request"},
    },
)
@flask_db.with_db_session()
def search_opportunities(db_session: db.Session, json_data: dict) -> tuple[dict, int]:
    """Search for opportunities based on the provided filters."""

    # Validate input
    request_schema = OpportunitySearchRequestSchema()
    try:
        request_object = request_schema.load(json_data)
        search_request = OpportunitySearchRequest(**request_object)
    except Exception as e:
        return generate_422_error(e)
    
    # Create service and get query result
    service = CommonGrantsOpportunityService(db_session)
    response_object = service.search_opportunities(
        filters=search_request.filters,
        sorting=search_request.sorting,
        pagination=search_request.pagination,
        search=search_request.search,
    )
    
    # Hydrate schema
    response_json = response_object.model_dump(by_alias=True, mode="json")
    response_schema = OpportunitiesSearchResponseSchema()
    validated_data = response_schema.load(response_json)
    return validated_data, 200
