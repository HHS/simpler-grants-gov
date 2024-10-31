"""Tests the code in datasets/issues.py."""

from pathlib import Path

import pandas as pd
import pytest
from analytics.datasets.issues import (
    GitHubIssues,
    IssueType,
    get_parent_with_type,
)
from analytics.datasets.utils import dump_to_json

from tests.conftest import (
    DAY_0,
    DAY_1,
    DAY_2,
    DAY_3,
    DAY_4,
    DAY_5,
    issue,
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


class TestGetSprintNameFromDate:
    """Test the GitHubIssues.get_sprint_name_from_date() method."""

    @pytest.mark.parametrize(
        ("date", "expected"),
        [
            (DAY_1, "Sprint 1"),
            (DAY_2, "Sprint 1"),
            (DAY_4, "Sprint 2"),
            (DAY_5, "Sprint 2"),
        ],
    )
    def test_return_name_if_matching_sprint_exists(self, date: str, expected: str):
        """Test that correct sprint is returned if date exists in a sprint."""
        # setup - create sample dataset
        board_data = [
            issue(issue=1, sprint=1, sprint_start=DAY_0, sprint_length=3),
            issue(issue=2, sprint=1, sprint_start=DAY_0, sprint_length=3),
            issue(issue=3, sprint=2, sprint_start=DAY_3, sprint_length=3),
        ]
        board_data = [i.__dict__ for i in board_data]
        board = GitHubIssues.from_dict(board_data)
        # validation
        sprint_date = pd.Timestamp(date)
        sprint_name = board.get_sprint_name_from_date(sprint_date)
        assert sprint_name == expected

    def test_return_none_if_no_matching_sprint(self):
        """The method should return None if no sprint contains the date."""
        # setup - create sample dataset
        board_data = [
            issue(issue=1, sprint=1, sprint_start=DAY_1),
            issue(issue=2, sprint=2, sprint_start=DAY_4),
        ]
        board_data = [i.__dict__ for i in board_data]
        board = GitHubIssues.from_dict(board_data)
        # validation
        bad_date = pd.Timestamp("1900-01-01")
        sprint_name = board.get_sprint_name_from_date(bad_date)
        assert sprint_name is None

    def test_return_previous_sprint_if_date_is_start_of_next_sprint(self):
        """
        Test correct behavior for sprint end/start dates.

        If date provided is both the the end of one sprint and the beginning of
        another, then return the name of the sprint that just ended.
        """
        # setup - create sample dataset
        board_data = [
            issue(issue=1, sprint=1, sprint_start=DAY_1, sprint_length=2),
            issue(issue=2, sprint=2, sprint_start=DAY_3, sprint_length=2),
        ]
        board_data = [i.__dict__ for i in board_data]
        board = GitHubIssues.from_dict(board_data)
        # execution
        bad_date = pd.Timestamp(DAY_3)  # end of sprint 1 and start of sprint 2
        sprint_name = board.get_sprint_name_from_date(bad_date)
        assert sprint_name == "Sprint 1"
