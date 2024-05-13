"""
Calculates burnup for sprints.

This is a subclass of the BaseMetric class that calculates the running total of
open issues for each day in a sprint
"""
from __future__ import annotations

from typing import TYPE_CHECKING

import pandas as pd
import plotly.express as px

from analytics.datasets.sprint_board import SprintBoard
from analytics.metrics.base import BaseMetric, Statistic, Unit
from analytics.metrics.utils import (
    get_cum_sum_of_tix,
    get_daily_tix_counts_by_status,
    get_tix_date_range,
)

if TYPE_CHECKING:
    from plotly.graph_objects import Figure


class SprintBurnup(BaseMetric[SprintBoard]):
    """Calculates the running total of open issues per day in the sprint."""

    def __init__(
        self,
        dataset: SprintBoard,
        sprint: str,
        unit: Unit,
    ) -> None:
        """Initialize the SprintBurnup metric."""
        self.dataset = dataset
        self.sprint = self._get_and_validate_sprint_name(sprint)
        self.sprint_data = self._isolate_data_for_this_sprint()
        self.date_col = "date"
        self.points_col = "points"
        self.opened_col = dataset.opened_col  # type: ignore[attr-defined]
        self.closed_col = dataset.closed_col  # type: ignore[attr-defined]
        self.unit = unit
        super().__init__(dataset)

    def calculate(self) -> pd.DataFrame:
        """
        Calculate the sprint burnup.

        Notes
        -----
        Sprint burnup is calculated with the following algorithm:
        1. Isolate Sprint records
        2. Create data range for burnup
        3. Group issues/points by date opened and date closed
        4. Join on date

        """
        # make a copy of columns and rows we need to calculate burndown for this sprint
        burnup_cols = [self.opened_col, self.closed_col, self.points_col]
        df_sprint = self.sprint_data[burnup_cols].copy()
        # get the date range over which tix were created and closed
        df_tix_range = get_tix_date_range(
            df_sprint,
            self.opened_col,
            self.closed_col,
            self.dataset.sprint_end(self.sprint),
        )
        # get the number of tix opened and closed each day
        df_opened = get_daily_tix_counts_by_status(df_sprint, "opened", self.unit)
        df_closed = get_daily_tix_counts_by_status(df_sprint, "closed", self.unit)
        # combine the daily opened and closed counts to get total open and closed per day
        return get_cum_sum_of_tix(df_tix_range, df_opened, df_closed)

    def plot_results(self) -> Figure:
        """Plot the sprint burnup using a plotly area chart."""
        # Limit the data in the area chart to dates within the sprint
        # or through today, if the sprint hasn't yet ended
        # NOTE: This will *not* affect the running totals on those days
        sprint_start = self.dataset.sprint_start(self.sprint)
        sprint_end = self.dataset.sprint_end(self.sprint)
        date_mask = self.results[self.date_col].between(
            sprint_start,
            min(sprint_end, pd.Timestamp.today(tz="utc")),
        )
        df = self.results[date_mask].melt(
            id_vars=self.date_col,
            value_vars=["total_closed", "total_open"],
            var_name="cols",
        )

        # create a area chart from the data in self.results
        chart = px.area(
            data_frame=df,
            x=self.date_col,
            y="value",
            color="cols",
            color_discrete_sequence=["#EFE0FC", "#2DA34D"],
            markers=True,
            title=f"{self.sprint} Burnup by {self.unit.value}",
            template="none",
        )
        # set the scale of the y axis to start at 0
        chart.update_yaxes(range=[0, df["value"].max() + 10])
        chart.update_xaxes(range=[sprint_start, sprint_end])
        chart.update_layout(
            xaxis_title="Date",
            yaxis_title=f"Total {self.unit.value.capitalize()}",
            legend_title=f"{self.unit.value.capitalize()}",
        )
        return chart

    def get_stats(self) -> dict[str, Statistic]:
        """Calculate summary statistics for this metric."""
        df = self.results
        # get sprint start and end dates
        sprint_start = self.dataset.sprint_start(self.sprint).strftime("%Y-%m-%d")
        sprint_end = self.dataset.sprint_end(self.sprint).strftime("%Y-%m-%d")
        # get open and closed counts and percentages
        total_opened = int(df["opened"].sum())
        total_closed = int(df["closed"].sum())
        pct_closed = int(round(total_closed / total_opened * 100, 0))
        # For burnup, we want to know at a glance the pct_remaining
        pct_remaining = int(100 - pct_closed)
        # get the percentage of tickets that were ticketed
        is_pointed = self.sprint_data[Unit.points.value] >= 1
        issues_pointed = len(self.sprint_data[is_pointed])
        issues_total = len(self.sprint_data)
        pct_pointed = int(round(issues_pointed / issues_total * 100,0))
        # format and return stats
        return {
            "Sprint start date": Statistic(value=sprint_start),
            "Sprint end date": Statistic(value=sprint_end),
            "Total opened": Statistic(total_opened, suffix=f" {self.unit.value}"),
            "Total closed": Statistic(total_closed, suffix=f" {self.unit.value}"),
            "Percent closed": Statistic(value=pct_closed, suffix="%"),
            "Percent remaining": Statistic(value=pct_remaining, suffix="%"),
            "Percent pointed": Statistic(
                value=pct_pointed,
                suffix=f"% of {Unit.issues.value}",
            ),
        }

    def format_slack_message(self) -> str:
        """Format the message that will be included with the charts posted to slack."""
        message = f"*:github: Burnup summary for {self.sprint} by {self.unit.value}*\n"
        for label, stat in self.stats.items():
            message += f"• *{label}:* {stat.value}{stat.suffix}\n"
        return message

    def _get_and_validate_sprint_name(self, sprint: str | None) -> str:
        """Get the name of the sprint we're using to calculate burndown or raise an error."""
        # save dataset to local variable for brevity
        dataset = self.dataset
        # update sprint name if calculating burndown for the current sprint
        if sprint == "@current":
            sprint = dataset.current_sprint
        # check that the sprint name matches one of the sprints in the dataset
        valid_sprint = sprint in list(dataset.sprints[dataset.sprint_col])
        if not sprint or not valid_sprint:  # needs `not sprint` for mypy checking
            msg = "Sprint value doesn't match one of the available sprints"
            raise ValueError(msg)
        # return the sprint name if it's valid
        return sprint

    def _isolate_data_for_this_sprint(self) -> pd.DataFrame:
        """Filter out issues that are not assigned to the current sprint."""
        sprint_filter = self.dataset.df[self.dataset.sprint_col] == self.sprint
        return self.dataset.df[sprint_filter]

    # def _get_daily_tix_counts_by_status(
    #     self,
    #     df: pd.DataFrame,
    #     status: Literal["opened", "closed"],
    # ) -> pd.DataFrame:
    #     """
    #     Count the number of issues or points opened or closed by date.

    #     Notes
    #     -----
    #     It does this by:
    #     - Grouping on the created_date or opened_date column, depending on status
    #     - Counting the total number of rows per group

    #     """
    #     # create local copies of the key column names
    #     # create a dummy column to sum per row if the unit is tasks
    #     if self.unit == Unit.issues:
    #     # isolate the key columns, group by open or closed date, then sum the units

    # def _get_tix_date_range(self, df: pd.DataFrame) -> pd.DataFrame:
    #     """
    #     Get the date range over which issues were created and closed.

    #     Notes
    #     -----
    #     It does this by:
    #     - Finding the date when the sprint ends
    #     - Finding the earliest date a issue was created
    #     - Finding the latest date a issue was closed
    #     - Creating a row for each day between the earliest date a ticket was opened
    #       and either the sprint end _or_ the latest date an issue was closed,
    #       whichever is the later date.

    #     """
    #     # get earliest date an issue was opened and latest date one was closed
    #     # creates a dataframe with one row for each day between min and max date
    #     return pd.DataFrame(
