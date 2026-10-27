"""Dotted paths into a form's response."""

from typing import Any


def read(scope: Any, path: str) -> Any:
    """The value at a dotted path below ``scope``, or None."""
    value = scope
    for step in path.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(step)
    return value


def root_of(path: str) -> str:
    """A path's first step: the response field it starts at."""
    return path.split(".", 1)[0]
