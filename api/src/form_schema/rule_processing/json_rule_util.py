import re
from typing import Any
import jsonpath_ng
import logging

logger = logging.getLogger(__name__)

def build_path_str(path: list[str], index: int | None = None) -> str:
    """Build a path string for validation issues

    We prepend $. on the front to mimic the format of
    the JSON Schema validation
    """
    path_str = ".".join(["$"] + path)

    if index is not None:
        path_str += f"[{index}]"

    return path_str


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
        ["array_field[]", "x"] -> [2, 3]
        ["array_field[0]", "x"] -> 2
        ["array_field[]", "y"] -> ["hello", "there"]
        ["array_field[0]", "y"] -> "hello"
        ["array_field[]", "z"] -> [None, "there"]
        ["array_field[0]", "z"] -> None
        ["array_field[]"] -> [{"x": 2, "y": "hello"}, {"x": 3, "y": "there", "z": "words"}] # Note this is the same as just ["array_field"] with more steps
    """
    if True:
        if len(path) == 0:
            return data
        full_path = ".".join(path)
        expr = jsonpath_ng.parse(full_path)

        result = expr.find(data)
        print(result)
        if len(result) == 0:
            return None
        if len(result) == 1 and "[*]" not in full_path:
            return result[0].value

        return [r.value for r in result]

    curr_path = []
    for part in path:
        curr_path.append(part)

        # TODO - move this mess into a function
        match = re.search(r"\[(.*?)]$", part)
        if match is not None:
            if not isinstance(data, dict):
                logger.error("TODO - bad type")
                return None


            field_name = part.split("[")[0]
            if field_name not in data:
                return None

            field_value = data[field_name]
            if not isinstance(field_value, list):
                return None


            print(f"HERE: {data}")

            raw_index = match.group(1)
            if raw_index == "*": # TODO - consider a * instead?
                # TODO - iteration via some sort of recursion?

                nested_path = path[len(curr_path):]

                values = []
                for item in field_value:
                    # TODO - shortcut if curr_path == path
                    values.append(get_nested_value(item, nested_path))

                return values

            else:
                # TODO - error handling
                index = int(raw_index)

                if index > len(field_value):
                    logger.error("TODO - bad index")
                    return None

                data = field_value[index]

        else:
            if isinstance(data, dict) and part in data:
                data = data[part]
            else:
                return None

    return data


def populate_nested_value(json_data: dict, path: list[str], value: Any) -> dict:
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
    """
    # If the path is empty, we assume the rule is misconfigured
    # as we can't populate a field we don't know the name of
    if len(path) == 0:
        raise ValueError("Unable to populate nested value, empty path given")

    # Iterate down the path, creating dicts if one
    # does not already exist.
    data = json_data
    for part in path[:-1]:
        if part in data:
            data = data[part]
        else:
            data = data.setdefault(part, {})

        # If the data we pulled out is not a dictionary
        # error because it means the data/configuration
        # is out of sync
        # For example, assume a dictionary of {"my_field": 10}
        # and a path of ["my_field", "nested_field"] were passed in
        # we wouldn't want to change "my_field" to a dict and erase a users answer.
        # This is likely a configurational issue we should be alerted to.
        if not isinstance(data, dict):
            raise ValueError(
                f"Unable to populate nested value, value in path is not a dictionary: {'.'.join(path)}"
            )

    # Set (and override) the value
    data[path[-1]] = value

    return json_data
