"""GitHub integration module for dependency mapping.

This module provides functionality for fetching, parsing, and mapping
GitHub issues and their dependencies.
"""

from .fetch import (
    fetch_issues_from_project,
    fetch_issues_from_repo,
    make_graphql_request,
    make_paginated_graphql_request,
    update_github_issue,
)
from .main import (
    map_issue_dependencies,
    map_repo_dependencies,
    map_project_dependencies,
)
from .parse import (
    parse_repo_response,
    parse_project_response,
)
from .main import fetch_and_parse_issues_from_repo

__all__ = [
    # Main functions
    "fetch_and_parse_issues_from_repo",
    # Fetch functions
    "fetch_issues_from_project",
    "fetch_issues_from_repo",
    "make_graphql_request",
    "make_paginated_graphql_request",
    "update_github_issue",
    # Map functions
    "fetch_and_parse_issues_from_repo",
    "map_issue_dependencies",
    "map_repo_dependencies",
    "map_project_dependencies",
    # Parse functions
    "parse_repo_response",
    "parse_project_response",
]
