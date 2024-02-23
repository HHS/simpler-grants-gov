"""Calculate and visualizes percent completion by deliverable."""
import datetime as dt

import pandas as pd
import plotly.express as px
from plotly.graph_objects import Figure

from analytics.datasets.deliverable_tasks import DeliverableTasks
from analytics.metrics.base import BaseMetric, Statistic, Unit


class DeliverablePercentComplete(BaseMetric[DeliverableTasks]):
    """Calculate the percentage of issues or points completed per deliverable."""

    def __init__(
        self,
        dataset: DeliverableTasks,
        unit: Unit,
        statuses_to_include: list[str] | None = None,
    ) -> None:
        """Initialize the DeliverablePercentComplete metric."""
        self.dataset = dataset
        self.deliverable_col = "deliverable_title"
        self.status_col = "status"
        self.deliverable_status_col = "deliverable_status"
        self.unit = unit
        self.statuses_to_include = statuses_to_include
        self.deliverable_data = self._isolate_deliverables_by_status()
        super().__init__(dataset)

    def calculate(self) -> pd.DataFrame:
        """
        Calculate the percent complete per deliverable.

        Notes
        -----
        Percent completion is calculated using the following steps:
        1. Count the number of all issues (or points) per deliverable
        2. Count the number of closed issues (or points) per deliverable
        3. Left join all issues/points with open issues/points on deliverable
           so that we have a row per deliverable with a total count column
           and a closed count column
        4. Subtract closed count from total count to get open count
        5. Divide closed count by total count to get percent complete
        """
        # get total and closed counts per deliverable
        df_total = self._get_count_by_deliverable(status="all")
        df_closed = self._get_count_by_deliverable(status="closed")
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
            x=self.unit.value,
            y=self.deliverable_col,
            color=self.status_col,
            text="percent_of_total",
            labels={self.deliverable_col: "deliverable"},
            color_discrete_map={"open": "#aacde3", "closed": "#06508f"},
            orientation="h",
            title=f"Percent of {self.unit.value} complete by deliverable as of {today}",
            height=800,
        )

    def get_stats(self) -> dict[str, Statistic]:
        """Calculate stats for this metric."""
        df_src = self.deliverable_data
        # get the total number of issues and the number of issues with points per deliverable
        is_pointed = df_src[Unit.points.value] >= 1
        issues_total = df_src.value_counts(self.deliverable_col).to_frame()
        issues_pointed = (
            df_src[is_pointed].value_counts(self.deliverable_col).to_frame()
        )
        # join the count of all issues to the count of pointed issues and
        # calculate the percentage of all issues that have points per deliverable
        df_tgt = issues_total.join(issues_pointed, lsuffix="_total", rsuffix="_pointed")
        df_tgt["pct_pointed"] = df_tgt["count_pointed"] / df_tgt["count_total"] * 100
        df_tgt["pct_pointed"] = round(df_tgt["pct_pointed"], 2).fillna(0)
        # export to a dictionary of stats)
        stats = {}
        for row in df_tgt.reset_index().to_dict("records"):
            deliverable = row[self.deliverable_col]
            stats[deliverable] = Statistic(
                value=row["pct_pointed"],
                suffix=f"% of {Unit.issues.value} pointed",
            )
        return stats

    def format_slack_message(self) -> str:
        """Format the message that will be included with the charts posted to slack."""
        message = f"*:github: Percent of {self.unit.value} completed by deliverable*\n"
        if self.statuses_to_include:
            statuses = ", ".join(self.statuses_to_include)
            message += f"Limited to deliverables with these statuses: {statuses}"
        for label, stat in self.stats.items():
            message += f"• *{label}:* {stat.value}{stat.suffix}\n"
        return message

    def _isolate_deliverables_by_status(self) -> pd.DataFrame:
        """Isolate the deliverables to include in the report based on their status."""
        df = self.dataset.df
        # if statuses_to_include is provided, use it to filter the dataset
        statuses_provided = self.statuses_to_include
        if statuses_provided:
            status_filter = df[self.deliverable_status_col].isin(statuses_provided)
            df = df[status_filter]
        return df

    def _get_count_by_deliverable(
        self,
        status: str,
    ) -> pd.DataFrame:
        """Get the count of issues (or points) by deliverable and status."""
        # create local copies of the dataset and key column names
        df = self.deliverable_data.copy()
        unit_col = self.unit.value
        key_cols = [self.deliverable_col, unit_col]
        # create a dummy column to sum per row if the unit is issues
        if self.unit == Unit.issues:
            df[unit_col] = 1
        # isolate issues with the status we want
        if status != "all":
            status_filter = df[self.status_col] == status
            df = df.loc[status_filter, key_cols]
        else:
            status = "total"  # rename status var to use as column name
            df = df[key_cols]
        # group by deliverable and sum the values in the unit field
        # then rename the sum column to the value of the status var
        # to prevent duplicate col names when open and closed counts are joined
        df_agg = df.groupby(self.deliverable_col, as_index=False).agg({unit_col: "sum"})
        return df_agg.rename(columns={unit_col: status})

    def _prepare_result_dataframe_for_plotly(self) -> pd.DataFrame:
        """Stack the open and closed counts self.results for plotly charts."""
        # unpivot open and closed counts so that each deliverable has both
        # an open and a closed row with just one column for count
        unit_col: str = self.unit.value
        df = self.results.melt(
            id_vars=[self.deliverable_col],
            value_vars=["open", "closed"],
            value_name=unit_col,
            var_name=self.status_col,
        )
        # calculate the percentage of open and closed per deliverable
        # so that we can use this value as label in the chart
        df["total"] = df.groupby(self.deliverable_col)[unit_col].transform("sum")
        df["percent_of_total"] = (df[unit_col] / df["total"] * 100).round(0)
        df["percent_of_total"] = (
            df["percent_of_total"].astype("Int64").astype("str") + "%"
        )
        # sort the dataframe by count and status so that the resulting chart
        # has deliverables with more issues/points at the top
        return df.sort_values(["total", self.status_col], ascending=True)
