"""Calculate and visualizes percent completion by deliverable."""
from enum import Enum
from typing import Literal
import datetime as dt

import pandas as pd
import plotly.express as px
from plotly.graph_objects import Figure

from analytics.datasets.deliverable_tasks import DeliverableTasks
from analytics.etl.slack import SlackBot
from analytics.metrics.base import BaseMetric


class Unit(Enum):
    """List the units in which percent completion can be calculated."""

    tasks = "tasks"  # pylint: disable=C0103
    points = "points"  # pylint: disable=C0103


class DeliverablePercentComplete(BaseMetric):
    """Calculate the percentage of tasks or points completed per deliverable."""

    def __init__(
        self,
        dataset: DeliverableTasks,
        unit: Unit,
    ) -> None:
        """Initialize the DeliverablePercentComplete metric."""
        self.deliverable_col = "deliverable_title"
        self.status_col = "status"
        self.unit: Literal["tasks", "points"] = unit.value
        self.dataset = dataset
        super().__init__()

    def calculate(self) -> pd.DataFrame:
        """
        Calculate the percent complete per deliverable.

        Notes
        -----
        Percent completion is calculated using the following steps:
        1. Count the number of all tasks (or points) per deliverable
        2. Count the number of closed tasks (or points) per deliverable
        3. Left join all tasks/points with open tasks/points on deliverable
           so that we have a row per deliverable with a total count column
           and a closed count column
        4. Subtract closed count from total count to get open count
        5. Divide closed count by total count to get percent complete
        """
        # get total and closed counts per deliverable
        df_total = self._get_count_by_deliverable(status="all", unit=self.unit)
        df_closed = self._get_count_by_deliverable(status="closed", unit=self.unit)
        # join total and closed counts on deliverable
        # and calculate remaining columns
        df_all = df_total.merge(df_closed, on=self.deliverable_col, how="left")
        df_all = df_all.fillna(0)
        df_all["open"] = df_all["total"] - df_all["closed"]
        df_all["percent_complete"] = df_all["closed"] / df_all["total"]
        df_all["percent_complete"] = df_all["percent_complete"].fillna(0)
        return df_all

    def plot_results(self) -> Figure:
        """Create a bar chart of percent completion from the data in self.results."""
        # get the current date in YYYY-MM-DD format
        today = dt.datetime.now(tz=dt.timezone.utc).strftime("%Y-%m-%d")
        # reshape the dataframe in self.results for plotly
        df = self._prepare_result_dataframe_for_plotly()
        # create a stacked bar chart from the data
        return px.bar(
            df,
            x=self.unit,
            y=self.deliverable_col,
            color=self.status_col,
            text="percent_of_total",
            color_discrete_map={"open": "#aacde3", "closed": "#06508f"},
            orientation="h",
            title=f"Deliverable percent complete by {self.unit} as of {today}",
            height=800,
        )

    def post_results_to_slack(self, slackbot: SlackBot, channel_id: str) -> None:
        """Post sprint burndown results and chart to slack channel."""
        return super()._post_results_to_slack(
            slackbot=slackbot,
            channel_id=channel_id,
            message="*:github: Percent complete by deliverable*",
        )

    def _get_count_by_deliverable(
        self,
        status: str,
        unit: Literal["tasks", "points"] = "points",
    ) -> pd.DataFrame:
        """Get the count of tasks (or points) by deliverable and status."""
        # create local copies of the dataset and key column names
        df = self.dataset.df.copy()
        key_cols = [self.deliverable_col, unit]
        # create a dummy column to sum per row if the unit is tasks
        if unit == "tasks":
            df["tasks"] = 1
        # isolate tasks with the status we want
        if status != "all":
            status_filter = df[self.status_col] == status
            df = df.loc[status_filter, key_cols]
        else:
            status = "total"  # rename status var to use as column name
            df = df[key_cols]
        # group by deliverable and sum the values in the unit field
        # then rename the sum column to the value of the status var
        # to prevent duplicate col names when open and closed counts are joined
        df_agg = df.groupby(self.deliverable_col, as_index=False).agg({unit: "sum"})
        return df_agg.rename(columns={unit: status})

    def _prepare_result_dataframe_for_plotly(self) -> pd.DataFrame:
        """Stack the open and closed counts self.results for plotly charts."""
        # unpivot open and closed counts so that each deliverable has both
        # an open and a closed row with just one column for count
        df = self.results.melt(
            id_vars=[self.deliverable_col],
            value_vars=["open", "closed"],
            value_name=self.unit,
            var_name=self.status_col,
        )
        # calculate the percentage of open and closed per deliverable
        # so that we can use this value as label in the chart
        df["total"] = df.groupby(self.deliverable_col)[self.unit].transform("sum")
        df["percent_of_total"] = (df[self.unit] / df["total"] * 100).round(0)
        df["percent_of_total"] = (
            df["percent_of_total"].astype("Int64").astype("str") + "%"
        )
        # sort the dataframe by count and status so that the resulting chart
        # has deliverables with more tasks/points at the top
        return df.sort_values(["total", self.status_col], ascending=True)
