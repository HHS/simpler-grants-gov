"""Tests the code in datasets/issues.py."""

from pathlib import Path

from analytics.datasets.issues import (
    GitHubIssues,
    IssueMetadata,
    IssueType,
    get_parent_with_type,
)
from analytics.datasets.utils import dump_to_json


def issue(
    name: str,
    kind: IssueType = IssueType.TASK,
    parent: str | None = None,
    points: int | None = None,
    quad: str | None = None,
    epic: str | None = None,
    deliverable: str | None = None,
) -> IssueMetadata:
    """Create a new issue."""
    return IssueMetadata(
        issue_title=name,
        issue_type=kind,
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
    )


class TestGitHubIssues:
    """Test the GitHubIssues.load_from_json_files() class method."""

    def test_load_from_json_files(self, tmp_path: Path):
        """Class method should return the correctly transformed data."""
        # Arrange - create dummy sprint data
        sprint_file = tmp_path / "sprint-data.json"
        sprint_data = [
            issue(name="task1", kind=IssueType.TASK, parent="epic1", points=2),
            issue(name="task2", kind=IssueType.TASK, parent="epic2", points=1),
        ]
        roadmap_data = [i.model_dump() for i in sprint_data]
        dump_to_json(str(sprint_file), roadmap_data)
        # Act - create dummy roadmap data
        roadmap_file = tmp_path / "roadmap-data.json"
        roadmap_data = [
            issue(name="epic1", kind=IssueType.EPIC, parent="del1"),
            issue(name="epic2", kind=IssueType.EPIC, parent="del2"),
            issue(name="del1", kind=IssueType.DELIVERABLE, quad="quad1"),
        ]
        roadmap_data = [i.model_dump() for i in roadmap_data]
        dump_to_json(str(roadmap_file), roadmap_data)
        # Arrange
        output_data = [
            issue(
                name="task1",
                points=2,
                parent="epic1",
                deliverable="del1",
                quad="quad1",
                epic="epic1",
            ),
            issue(
                name="task2",
                points=1,
                parent="epic2",
                deliverable=None,
                quad=None,
                epic="epic2",
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
        task = "task"
        lookup = {
            task: issue(name=task, kind=IssueType.TASK, parent="epic"),
            "epic": issue(name=task, kind=IssueType.EPIC, parent=None),
        }
        wanted = lookup["epic"]
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
        task = "task"
        lookup = {
            task: issue(name=task, kind=IssueType.TASK, parent="epic"),
            "epic": issue(name=task, kind=IssueType.EPIC, parent="deliverable"),
            "deliverable": issue(name=task, kind=IssueType.DELIVERABLE, parent=None),
        }
        wanted = lookup["deliverable"]
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
            task: issue(name=task, kind=IssueType.TASK, parent=None),
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
        task = "task"
        lookup = {
            task: issue(name=task, kind=IssueType.TASK, parent="parent"),
            "parent": issue(name=task, kind=IssueType.TASK, parent=task),
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
        task = "task"
        lookup = {
            task: issue(name=task, kind=IssueType.TASK, parent="parent"),
            "parent": issue(name=task, kind=IssueType.TASK, parent="epic"),
            "epic": issue(name=task, kind=IssueType.EPIC, parent=task),
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
