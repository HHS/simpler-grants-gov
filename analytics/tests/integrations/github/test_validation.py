"""Test the validation schemas for GitHub API responses."""

from datetime import datetime

import pytest
from analytics.integrations.github.validation import (
    IssueContent,
    IterationValue,
    NumberValue,
    ProjectItem,
    RoadmapItem,
    SingleSelectValue,
    SprintItem,
)
from pydantic import ValidationError

# #############################################
# Test data constants
# #############################################

VALID_ISSUE_CONTENT = {
    "title": "Test Issue",
    "url": "https://github.com/test/repo/issues/1",
    "closed": True,
    "createdAt": "2024-01-01T00:00:00Z",
    "closedAt": "2024-01-02T00:00:00Z",
    "parent": {
        "title": "Test Parent",
        "url": "https://github.com/test/repo/issues/2",
    },
    "type": {
        "name": "Bug",
    },
}

VALID_ITERATION_VALUE = {
    "iterationId": "123",
    "title": "Sprint 1",
    "startDate": "2024-01-01",
    "duration": 14,
}

VALID_SINGLE_SELECT = {
    "optionId": "456",
    "name": "In Progress",
}


# #############################################
# Project items tests
# #############################################


class TestProjectItems:
    """Test cases for top-level project item schemas."""

    def test_project_item_fully_populated(self) -> None:
        """Test validating a fully populated project item."""
        data = {
            "content": VALID_ISSUE_CONTENT,
            "status": VALID_SINGLE_SELECT,
        }
        item = ProjectItem.model_validate(data)
        assert item.content.title == "Test Issue"
        assert item.status.name == "In Progress"

    def test_project_item_minimal(self) -> None:
        """Test validating a project item with only required fields."""
        data = {
            "content": VALID_ISSUE_CONTENT,
        }
        item = ProjectItem.model_validate(data)
        assert item.status.name is None
        assert item.status.option_id is None


class TestRoadmapItems:
    """Test cases for roadmap item schemas."""

    def test_fully_populated(self) -> None:
        """Test validating a fully populated roadmap item."""
        data = {
            "content": VALID_ISSUE_CONTENT,
            "status": VALID_SINGLE_SELECT,
            "quad": VALID_ITERATION_VALUE,
            "pillar": VALID_SINGLE_SELECT,
        }
        item = RoadmapItem.model_validate(data)
        assert item.quad.title == "Sprint 1"
        assert item.pillar.name == "In Progress"

    def test_with_nulls(self) -> None:
        """Test validating a roadmap item with null values."""
        data = {
            "content": {
                "title": "Test Issue",
                "url": "https://github.com/test/repo/issues/1",
                "closed": True,
                "createdAt": "2024-01-01T00:00:00Z",
                "closedAt": "2024-01-02T00:00:00Z",
                "type": None,
                "parent": None,
            },
            "quad": None,
            "pillar": None,
            "status": None,
        }
        item = RoadmapItem.model_validate(data)
        assert item.quad.title is None
        assert item.quad.iteration_id is None
        assert item.pillar.name is None
        assert item.pillar.option_id is None
        assert item.status.name is None
        assert item.status.option_id is None


class TestSprintItem:
    """Test cases for sprint item schemas."""

    def test_fully_populated(self) -> None:
        """Test validating a fully populated sprint item."""
        data = {
            "content": VALID_ISSUE_CONTENT,
            "status": VALID_SINGLE_SELECT,
            "sprint": VALID_ITERATION_VALUE,
            "points": {"number": 5},
        }
        item = SprintItem.model_validate(data)
        assert item.sprint.title == "Sprint 1"
        assert item.points.number == 5

    def test_with_nulls(self) -> None:
        """Test validating a sprint item with null values."""
        data = {
            "content": {
                "title": "Test Issue",
                "url": "https://github.com/test/repo/issues/1",
                "closed": True,
                "createdAt": "2024-01-01T00:00:00Z",
                "closedAt": "2024-01-02T00:00:00Z",
                "type": None,
                "parent": None,
            },
            "sprint": None,
            "points": None,
            "status": None,
        }
        item = SprintItem(**data)
        assert item.sprint.title is None
        assert item.sprint.iteration_id is None
        assert item.points.number is None
        assert item.status.name is None
        assert item.status.option_id is None


# #############################################
# Issue content tests
# #############################################


class TestIssueContent:
    """Test cases for issue content schemas."""

    def test_fully_populated(self) -> None:
        """Test validating a fully populated issue content."""
        issue = IssueContent.model_validate(VALID_ISSUE_CONTENT)
        assert issue.title == "Test Issue"
        assert issue.url == "https://github.com/test/repo/issues/1"
        assert issue.closed is True
        assert issue.parent.title == "Test Parent"
        assert issue.issue_type.name == "Bug"

    def test_minimal(self) -> None:
        """Test validating an issue content with only required fields."""
        minimal_content = {
            "title": "Test Issue",
            "url": "https://github.com/test/repo/issues/1",
            "closed": False,
            "createdAt": "2024-01-01T00:00:00Z",
        }
        issue = IssueContent.model_validate(minimal_content)
        assert issue.closed_at is None
        assert issue.parent.title is None
        assert issue.parent.url is None
        assert issue.issue_type.name is None

    def test_with_nulls(self) -> None:
        """Test validating an issue content with null values."""
        data = {
            "title": "Test Issue",
            "url": "https://github.com/test/repo/issues/1",
            "closed": True,
            "createdAt": "2024-01-01T00:00:00Z",
            "closedAt": None,
            "type": None,
            "parent": None,
        }
        issue = IssueContent.model_validate(data)
        assert issue.title == "Test Issue"
        assert issue.closed_at is None
        assert issue.issue_type.name is None
        assert issue.parent.title is None
        assert issue.parent.url is None

    def test_missing_title_raises_error(self) -> None:
        """Test that validation fails when title is missing."""
        with pytest.raises(ValidationError):
            IssueContent.model_validate(
                {
                    "url": "https://github.com/test/repo/issues/1",
                    "closed": True,
                    "createdAt": "2024-01-01T00:00:00Z",
                },
            )

    def test_missing_url_raises_error(self) -> None:
        """Test that validation fails when url is missing."""
        with pytest.raises(ValidationError):
            IssueContent.model_validate(
                {
                    "title": "Test Issue",
                    "closed": True,
                    "createdAt": "2024-01-01T00:00:00Z",
                },
            )

    def test_missing_closed_raises_error(self) -> None:
        """Test that validation fails when closed is missing."""
        with pytest.raises(ValidationError):
            IssueContent.model_validate(
                {
                    "title": "Test Issue",
                    "url": "https://github.com/test/repo/issues/1",
                    "createdAt": "2024-01-01T00:00:00Z",
                },
            )

    def test_missing_created_at_raises_error(self) -> None:
        """Test that validation fails when createdAt is missing."""
        with pytest.raises(ValidationError):
            IssueContent.model_validate(
                {
                    "title": "Test Issue",
                    "url": "https://github.com/test/repo/issues/1",
                    "closed": True,
                },
            )


# #############################################
# Project field tests
# #############################################


class TestProjectFields:
    """Test cases for project field schemas."""

    def test_iteration_value_fully_populated(self) -> None:
        """Test validating a fully populated iteration value."""
        iteration = IterationValue.model_validate(VALID_ITERATION_VALUE)
        assert iteration.iteration_id == "123"
        assert iteration.title == "Sprint 1"
        assert iteration.start_date == "2024-01-01"
        assert iteration.duration == 14
        assert iteration.end_date == "2024-01-15"

    def test_iteration_value_with_empty_data(self) -> None:
        """Test validating an iteration value with empty data."""
        iteration = IterationValue.model_validate({})
        assert iteration.iteration_id is None
        assert iteration.title is None
        assert iteration.start_date is None
        assert iteration.duration is None
        assert iteration.end_date is None

    def test_single_select_value_fully_populated(self) -> None:
        """Test validating a fully populated single select value."""
        select = SingleSelectValue.model_validate(VALID_SINGLE_SELECT)
        assert select.option_id == "456"
        assert select.name == "In Progress"

    def test_number_value_with_number(self) -> None:
        """Test validating number value with a number."""
        with_value = NumberValue.model_validate({"number": 5})
        assert with_value.number == 5

    def test_number_value_with_empty_data(self) -> None:
        """Test validating number value with empty data."""
        without_value = NumberValue.model_validate({})
        assert without_value.number is None
