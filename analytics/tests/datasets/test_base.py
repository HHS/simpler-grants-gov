"""Test the BaseDataset class."""
from pathlib import Path  # noqa: I001

import pandas as pd

from analytics.datasets.base import BaseDataset

from analytics.integrations.db import get_db

from config import settings

TEST_DATA = [
    {"Col A": 1, "Col b": "One"},
    {"Col A": 2, "Col b": "Two"},
    {"Col A": 3, "Col b": "Three"},
]


# add a test for sql
def test_to_and_from_sql():
    """BaseDataset should write to and load from SQL table with to_sql() and from_sql()."""
    # Setup - create sample dataframe and instantiate class
    test_df = pd.DataFrame(TEST_DATA)
    dataset_in = BaseDataset(test_df)

    # Setup - configure SQL connection
    db_url = settings.database_url
    # Assert the value of db_url
    assert db_url == "sqlite:///mock.db"
    engine = get_db() 
    table_name = "your_table_name"  # Replace with actual table name

    # Execution - write to SQL table and read from SQL table
    dataset_in.to_sql(table_name, engine)
    dataset_out = BaseDataset.from_sql(table_name, engine)
    # Validation - check that datasets match
    assert dataset_in.df.equals(dataset_out.df)


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
