# ruff: noqa: SLF001
# pylint: disable=protected-access
"""Test the GitHubProjectETL class."""

from pathlib import Path
from unittest.mock import MagicMock

import pytest
from analytics.datasets.issues import IssueType
from analytics.datasets.utils import dump_to_json
from analytics.etl.github import (
    GitHubProjectConfig,
    GitHubProjectETL,
    InputFiles,
    RoadmapConfig,
    SprintBoardConfig,
    get_parent_with_type,
)

from tests.conftest import issue


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


def test_transform(tmp_path: Path, etl: GitHubProjectETL):
    """Test the transform step by mocking GitHubIssues.load_from_json_files."""
    # Arrange - create dummy sprint data
    sprint_file = str(tmp_path / "sprint-data.json")
    sprint_data = [
        issue(issue=1, kind=IssueType.TASK, parent="Epic3", points=2),
        issue(issue=2, kind=IssueType.TASK, parent="Epic4", points=1),
    ]
    roadmap_data = [i.model_dump() for i in sprint_data]
    dump_to_json(sprint_file, roadmap_data)
    # Act - create dummy roadmap data
    roadmap_file = str(tmp_path / "roadmap-data.json")
    roadmap_data = [
        issue(issue=3, kind=IssueType.EPIC, parent="Deliverable5"),
        issue(issue=4, kind=IssueType.EPIC, parent="Deliverable6"),
        issue(issue=5, kind=IssueType.DELIVERABLE, quad="quad1"),
    ]
    roadmap_data = [i.model_dump() for i in roadmap_data]
    dump_to_json(roadmap_file, roadmap_data)
    # Arrange
    output_data = [
        issue(
            issue=1,
            points=2,
            parent="Epic3",
            deliverable="Deliverable5",
            quad="quad1",
            epic="Epic3",
        ),
        issue(
            issue=2,
            points=1,
            parent="Epic4",
            deliverable=None,
            quad=None,
            epic="Epic4",
        ),
    ]
    wanted = [i.model_dump() for i in output_data]
    etl._transient_files = [InputFiles(roadmap=roadmap_file, sprint=sprint_file)]
    # Act
    etl.transform()
    # Assert
    assert etl.dataset.to_dict() == wanted


def test_load(etl: GitHubProjectETL):
    """Test the load step by mocking the to_json method."""
    mock_to_json = MagicMock()
    etl.dataset = MagicMock()
    etl.dataset.to_json = mock_to_json

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


class TestGetParentWithType:
    """Test the get_parent_with_type() method."""

    def test_return_epic_that_is_direct_parent_of_issue(self):
        """Return the correct epic for an issue that is one level down."""
        # Arrange
        task = "Task1"
        epic = "Epic1"
        lookup = {
            task: issue(issue=1, kind=IssueType.TASK, parent=epic),
            epic: issue(issue=2, kind=IssueType.EPIC, parent=None),
        }
        wanted = lookup[epic]
        # Act
        got = get_parent_with_type(
            child_url=task,
            lookup=lookup,
            type_wanted=IssueType.EPIC,
        )
        # Assert
        assert got == wanted

    def test_return_correct_deliverable_that_is_grandparent_of_issue(self):
        """Return the correct deliverable for an issue that is two levels down."""
        # Arrange
        task = "Task1"
        epic = "Epic2"
        deliverable = "Deliverable3"
        lookup = {
            task: issue(issue=1, kind=IssueType.TASK, parent=epic),
            epic: issue(issue=2, kind=IssueType.EPIC, parent=deliverable),
            deliverable: issue(issue=3, kind=IssueType.DELIVERABLE, parent=None),
        }
        wanted = lookup[deliverable]
        # Act
        got = get_parent_with_type(
            child_url=task,
            lookup=lookup,
            type_wanted=IssueType.DELIVERABLE,
        )
        # Assert
        assert got == wanted

    def test_return_none_if_issue_has_no_parent(self):
        """Return None if the input issue has no parent."""
        # Arrange
        task = "task"
        lookup = {
            task: issue(issue=1, kind=IssueType.TASK, parent=None),
        }
        wanted = None
        # Act
        got = get_parent_with_type(
            child_url=task,
            lookup=lookup,
            type_wanted=IssueType.DELIVERABLE,
        )
        # Assert
        assert got == wanted

    def test_return_none_if_parents_form_a_cycle(self):
        """Return None if the issue hierarchy forms a cycle."""
        # Arrange
        task = "Task1"
        parent = "Task2"
        lookup = {
            task: issue(issue=1, kind=IssueType.TASK, parent="parent"),
            parent: issue(issue=2, kind=IssueType.TASK, parent=task),
        }
        wanted = None
        # Act
        got = get_parent_with_type(
            child_url=task,
            lookup=lookup,
            type_wanted=IssueType.DELIVERABLE,
        )
        # Assert
        assert got == wanted

    def test_return_none_if_deliverable_is_not_found_in_parents(self):
        """Return None if the desired type (e.g. epic) isn't found in the list of parents."""
        # Arrange
        task = "Task1"
        parent = "Task2"
        epic = "Epic3"
        lookup = {
            task: issue(issue=1, kind=IssueType.TASK, parent=parent),
            parent: issue(issue=2, kind=IssueType.TASK, parent=epic),
            epic: issue(issue=3, kind=IssueType.EPIC, parent=task),
        }
        wanted = None
        # Act
        got = get_parent_with_type(
            child_url=task,
            lookup=lookup,
            type_wanted=IssueType.DELIVERABLE,
        )
        # Assert
        assert got == wanted
