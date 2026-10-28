"""The conditions ``$when`` tests: an operator on the answer at a path, ``all``/``any`` of
other conditions, or ``not`` another."""

from collections.abc import Callable
from typing import Any

from .paths import read


def _same(value: Any, expected: Any) -> bool:
    """Whether two answers are equal as the form library's runtime compares them: a boolean
    never equals a number, so ``True`` isn't ``1``."""
    return isinstance(value, bool) == isinstance(expected, bool) and value == expected


OPERATORS: dict[str, Callable[[Any, Any], bool]] = {
    "equals": _same,
    "not_equals": lambda value, expected: not _same(value, expected),
    "in": lambda value, expected: any(_same(value, option) for option in expected),
    "contains": lambda value, expected: isinstance(value, list)
    and any(_same(entry, expected) for entry in value),
    "exists": lambda value, _: value not in (None, ""),
}


def holds(condition: dict[str, Any], scope: Any) -> bool:
    """Whether ``condition`` holds for ``scope``."""
    if "all" in condition:
        return all(holds(c, scope) for c in condition["all"])
    if "any" in condition:
        return any(holds(c, scope) for c in condition["any"])
    if "not" in condition:
        return not holds(condition["not"], scope)
    operator = OPERATORS.get(condition["operator"])
    if operator is None:
        raise ValueError(f"Unknown condition operator: {condition['operator']}")
    return operator(read(scope, condition["field"]), condition.get("value"))


def fields_of(condition: dict[str, Any]) -> list[str]:
    """The paths a condition reads, in the conditions it combines too."""
    if "field" in condition:
        return [condition["field"]]
    nested = [*condition.get("all", []), *condition.get("any", [])]
    if "not" in condition:
        nested.append(condition["not"])
    return [field for c in nested for field in fields_of(c)]
