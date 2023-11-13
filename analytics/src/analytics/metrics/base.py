"""Base class for all metrics"""
import pandas as pd

from analytics.datasets.base import BaseDataset


class BaseMetric:
    """Base class for all metrics"""

    def __init__(self, **kwargs) -> None:
        """Initialize and calculate the metric from the input dataset"""
        self.result = self.calculate()

    def calculate(self) -> pd.DataFrame:
        """Calculate the metric and return the result dataset"""
        raise NotImplementedError

    def visualize(self) -> None:
        """Display a visual representation of the data"""
        raise NotImplementedError
