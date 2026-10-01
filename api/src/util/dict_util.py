from typing import Any

import jsonpath_ng


def flatten_dict(in_dict: Any, separator: str = ".", prefix: str = "") -> dict:
    """
    Takes a set of nested dictionaries and flattens it

    For example::

    {
        "a": {
            "b": {
                "c": "value_c"
            },
            "d": "value_d"
        },
        "e": "value_e"
    }

    Would become::

    {
        "a.b.c": "value_c",
        "a.d": "value_d",
        "e": "value_e"
    }
    """

    if isinstance(in_dict, dict):
        return_dict = {}
        # Iterate over each item in the dictionary
        for kk, vv in in_dict.items():
            # Flatten each item in the dictionary
            for k, v in flatten_dict(vv, separator, str(kk)).items():
                # Update the path
                new_key = prefix + separator + str(k) if prefix else str(k)
                return_dict[new_key] = v

        return return_dict

    # value isn't a dictionary, so no more recursion
    return {prefix: in_dict}


def diff_nested_dicts(dict1: dict, dict2: dict) -> list:
    """
        Compare two dictionaries (possibly nested), return a list of differences
        with 'field', 'before', and 'after' for each key.


        :param dict1 : The first dictionary.
        :param dict2 : The second dictionary.
        :return : Returns a list of dictionaries representing the differences.
    a"""

    flatt_dict1 = flatten_dict(dict1)
    flatt_dict2 = flatten_dict(dict2)

    diffs: list = []

    all_keys = set(flatt_dict1.keys()).union(flatt_dict2.keys())  # Does not keep order

    for k in all_keys:
        values = [flatt_dict1.get(k, None), flatt_dict2.get(k, None)]
        # convert values to set for comparison
        v_a = _convert_iterables_to_set(values[0])
        v_b = _convert_iterables_to_set(values[1])

        if v_a != v_b:
            diffs.append({"field": k, "before": values[0], "after": values[1]})

    return diffs


def _convert_iterables_to_set(data: Any) -> Any:
    if isinstance(data, (list, tuple)):
        if data and isinstance(data[0], (dict, list)):
            return {tuple(d.items()) for d in data}
        return set(data)
    return data


def get_nested_value(data: dict, path: list[str]) -> Any:
    """Fetch a value from a dictionary based on the nested path

    For example, if you have the following dict:
        {
            "path": {
                "to": {
                    "some_field": 10
                },
                "another_field": "hello"
            },
            "array_field": [
              {
                "x": 1,
                "y": "hello"
              },
              {
                "x": 3,
                "y": "there",
                "z": "words"
              }
            ]
        }

        Passing in the following paths would give the following values:
        ["path", "to", "some_field"] -> 10
        ["path", "another_field"] -> "hello"
        [] -> Returns the whole dict back
        ["something", "that", "isn't", "a", "path"] -> None

        Array Cases
        ["array_field[*]", "x"] -> [2, 3]
        ["array_field[0]", "x"] -> 2
        ["array_field[*]", "y"] -> ["hello", "there"]
        ["array_field[0]", "y"] -> "hello"
        ["array_field[*]", "z"] -> [None, "there"]
        ["array_field[0]", "z"] -> None
        ["array_field[*]"] -> [{"x": 2, "y": "hello"}, {"x": 3, "y": "there", "z": "words"}] # Note this is the same as just ["array_field"] with more steps
    """
    # If no path, just return the data
    if len(path) == 0:
        return data

    # Use jsonpath_ng to parse the path and
    # find the data
    full_path = ".".join(path)
    expr = jsonpath_ng.parse(full_path)
    result = expr.find(data)

    # No results, return None, not an empty list
    if len(result) == 0:
        return None
    # One result and the path didn't specify an array (anywhere, not just at end)
    # then we want to return a single item
    if len(result) == 1 and "[*]" not in full_path:
        return result[0].value

    # Otherwise return the list of results
    return [r.value for r in result]
