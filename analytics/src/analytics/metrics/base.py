"""Base class for all metrics"""
import pandas as pd
from plotly.graph_objects import Figure


class BaseMetric:
    """Base class for all metrics"""

    def __init__(self) -> None:
        """Initialize and calculate the metric from the input dataset"""
        self.result = self.calculate()

    def calculate(self) -> pd.DataFrame:
        """Calculate the metric and return the resulting dataset"""
        raise NotImplementedError

    def visualize(self) -> Figure:
        """Display a visual representation of the data"""
        raise NotImplementedError
