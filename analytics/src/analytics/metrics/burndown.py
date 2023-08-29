import pandas as pd
import plotly.express as px

from analytics.datasets.github_projects import SprintBoard
from analytics.metrics.base import BaseMetric


class SprintBurndown(BaseMetric):
    """Calculates burndown by sprint"""

    def __init__(self, dataset: SprintBoard, sprint: str) -> None:
        self.sprint = sprint
        self.date_col = "dates"
        self.opened_col = dataset.opened_col
        self.closed_col = dataset.closed_col
        super().__init__(dataset)

    def calculate(self) -> pd.DataFrame:
        """"""
        # create local variables for key columns
        date_col = self.date_col
        opened_col = self.opened_col
        closed_col = self.closed_col
        # isolate columns we need to calculate burndown
        sprint_mask = self.dataset.df[self.dataset.sprint_col] == self.sprint
        df_sprint = self.dataset.df.loc[sprint_mask, [opened_col, closed_col]]
        # get the date range over which tix were created and closed
        df_tix_range = self._get_tix_date_range(df_sprint)
        # get the number of tix opened and closed each day
        df_opened = self._aggregate_tickets(df_sprint, "opened")
        df_closed = self._aggregate_tickets(df_sprint, "closed")
        # combine the daily opened and closed counts to get total open per day
        df_burndown = self._get_burndown(df_tix_range, df_opened, df_closed)
        # isolate the dates for this sprint
        date_mask = df_burndown[date_col].between(
            self.dataset.sprint_start(self.sprint),
            self.dataset.sprint_end(self.sprint),
        )
        return df_burndown.loc[date_mask, [date_col, "total_open"]]

    def visualize(self) -> None:
        fig = px.line(
            self.result,
            x=self.date_col,
            y="total_open",
            title=f"{self.sprint} Burndown",
        )
        fig.show()
        return

    def _aggregate_tickets(self, df: pd.DataFrame, status=str) -> pd.DataFrame:
        """Aggregate tickets open or closed by count or story points"""
        if status == "opened":
            agg_col = self.opened_col
        else:
            agg_col = self.closed_col
        df_agg = df.groupby(agg_col, as_index=False).size()
        df_agg.columns = [self.date_col, status]
        return df_agg

    def _get_tix_date_range(self, df: pd.DataFrame) -> pd.DataFrame:
        """Get the date range over which tickets were created and closed"""
        opened_min = df[self.opened_col].min()
        closed_max = df[self.closed_col].max()
        self.opened_col
        self.closed_col
        return pd.DataFrame(
            pd.date_range(opened_min, closed_max),
            columns=[self.date_col],
        )

    def _get_burndown(
        self,
        dates: pd.DataFrame,
        opened: pd.DataFrame,
        closed: pd.DataFrame,
    ) -> pd.DataFrame:
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
