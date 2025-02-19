"""Test the validation schemas for GitHub API responses."""

import pytest  # noqa: I001
from pydantic import ValidationError
from analytics.integrations.github.main import transform_project_data
from analytics.integrations.github.validation import (
    IssueContent,
    IterationValue,
    NumberValue,
    ProjectItem,
    SingleSelectValue,
)

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
    "issueType": {
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


class TestTransformProjectData:
    """Test cases for the entire transform function."""

    def test_content_none(self) -> None:
        """Test validating a project item that has none for it's content filters that item out."""
        data = [
            {
                "content": None,
                "status": None,
                "sprint": None,
                "points": None,
                "quad": None,
                "pillar": None,
            },
            {
                "content": VALID_ISSUE_CONTENT,
                "status": VALID_SINGLE_SELECT,
                "sprint": VALID_ITERATION_VALUE,
                "points": {"number": 5},
                "quad": VALID_ITERATION_VALUE,
                "pillar": VALID_SINGLE_SELECT,
            },
        ]
        result = transform_project_data(data, "test", project=17)

        assert len(result) == 1
        print(result[0])
        assert result[0]["issue_title"] == "Test Issue"


# #############################################
# Project items tests
# #############################################


class TestProjectItems:
    """Test cases for project item schemas."""

    def test_fully_populated(self) -> None:
        """Test validating a fully populated project item."""
        data = {
            "content": VALID_ISSUE_CONTENT,
            "status": VALID_SINGLE_SELECT,
            "sprint": VALID_ITERATION_VALUE,
            "points": {"number": 5},
            "quad": VALID_ITERATION_VALUE,
            "pillar": VALID_SINGLE_SELECT,
        }
        item = ProjectItem.model_validate(data)
        # Check issue content
        assert item.content.title == "Test Issue"
        assert item.status.name == "In Progress"
        # Check sprint fields
        assert item.sprint.title == "Sprint 1"
        assert item.points.number == 5
        # Check roadmap fields
        assert item.quad.title == "Sprint 1"
        assert item.pillar.name == "In Progress"

    def test_minimal(self) -> None:
        """Test validating a project item with only required fields."""
        data = {
            "content": VALID_ISSUE_CONTENT,
        }
        item = ProjectItem.model_validate(data)
        # Check status defaults
        assert item.status.name is None
        assert item.status.option_id is None
        # Check sprint defaults
        assert item.sprint.title is None
        assert item.sprint.iteration_id is None
        assert item.points.number is None
        # Check roadmap defaults
        assert item.quad.title is None
        assert item.quad.iteration_id is None
        assert item.pillar.name is None
        assert item.pillar.option_id is None

    def test_with_nulls(self) -> None:
        """Test validating a project item with null values explicitly set."""
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
            "status": None,
            "sprint": None,
            "points": None,
            "quad": None,
            "pillar": None,
        }
        item = ProjectItem.model_validate(data)
        # Check status defaults
        assert item.status.name is None
        assert item.status.option_id is None
        # Check sprint defaults
        assert item.sprint.title is None
        assert item.sprint.iteration_id is None
        assert item.points.number is None
        # Check roadmap defaults
        assert item.quad.title is None
        assert item.quad.iteration_id is None
        assert item.pillar.name is None
        assert item.pillar.option_id is None


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
