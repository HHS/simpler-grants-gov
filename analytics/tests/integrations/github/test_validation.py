"""Test the validation schemas for GitHub API responses."""

from datetime import datetime

import pytest
from analytics.integrations.github.validation import (
    IssueContent,
    IssueParent,
    IssueType,
    IterationValue,
    NumberValue,
    ProjectItem,
    RoadmapItem,
    SingleSelectValue,
    SprintItem,
)
from pydantic import ValidationError


@pytest.fixture
def valid_issue_content() -> dict:
    """Fixture for a fully populated issue content."""
    return {
        "title": "Test Issue",
        "url": "https://github.com/test/repo/issues/1",
        "closed": True,
        "createdAt": "2024-01-01T00:00:00Z",
        "closedAt": "2024-01-02T00:00:00Z",
    }


@pytest.fixture
def valid_iteration_value() -> dict:
    """Fixture for a fully populated iteration value."""
    return {
        "iterationId": "123",
        "title": "Sprint 1",
        "startDate": "2024-01-01",
        "duration": 14,
    }


@pytest.fixture
def valid_single_select() -> dict:
    """Fixture for a fully populated single select value."""
    return {
        "optionId": "456",
        "name": "In Progress",
    }


class TestProjectItems:
    """Test cases for top-level project item schemas."""

    def test_project_item_fully_populated(
        self,
        valid_issue_content: dict,
        valid_single_select: dict,
    ) -> None:
        """Test validating a fully populated project item."""
        data = {
            "content": valid_issue_content,
            "status": valid_single_select,
        }
        item = ProjectItem.model_validate(data)
        assert isinstance(item.content, IssueContent)
        assert isinstance(item.status, SingleSelectValue)

    def test_project_item_minimal(self, valid_issue_content: dict) -> None:
        """Test validating a project item with only required fields."""
        data = {
            "content": valid_issue_content,
        }
        item = ProjectItem.model_validate(data)
        assert item.status is None

    def test_roadmap_item_fully_populated(
        self,
        valid_issue_content: dict,
        valid_single_select: dict,
        valid_iteration_value: dict,
    ) -> None:
        """Test validating a fully populated roadmap item."""
        data = {
            "content": valid_issue_content,
            "status": valid_single_select,
            "quad": valid_iteration_value,
            "pillar": valid_single_select,
        }
        item = RoadmapItem.model_validate(data)
        assert isinstance(item.quad, IterationValue)
        assert isinstance(item.pillar, SingleSelectValue)

    def test_sprint_item_fully_populated(
        self,
        valid_issue_content: dict,
        valid_single_select: dict,
        valid_iteration_value: dict,
    ) -> None:
        """Test validating a fully populated sprint item."""
        data = {
            "content": valid_issue_content,
            "status": valid_single_select,
            "sprint": valid_iteration_value,
            "points": {"number": 5},
        }
        item = SprintItem.model_validate(data)
        assert isinstance(item.sprint, IterationValue)
        assert isinstance(item.points, NumberValue)
        assert item.points.number == 5

    def test_sprint_item_minimal(self, valid_issue_content: dict) -> None:
        """Test validating a sprint item with only required fields."""
        data = {
            "content": valid_issue_content,
        }
        item = SprintItem.model_validate(data)
        assert item.sprint is None
        assert item.points is None
        assert item.status is None


class TestIssueContent:
    """Test cases for issue content schemas."""

    def test_issue_content_fully_populated(self, valid_issue_content: dict) -> None:
        """Test validating a fully populated issue content."""
        issue = IssueContent.model_validate(valid_issue_content)
        assert issue.title == "Test Issue"
        assert issue.url == "https://github.com/test/repo/issues/1"
        assert issue.closed is True
        assert isinstance(issue.created_at, datetime)
        assert isinstance(issue.closed_at, datetime)

    def test_issue_content_minimal(self) -> None:
        """Test validating an issue content with only required fields."""
        minimal_content = {
            "title": "Test Issue",
            "url": "https://github.com/test/repo/issues/1",
            "closed": False,
            "createdAt": "2024-01-01T00:00:00Z",
        }
        issue = IssueContent.model_validate(minimal_content)
        assert issue.closed_at is None

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

    def test_issue_parent_with_empty_data(self) -> None:
        """Test validating issue parent with empty data."""
        parent = IssueParent.model_validate({})
        assert parent.title is None
        assert parent.url is None

    def test_issue_type_with_name(self) -> None:
        """Test validating issue type with a name value."""
        type_with_value = IssueType.model_validate({"name": "Bug"})
        assert type_with_value.name == "Bug"

    def test_issue_type_with_empty_data(self) -> None:
        """Test validating issue type with empty data."""
        type_without_value = IssueType.model_validate({})
        assert type_without_value.name is None


class TestProjectFields:
    """Test cases for project field schemas."""

    def test_iteration_value_fully_populated(self, valid_iteration_value: dict) -> None:
        """Test validating a fully populated iteration value."""
        iteration = IterationValue.model_validate(valid_iteration_value)
        assert iteration.iteration_id == "123"
        assert iteration.title == "Sprint 1"
        assert iteration.start_date == "2024-01-01"
        assert iteration.duration == 14

    def test_iteration_value_with_empty_data(self) -> None:
        """Test validating an iteration value with empty data."""
        iteration = IterationValue.model_validate({})
        assert iteration.iteration_id is None
        assert iteration.title is None
        assert iteration.start_date is None
        assert iteration.duration is None

    def test_single_select_value_fully_populated(
        self,
        valid_single_select: dict,
    ) -> None:
        """Test validating a fully populated single select value."""
        select = SingleSelectValue.model_validate(valid_single_select)
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
