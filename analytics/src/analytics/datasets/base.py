"""Base class for all datasets which provides an interface for metrics"""
import pandas as pd


class BaseDataset:
    """Base class for all datasets"""

    def __init__(self) -> None:
        pass

    def to_csv(self) -> None:
        """Export the dataset to a csv"""
        raise NotImplementedError

    def to_df(self) -> pd.DataFrame:
        """Export the dataset to a dataframe"""
        raise NotImplementedError
