"""Tests the code in datasets/issues.py."""

from pathlib import Path

import pandas as pd
from analytics.datasets.issues import (
    GitHubIssues,
    IssueMetadata,
    IssueType,
    get_parent_with_type,
)
from analytics.datasets.utils import dump_to_json

from tests.conftest import DAY_0


def issue(
    issue: int,
    kind: IssueType = IssueType.TASK,
    parent: str | None = None,
    points: int | None = None,
    quad: str | None = None,
    epic: str | None = None,
    deliverable: str | None = None,
    sprint: int = 1,
    sprint_start: str = DAY_0,
    sprint_length: int = 2,
) -> IssueMetadata:
    """Create a new issue."""
    # Create issue name
    name = f"{kind.value}{issue}"
    # create timestamp and time delta fields
    sprint_name = f"Sprint{sprint}"
    sprint_start_ts = pd.Timestamp(sprint_start)
    sprint_duration = pd.Timedelta(days=sprint_length)
    sprint_end_ts = sprint_start_ts + sprint_duration
    sprint_end = sprint_end_ts.strftime("%Y-%m-%d")
    print(f"Sprint End: {sprint_end}")
    return IssueMetadata(
        issue_title=name,
        issue_type=kind.value,
        issue_url=name,
        issue_is_closed=False,
        issue_opened_at="2024-02-01",
        issue_closed_at=None,
        issue_parent=parent,
        issue_points=points,
        quad_name=quad,
        epic_title=epic,
        epic_url=epic,
        deliverable_title=deliverable,
        deliverable_url=deliverable,
        sprint_id=sprint_name,
        sprint_name=sprint_name,
        sprint_start=sprint_start,
        sprint_end=sprint_end,
    )


class TestGitHubIssues:
    """Test the GitHubIssues.load_from_json_files() class method."""

    def test_load_from_json_files(self, tmp_path: Path):
        """Class method should return the correctly transformed data."""
        # Arrange - create dummy sprint data
        sprint_file = tmp_path / "sprint-data.json"
        sprint_data = [
            issue(issue=1, kind=IssueType.TASK, parent="Epic3", points=2),
            issue(issue=2, kind=IssueType.TASK, parent="Epic4", points=1),
        ]
        roadmap_data = [i.model_dump() for i in sprint_data]
        dump_to_json(str(sprint_file), roadmap_data)
        # Act - create dummy roadmap data
        roadmap_file = tmp_path / "roadmap-data.json"
        roadmap_data = [
            issue(issue=3, kind=IssueType.EPIC, parent="Deliverable5"),
            issue(issue=4, kind=IssueType.EPIC, parent="Deliverable6"),
            issue(issue=5, kind=IssueType.DELIVERABLE, quad="quad1"),
        ]
        roadmap_data = [i.model_dump() for i in roadmap_data]
        dump_to_json(str(roadmap_file), roadmap_data)
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
        # Act
        got = GitHubIssues.load_from_json_files(
            sprint_file=str(sprint_file),
            roadmap_file=str(roadmap_file),
        )
        # Assert
        assert got.to_dict() == wanted


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
