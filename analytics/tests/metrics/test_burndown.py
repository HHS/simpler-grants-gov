"""Test the analytics.metrics.burndown module."""
from datetime import datetime, timedelta, timezone

import pandas as pd
import pytest
from analytics.datasets.sprint_board import SprintBoard
from analytics.metrics.burndown import SprintBurndown

DAY_0 = "2023-10-31"
DAY_1 = "2023-11-01"
DAY_2 = "2023-11-02"
DAY_3 = "2023-11-03"


def sprint_row(
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


def result_row(
    day: str,
    opened: int,
    closed: int,
    delta: int,
    total: int,
) -> dict:
    """Create a sample result row."""
    return {
        "date": pd.Timestamp(day, tz="UTC"),
        "opened": opened,
        "closed": closed,
        "delta": delta,
        "total_open": total,
    }


class TestSprintBurndown:
    """Test the SprintBurndown class."""

    def test_count_tix_created_before_sprint_start(self):
        """Burndown should include tix opened before the sprint but closed during it."""
        # setup - create test data
        sprint_data = [
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, closed=DAY_2),
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, closed=DAY_3),
        ]
        test_data = SprintBoard.from_dict(sprint_data)
        # execution
        output = SprintBurndown(test_data, sprint="Sprint 1")
        df = output.results
        # validation - check min and max dates
        assert df[output.date_col].min() == pd.Timestamp(DAY_0, tz="UTC")
        assert df[output.date_col].max() == pd.Timestamp(DAY_3, tz="UTC")
        # validation - check burndown output
        expected = [
            result_row(day=DAY_0, opened=2, closed=0, delta=2, total=2),
            result_row(day=DAY_1, opened=0, closed=0, delta=0, total=2),
            result_row(day=DAY_2, opened=0, closed=1, delta=-1, total=1),
            result_row(day=DAY_3, opened=0, closed=1, delta=-1, total=0),
        ]
        assert df.to_dict("records") == expected

    def test_count_tix_created_after_sprint_start(self):
        """Burndown should include tix opened and closed during the sprint."""
        # setup - create test data
        sprint_data = [
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, closed=DAY_2),
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_2, closed=DAY_3),
        ]
        test_data = SprintBoard.from_dict(sprint_data)
        # execution
        output = SprintBurndown(test_data, sprint="Sprint 1")
        df = output.results
        # validation - check burndown output
        expected = [
            result_row(day=DAY_0, opened=1, closed=0, delta=1, total=1),
            result_row(day=DAY_1, opened=0, closed=0, delta=0, total=1),
            result_row(day=DAY_2, opened=1, closed=1, delta=0, total=1),
            result_row(day=DAY_3, opened=0, closed=1, delta=-1, total=0),
        ]
        assert df.to_dict("records") == expected

    def test_include_all_sprint_days_if_tix_closed_early(self):
        """All days of the sprint should be included even if all tix were closed early."""
        # setup - create test data
        sprint_data = [
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, closed=DAY_1),
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, closed=DAY_1),
        ]
        test_data = SprintBoard.from_dict(sprint_data)
        # execution
        output = SprintBurndown(test_data, sprint="Sprint 1")
        df = output.results
        # validation - check max date is end of sprint not last closed date
        assert df[output.date_col].max() == pd.Timestamp(DAY_3, tz="UTC")

    def test_raise_value_error_if_sprint_arg_not_in_dataset(self):
        """A ValueError should be raised if the sprint argument isn't valid."""
        # setup - create test data
        sprint_data = [
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, closed=DAY_1),
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0),
        ]
        test_data = SprintBoard.from_dict(sprint_data)
        # validation
        with pytest.raises(
            ValueError,
            match="Sprint value doesn't match one of the available sprints",
        ):
            SprintBurndown(test_data, sprint="Fake sprint")

    def test_calculate_burndown_for_current_sprint(self):
        """A ValueError should be raised if the sprint argument isn't valid."""
        # setup - create test data
        now = datetime.now(tz=timezone.utc)
        day_1 = now.strftime("%Y-%m-%d")
        day_2 = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        day_3 = (now + timedelta(days=2)).strftime("%Y-%m-%d")
        sprint_data = [
            sprint_row(issue=1, sprint_start=day_1, created=day_1, closed=day_2),
            sprint_row(issue=1, sprint_start=day_1, created=day_1),
        ]
        test_data = SprintBoard.from_dict(sprint_data)
        # execution
        output = SprintBurndown(test_data, sprint="Sprint 1")
        df = output.results
        # validation - check burndown output
        expected = [
            result_row(day=day_1, opened=2, closed=0, delta=2, total=2),
            result_row(day=day_2, opened=0, closed=1, delta=-1, total=1),
            result_row(day=day_3, opened=0, closed=0, delta=0, total=1),
        ]
        assert df.to_dict("records") == expected
