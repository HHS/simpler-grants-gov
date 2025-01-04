"""Expose a client for making calls to GitHub's GraphQL API."""

import functools
import logging
from typing import Any, Callable

import requests

from config import get_db_settings

logger = logging.getLogger(__name__)


class GraphqlError(Exception):
    """
    Exception raised for errors returned by the GraphQL API.

    Attributes
    ----------
    errors : list
        List of error details returned by the API.
    message : str
        Human-readable explanation of the error.

    """

    def __init__(self, errors: list[dict]) -> None:
        """Initialize the GraphqlError."""
        self.errors = errors
        self.message = f"GraphQL API returned errors: {errors}"
        super().__init__(self.message)


def github_api_error_handler(api_call: Callable) -> Callable:
    """
    Wrap GitHub API calls with error handling.

    Parameters
    ----------
    api_call : Callable
        The GitHub API call function to wrap.

    Returns
    -------
    Callable
        A wrapped function that catches and logs errors.

    """

    @functools.wraps(api_call)
    def try_to_make_api_call_and_catch_error(
        *args: Any,  # noqa: ANN401
        **kwargs: Any,  # noqa: ANN401
    ) -> dict | None:
        try:
            return api_call(*args, **kwargs)
        except Exception:
            logger.exception("GitHub API error")
            return None

    return try_to_make_api_call_and_catch_error


class GitHubGraphqlClient:
    """
    A client to interact with GitHub's GraphQL API.

    Methods
    -------
    execute_paginated_query(query, variables, data_path, batch_size=100)
        Executes a paginated GraphQL query and returns all results.

    """

    def __init__(self) -> None:
        """
        Initialize the GitHubClient.

        Parameters
        ----------
        token : str
            GitHub personal access token for authentication.

        """
        settings = get_db_settings()
        self.endpoint = "https://api.github.com/graphql"
        self.headers = {
            "Authorization": f"Bearer {settings.github_token}",
            "Content-Type": "application/json",
            "GraphQL-Features": "sub_issues,issue_types",
        }

    def execute_query(self, query: str, variables: dict[str, str | int]) -> dict:
        """
        Make a POST request to the GitHub GraphQL API.

        Parameters
        ----------
        query : str
            The GraphQL query string.
        variables : dict
            A dictionary of variables to pass to the query.

        Returns
        -------
        dict
            The JSON response from the API.

        """
        response = requests.post(
            self.endpoint,
            headers=self.headers,
            json={"query": query, "variables": variables},
            timeout=60,
        )
        response.raise_for_status()
        result = response.json()
        if "errors" in result:
            raise GraphqlError(result["errors"])
        return result

    def execute_paginated_query(
        self,
        query: str,
        variables: dict[str, Any],
        path_to_nodes: list[str],
        batch_size: int = 100,
    ) -> list[dict]:
        """
        Execute a paginated GraphQL query.

        Parameters
        ----------
        query : str
            The GraphQL query string.
        variables : dict
            A dictionary of variables to pass to the query.
        path_to_nodes : list of str
            The path to traverse the response data to extract the "nodes" list,
            so the nodes can be combined from multiple paginated responses.
        batch_size : int, optional
            The number of items to fetch per batch, by default 100.

        Returns
        -------
        list of dict
            The combined results from all paginated responses.

        """
        all_data = []
        has_next_page = True
        variables["batch"] = batch_size
        variables["endCursor"] = None

        while has_next_page:
            response = self.execute_query(query, variables)
            data = response["data"]

            # Traverse the data path to extract nodes
            for key in path_to_nodes:
                data = data[key]

            all_data.extend(data["nodes"])

            # Handle pagination
            page_info = data["pageInfo"]
            has_next_page = page_info["hasNextPage"]
            variables["endCursor"] = page_info["endCursor"]

        return all_data
