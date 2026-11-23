"""Paths to data values in a form's response."""

import re
from typing import Any

# Split a path into steps with these patterns. A segment between dots can be a name followed
# by any number of brackets, so a plain split on "." isn't enough.
_SEGMENT = re.compile(r"([^\[\]]*)((?:\[[^\]]*\])*)")  # "sites[1:]" -> "sites", "[1:]"
_BRACKET = re.compile(r"\[([^\]]*)\]")  # "[0][2]" -> "0", "2"
_INDEX = re.compile(r"-?[0-9]+")  # "0", "-1"
_RANGE = re.compile(r"(-?[0-9]+)?:(-?[0-9]+)?")  # "1:3", "1:", ":2", "-2:"


def steps(path: str) -> list[str | int | slice]:
    """Parse a path into the steps you would take to pluck its value from nested JSON.

    Each step is an object key (``str``), an array index (``int``) or an array slice
    (``slice``). Steps are separated by ``.``, and a key can be followed by brackets that index
    or slice the array at that key, as in Python and jq. The form library's runtime parses the
    same paths.

    Examples:
        ``name``           -> ``["name"]``
        ``contact.email``  -> ``["contact", "email"]``
        ``types[0]``       -> ``["types", 0]``
        ``types[-1]``      -> ``["types", -1]``
        ``types.0``        -> ``["types", "0"]`` (a whole-number key also reads an entry)
        ``sites[1:]``      -> ``["sites", slice(1, None)]``
        ``sites[0].name``  -> ``["sites", 0, "name"]``
        ``.``              -> ``[]`` (the scope itself, e.g. the item inside ``$each``)

    Raises:
        ValueError: for a path that isn't valid, e.g. ``sites[a]`` (a bracket that isn't an
            index or slice), ``sites..name`` (an empty step), or ``sites[1:].name`` (a slice
            that isn't the last step).
    """
    if path == ".":
        return []
    result: list[str | int | slice] = []
    for segment in path.split("."):
        match = _SEGMENT.fullmatch(segment)
        if match is None or segment == "":
            raise ValueError(f"not a path: {path}")
        name, brackets = match.groups()
        if name:
            result.append(name)
        for inner in _BRACKET.findall(brackets):
            if _INDEX.fullmatch(inner):
                result.append(int(inner))
            elif bounds := _RANGE.fullmatch(inner):
                start, stop = (int(b) if b is not None else None for b in bounds.groups())
                result.append(slice(start, stop))
            else:
                raise ValueError(f"not a path: {path}")
    if any(isinstance(step, slice) for step in result[:-1]):
        raise ValueError(f"a range must be a path's last step: {path}")
    return result


def read(scope: Any, path: str) -> Any:
    """Return the value at ``path`` below ``scope``, or None if the response doesn't have it.

    ``.`` returns ``scope`` itself: inside ``$each``, the item. See ``steps`` for the paths
    this reads.
    """
    value = scope
    for step in steps(path):
        # The current value is an array: `types[...]` or `types.0`
        if isinstance(value, list):
            # The step is a slice, `sites[1:]`: read every entry in the range
            if isinstance(step, slice):
                value = value[step]
            # The step is an index, `types[0]` or `types[-1]`: read one entry, or None if the
            # array doesn't have it
            elif isinstance(step, int):
                value = value[step] if -len(value) <= step < len(value) else None
            # The step is a whole-number key, `types.0`: read it as an index, or None if it
            # isn't one
            else:
                in_range = re.fullmatch(r"[0-9]+", step) and int(step) < len(value)
                value = value[int(step)] if in_range else None
        # The current value is an object and the step is a key: `contact.email`
        elif isinstance(value, dict) and isinstance(step, str):
            value = value.get(step)
        # The step doesn't match the value, e.g. an index into an object: there's no value
        else:
            return None
    return value


def root_of(path: str) -> str:
    """Return a path's first step: the response field it starts at."""
    first = steps(path)[:1]
    return first[0] if first and isinstance(first[0], str) else ""
