"""Test the cli entrypoints."""

from dataclasses import dataclass  # noqa: I001
from pathlib import Path

import pytest
from typer.testing import CliRunner

from analytics.cli import app
from tests.conftest import (
    json_issue_row,
    json_sprint_row,
    issue,
    write_test_data_to_file,
)

runner = CliRunner()


@dataclass
class MockFiles:
    """Store paths to stub files for testing."""

    issue_file: Path
    sprint_file: Path
    delivery_file: Path


@pytest.fixture(name="mock_files")
def test_file_fixtures(tmp_path: Path) -> MockFiles:
    """Create test files to use in unit tests."""
    # set paths to test files
    issue_file = tmp_path / "data" / "issue-data.json"
    sprint_file = tmp_path / "data" / "sprint-data.json"
    delivery_file = tmp_path / "data" / "delivery-data.json"
    # create test data
    sprint_data = [json_sprint_row(issue=1, parent_number=2)]
    issue_data = [
        json_issue_row(issue=1, labels=["task"]),
        json_issue_row(issue=2, labels=["deliverable: 30k ft"]),
    ]
    delivery_data = [
        issue(issue=1).model_dump(),
        issue(issue=2).model_dump(),
    ]
    # write test data to json files
    write_test_data_to_file(issue_data, issue_file)
    write_test_data_to_file({"items": sprint_data}, sprint_file)
    write_test_data_to_file(delivery_data, delivery_file)
    # confirm the data was written
    assert issue_file.exists()
    assert sprint_file.exists()
    # return paths to output files
    return MockFiles(
        issue_file=issue_file,
        sprint_file=sprint_file,
        delivery_file=delivery_file,
    )


class TestEtlEntryPoint:
    """Test the etl entry point."""

    TEST_FILE_1 = "./tests/etldb_test_01.json"
    EFFECTIVE_DATE = "2024-10-07"

    def test_init_db(self):
        """Test the db initialization command."""
        # setup - create command
        command = [
            "etl",
            "db_migrate",
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        assert "initializing database" in result.stdout
        assert "done" in result.stdout

    def test_transform_and_load_with_valid_parameters(self):
        """Test the transform and load command."""
        # setup - create command
        command = [
            "etl",
            "transform_and_load",
            "--issue-file",
            self.TEST_FILE_1,
            "--effective-date",
            str(self.EFFECTIVE_DATE),
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        assert (
            f"running transform and load with effective date {self.EFFECTIVE_DATE}"
            in result.stdout
        )
        assert "project row(s) processed: 2" in result.stdout
        assert "quad row(s) processed: 1" in result.stdout
        assert "deliverable row(s) processed: 4" in result.stdout
        assert "sprint row(s) processed: 4" in result.stdout
        assert "epic row(s) processed: 6" in result.stdout
        assert "issue row(s) processed: 22" in result.stdout
        assert "transform and load is done" in result.stdout

    def test_transform_and_load_with_malformed_effective_date_parameter(self):
        """Test the transform and load command."""
        # setup - create command
        command = [
            "etl",
            "transform_and_load",
            "--issue-file",
            self.TEST_FILE_1,
            "--effective-date",
            "2024-Oct-07",
        ]
        # execution
        result = runner.invoke(app, command)
        print(result.stdout)
        # validation - check there wasn't an error
        assert result.exit_code == 0
        assert "FATAL ERROR: malformed effective date" in result.stdout
