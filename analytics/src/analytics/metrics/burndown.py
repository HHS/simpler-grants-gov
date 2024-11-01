"""
Calculates burndown for sprints.

This is a subclass of the BaseMetric class that calculates the running total of
open issues for each day in a sprint
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import pandas as pd
import plotly.express as px

from analytics.datasets.issues import GitHubIssues
from analytics.metrics.base import BaseMetric, Statistic, Unit
from analytics.metrics.utils import Columns, sum_tix_by_day

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
        self.columns = Columns(
            opened_at_col=dataset.opened_col,
            closed_at_col=dataset.closed_col,
            unit_col=dataset.points_col if unit == Unit.points else unit.value,
            date_col=self.date_col,
        )
        self.unit = unit
        # Set the value of the unit column based on
        # whether we're summing issues or story points
        self.unit_col = dataset.points_col if unit == Unit.points else unit.value
        super().__init__(dataset)

    def calculate(self) -> pd.DataFrame:
        """Calculate the sprint burnup."""
        # make a copy of columns and rows we need to calculate burndown for this sprint
        burnup_cols = [
            self.dataset.opened_col,
            self.dataset.closed_col,
            self.dataset.points_col,
        ]
        df_sprint = self.sprint_data[burnup_cols].copy()
        # Count the number of tickets opened, closed, and remaining by day
        return sum_tix_by_day(
            df=df_sprint,
            cols=self.columns,
            unit=self.unit,
            sprint_end=self.dataset.sprint_end(self.sprint),
        )

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
