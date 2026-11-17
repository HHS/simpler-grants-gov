"""Paths into a form's response."""

import re
from typing import Any

_SEGMENT = re.compile(r"([^\[\]]*)((?:\[[^\]]*\])*)")
_BRACKET = re.compile(r"\[([^\]]*)\]")
_INDEX = re.compile(r"-?[0-9]+")
_RANGE = re.compile(r"(-?[0-9]+)?:(-?[0-9]+)?")


def steps(path: str) -> list[str | int | slice]:
    """A path's steps: an object's key (``str``), a list's entry by index (``int``), or a range
    of its entries (``slice``). Steps are separated by ``.``, and a name can be followed by
    brackets: ``[i]`` reads one entry (``types[0]``, ``types[-1]``), ``[start:stop]`` a range,
    its stop excluded (``sites[1:]``, ``codes[:3]``). A range must be the last step. A
    whole-number step (``types.0``) also reads an entry, as before brackets. ``.`` is no
    steps: the scope itself. The form library's runtime reads the same paths."""
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
    """The value at a path below ``scope``, or None. ``.`` is ``scope`` itself: inside
    ``$each``, the item. See ``steps`` for what a path can say."""
    value = scope
    for step in steps(path):
        if isinstance(value, list):
            if isinstance(step, slice):
                value = value[step]
            elif isinstance(step, int):
                value = value[step] if -len(value) <= step < len(value) else None
            else:
                in_range = re.fullmatch(r"[0-9]+", step) and int(step) < len(value)
                value = value[int(step)] if in_range else None
        elif isinstance(value, dict) and isinstance(step, str):
            value = value.get(step)
        else:
            return None
    return value


def root_of(path: str) -> str:
    """A path's first step: the response field it starts at."""
    first = steps(path)[:1]
    return first[0] if first and isinstance(first[0], str) else ""
