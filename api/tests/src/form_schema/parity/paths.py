"""Paths to fields and elements, shared by every parity check.

A path is a tuple of property names in `json_schema/`, or XSD element names in `xml/`, with
`[]` standing for any item in a list.

    ("applicant", "street1")                  applicant.street1
    ("activity_line_items", "[]", "title")    activity_line_items.[].title
"""

from typing import Any

Path = tuple[str, ...]

ARRAY = "[]"


def join(path: Path) -> str:
    """Join a path into its dotted form: `("applicant", "street1")` -> `"applicant.street1"`."""
    return ".".join(path)


def split(text: str) -> Path:
    """Split a dotted path into steps: `"applicant.street1"` -> `("applicant", "street1")`."""
    return tuple(text.split("."))


def value_at(data: Any, path: Path) -> Any:
    """Return the value at `path` in `data`, or None if any step is missing.

        value_at({"applicant": {"street1": "1 Main St"}}, ("applicant", "street1"))
        -> "1 Main St"

        value_at({"items": [{"title": "A"}]}, ("items", ARRAY, "title"))
        -> "A"

    An `[]` step reads the first item in the list.
    """
    for step in path:
        if data is None:
            return None
        if step == ARRAY:
            data = data[0] if isinstance(data, list) and data else None
        else:
            data = data.get(step) if isinstance(data, dict) else None
    return data
