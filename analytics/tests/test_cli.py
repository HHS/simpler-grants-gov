"""Test the cli entrypoints."""
from dataclasses import dataclass  # noqa: I001
from pathlib import Path

import pytest
from typer.testing import CliRunner

from analytics.cli import app
from tests.conftest import (
    json_issue_row,
    json_sprint_row,
    write_test_data_to_file,
)

runner = CliRunner()


@dataclass
class MockFiles:
    """Store paths to stub files for testing."""

    issue_file: Path
    sprint_file: Path


@pytest.fixture(name="mock_files")
def test_file_fixtures(tmp_path: Path) -> MockFiles:
    """Create test files to use in unit tests."""
    # set paths to test files
    issue_file = tmp_path / "data" / "issue-data.json"
    sprint_file = tmp_path / "data" / "sprint-data.json"
    # create test data
    sprint_data = [json_sprint_row(issue=1, parent_number=2)]
    issue_data = [
        json_issue_row(issue=1, labels=["task"]),
        json_issue_row(issue=2, labels=["deliverable: 30k ft"]),
    ]
    # write test data to json files
    write_test_data_to_file(issue_data, issue_file)
    write_test_data_to_file({"items": sprint_data}, sprint_file)
    # confirm the data was written
    assert issue_file.exists()
    assert sprint_file.exists()
    # return paths to output files
    return MockFiles(
        issue_file=issue_file,
        sprint_file=sprint_file,
    )


class TestCalculateSprintBurndown:
    """Test the calculate_sprint_burndown entry point with mock data."""

    def test_without_showing_or_posting_results(self, mock_files: MockFiles):
        """Entrypoint should run successfully but not print slack message to stdout."""
        # setup - create command
        command = [
            "calculate",
            "sprint_burndown",
            "--sprint-file",
            str(mock_files.sprint_file),
            "--issue-file",
            str(mock_files.issue_file),
            "--sprint",
            "Sprint 1",
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        assert "Slack message" not in result.stdout

    def test_stdout_message_includes_points_if_no_unit_is_set(
        self,
        mock_files: MockFiles,
    ):
        """CLI should uses 'points' as default unit and include it in stdout message."""
        # setup - create command
        command = [
            "calculate",
            "sprint_burndown",
            "--sprint-file",
            str(mock_files.sprint_file),
            "--issue-file",
            str(mock_files.issue_file),
            "--sprint",
            "Sprint 1",
            "--show-results",
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        # validation - check that slack message is printed and includes 'points'
        assert "Slack message" in result.stdout
        assert "points" in result.stdout

    def test_stdout_message_includes_issues_if_unit_set_to_issues(
        self,
        mock_files: MockFiles,
    ):
        """CLI should use issues if set explicitly and include it in stdout."""
        # setup - create command
        command = [
            "calculate",
            "sprint_burndown",
            "--sprint-file",
            str(mock_files.sprint_file),
            "--issue-file",
            str(mock_files.issue_file),
            "--sprint",
            "Sprint 1",
            "--unit",
            "issues",
            "--show-results",
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        # validation - check that slack message is printed and includes 'points'
        assert "Slack message" in result.stdout
        assert "issues" in result.stdout


class TestCalculateDeliverablePercentComplete:
    """Test the calculate_deliverable_percent_complete entry point with mock data."""

    def test_calculate_deliverable_percent_complete(self, mock_files: MockFiles):
        """Entrypoint should run successfully but not print slack message to stdout."""
        # setup - create command
        command = [
            "calculate",
            "deliverable_percent_complete",
            "--sprint-file",
            str(mock_files.sprint_file),
            "--issue-file",
            str(mock_files.issue_file),
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        assert "Slack message" not in result.stdout

    def test_stdout_message_includes_points_if_no_unit_is_set(
        self,
        mock_files: MockFiles,
    ):
        """CLI should uses 'points' as default unit and include it in stdout message."""
        # setup - create command
        command = [
            "calculate",
            "deliverable_percent_complete",
            "--sprint-file",
            str(mock_files.sprint_file),
            "--issue-file",
            str(mock_files.issue_file),
            "--show-results",
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        # validation - check that slack message is printed and includes 'points'
        assert "Slack message" in result.stdout
        assert "points" in result.stdout

    def test_stdout_message_includes_issues_if_unit_set_to_issues(
        self,
        mock_files: MockFiles,
    ):
        """CLI should use issues if set explicitly and include it in stdout."""
        # setup - create command
        command = [
            "calculate",
            "deliverable_percent_complete",
            "--sprint-file",
            str(mock_files.sprint_file),
            "--issue-file",
            str(mock_files.issue_file),
            "--unit",
            "issues",
            "--show-results",
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        # validation - check that slack message is printed and includes 'points'
        assert "Slack message" in result.stdout
        assert "issues" in result.stdout
