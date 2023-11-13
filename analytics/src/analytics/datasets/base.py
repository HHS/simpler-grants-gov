"""Base class for all datasets which provides an interface for metrics"""
from typing import Self

import pandas as pd


class BaseDataset:
    """Base class for all datasets"""

    def __init__(self, df: pd.DataFrame) -> None:
        """Instantiate the dataset"""
        self.df = df

    @classmethod
    def from_csv(cls, file_path: str) -> Self:
        """Load and instantiate the dataset from a csv file"""
        return cls(df=pd.read_csv(file_path))

    @classmethod
    def from_dict(cls, data: list[dict]) -> Self:
        """Load the dataset from a list of python dictionaries representing records"""
        return cls(df=pd.DataFrame(data))

    def to_csv(self, output_file: str) -> None:
        """Export the dataset to a csv"""
        return self.df.to_csv(output_file)

    def to_dict(self) -> list[dict]:
        """Export the dataset to a list of python dictionaries representing records"""
        return self.df.to_dict(orient="records")
