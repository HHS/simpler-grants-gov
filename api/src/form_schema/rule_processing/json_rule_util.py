import logging
import re
from typing import Any

from src.util.dict_util import get_nested_value

logger = logging.getLogger(__name__)

RELATIVE_PATH_TOKEN = "@THIS."

# Regex to parse strings that end with [*] or [0] (any number of digits)
ARRAY_INDEX_REGEX = re.compile(
    r"""
    \[           # Has a [
    ([0-9]*?|\*) # Any number of numbers or exactly 1 *
    \]$          # String ends with ]
    """,
    re.ASCII | re.VERBOSE,
)


def build_path_str(path: list[str], index: int | None = None) -> str:
    """Build a path string for validation issues

    We prepend $. on the front to mimic the format of
    the JSON Schema validation
    """
    path_str = ".".join(["$"] + path)

    if index is not None:
        path_str += f"[{index}]"

    return path_str


def is_relative_path(raw_path: str) -> bool:
    """If the path starts with @THIS. then we know it's supposed to be a relative path"""
    return raw_path.startswith(RELATIVE_PATH_TOKEN)


def make_relative_path_absolute(path: list[str], relative_path: str) -> list[str]:
    """Create an absolute path from a relative path

    A relative path is of the form @THIS.x.y where @THIS
    is saying to go from the same level as the path. To accomplish that
    we drop the last path param, and add everything after the @THIS.

    For example, if we had a path of ["a", "b[*]", "c"] and a relative
    path of @THIS.x.y, the path we would produce would be:
    ["a", "b[*]", "x", "y"]

    These paths can include arrays in either [*] or [1] form.

    NOTE: While we could use the `parent` value in
    """
    updated_relative_path = relative_path.removeprefix(RELATIVE_PATH_TOKEN)
    return path[:-1] + updated_relative_path.split(".")


def get_field_values(data: dict, fields: list[str], path: list[str]) -> list:
    """Fetch a list of field values from the JSON

    fields should be a list of paths that can either be:
    * absolute: "x.y[*].z[0]"
    * relative: "@THIS.x.y[*]"

    Relative paths get appended to the path we're currently processing at
    after removing the current node
    For example: a path of ["a[*]", "b"] and a relative path of @THIS.x.y will be treated as ["a[*]", "x", "y"]

    Arrays are supported, we will fetch all values under that path if [*] is specified
    """
    values = []

    for field in fields:
        if is_relative_path(field):
            field_path = make_relative_path_absolute(path, field)
        else:
            field_path = field.split(".")

        value = get_nested_value(data, field_path)
        # If no value found, we won't add it to the list
        if value is None:
            continue

        # Because we might have fetched an array path, we
        # want to pull each value out
        if isinstance(value, list):
            for v in value:
                values.append(v)
        else:
            values.append(value)

    return values


def _populate_nested_value_for_array(
    json_data: dict,
    curr_node: str,
    sub_path: list[str],
    raw_index: str,
    value: Any,
    remove_null_fields: bool = True,
) -> dict:
    """Handle the case where we need to populate a nested value
    for an array field.

    Will handle iterating over the array and populating that value,
    even if multiple levels down from the array itself.
    """
    node_name = curr_node.split("[")[0]
    array_value = json_data.get(node_name, None)

    # If the array doesn't yet exist in the data, don't create it
    # and leave the json value unset.
    if array_value is None:
        return json_data
    # Sanity check to make sure the data we're looking at is an array
    if not isinstance(array_value, list):
        raise ValueError(
            f"Unable to populate nested value, value in path is not a list: {curr_node}"
        )

    if raw_index == "*":
        indexes = [i for i in range(len(array_value))]
    else:
        try:
            indexes = [int(raw_index)]
        except ValueError as e:
            # This case shouldn't be possible if the above regex
            # is working, but let's be very safe
            raise ValueError(f"Unexpected index in path part: {raw_index}") from e

    # For each index, recursively call/update the values
    for index in indexes:
        # If we're at the end of the path, don't bother recursing down
        # we can just set the value directly
        if len(sub_path) == 0:
            array_value[index] = value
        else:
            result = _populate_nested_value(
                array_value[index], sub_path, value, remove_null_fields=remove_null_fields
            )
            array_value[index] = result
    return json_data


def _get_index_from_str(text: str) -> str | None:
    """Get the index value from a string

    Examples:
        * my_text[0]   -> "0"
        * my_text[123] -> "123"
        * my_text[*]   -> "*"
        * my_text      -> None # No array
        * my_text[-1]  -> None # Negative index not supported
        * [1]my_text   -> None # Only at the end
        * my_text[**]  -> None # Has to be exactly one *
    """
    match = ARRAY_INDEX_REGEX.search(text)
    if match is None:
        return None

    # Fetch the value it found between the []
    return match.group(1)


def _populate_nested_value(
    json_data: dict, path: list[str], value: Any, remove_null_fields: bool = True
) -> dict:
    """Populate a value in a series of nested dictionaries

    For example, if your path is ["path", "to", "field"]
    and the incoming data were {"path": {"some_field": 123}} the result would be
    {
        "path": {
            "some_field": 123,
            "to": {
                "some_field": "whatever value"
                }
            },
    }

    This can handle populating values in arrays, but will only ever
    modify items in an array, and never create an array or add/remove items from an array.
    """

    if len(path) == 0:
        raise ValueError("Unable to populate nested value, empty path given")

    curr_node = path[0]
    sub_path = path[1:]

    # If the current path piece ends with [*] or [#], then
    # process this as an array.
    raw_index = _get_index_from_str(curr_node)
    if raw_index is not None:
        return _populate_nested_value_for_array(
            json_data=json_data,
            curr_node=curr_node,
            sub_path=sub_path,
            raw_index=raw_index,
            value=value,
            remove_null_fields=remove_null_fields,
        )

    # If we're at the end of the path, populate
    # the value in the json_data and return, we're
    # done with recursion down this path.
    if len(path) == 1:
        # If a value is None and we want to remove null fields
        # then we want to skip populating the field will null
        if value is None and remove_null_fields:
            # If the field already exists, remove it rather
            # than leave some lingering value
            if json_data.get(curr_node, None) is not None:
                del json_data[curr_node]

            return json_data

        json_data[curr_node] = value
        return json_data

    # If the value is None, and we want to remove null fields
    # Don't create a nested object if the value is just going to be removed
    # This prevents us from creating a path to an object and then doing nothing with it
    if value is None and remove_null_fields and json_data.get(curr_node, None) is None:
        return json_data

    # If the value doesn't exist, make it a dictionary
    json_data.setdefault(curr_node, {})

    # If we're looking at data that isn't a dictionary
    # then something is misconfigured somewhere as we
    # expect dictionaries or arrays until the end of the path is reached
    if not isinstance(json_data[curr_node], dict):
        raise ValueError(
            f"Unable to populate nested value, value in path is not a dictionary: {curr_node}"
        )

    result = _populate_nested_value(
        json_data[curr_node], sub_path, value, remove_null_fields=remove_null_fields
    )
    json_data[curr_node] = result
    return json_data


def populate_nested_value(
    json_data: dict, path: list[str], value: Any, remove_null_fields: bool = True
) -> dict:
    """Handle populating a nested value, just a wrapper around _populate_nested_value
    to add a convenient error log message for debugging
    """
    try:
        return _populate_nested_value(json_data, path, value, remove_null_fields)
    except Exception:
        logger.exception("Failed to populate nested value", extra={"path": build_path_str(path)})
        raise
