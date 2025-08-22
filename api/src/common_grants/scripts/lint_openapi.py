#!/usr/bin/env python3

"""
Simple linter to check for inconsistencies between Flask API and generated OpenAPI spec.
"""

import sys
from typing import Dict, Any

from src.app import create_app
from src.common_grants.scripts.generate_openapi import get_common_grants_openapi_schema


def get_flask_spec() -> Dict[str, Any]:
    """Get OpenAPI spec from Flask API."""
    app = create_app()
    if hasattr(app, 'spec'):
        return app.spec if isinstance(app.spec, dict) else app.spec.to_dict()
    else:
        return app.openapi()


def get_fastapi_spec() -> Dict[str, Any]:
    """Get OpenAPI spec from FastAPI mirror."""
    return get_common_grants_openapi_schema()


def extract_common_grants_routes(spec: Dict[str, Any]) -> Dict[str, Any]:
    """Extract only CommonGrants routes from spec."""
    cg_spec = {
        "openapi": spec.get("openapi", "3.0.0"),
        "info": spec.get("info", {}),
        "paths": {},
        "components": spec.get("components", {}),
    }
    
    for path, path_item in spec.get("paths", {}).items():
        if path.startswith("/common-grants/"):
            cg_spec["paths"][path] = path_item
    
    return cg_spec


def lint_specs() -> bool:
    """Lint the specs and return True if no issues found."""
    print("🔍 Linting OpenAPI specifications...")
    
    # Get specs
    flask_spec = get_flask_spec()
    fastapi_spec = get_fastapi_spec()
    
    # Extract CommonGrants routes
    flask_cg = extract_common_grants_routes(flask_spec)
    fastapi_cg = extract_common_grants_routes(fastapi_spec)
    
    # Compare paths
    flask_paths = set(flask_cg["paths"].keys())
    fastapi_paths = set(fastapi_cg["paths"].keys())
    
    issues = []
    
    # Check for missing paths
    missing = flask_paths - fastapi_paths
    if missing:
        issues.append(f"Paths missing in FastAPI spec: {missing}")
    
    # Check for extra paths
    extra = fastapi_paths - flask_paths
    if extra:
        issues.append(f"Extra paths in FastAPI spec: {extra}")
    
    # Check common paths
    common = flask_paths & fastapi_paths
    for path in common:
        flask_item = flask_cg["paths"][path]
        fastapi_item = fastapi_cg["paths"][path]
        
        # Compare HTTP methods
        flask_methods = set(flask_item.keys()) - {"parameters"}
        fastapi_methods = set(fastapi_item.keys()) - {"parameters"}
        
        if flask_methods != fastapi_methods:
            issues.append(f"Path {path}: Methods differ - Flask: {flask_methods}, FastAPI: {fastapi_methods}")
    
    # Report issues
    if issues:
        print("❌ Issues found:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    else:
        print("No inconsistencies found")
        return True


if __name__ == "__main__":
    success = lint_specs()
    sys.exit(0 if success else 1)
