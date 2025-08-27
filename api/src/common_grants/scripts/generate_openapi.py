#!/usr/bin/env python3

"""
Script to generate OpenAPI specifications for the CommonGrants API routes using APIFlask.

This module creates an APIFlask app that includes only the CommonGrants routes
for OpenAPI schema generation.
"""

from typing import Any

from apiflask import APIFlask
from apiflask.schemas import Schema

# Import the actual CommonGrants routes and schemas
from src.api.common_grants.common_grants_blueprint import common_grants_blueprint
from src.api.schemas.common_grants_schema import (
    CGPaginatedQueryParamsSchema,
    CGOpportunitiesListResponseSchema,
    CGOpportunityResponseSchema,
    CGOpportunitiesSearchResponseSchema,
    CGOpportunitySearchRequestSchema,
)


def create_apiflask_app() -> APIFlask:
    """
    Create an APIFlask app with only CommonGrants routes for OpenAPI schema generation.

    This creates an APIFlask app that includes the actual CommonGrants blueprint
    and schemas, but without any business logic implementation.
    """
    app = APIFlask(
        __name__,
        title="CommonGrants API",
        version="0.1.0",
    )
    
    # Set description after creation
    app.description = "An implementation of the CommonGrants API specification"

    # Register only the CommonGrants blueprint
    app.register_blueprint(common_grants_blueprint)

    return app


def get_common_grants_openapi_schema() -> dict[str, Any]:
    """
    Generate OpenAPI schema for CommonGrants API routes using APIFlask.

    Returns:
        dict: The OpenAPI schema containing only CommonGrants routes
    """
    app = create_apiflask_app()

    # Generate the OpenAPI schema using APIFlask's spec attribute
    return app.spec


if __name__ == "__main__":
    import yaml

    print(yaml.dump(get_common_grants_openapi_schema(), sort_keys=False))  # noqa: T201
