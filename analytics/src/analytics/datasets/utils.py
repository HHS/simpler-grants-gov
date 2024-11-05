"""Stores utility functions for Dataset classes."""

import json


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
