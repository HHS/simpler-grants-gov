"""CommonGrants Protocol routes."""

import logging
from uuid import UUID

from apiflask import HTTPError
from common_grants_sdk.schemas import OpportunityResponse
from common_grants_sdk.schemas.requests.opportunity import OpportunitySearchRequest
from common_grants_sdk.schemas.pagination import PaginatedQueryParams
from flask import request

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.api.common_grants.common_grants_blueprint import common_grants_blueprint
from src.services.common_grants.opportunity_service import CommonGrantsOpportunityService

logger = logging.getLogger(__name__)


@common_grants_blueprint.get("/opportunities")
@common_grants_blueprint.doc(
    summary="List opportunities",
    description="Get a paginated list of opportunities, sorted by `lastModifiedAt` with most recent first.",
)
@flask_db.with_db_session()
def list_opportunities(db_session: db.Session) -> tuple[dict, int]:
    """Get a paginated list of opportunities."""
    # Parse pagination parameters using PySDK classes
    try:
        pagination_params = PaginatedQueryParams.model_validate({
            "page": request.args.get("page", 1, type=int),
            "pageSize": request.args.get("pageSize", 10, type=int),
        })
    except Exception as e:
        raise HTTPError(400, message=f"Invalid pagination parameters: {str(e)}") from e

    # Create service and get opportunities
    opportunity_service = CommonGrantsOpportunityService(db_session)
    response = opportunity_service.list_opportunities(
        page=pagination_params.page, 
        page_size=pagination_params.page_size
    )
    return response.model_dump(mode="json"), 200


@common_grants_blueprint.get("/opportunities/<oppId>")
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
    return response.model_dump(mode="json"), 200


@common_grants_blueprint.post("/opportunities/search")
@common_grants_blueprint.doc(
    summary="Search opportunities",
    description="Search for opportunities based on the provided filters",
    responses={
        200: "Success",
        400: "Bad request",
    },
)
@flask_db.with_db_session()
def search_opportunities(db_session: db.Session) -> tuple[dict, int]:
    """Search for opportunities based on the provided filters."""
    # Parse request body
    try:
        request_data = request.get_json()
        if not request_data:
            request_data = {}

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
    return response.model_dump(mode="json"), 200
