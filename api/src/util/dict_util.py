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
