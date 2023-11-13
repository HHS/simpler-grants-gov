"""Stores utility functions for Dataset classes"""
import json
from typing import Optional

import pandas as pd


def load_json_data_as_df(
    file_path: str,
    column_map: dict,
    date_cols: list[str],
    key_for_nested_items: Optional[str] = None,
) -> pd.DataFrame:
    """Load a file that contains JSON data and format is as a DataFrame

    Parameters
    ----------
    file_path: str
        Path to the JSON file with the exported issue data
    column_map: dict
        Dictionary mapping of existing JSON keys to their new column names
    date_cols: list[str]
        List of columns that need to be converted to date types
    key_for_items: str
        Name of the

    Returns
    -------
    pd.DataFrame
        Pandas dataframe with columns renamed to match the values of the column map

    Notes
    -----
    TODO: @widal001 2023-11-06 - Consider replacing column_map and date_cols with a
        pydantic schema which would also allow us to do type validation and conversions
    """
    # load json data from the local file
    with open(file_path, encoding="utf-8") as f:
        json_data = json.loads(f.read())
    # if the items we want to convert are nested under a key extract them
    if key_for_nested_items:
        json_data = json_data[key_for_nested_items]
    # flatten the nested json into a dataframe
    df = pd.json_normalize(json_data)
    # reorder and rename the columns
    df = df[column_map.keys()]
    df = df.rename(columns=column_map)
    # convert datetime columns to date
    for col in date_cols:
        # strip off the timestamp portion of the date
        df[col] = pd.to_datetime(df[col]).dt.floor("d")
    return df
