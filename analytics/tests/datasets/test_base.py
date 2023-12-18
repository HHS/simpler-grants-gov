"""Test the BaseDataset class."""
from pathlib import Path  # noqa: I001

import pandas as pd

from analytics.datasets.base import BaseDataset

TEST_DATA = [
    {"Col A": 1, "Col b": "One"},
    {"Col A": 2, "Col b": "Two"},
    {"Col A": 3, "Col b": "Three"},
]


def test_to_and_from_csv(tmp_path: Path):
    """BaseDataset should write to csv with to_csv() and load from a csv with from_csv()."""
    # setup - create sample dataframe and instantiate class
    test_df = pd.DataFrame(TEST_DATA)
    dataset_in = BaseDataset(test_df)
    # setup - set output path and check that it doesn't exist
    output_csv = tmp_path / "dataset.csv"
    assert output_csv.exists() is False
    # execution - write to csv and read from csv
    dataset_in.to_csv(output_csv)
    dataset_out = BaseDataset.from_csv(output_csv)
    # validation - check that csv exists and that datasets match
    assert output_csv.exists()
    assert dataset_in.df.equals(dataset_out.df)


def test_to_and_from_dict():
    """BaseDataset should have same input and output with to_dict() and from_dict()."""
    # execution
    dict_in = TEST_DATA
    dataset = BaseDataset.from_dict(TEST_DATA)
    dict_out = dataset.to_dict()
    # validation
    assert dict_in == dict_out
