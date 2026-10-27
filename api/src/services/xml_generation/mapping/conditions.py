"""The conditions ``$when`` tests: an operator on the answer at a path, or ``all``/``any`` of
other conditions."""

from collections.abc import Callable
from typing import Any

from .paths import read

OPERATORS: dict[str, Callable[[Any, Any], bool]] = {
    "equals": lambda value, expected: value == expected,
    "not_equals": lambda value, expected: value != expected,
    "in": lambda value, expected: value in expected,
    "exists": lambda value, _: value not in (None, ""),
}


def holds(condition: dict[str, Any], scope: Any) -> bool:
    """Whether ``condition`` holds for ``scope``."""
    if "all" in condition:
        return all(holds(c, scope) for c in condition["all"])
    if "any" in condition:
        return any(holds(c, scope) for c in condition["any"])
    operator = OPERATORS.get(condition["operator"])
    if operator is None:
        raise ValueError(f"Unknown condition operator: {condition['operator']}")
    return operator(read(scope, condition["field"]), condition.get("value"))
