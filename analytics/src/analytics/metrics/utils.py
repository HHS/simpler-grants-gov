"""Stores utility functions for Metrics classes."""

from __future__ import annotations

import pandas as pd


def get_cum_sum_of_tix(dates: pd.DataFrame,
                       opened: pd.DataFrame,
                       closed: pd.Dataframe,
                       date_col: str | None = None) -> pd.DataFrame:
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
    df["Total Open"] = df["delta"].cumsum()
    df["Total Closed"] = df["closed"].cumsum()
    return df
