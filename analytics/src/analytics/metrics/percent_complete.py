from typing import Literal

import pandas as pd
import plotly.express as px

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
        super().__init__(dataset, unit=unit)

    def calculate(self, unit: Literal["tasks", "points"]) -> pd.DataFrame:
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
        df_total = self._get_count_by_deliverable(status="all", unit=unit)
        df_closed = self._get_count_by_deliverable(status="closed", unit=unit)
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
        status: Literal["closed", "open", "all"],
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
            status_filter = df["status"] == status
            df = df.loc[status_filter, key_cols]
        else:
            status = "total"  # rename status var to use as column name
            df = df[key_cols]
        # group by deliverable and sum the unit field
        df_agg = df.groupby(self.deliverable_col, as_index=False).agg("sum")
        df_agg.columns = [self.deliverable_col, status]
        return df_agg
