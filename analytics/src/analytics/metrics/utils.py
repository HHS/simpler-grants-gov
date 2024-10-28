"""Stores utility functions for Metrics classes."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

import pandas as pd

from analytics.metrics.base import Unit


@dataclass
class Columns:
    """List of columns names to use when calculating burnup/down."""

    opened_at_col: str
    closed_at_col: str
    unit_col: str
    date_col: str = "date"
    opened_count_col: str = "opened"
    closed_count_col: str = "closed"
    delta_col: str = "delta"


class IssueState(StrEnum):
    """Whether the issue is open or closed."""

    OPEN = "opened"
    CLOSED = "closed"


def sum_tix_by_day(
    df: pd.DataFrame,
    cols: Columns,
    unit: Unit,
    sprint_end: pd.Timestamp,
) -> pd.DataFrame:
    """Count the total number of tix opened, closed, and remaining by day."""
    # Get the date range for burndown/burnup
    df_tix_range = get_tix_date_range(df, cols, sprint_end)
    # Get the number of tix opened and closed by day
    df_opened = get_daily_tix_counts_by_status(df, cols, IssueState.OPEN, unit)
    df_closed = get_daily_tix_counts_by_status(df, cols, IssueState.CLOSED, unit)
    # combine the daily opened and closed counts to get total open and closed per day
    return get_cum_sum_of_tix(cols, df_tix_range, df_opened, df_closed)


def get_daily_tix_counts_by_status(
    df: pd.DataFrame,
    cols: Columns,
    state: IssueState,
    unit: Unit,
) -> pd.DataFrame:
    """
    Count the number of issues or points opened or closed by date.

    Notes
    -----
    It does this by:
    - Grouping on the created_date or opened_date column, depending on state
    - Counting the total number of rows per group

    """
    agg_col = cols.opened_at_col if state == IssueState.OPEN else cols.closed_at_col
    unit_col = cols.unit_col
    key_cols = [agg_col, unit_col]
    if unit == Unit.issues:
        df[unit_col] = 1
    df_agg = df[key_cols].groupby(agg_col, as_index=False).agg({unit_col: "sum"})
    return df_agg.rename(columns={agg_col: "date", unit_col: state.value})


def get_tix_date_range(
    df: pd.DataFrame,
    cols: Columns,
    sprint_end: pd.Timestamp,
) -> pd.DataFrame:
    """
    Get the data range over which issues were created and closed.

    Notes
    -----
    It does this by:
    - Finding the date when the sprint ends
    - Finding the earliest date a issue was created
    - Finding the latest date a issue was closed
    - Creating a row for each day between the earliest date a ticket was opened
        and either the sprint end _or_ the latest date an issue was closed,
        whichever is the later date.

    """
    opened_min = df[cols.opened_at_col].min()
    closed_max = df[cols.closed_at_col].max()
    closed_max = sprint_end if pd.isna(closed_max) else max(sprint_end, closed_max)
    return pd.DataFrame(
        pd.date_range(opened_min, closed_max),
        columns=["date"],
    )


def get_cum_sum_of_tix(
    cols: Columns,
    dates: pd.DataFrame,
    opened: pd.DataFrame,
    closed: pd.DataFrame,
) -> pd.DataFrame:
    """
    Create results data frame.

    Notes
    -----
    It does this by:
    - Left joining the full date range to the daily open and closed counts
    so that we have a row for each day of the range with a column for tix
    opened, a column for tix closed for the day,
    - Cumulatively summing the deltas to get the running total of open tix
    - Cumulative summing the closed column to get the running total of closed tix

    """
    df = (
        dates.merge(opened, on=cols.date_col, how="left")
        .merge(closed, on=cols.date_col, how="left")
        .fillna(0)
    )
    df[cols.delta_col] = df[cols.opened_count_col] - df[cols.closed_count_col]
    df["total_open"] = df[cols.delta_col].cumsum()
    df["total_closed"] = df[cols.closed_count_col].cumsum()
    return df
