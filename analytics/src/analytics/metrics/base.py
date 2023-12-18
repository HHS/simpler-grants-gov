"""Base class for all metrics."""
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any

import pandas as pd
from plotly.graph_objects import Figure

from analytics.etl.slack import FileMapping, SlackBot


class Unit(Enum):
    """List the units in which metrics can be calculated."""

    issues = "issues"  # pylint: disable=C0103
    points = "points"  # pylint: disable=C0103


@dataclass
class Statistic:
    """Store a single value that represents a summary statistic about a dataset."""

    value: Any
    suffix: str = ""


class BaseMetric:
    """Base class for all metrics."""

    CHART_PNG = "chart-static.png"
    CHART_HTML = "chart-interactive.html"
    RESULTS_CSV = "results.csv"

    def __init__(self) -> None:
        """Initialize and calculate the metric from the input dataset."""
        self.results = self.calculate()
        self.stats = self.get_stats()
        self._chart: Figure | None = None

    def calculate(self) -> pd.DataFrame:
        """Calculate the metric and return the resulting dataset."""
        raise NotImplementedError

    def get_stats(self) -> dict[str, Statistic]:
        """Get the list of stats associated with this metric to include in reporting."""
        raise NotImplementedError

    @property
    def chart(self) -> Figure:
        """
        Return a chart visualizing the results.

        Note:
        ----
        By deferring the self.plot_results() method invocation until the chart is
        needed, we decrease the amount of time required to instantiate the class
        """
        if not self._chart:
            self._chart = self.plot_results()
        return self._chart

    def plot_results(self) -> Figure:
        """Create a plotly chart that visually represents the results."""
        raise NotImplementedError

    def export_results(self, output_dir: Path = Path("data")) -> Path:
        """Export the self.results dataframe to a csv file."""
        # make sure the parent directory exists
        output_dir.mkdir(exist_ok=True, parents=True)
        output_path = output_dir / self.RESULTS_CSV
        # export results dataframe to a csv
        self.results.to_csv(output_path)
        return output_path

    def export_chart_to_html(self, output_dir: Path = Path("data")) -> Path:
        """Export the plotly chart in self.chart to a png file."""
        # make sure the parent directory exists
        output_dir.mkdir(exist_ok=True, parents=True)
        output_path = output_dir / self.CHART_HTML
        # export chart to a png
        self.chart.write_html(output_path)
        return output_path

    def export_chart_to_png(self, output_dir: Path = Path("data")) -> Path:
        """Export the plotly chart in self.chart to a png file."""
        # make sure the parent directory exists
        output_dir.mkdir(exist_ok=True, parents=True)
        output_path = output_dir / self.CHART_PNG
        # export chart to a png
        self.chart.write_image(output_path, width=900)
        return output_path

    def show_chart(self) -> None:
        """Display self.chart in a browser."""
        self.chart.show()

    def format_slack_message(self) -> str:
        """Format the message that will be included with the charts posted to slack."""
        raise NotImplementedError

    def post_results_to_slack(
        self,
        slackbot: SlackBot,
        channel_id: str,
        output_dir: Path = Path("data"),
    ) -> None:
        """Upload copies of the results and chart to a slack channel."""
        results_csv = self.export_results(output_dir)
        chart_png = self.export_chart_to_png(output_dir)
        chart_html = self.export_chart_to_html(output_dir)
        files = [
            FileMapping(path=str(results_csv), name=results_csv.name),
            FileMapping(path=str(chart_png), name=chart_png.name),
            FileMapping(path=str(chart_html), name=chart_html.name),
        ]
        slackbot.upload_files_to_slack_channel(
            files=files,
            channel_id=channel_id,
            message=self.format_slack_message(),
        )
