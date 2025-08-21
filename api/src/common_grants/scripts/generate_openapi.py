#!/usr/bin/env python3

"""
Script to generate OpenAPI specifications for the CommonGrants API routes only.

This module provides functionality to generate OpenAPI specifications that include
only the CommonGrants Protocol endpoints, excluding legacy routes.
"""

import os
import sys
from typing import Any

from apiflask import APIFlask


def get_common_grants_openapi_schema() -> dict[str, Any]:
    """
    Generate OpenAPI schema for CommonGrants API routes only.

    Returns:
        dict: The OpenAPI schema containing only CommonGrants routes

    """
    # Create a minimal app with only the common-grants routes
    app = APIFlask(
        __name__,
        title="CommonGrants API",
        version="0.1.0",
    )

    # Set the description
    app.info = {
        "description": "An implementation of the CommonGrants API specification",
    }

    # Register only the common-grants blueprint
    from src.api.common_grants import common_grants_blueprint

    app.register_blueprint(common_grants_blueprint)

    # Generate the OpenAPI schema
    return app.spec


if __name__ == "__main__":
    import yaml

    print(yaml.dump(get_common_grants_openapi_schema(), sort_keys=False))  # noqa: T201
