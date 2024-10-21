"""Tests the code in datasets/issues.py."""

from analytics.datasets.issues import IssueMetadata, IssueType, get_parent_with_type


def issue(
    name: str,
    kind: IssueType,
    parent: str | None = None,
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
    )


class TestGetParentWithType:
    """Tests the get_parent_with_type() method."""

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
