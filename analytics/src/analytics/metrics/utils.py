"""Stores utility functions for Metrics classes."""

from __future__ import annotations

from typing import Literal

import pandas as pd

from analytics.metrics.base import Unit


def get_daily_tix_counts_by_status(
    df: pd.DataFrame,
    status: Literal["opened", "closed"],
    unit: Unit,
) -> pd.DataFrame:
    """
    Count the number of issues or points opened or closed by date.

    Notes
    -----
    It does this by:
    - Grouping on the created_date or opened_date column, depending on status
    - Counting the total number of rows per group

    """
    agg_col = "created_date" if status == "opened" else "closed_date"
    unit_col = unit.value
    key_cols = [agg_col, unit_col]
    if unit == Unit.issues:
        df[unit_col] = 1
    df_agg = df[key_cols].groupby(agg_col, as_index=False).agg({unit_col: "sum"})
    return df_agg.rename(columns={agg_col: "date", unit_col: status})


def get_tix_date_range(
    df: pd.DataFrame,
    open_col: str | None,
    closed_col: str | None,
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
    opened_min = df[open_col].min()
    closed_max = df[closed_col].max()
    closed_max = sprint_end if pd.isna(closed_max) else max(sprint_end, closed_max)
    return pd.DataFrame(
        pd.date_range(opened_min, closed_max),
        columns=["date"],
    )


def get_cum_sum_of_tix(
    dates: pd.DataFrame,
    opened: pd.DataFrame,
    closed: pd.DataFrame,
    date_col: str | None = None,
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
        dates.merge(opened, on=date_col, how="left")
        .merge(closed, on=date_col, how="left")
        .fillna(0)
    )
    df["delta"] = df["opened"] - df["closed"]
    df["total_open"] = df["delta"].cumsum()
    df["total_closed"] = df["closed"].cumsum()
    return df
