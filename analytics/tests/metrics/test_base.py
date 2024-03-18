"""Test the BaseMetric class."""
# pylint: disable=abstract-method
import pandas as pd  # noqa: I001
import pytest

from analytics.datasets.base import BaseDataset
from analytics.metrics.base import BaseMetric, Statistic


class MetricWithoutStats(BaseMetric):
    """Create a mock metric for testing without get_stats() method."""

    def calculate(self) -> pd.DataFrame:
        """Implement calculate method."""
        return pd.DataFrame()


class MetricWithoutPlotResults(BaseMetric):
    """Create a mock metric for testing without get_stats() method."""

    def calculate(self) -> pd.DataFrame:
        """Implement calculate method."""
        return pd.DataFrame()

    def get_stats(self) -> dict[str, Statistic]:
        """Implement get_stats method."""
        return {}


@pytest.fixture(scope="module", name="dataset")
def mock_dataset() -> BaseDataset:
    """Create a mock BaseDataset instance for tests."""
    return BaseDataset(df=pd.DataFrame())


class TestRequiredImplementations:
    """Check that NotImplementedError is raised for abstract methods."""

    def test_raise_not_implemented_on_init_due_to_calculate(
        self,
        dataset: BaseDataset,
    ):
        """Error should be raised for __init__() method without calculate()."""
        with pytest.raises(NotImplementedError):
            BaseMetric(dataset)

    def test_raise_not_implemented_on_init_due_to_get_stats(
        self,
        dataset: BaseDataset,
    ):
        """Error should be raised for __init__() method without get_stats()."""
        with pytest.raises(NotImplementedError):
            MetricWithoutStats(dataset)

    def test_raise_not_implemented_for_plot_results(self, dataset: BaseDataset):
        """NotImplementedError should be raised for plot_results()."""
        mock_metric = MetricWithoutPlotResults(dataset)
        with pytest.raises(NotImplementedError):
            mock_metric.plot_results()

    def test_raise_not_implemented_for_format_slack_message(
        self,
        dataset: BaseDataset,
    ):
        """NotImplementedError should be raised for format_slack_message()."""
        mock_metric = MetricWithoutPlotResults(dataset)
        with pytest.raises(NotImplementedError):
            mock_metric.format_slack_message()
