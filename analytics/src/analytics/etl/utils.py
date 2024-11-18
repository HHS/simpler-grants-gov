"""Expose utility functions used across the etl sub-package."""

import json
from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel

# Define a generic type variable for the schema
T = TypeVar("T", bound=BaseModel)


def load_config(config_path: Path, schema: type[T]) -> T:
    """
    Load a JSON config file and validate it against a Pydantic schema.

    Parameters
    ----------
    config_path:
        Path to the JSON config file.
    schema:
        The Pydantic schema class to validate the JSON data.

    Returns
    -------
    An instance of the schema containing validated config data.

    """
    with open(config_path) as f:
        config_data = json.load(f)

    return schema(**config_data)
