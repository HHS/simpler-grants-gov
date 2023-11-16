"""Base class for all metrics."""
from pathlib import Path

import pandas as pd
from plotly.graph_objects import Figure

from analytics.etl.slack import FileMapping, SlackBot


class BaseMetric:
    """Base class for all metrics."""

    CHART_PNG = "data/sprint-burndown-chart.png"
    CHART_HTML = "data/sprint-burndown-chart.html"
    RESULTS_CSV = "data/sprint-burndown-results.csv"

    def __init__(self) -> None:
        """Initialize and calculate the metric from the input dataset."""
        self.results = self.calculate()
        self.chart = self.plot_results()

    def calculate(self) -> pd.DataFrame:
        """Calculate the metric and return the resulting dataset."""
        raise NotImplementedError

    def plot_results(self) -> Figure:
        """Create a plotly chart that visually represents the results."""
        raise NotImplementedError

    def export_results(self) -> Path:
        """Export the self.results dataframe to a csv file."""
        # make sure the parent directory exists
        output_path = Path(self.RESULTS_CSV)
        output_path.parent.mkdir(exist_ok=True, parents=True)
        # export results dataframe to a csv
        self.results.to_csv(output_path)
        return output_path

    def export_chart(self) -> Path:
        """Export the plotly chart in self.chart to a png file."""
        # make sure the parent directory exists
        output_path = Path(self.CHART_HTML)
        output_path.parent.mkdir(exist_ok=True, parents=True)
        # export chart to a png
        self.chart.write_html(output_path)
        return output_path

    def show_chart(self) -> None:
        """Display self.chart in a browser."""
        self.chart.show()

    def post_results_to_slack(
        self,
        slackbot: SlackBot,
        channel_id: str,
    ) -> None:
        """Upload copies of the results and chart to a slack channel."""
        raise NotImplementedError

    def _post_results_to_slack(
        self,
        slackbot: SlackBot,
        channel_id: str,
        message: str,
    ) -> None:
        """Execute shared code required to upload files to a slack channel."""
        results_path = self.export_results()
        chart_path = self.export_chart()
        files = [
            FileMapping(path=str(results_path), name=results_path.name),
            FileMapping(path=str(chart_path), name=chart_path.name),
        ]
        slackbot.upload_files_to_slack_channel(
            files=files,
            channel_id=channel_id,
            message=message,
        )
