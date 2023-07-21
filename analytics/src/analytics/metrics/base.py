"""Base class for all metrics"""
from analytics.datasets.base import BaseDataset


class BaseMetric:
    """Base class for all metrics"""

    def __init__(self, dataset: BaseDataset) -> None:
        """Initialize and calculate the metric from the input dataset"""
        self.dataset = dataset
        self.result = self.calculate()

    def calculate(self) -> BaseDataset:
        """Calculate the metric and return the result dataset"""
        raise NotImplementedError

    def visualize(self) -> None:
        """Display a visual representation of the data"""
