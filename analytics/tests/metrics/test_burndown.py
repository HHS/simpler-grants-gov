"""Test the analytics.metrics.burndown module."""
from datetime import datetime, timedelta, timezone

import pandas as pd
import pytest
from analytics.datasets.sprint_board import SprintBoard
from analytics.metrics.burndown import SprintBurndown, Unit

from tests.conftest import (
    DAY_0,
    DAY_1,
    DAY_2,
    DAY_3,
    sprint_row,
)


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


class TestSprintBurndownByTasks:
    """Test the SprintBurndown class with unit='tasks'."""

    def test_count_tix_created_before_sprint_start(self):
        """Burndown should include tix opened before the sprint but closed during it."""
        # setup - create test data
        sprint_data = [
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, closed=DAY_2),
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, closed=DAY_3),
        ]
        test_data = SprintBoard.from_dict(sprint_data)
        # execution
        output = SprintBurndown(test_data, sprint="Sprint 1", unit=Unit.tasks)
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
        output = SprintBurndown(test_data, sprint="Sprint 1", unit=Unit.tasks)
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
        output = SprintBurndown(test_data, sprint="Sprint 1", unit=Unit.tasks)
        df = output.results
        # validation - check burndown output
        expected = [
            result_row(day=day_1, opened=2, closed=0, delta=2, total=2),
            result_row(day=day_2, opened=0, closed=1, delta=-1, total=1),
            result_row(day=day_3, opened=0, closed=0, delta=0, total=1),
        ]
        assert df.to_dict("records") == expected


class TestSprintBurndownByPoints:
    """Test the SprintBurndown class with unit='points'."""

    def test_burndown_works_with_points(self):
        """Burndown should be calculated correctly with points."""
        # setup - create test data
        sprint_data = [
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_0, points=2),
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_2, points=3),
        ]
        test_data = SprintBoard.from_dict(sprint_data)
        # execution
        output = SprintBurndown(test_data, sprint="Sprint 1", unit=Unit.points)
        df = output.results
        # validation
        expected = [
            result_row(day=DAY_0, opened=2, closed=0, delta=2, total=2),
            result_row(day=DAY_1, opened=0, closed=0, delta=0, total=2),
            result_row(day=DAY_2, opened=3, closed=0, delta=3, total=5),
            result_row(day=DAY_3, opened=0, closed=0, delta=0, total=5),
        ]
        assert df.to_dict("records") == expected

    def test_burndown_excludes_tix_without_points(self):
        """Burndown should exclude tickets that are not pointed."""
        # setup - create test data
        sprint_data = [
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_1, points=2),
            sprint_row(issue=1, sprint_start=DAY_1, created=DAY_2, points=0),
        ]
        test_data = SprintBoard.from_dict(sprint_data)
        # execution
        output = SprintBurndown(test_data, sprint="Sprint 1", unit=Unit.points)
        df = output.results
        # validation
        expected = [
            result_row(day=DAY_1, opened=2, closed=0, delta=2, total=2),
            result_row(day=DAY_2, opened=0, closed=0, delta=0, total=2),
            result_row(day=DAY_3, opened=0, closed=0, delta=0, total=2),
        ]
        assert df.to_dict("records") == expected
