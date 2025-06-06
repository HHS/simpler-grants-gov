from typing import Any

def build_path_str(path: list[str]) -> str:
    """Build a path string for validation issues

    We prepend $. on the front to mimic the format of
    the JSON Schema validation
    """
    return ".".join(["$"] + path)

def get_nested_value(data: dict, path: list[str]) -> Any:
    """Fetch a value from a dictionary based on the nested path

    For example, if you have the following dict:
        {
            "path": {
                "to": {
                    "some_field": 10
                },
                "another_field": "hello"
            }
        }

        Passing in the following paths would give the following values:
        ["path", "to", "some_field"] -> 10
        ["path", "another_field"] -> "hello"
        [] -> Returns the whole dict back
        ["something", "that", "isn't", "a", "path"] -> None
    """
    for part in path:
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
            raise ValueError(f"Unable to populate nested value, value in path is not a dictionary: {'.'.join(path)}")

    data[path[-1]] = value

    return json_data