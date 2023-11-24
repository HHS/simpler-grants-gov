"""Tests for analytics/datasets/sprint_board.py."""

import pandas as pd
import pytest
from analytics.datasets.sprint_board import SprintBoard

from tests.conftest import (
    json_issue_row,
    json_sprint_row,
    write_test_data_to_file,
)

DAY_1 = "2023-11-01"
DAY_2 = "2023-11-02"
DAY_3 = "2023-11-03"
DAY_4 = "2023-11-04"
DAY_5 = "2023-11-05"


def sprint_board_row(
    issue: int,
    created: str = DAY_1,
    closed: str | None = None,
    status: str = "In Progress",
    points: int = 1,
    sprint: int = 1,
    sprint_start: str = DAY_1,
    sprint_length: int = 2,
) -> dict:
    """Create a sample row of the SprintBoard dataset."""
    # create timestamp and time delta fields
    sprint_start_ts = pd.Timestamp(sprint_start)
    sprint_duration = pd.Timedelta(days=sprint_length)
    sprint_end_ts = sprint_start_ts + sprint_duration
    created_date = pd.Timestamp(created, tz="UTC")
    closed_date = pd.Timestamp(closed, tz="UTC") if closed else None
    # return the sample record
    return {
        "issue_number": issue,
        "issue_title": f"Issue {issue}",
        "type": "issue",
        "issue_body": f"Description of issue {issue}",
        "status": "Done" if closed else status,
        "assignees": "mickeymouse",
        "labels": [],
        "url": f"https://github.com/HHS/simpler-grants-gov/issues/{issue}",
        "points": points,
        "milestone": "Milestone 1",
        "milestone_due_date": sprint_end_ts,
        "milestone_description": "Milestone 1 description",
        "sprint": f"Sprint {sprint}",
        "sprint_start_date": sprint_start_ts,
        "sprint_end_date": sprint_end_ts,
        "sprint_duration": sprint_duration,
        "created_date": created_date,
        "closed_date": closed_date,
    }


class TestSprintBoard:
    """Tests the SprintBoard data class."""

    ISSUE_FILE = "data/test-issue.json"
    SPRINT_FILE = "data/test-sprint.json"

    def test_get_sprint_start_and_end_dates(self):
        """Sprint start date should be returned correctly."""
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=1, sprint_name="Sprint 1", sprint_date="2023-11-01"),
            json_sprint_row(issue=2, sprint_name="Sprint 2", sprint_date="2023-11-16"),
        ]
        issue_data = [json_issue_row(issue=1), json_issue_row(issue=2)]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board
        board = SprintBoard.load_from_json_files(self.SPRINT_FILE, self.ISSUE_FILE)
        # validation - check sprint start dates
        assert board.sprint_start("Sprint 1") == pd.Timestamp("2023-11-01", tz="UTC")
        assert board.sprint_start("Sprint 2") == pd.Timestamp("2023-11-16", tz="UTC")
        # validation - check sprint start dates
        assert board.sprint_end("Sprint 1") == pd.Timestamp("2023-11-15", tz="UTC")
        assert board.sprint_end("Sprint 2") == pd.Timestamp("2023-11-30", tz="UTC")

    def test_datasets_joined_on_issue_number_correctly(self):
        """The datasets should be correctly joined on issue number."""
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=111, sprint_name="Sprint 1"),
            json_sprint_row(issue=222, sprint_name="Sprint 2"),
        ]
        issue_data = [
            json_issue_row(issue=111, created_at="2023-11-03"),
            json_issue_row(issue=222, created_at="2023-11-16"),
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board and extract the df
        df = SprintBoard.load_from_json_files(self.SPRINT_FILE, self.ISSUE_FILE).df
        df = df.set_index("issue_number")
        # validation -- check that both rows are preserved
        assert len(df) == 2
        # validation -- check that the sprints are matched to the right issue
        assert df.loc[111]["sprint"] == "Sprint 1"
        assert df.loc[222]["sprint"] == "Sprint 2"
        # validation -- check that the correct created dates are preserved
        assert df.loc[111]["created_date"] == pd.Timestamp("2023-11-03")
        assert df.loc[222]["created_date"] == pd.Timestamp("2023-11-16")

    def test_drop_sprint_rows_that_are_not_found_in_issue_data(self):
        """Sprint board items without a matching issue should be dropped."""
        # setup - create test data for two different sprints
        sprint_data = [json_sprint_row(issue=111), json_sprint_row(issue=222)]
        issue_data = [json_issue_row(issue=111)]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board and extract the df
        df = SprintBoard.load_from_json_files(self.SPRINT_FILE, self.ISSUE_FILE).df
        df = df.set_index("issue_number")
        # validation -- check that issue 222 was dropped
        assert len(df) == 1
        assert 222 not in list(df.index)

    @pytest.mark.parametrize(
        "parent_number",
        [222, 333, 444],  # run this test against multiple inputs
    )
    def test_extract_parent_issue_correctly(self, parent_number: int):
        """The parent issue number should be extracted from the milestone description."""
        # setup - create test data for two different sprints
        sprint_data = [json_sprint_row(issue=111, parent_number=parent_number)]
        issue_data = [json_issue_row(issue=111)]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board and extract the df
        df = SprintBoard.load_from_json_files(self.SPRINT_FILE, self.ISSUE_FILE).df
        df = df.set_index("issue_number")
        # validation -- check that issue 111's parent_issue_number is 222
        assert df.loc[111]["parent_issue_number"] == parent_number


class TestGetSprintNameFromDate:
    """Test the SprintBoard.get_sprint_name_from_date() method."""

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
            sprint_board_row(issue=1, sprint=1, sprint_start=DAY_1),
            sprint_board_row(issue=2, sprint=1, sprint_start=DAY_1),
            sprint_board_row(issue=3, sprint=2, sprint_start=DAY_4),
        ]
        board = SprintBoard.from_dict(board_data)
        # validation
        sprint_date = pd.Timestamp(date)
        sprint_name = board.get_sprint_name_from_date(sprint_date)
        assert sprint_name == expected

    def test_return_none_if_no_matching_sprint(self):
        """The method should return None if no sprint contains the date."""
        # setup - create sample dataset
        board_data = [
            sprint_board_row(issue=1, sprint=1, sprint_start=DAY_1),
            sprint_board_row(issue=2, sprint=2, sprint_start=DAY_4),
        ]
        board = SprintBoard.from_dict(board_data)
        # validation
        bad_date = pd.Timestamp("1900-01-01")
        sprint_name = board.get_sprint_name_from_date(bad_date)
        assert sprint_name is None
