"""
Calculates burndown for sprints.

This is a subclass of the BaseMetric class that calculates the running total of
open tickets for each day in a sprint
"""
from typing import Literal

import pandas as pd
import plotly.express as px
from plotly.graph_objects import Figure

from analytics.datasets.sprint_board import SprintBoard
from analytics.etl.slack import SlackBot
from analytics.metrics.base import BaseMetric


class SprintBurndown(BaseMetric):
    """Calculates the running total of open tickets per day in the sprint."""

    def __init__(self, dataset: SprintBoard, sprint: str) -> None:
        """Initialize the SprintBurndown metric."""
        self.dataset = dataset
        self.sprint = self._get_and_validate_sprint_name(sprint)
        self.date_col = "date"
        self.opened_col = dataset.opened_col  # type: ignore[attr-defined]
        self.closed_col = dataset.closed_col  # type: ignore[attr-defined]
        self.unit = "tickets"
        super().__init__()

    def calculate(self) -> pd.DataFrame:
        """
        Calculate the sprint burndown.

        Notes
        -----
        Sprint burndown is calculated with the following algorithm:
        1. Isolate the records that belong to the given sprint
        2. Get the range of dates over which these tickets were opened and closed
        3. Count the number of tickets opened and closed on each day of that range
        4. Calculate the delta between opened and closed tickets per day
        5. Cumulatively sum those deltas to get the running total of open tix
        """
        # create local variables for key columns
        opened_col = self.opened_col
        closed_col = self.closed_col
        # isolate columns we need to calculate burndown
        sprint_mask = self.dataset.df[self.dataset.sprint_col] == self.sprint
        df_sprint = self.dataset.df.loc[sprint_mask, [opened_col, closed_col]]
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
        # NOTE: This will *not* affect the running totals on those days
        date_mask = self.results[self.date_col].between(
            self.dataset.sprint_start(self.sprint),
            self.dataset.sprint_end(self.sprint),
        )
        df = self.results[date_mask]
        # create a line chart from the data in self.results
        chart = px.line(
            data_frame=df,
            x=self.date_col,
            y="total_open",
            title=f"{self.sprint} Burndown",
        )
        # set the scale of the y axis to start at 0
        chart.update_yaxes(range=[0, df["total_open"].max() + 2])
        return chart

    def post_results_to_slack(self, slackbot: SlackBot, channel_id: str) -> None:
        """Post sprint burndown results and chart to slack channel."""
        # calculate a series of stats about the sprint
        df = self.results
        sprint_start = self.dataset.sprint_start(self.sprint).strftime("%Y-%m-%d")
        sprint_end = self.dataset.sprint_end(self.sprint).strftime("%Y-%m-%d")
        total_opened = int(df["opened"].sum())
        total_closed = int(df["closed"].sum())
        pct_closed = round(total_closed / total_opened * 100, 2)
        message = f"""
*:github: Burndown summary for {self.sprint}*
• *Sprint start date:* {sprint_start}
• *Sprint end date:* {sprint_end}
• *Total opened:* {total_opened} {self.unit}
• *Total closed:* {total_closed} {self.unit}
• *Percent closed:* {pct_closed}%
"""
        return super()._post_results_to_slack(
            slackbot=slackbot,
            channel_id=channel_id,
            message=message,
        )

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

    def _get_daily_tix_counts_by_status(
        self,
        df: pd.DataFrame,
        status: Literal["opened", "closed"],
    ) -> pd.DataFrame:
        """
        Count the number of tickets opened or closed by date.

        Notes
        -----
        It does this by:
        - Grouping on the created_date or opened_date column, depending on status
        - Counting the total number of rows per group
        """
        agg_col = self.opened_col if status == "opened" else self.closed_col
        df_agg = df.groupby(agg_col, as_index=False).agg("size")
        df_agg.columns = [self.date_col, status]
        return pd.DataFrame(df_agg)  # prevents mypy issue

    def _get_tix_date_range(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Get the date range over which tickets were created and closed.

        Notes
        -----
        It does this by:
        - Finding the earliest date a ticket was created
        - Finding the date when the sprint ends
        - Creating a row for each day between the earliest date a ticket was closed

        """
        opened_min = df[self.opened_col].min()  # earliest date a tix was created
        sprint_end = self.dataset.sprint_end(self.sprint)
        # creates a dataframe with one row for each day between min and max date
        return pd.DataFrame(
            pd.date_range(opened_min, sprint_end),
            columns=[self.date_col],
        )

    def _get_cum_sum_of_open_tix(
        self,
        dates: pd.DataFrame,
        opened: pd.DataFrame,
        closed: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Get the cumulative sum of open tickets per day.

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
