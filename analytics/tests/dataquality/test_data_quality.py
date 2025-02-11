"""Test snapshot comparison to known output."""

from pathlib import Path
from unittest import mock

from analytics.etl.github import GitHubProjectConfig, GitHubProjectETL
from analytics.etl.utils import load_config
from analytics.integrations.github.client import GitHubGraphqlClient

from tests.dataquality.inputs.roadmap import mock_graphql_roadmap_data
from tests.dataquality.inputs.sprintboards import mock_graphql_sprintboard_data


def test_snapshot(snapshot):
    """Compare pipeline to pre-committed snapshot."""
    test_data = output()

    assert test_data == snapshot()

@mock.patch.object(GitHubGraphqlClient,
                "execute_paginated_query",
             mock_graphql_roadmap_data)
def output() -> list[dict]|None:
    """Call the new pipeline code to be used for comparison."""
    #extract_transform_and_load("config/github-projects.json", "2025-02-11")

    config_path = Path("config/github-projects.json")
    effective_date = "2025-02-11"
    config = load_config(config_path, GitHubProjectConfig)

    # validate effective_date

    return GitHubProjectETL(config).extract_and_transform_in_memory()


def side_effects(*args):
    """Call the roadmap data on first call then sprintboard data on subsequent calls."""
    if args[0] == "0":
        return mock_graphql_roadmap_data
    return mock_graphql_sprintboard_data
