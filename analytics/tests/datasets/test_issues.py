"""Tests the code in datasets/issues.py."""

import pandas as pd
import pytest
from analytics.datasets.issues import (
    GitHubIssues,
)

from tests.conftest import (
    DAY_0,
    DAY_1,
    DAY_2,
    DAY_3,
    DAY_4,
    DAY_5,
    issue,
)


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
