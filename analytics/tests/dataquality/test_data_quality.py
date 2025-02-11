from datetime import datetime
from pathlib import Path
from unittest import mock

from analytics.cli import extract_transform_and_load
from analytics.etl.github import GitHubProjectConfig, GitHubProjectETL
from analytics.etl.utils import load_config

from tests.dataquality.inputs.roadmap import mock_graphql_roadmap_data
from tests.dataquality.inputs.sprintboards import mock_graphql_sprintboard_data


def test_snapshot(snapshot):
    """Compare pipeline to pre-committed snapshot."""
    assert output() == snapshot()

@mock.patch("analytics.integrations.github.export_roadmap_data_to_object",
             mock_graphql_roadmap_data)
@mock.patch("analytics.integrations.github.export_sprint_data_to_object",
            mock_graphql_sprintboard_data)
def output() -> list[dict]|None:
    """Call the new pipeline code to be used for comparison."""
    #extract_transform_and_load("config/github-projects.json", "2025-02-11")

    config_path = Path("config/github-projects.json")
    effective_date = "2025-02-11"
    config = load_config(config_path, GitHubProjectConfig)

    # validate effective_date

    return GitHubProjectETL(config).extract_and_transform_in_memory()
