"""Stores utility functions for Metrics classes."""

from __future__ import annotations

from math import isnan
from typing import Literal

import pandas as pd
from plotly.graph_objects import Figure

from analytics.metrics.base import Unit

# def get_and_validate_sprint_name() -> None:
#     """Docstring."""

# def isolate_data_for_this_sprint() -> None:
#     """Docstring."""

def get_daily_tix_counts_by_status(df: pd.DataFrame,
                                   status: Literal["opened", "closed"],
                                #    opened_col,
                                #    closed_col,
                                   unit: Unit) -> pd.DataFrame:
    """Docstring."""
    agg_col = "created_date" if status == "opened" else "closed_date"
    unit_col = unit.value
    key_cols = [agg_col, unit_col]
    if unit == Unit.issues:
        df[unit_col] = 1
    df_agg = df[key_cols].groupby(agg_col, as_index=False).agg({unit_col: "sum"})
    return df_agg.rename(columns={agg_col: "date", unit_col: status})

def get_tix_date_range(df: pd.DataFrame, open_col: str | None,
                       closed_col: str | None,
                       sprint_end: pd.Timestamp) -> pd.DataFrame:
    """Docstring."""
    opened_min = df[open_col].min()
    closed_max = df[closed_col].max()
    closed_max = sprint_end if pd.isna(closed_max) else max(sprint_end, closed_max)
    return pd.DataFrame(
        pd.date_range(opened_min, closed_max),
        columns = ["date"],
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

# def isolate_deliverables_by_status() -> None:
#     """Docstring."""

# def get_count_by_deliverable() -> None:
#     """Docstring."""

# def prepare_result_dataframe_for_plotly() -> None:
#     """Docstring."""

# def make_chart(df:pd.DataFrame, unit: Unit, chart: str | None)-> Figure:
#     """Plot data using a plotly chart."""
#     if(chart == "area"):
#         chart = px.area(
#             data_frame=df,
#             x="date",
#             y="value",
#             color="cols",
#             color_discrete_sequence=["#EFE0FC", "#2DA34D"],
#             markers=True,
#             title=f"{self.sprint} Burnup by {self.unit.value}",
#             template="none",
#         )
#         # set the scale of the y axis to start at 0
#         chart.update_yaxes(range=[0, df["value"].max() + 10])
#         chart.update_xaxes(range=[sprint_start, sprint_end])
#         chart.update_layout(
#             xaxis_title="Date",
#             yaxis_title=f"Total {self.unit.value.capitalize()}",
#             legend_title=f"{self.unit.value.capitalize()}",
#         )
#     else:
#         chart = px.line(
#             data_frame=df,
#             x="date",
#             y="total_open",
#             title=f"{self.sprint} burndown by {self.unit.value}",
#             labels={"total_open": f"total {self.unit.value} open"},
#         )
#         # set the scale of the y axis to start at 0
#         chart.update_yaxes(range=[0, df["total_open"].max() + 2])
#         chart.update_xaxes(range=[sprint_start, sprint_end])
#     return chart
