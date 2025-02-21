from typing import Any


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
a    """

    flatt_dict1 = flatten_dict(dict1)
    flatt_dict2 = flatten_dict(dict2)

    diffs: list = []

    all_keys = set(flatt_dict1.keys()).union(flatt_dict2.keys())  # Does not keep order

    for k in all_keys:
        v_a = flatt_dict1.get(k, None)
        v_b = flatt_dict2.get(k, None)

        # Store diff if values are different
        if v_a != v_b:
            diff = {"field": k, "before": v_a, "after": v_b}

            diffs.append(diff)

    return diffs
