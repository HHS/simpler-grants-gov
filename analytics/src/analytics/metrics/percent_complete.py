from typing import Literal

import pandas as pd
import plotly.express as px
from plotly.graph_objects import Figure

from analytics.datasets.deliverable_tasks import DeliverableTasks
from analytics.metrics.base import BaseMetric


class DeliverablePercentComplete(BaseMetric):
    """Calculates the percentage of tasks or points completed per deliverable"""

    def __init__(
        self,
        dataset: DeliverableTasks,
        unit: Literal["tasks", "points"],
    ) -> None:
        """Initialize the DeliverablePercentComplete metric"""
        self.deliverable_col = "deliverable_title"
        self.status_col = "status"
        self.unit = unit
        self.dataset = dataset

    def calculate(self) -> pd.DataFrame:
        """Calculates the percent complete per deliverable

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

    def _get_count_by_deliverable(
        self,
        status: str,
        unit: Literal["tasks", "points"] = "points",
    ) -> pd.DataFrame:
        """Get the count of tasks (or points) by deliverable and status"""
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
        df_agg = df_agg.rename(columns={unit: status})
        return df_agg

    def visualize(self) -> Figure:
        """Creates a bar chart of percent completion from the data in self.result"""
        # unpivots open and closed counts so that each deliverable has both
        # an open and a closed row with just one column for count
        df = self.result.melt(
            id_vars=[self.deliverable_col],
            value_vars=["open", "closed"],
            value_name=self.unit,
            var_name=self.status_col,
        )
        # sort the dataframe by count and status so that the resulting chart
        # has deliverables with more tasks/points at the top
        df = df.sort_values([self.unit, self.status_col], ascending=True)
        # create a stacked bar chart from the data
        fig = px.bar(
            df,
            x=self.unit,
            y=self.deliverable_col,
            color=self.status_col,
            orientation="h",
            title=f"Deliverable Percent Complete by {self.unit}",
            height=800,
        )
        fig.show()
        return fig
