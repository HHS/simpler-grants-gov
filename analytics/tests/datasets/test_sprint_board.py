"""Tests for analytics/datasets/sprint_board.py."""

import pandas as pd
import pytest
from analytics.datasets.sprint_board import SprintBoard

from tests.conftest import (
    DAY_0,
    DAY_1,
    DAY_2,
    DAY_3,
    DAY_4,
    DAY_5,
    json_issue_row,
    json_sprint_row,
    sprint_row,
    write_test_data_to_file,
)


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
            sprint_row(issue=1, sprint=1, sprint_start=DAY_0, sprint_length=3),
            sprint_row(issue=2, sprint=1, sprint_start=DAY_0, sprint_length=3),
            sprint_row(issue=3, sprint=2, sprint_start=DAY_3, sprint_length=3),
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
            sprint_row(issue=1, sprint=1, sprint_start=DAY_1),
            sprint_row(issue=2, sprint=2, sprint_start=DAY_4),
        ]
        board = SprintBoard.from_dict(board_data)
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
            sprint_row(issue=1, sprint=1, sprint_start=DAY_1, sprint_length=2),
            sprint_row(issue=2, sprint=2, sprint_start=DAY_3, sprint_length=2),
        ]
        board = SprintBoard.from_dict(board_data)
        # execution
        bad_date = pd.Timestamp(DAY_3)  # end of sprint 1 and start of sprint 2
        sprint_name = board.get_sprint_name_from_date(bad_date)
        assert sprint_name == "Sprint 1"
