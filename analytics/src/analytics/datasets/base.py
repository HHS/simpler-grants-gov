# ruff: noqa: E501
# pylint: disable=C0301
"""Base class for all datasets which provides an interface for metrics."""
from pathlib import Path
from typing import Self

import numpy as np
import pandas as pd
from sqlalchemy import Engine

from analytics.datasets.utils import dump_to_json, load_json_file


class BaseDataset:
    """Base class for all datasets."""

    def __init__(self, df: pd.DataFrame) -> None:
        """Instantiate the dataset."""
        self.df = df

    @classmethod
    def from_csv(cls, file_path: str | Path) -> Self:
        """Load and instantiate the dataset from a csv file."""
        return cls(df=pd.read_csv(file_path))

    @classmethod
    def from_dict(cls, data: list[dict]) -> Self:
        """Load the dataset from a list of python dictionaries representing records."""
        return cls(df=pd.DataFrame(data))

    @classmethod
    def from_json(cls, file_path: str | Path) -> Self:
        """Load the dataset from a JSON file."""
        data = load_json_file(str(file_path))
        return cls(df=pd.DataFrame(data))

    def to_sql(
        self,
        output_table: str,
        engine: Engine,
        *,
        replace_table: bool = True,
    ) -> None:
        """
        Write the contents of a pandas DataFrame to a SQL table.

        This function takes a pandas DataFrame (`self.df`), an output table name (`output_table`),
        and a SQLAlchemy Engine object (`engine`) as required arguments. It optionally accepts
        a `replace_table` argument (default: True) that determines how existing data in the
        target table is handled.

        **Parameters:**

        * self (required): The instance of the class containing the DataFrame (`self.df`)
            to be written to the database.
        * output_table (str, required): The name of the table in the database where the
            data will be inserted.
        * engine (sqlalchemy.engine.Engine, required): A SQLAlchemy Engine object representing
            the connection to the database.
        * replace_table (bool, default=True):
            * If True (default), the function will completely replace the contents of the
            existing table with the data from the DataFrame. (if_exists="replace")
            * If False, the data from the DataFrame will be appended to the existing table.
            (if_exists="append")

        **Returns:**

        * None

        **Raises:**

        * Potential exceptions raised by the underlying pandas.to_sql function, such as
            database connection errors or errors related to data type mismatches.
        """
        if replace_table:
            self.df.to_sql(output_table, engine, if_exists="replace", index=False)
        else:
            self.df.to_sql(output_table, engine, if_exists="append", index=False)

    @classmethod
    def from_sql(
        cls,
        source_table: str,
        engine: Engine,
    ) -> Self:
        """
        Read data from a SQL table into a pandas DataFrame and creates an instance of the current class.

        This function takes a source table name (`source_table`) and a SQLAlchemy Engine object (`engine`) as required arguments.
        It utilizes pandas.read_sql to retrieve the data from the database and then creates a new instance of the current class (`cls`) initialized with the resulting DataFrame (`df`).

        **Parameters:**

        * cls (class, required): The class that will be instantiated with the data from the
        SQL table. This allows for creating objects of the same type as the function is called on.
        * source_table (str, required): The name of the table in the database from which the
        data will be read.
        * engine (sqlalchemy.engine.Engine, required): A SQLAlchemy Engine object representing
        the connection to the database.

        **Returns:**

        * Self: A new instance of the current class (`cls`) initialized with the DataFrame
        containing the data from the SQL table.

        **Raises:**

        * Potential exceptions raised by the underlying pandas.read_sql function, such as
        database connection errors or errors related to data type mismatches.
        """
        return cls(df=pd.read_sql(source_table, engine))

    def to_csv(
        self,
        output_file: Path,
        *,  # force include_index to be passed as keyword instead of positional arg
        include_index: bool = False,
    ) -> None:
        """Export the dataset to a csv."""
        return self.df.to_csv(output_file, index=include_index)

    def to_dict(self) -> list[dict]:
        """Export the dataset to a list of python dictionaries representing records."""
        return self.df.replace([np.nan], [None], regex=False).to_dict(orient="records")

    def to_json(self, output_file: str) -> None:
        """Dump dataset to JSON."""
        return dump_to_json(output_file, self.to_dict())
