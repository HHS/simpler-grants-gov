"""
Calculates burndown for sprints.

This is a subclass of the BaseMetric class that calculates the running total of
open issues for each day in a sprint
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal

import pandas as pd
import plotly.express as px
from numpy import nan

from analytics.datasets.issues import GitHubIssues
from analytics.metrics.base import BaseMetric, Statistic, Unit

if TYPE_CHECKING:
    from plotly.graph_objects import Figure


class SprintBurndown(BaseMetric[GitHubIssues]):
    """Calculates the running total of open issues per day in the sprint."""

    def __init__(
        self,
        dataset: GitHubIssues,
        sprint: str,
        unit: Unit,
    ) -> None:
        """Initialize the SprintBurndown metric."""
        self.dataset = dataset
        self.sprint = self._get_and_validate_sprint_name(sprint)
        self.sprint_data = self._isolate_data_for_this_sprint()
        self.date_col = "date"
        self.points_col = dataset.points_col
        self.opened_col = dataset.opened_col  # type: ignore[attr-defined]
        self.closed_col = dataset.closed_col  # type: ignore[attr-defined]
        self.unit = unit
        # Set the value of the unit column based on
        # whether we're summing issues or story points
        self.unit_col = dataset.points_col if unit == Unit.points else unit.value
        super().__init__(dataset)

    def calculate(self) -> pd.DataFrame:
        """
        Calculate the sprint burndown.

        Notes
        -----
        Sprint burndown is calculated with the following algorithm:
        1. Isolate the records that belong to the given sprint
        2. Get the range of dates over which these issues were opened and closed
        3. Count the number of issues opened and closed on each day of that range
        4. Calculate the delta between opened and closed issues per day
        5. Cumulatively sum those deltas to get the running total of open tix

        """
        # make a copy of columns and rows we need to calculate burndown for this sprint
        burndown_cols = [self.opened_col, self.closed_col, self.points_col]
        df_sprint = self.sprint_data[burndown_cols].copy()
        # get the date range over which tix were created and closed
        df_tix_range = self._get_tix_date_range(df_sprint)
        # get the number of tix opened and closed each day
        df_opened = self._get_daily_tix_counts_by_status(df_sprint, "opened")
        df_closed = self._get_daily_tix_counts_by_status(df_sprint, "closed")
        # combine the daily opened and closed counts to get total open per day
        return self._get_cum_sum_of_open_tix(df_tix_range, df_opened, df_closed)

    def plot_results(self) -> Figure:
        """Plot the sprint burndown using a plotly line chart."""
        # Limit the data in the line chart to dates within the sprint
        # or through today, if the sprint hasn't yet ended
        # NOTE: This will *not* affect the running totals on those days
        sprint_start = self.dataset.sprint_start(self.sprint)
        sprint_end = self.dataset.sprint_end(self.sprint)
        date_mask = self.results[self.date_col].between(
            sprint_start,
            min(sprint_end, pd.Timestamp.today()),
        )
        df = self.results[date_mask]
        # create a line chart from the data in self.results
        chart = px.line(
            data_frame=df,
            x=self.date_col,
            y="total_open",
            title=f"{self.sprint} burndown by {self.unit.value}",
            labels={"total_open": f"total {self.unit.value} open"},
        )
        # set the scale of the y axis to start at 0
        chart.update_yaxes(range=[0, df["total_open"].max() + 2])
        chart.update_xaxes(range=[sprint_start, sprint_end])
        return chart

    def get_stats(self) -> dict[str, Statistic]:
        """
        Calculate summary statistics for this metric.

        Notes
        -----
        TODO(@widal001): 2023-12-04 - Should stats be calculated in separate private methods?

        """
        df = self.results
        # get sprint start and end dates
        sprint_start = self.dataset.sprint_start(self.sprint).strftime("%Y-%m-%d")
        sprint_end = self.dataset.sprint_end(self.sprint).strftime("%Y-%m-%d")
        # get open and closed counts and percentages
        total_opened = int(df["opened"].sum())
        total_closed = int(df["closed"].sum())
        pct_closed = round(total_closed / total_opened * 100, 2)
        # get the percentage of tickets that were ticketed
        is_pointed = self.sprint_data[self.dataset.points_col] >= 1
        issues_pointed = len(self.sprint_data[is_pointed])
        issues_total = len(self.sprint_data)
        pct_pointed = round(issues_pointed / issues_total * 100, 2)
        # format and return stats
        return {
            "Sprint start date": Statistic(value=sprint_start),
            "Sprint end date": Statistic(value=sprint_end),
            "Total opened": Statistic(total_opened, suffix=f" {self.unit.value}"),
            "Total closed": Statistic(total_closed, suffix=f" {self.unit.value}"),
            "Percent closed": Statistic(value=pct_closed, suffix="%"),
            "Percent pointed": Statistic(
                value=pct_pointed,
                suffix=f"% of {Unit.issues.value}",
            ),
        }

    def format_slack_message(self) -> str:
        """Format the message that will be included with the charts posted to slack."""
        message = (
            f"*:github: Burndown summary for {self.sprint} by {self.unit.value}*\n"
        )
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

    def _get_daily_tix_counts_by_status(
        self,
        df: pd.DataFrame,
        status: Literal["opened", "closed"],
    ) -> pd.DataFrame:
        """
        Count the number of issues or points opened or closed by date.

        Notes
        -----
        It does this by:
        - Grouping on the created_date or opened_date column, depending on status
        - Counting the total number of rows per group

        """
        # create local copies of the key column names
        agg_col = self.opened_col if status == "opened" else self.closed_col
        unit_col = self.unit_col
        key_cols = [agg_col, unit_col]
        # create a dummy column to sum per row if the unit is tasks
        if self.unit == Unit.issues:
            df[unit_col] = 1
        # isolate the key columns, group by open or closed date, then sum the units
        df_agg = df[key_cols].groupby(agg_col, as_index=False).agg({unit_col: "sum"})
        return df_agg.rename(columns={agg_col: self.date_col, unit_col: status})

    def _get_tix_date_range(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Get the date range over which issues were created and closed.

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
        # get earliest date an issue was opened and latest date one was closed
        sprint_end = self.dataset.sprint_end(self.sprint)
        opened_min = df[self.opened_col].min()
        closed_max = df[self.closed_col].max()
        closed_max = sprint_end if closed_max is nan else max(sprint_end, closed_max)
        # creates a dataframe with one row for each day between min and max date
        return pd.DataFrame(
            pd.date_range(opened_min, closed_max),
            columns=[self.date_col],
        )

    def _get_cum_sum_of_open_tix(
        self,
        dates: pd.DataFrame,
        opened: pd.DataFrame,
        closed: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Get the cumulative sum of open issues per day.

        Notes
        -----
        It does this by:
        - Left joining the full date range to the daily open and closed counts
          so that we have a row for each day of the range, with a column for tix
          opened and a column for tix closed on that day
        - Subtracting closed from opened to get the "delta" on each day in the range
        - Cumulatively summing the deltas to get the running total of open tix

        """
        # left join the full date range to open and closed counts
        df = (
            dates.merge(opened, on=self.date_col, how="left")
            .merge(closed, on=self.date_col, how="left")
            .fillna(0)
        )
        # calculate the difference between opened and closed each day
        df["delta"] = df["opened"] - df["closed"]
        # cumulatively sum the deltas to get the running total
        df["total_open"] = df["delta"].cumsum()
        return df
