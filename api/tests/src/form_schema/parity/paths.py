"""Path vocabulary shared by every comparison.

A path is a tuple of steps: response field names, with a repeated item spelled `[]`.

    ("applicant", "street1")                  applicant.street1
    ("activity_line_items", "[]", "title")    activity_line_items.[].title
"""

from typing import Any

Path = tuple[str, ...]

ARRAY = "[]"


def join(path: Path) -> str:
    """`("applicant", "street1")` -> `"applicant.street1"`."""
    return ".".join(path)


def split(text: str) -> Path:
    """`"applicant.street1"` -> `("applicant", "street1")`."""
    return tuple(text.split("."))


def value_at(data: Any, path: Path) -> Any:
    """The value at `path`, or None if any step is absent.

        value_at({"applicant": {"street1": "1 Main St"}}, ("applicant", "street1"))
        -> "1 Main St"

        value_at({"items": [{"title": "A"}]}, ("items", ARRAY, "title"))
        -> "A"

    An `[]` step takes the first item, so this reports the shape of a repeated section
    rather than every value in it.
    """
    for step in path:
        if data is None:
            return None
        if step == ARRAY:
            data = data[0] if isinstance(data, list) and data else None
        else:
            data = data.get(step) if isinstance(data, dict) else None
    return data
