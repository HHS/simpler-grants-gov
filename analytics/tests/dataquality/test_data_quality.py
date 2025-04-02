"""Test snapshot comparison to known output."""

from pathlib import Path
from unittest import mock

from analytics.etl.github import GitHubProjectConfig, GitHubProjectETL
from analytics.etl.utils import load_config
from analytics.integrations.github.client import GitHubGraphqlClient

from tests.dataquality.inputs.extracted_json import mock_extracted_json
from tests.dataquality.inputs.roadmap import mock_graphql_roadmap_data
from tests.dataquality.inputs.sprintboards import mock_graphql_sprintboard_data


def test_roadmap_snapshot(snapshot):  # noqa: ANN001
    """Extract and transform for comparison to pre-committed snapshot of roadmap."""
    assert roadmap_output() == snapshot()


@mock.patch.object(
    GitHubGraphqlClient,
    "execute_paginated_query",
    mock_graphql_roadmap_data,
)
def roadmap_output() -> list[dict] | None:
    """Call the new pipeline code to be used for comparison."""
    config_path = Path("config/github-projects.json")
    config = load_config(config_path, GitHubProjectConfig)

    # validate effective_date

    roadmap_data, _ = GitHubProjectETL(config).extract_and_transform_in_memory()
    return roadmap_data


def test_sprint_snapshot(snapshot):  # noqa: ANN001
    """Extract and transform for comparison to pre-committed snapshot of sprint board."""
    assert sprint_board_output() == snapshot


@mock.patch.object(
    GitHubGraphqlClient,
    "execute_paginated_query",
    mock_graphql_sprintboard_data,
)
def sprint_board_output() -> list[dict] | None:
    """Call the new pipeline code to be used for comparison."""
    config_path = Path("config/github-projects.json")
    config = load_config(config_path, GitHubProjectConfig)

    # validate effective_date

    sprint_data, _ = GitHubProjectETL(config).extract_and_transform_in_memory()
    return sprint_data


@mock.patch.object(
    GitHubProjectETL,
    "extract_and_transform_in_memory",
    mock_extracted_json,
)
def etl_output() -> list[dict]:
    """Call the pipeline code to be used with comparison."""
    config_path = Path("config/github-projects.json")
    config = load_config(config_path, GitHubProjectConfig)

    # validate effective_date

    etl_data, _ = GitHubProjectETL(config).extract_and_transform_in_memory()
    return etl_data


def test_load_from_json_object(snapshot):  # noqa: ANN001
    """Extract JSON and compare to pre-committed snapshot."""
    assert etl_output() == snapshot
