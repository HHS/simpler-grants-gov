"""Dotted paths into a form's response."""

import re
from typing import Any


def read(scope: Any, path: str) -> Any:
    """The value at a dotted path below ``scope``, or None. ``.`` is ``scope`` itself: inside
    ``$each``, the item. A whole-number step reads a list's entry by index (``types.0``), as
    the form library's runtime does; any other step reads a dict's key."""
    if path == ".":
        return scope
    value = scope
    for step in path.split("."):
        if isinstance(value, list):
            in_range = re.fullmatch(r"[0-9]+", step) and int(step) < len(value)
            value = value[int(step)] if in_range else None
        elif isinstance(value, dict):
            value = value.get(step)
        else:
            return None
    return value


def root_of(path: str) -> str:
    """A path's first step: the response field it starts at."""
    return path.split(".", 1)[0]
