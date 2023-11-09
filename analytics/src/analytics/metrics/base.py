"""Base class for all metrics"""
import pandas as pd

from analytics.datasets.base import BaseDataset


class BaseMetric:
    """Base class for all metrics"""

    def __init__(self, dataset: BaseDataset, **kwargs) -> None:
        """Initialize and calculate the metric from the input dataset"""
        self.dataset = dataset
        self.result = self.calculate(**kwargs)

    def calculate(self, **kwargs) -> pd.DataFrame:
        """Calculate the metric and return the result dataset"""
        raise NotImplementedError

    def visualize(self) -> None:
        """Display a visual representation of the data"""
        raise NotImplementedError
