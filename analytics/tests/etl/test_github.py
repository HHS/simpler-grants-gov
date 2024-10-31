# ruff: noqa: SLF001
# pylint: disable=protected-access
"""Test the GitHubProjectETL class."""

from pathlib import Path
from unittest.mock import MagicMock

import pytest
from analytics.datasets.issues import GitHubIssues, InputFiles
from analytics.etl.github import (
    GitHubProjectConfig,
    GitHubProjectETL,
    RoadmapConfig,
    SprintBoardConfig,
)


@pytest.fixture(name="config")
def mock_config() -> GitHubProjectConfig:
    """Fixture to create a sample configuration for testing."""
    return GitHubProjectConfig(
        roadmap_project=RoadmapConfig(owner="test_owner", project_number=1),
        sprint_projects=[SprintBoardConfig(owner="test_owner", project_number=2)],
        temp_dir="test_data",
        output_file="test_output.json",
    )


@pytest.fixture(name="etl")
def mock_etl(config: GitHubProjectConfig):
    """Fixture to initialize the ETL pipeline."""
    return GitHubProjectETL(config)


def test_extract(monkeypatch: pytest.MonkeyPatch, etl: GitHubProjectETL):
    """Test the extract step by mocking export functions."""
    mock_export_roadmap_data = MagicMock()
    mock_export_sprint_data = MagicMock()
    monkeypatch.setattr(etl, "_export_roadmap_data", mock_export_roadmap_data)
    monkeypatch.setattr(etl, "_export_sprint_data", mock_export_sprint_data)

    # Run the extract method
    etl.extract()

    # Assert roadmap export was called with expected arguments
    roadmap = etl.config.roadmap_project
    mock_export_roadmap_data.assert_called_once_with(
        roadmap=roadmap,
        output_file=str(Path(etl.config.temp_dir) / "roadmap-data.json"),
    )

    # Assert sprint export was called with expected arguments
    sprint_board = etl.config.sprint_projects[0]
    mock_export_sprint_data.assert_called_once_with(
        sprint_board=sprint_board,
        output_file=str(
            Path(etl.config.temp_dir)
            / f"sprint-data-{sprint_board.project_number}.json",
        ),
    )

    # Verify transient files were set correctly
    assert len(etl._transient_files) == 1
    assert etl._transient_files[0].roadmap.endswith("roadmap-data.json")
    assert etl._transient_files[0].sprint.endswith(
        f"sprint-data-{sprint_board.project_number}.json",
    )


def test_transform(monkeypatch: pytest.MonkeyPatch, etl: GitHubProjectETL):
    """Test the transform step by mocking GitHubIssues.load_from_json_files."""
    mock_load_from_json_files = MagicMock(return_value="mock_dataset")
    monkeypatch.setattr(GitHubIssues, "load_from_json_files", mock_load_from_json_files)

    # Provide a sample transient file to `etl`
    etl._transient_files = [InputFiles(roadmap="roadmap.json", sprint="sprint.json")]

    # Run the transform method
    etl.transform()

    # Check if load_from_json_files was called with correct files
    mock_load_from_json_files.assert_called_once_with(etl._transient_files)

    # Verify that the dataset was assigned correctly
    assert etl._dataset == "mock_dataset"


def test_load(etl: GitHubProjectETL):
    """Test the load step by mocking the to_json method."""
    mock_to_json = MagicMock()
    etl._dataset = MagicMock()
    etl._dataset.to_json = mock_to_json

    # Run the load method
    etl.load()

    # Check if to_json was called with the correct output file
    mock_to_json.assert_called_once_with(etl.config.output_file)


def test_run(monkeypatch: pytest.MonkeyPatch, etl: GitHubProjectETL):
    """Test the entire ETL pipeline by verifying method calls in run."""
    # Mock the extract, transform, and load methods
    mock_extract = MagicMock()
    mock_transform = MagicMock()
    mock_load = MagicMock()
    monkeypatch.setattr(etl, "extract", mock_extract)
    monkeypatch.setattr(etl, "transform", mock_transform)
    monkeypatch.setattr(etl, "load", mock_load)

    # Run the entire ETL process
    etl.run()

    # Verify that each step was called once
    mock_extract.assert_called_once()
    mock_transform.assert_called_once()
    mock_load.assert_called_once()
