"""Stores utility functions for Dataset classes."""

import json

import pandas as pd


def load_json_data_as_df(
    file_path: str,
    column_map: dict,
    date_cols: list[str] | None = None,
) -> pd.DataFrame:
    """
    Load a file that contains JSON data and format is as a DataFrame.

    Parameters
    ----------
    file_path: str
        Path to the JSON file with the exported issue data
    column_map: dict
        Dictionary mapping of existing JSON keys to their new column names
    date_cols: list[str]
        List of columns that need to be converted to date types

    Returns
    -------
    pd.DataFrame
        Pandas dataframe with columns renamed to match the values of the column map

    """
    # load json data from the local file
    with open(file_path, encoding="utf-8") as f:
        json_data = json.loads(f.read())

    return load_json_data_as_df_from_object(
        json_data,
        column_map,
        date_cols,
    )


def load_json_data_as_df_from_object(
    json_data: list,
    column_map: dict,
    date_cols: list[str] | None = None,
) -> pd.DataFrame:
    """
    Load JSON data and format it as a DataFrame.

    Parameters
    ----------
    json_data: list
        JSON object with the exported issue data
    column_map: dict
        Dictionary mapping of existing JSON keys to their new column names
    date_cols: list[str]
        List of columns that need to be converted to date types
    key_for_nested_items: Optional[str]
        Name of the key containing a list of objects to load as a dataframe.
        Only needed if the JSON loaded is an object instead of a list

    Returns
    -------
    pd.DataFrame
        Pandas dataframe with columns renamed to match the values of the column map

    """
    # flatten the nested json into a dataframe
    df = pd.json_normalize(json_data)
    # reorder and rename the columns
    df = df[column_map.keys()]
    df = df.rename(columns=column_map)
    # convert datetime columns to date
    if date_cols:
        for col in date_cols:
            # strip off the timestamp portion of the date
            df[col] = pd.to_datetime(df[col]).dt.floor("d")
    return df


def load_json_file(path: str) -> list[dict]:
    """Load contents of a JSON file into a dictionary."""
    with open(path) as f:
        return json.load(f)


def dump_to_json(path: str, data: dict | list[dict]) -> None:
    """Write a dictionary or list of dicts to a json file."""
    with open(path, "w") as f:
        # Uses ensure_ascii=False to preserve emoji characters in output
        # https://stackoverflow.com/a/52206290/7338319
        json.dump(data, f, indent=2, ensure_ascii=False)
