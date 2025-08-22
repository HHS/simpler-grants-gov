#!/usr/bin/env python3

"""
Script to generate OpenAPI specifications for the CommonGrants API routes using FastAPI.

This module creates a FastAPI app that mirrors the existing CommonGrants routes
for OpenAPI schema generation only.
"""

from typing import Any

# Import the CommonGrants SDK schemas
from common_grants_sdk.schemas import (
    Error,
    OpportunitiesListResponse,
    OpportunitiesSearchResponse,
    OpportunityResponse,
)
from common_grants_sdk.schemas.requests.opportunity import OpportunitySearchRequest
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.openapi.utils import get_openapi


def create_fastapi_app() -> FastAPI:
    """
    Create a FastAPI app with CommonGrants routes for OpenAPI schema generation.

    This creates FastAPI routes that mirror the existing APIFlask routes
    but use FastAPI's native Pydantic support for proper OpenAPI generation.
    No actual business logic is executed - this is just for schema generation.
    """
    app = FastAPI(
        title="CommonGrants API",
        description="An implementation of the CommonGrants API specification",
        version="0.1.0",
    )

    @app.get(
        "/common-grants/opportunities",
        summary="List opportunities",
        description="Get a paginated list of opportunities, sorted by `lastModifiedAt` with most recent first.",
        response_model=OpportunitiesListResponse,
    )
    async def list_opportunities(
        page: int = Query(default=1, ge=1, description="The page number to retrieve"),
        page_size: int = Query(
            default=10, alias="pageSize", ge=1, description="The number of items per page"
        ),
    ) -> OpportunitiesListResponse:
        """Get a paginated list of opportunities."""
        # This is just for schema generation - no actual implementation needed
        pass

    @app.get(
        "/common-grants/opportunities/{oppId}",
        summary="View opportunity",
        description="View additional details about an opportunity",
        response_model=OpportunityResponse,
        responses={
            200: {"description": "Success", "model": OpportunityResponse},
            404: {"description": "Opportunity not found", "model": Error},
        },
    )
    async def get_opportunity(oppId: str) -> OpportunityResponse:
        """Get a specific opportunity by ID."""
        # This is just for schema generation - no actual implementation needed
        pass

    @app.post(
        "/common-grants/opportunities/search",
        summary="Search opportunities",
        description="Search for opportunities based on the provided filters",
        response_model=OpportunitiesSearchResponse,
    )
    async def search_opportunities(
        request: OpportunitySearchRequest,
    ) -> OpportunitiesSearchResponse:
        """Search for opportunities based on the provided filters."""
        # This is just for schema generation - no actual implementation needed
        pass

    return app


def get_common_grants_openapi_schema() -> dict[str, Any]:
    """
    Generate OpenAPI schema for CommonGrants API routes using FastAPI.

    Returns:
        dict: The OpenAPI schema containing only CommonGrants routes

    """
    app = create_fastapi_app()

    # Generate the OpenAPI schema using FastAPI's built-in generator
    return get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )


if __name__ == "__main__":
    import yaml

    print(yaml.dump(get_common_grants_openapi_schema(), sort_keys=False))  # noqa: T201
