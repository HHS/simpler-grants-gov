"""Walk a mapping and resolve it against a form's response.

Modeled on the CommonGrants SDK's ``transform_from_mapping``: a node whose one key names a
handler is passed to that handler; any other object is output shape, and each of its values is
resolved in turn. The result is a tree shaped like the mapping, with every function replaced
by what it yields, which ``xml_writer`` then writes.

Two departures from the SDK:

- Handlers receive the walker itself, so a function's inputs can be any value and functions
  nest (a ``$match`` branch can be a ``$when``).
- Vocabulary keys start with ``$``, and anything that resolves to nothing (None, "", or an
  empty group or list) is left out.
"""

from collections.abc import Callable
from typing import Any

Transform = Callable[[Any, Any], Any]
"""Resolve a mapping node against a scope: ``transform(data, node)``."""

Handler = Callable[[Any, Any, Transform], Any]
"""A vocabulary word: ``handler(data, argument, transform)`` returns what the node yields."""


class Group(dict[str, Any]):
    """Output shape: elements to write, in order. Kept apart from a plain ``dict`` that a
    ``$field`` reads from the response, which is data, not elements."""


# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def transform_from_mapping(data: Any, mapping: Any, handlers: dict[str, Handler]) -> Any:
    """Resolve ``mapping`` against ``data``, a form's response or, inside ``$each``, an item."""

    def transform(scope: Any, node: Any) -> Any:
        if not isinstance(node, dict):
            return node  # a literal, e.g. a ``case`` entry
        name = _function_name(node, handlers)
        if name is not None:
            return handlers[name](scope, node[name], transform)

        group = Group()
        for key, child in node.items():
            value = transform(scope, child)
            if not is_empty(value):
                group[key] = value
        return group

    return transform(data, mapping)


def is_empty(value: Any) -> bool:
    """Whether a resolved value has nothing to write."""
    return value is None or value == "" or (isinstance(value, (dict, list)) and not value)


# =============================================================================
# HELPERS
# =============================================================================


def _function_name(node: dict[str, Any], handlers: dict[str, Handler]) -> str | None:
    """The handler a node names, or None for output shape. A ``$`` key that isn't a handler,
    or one beside other keys, is an error."""
    names = [key for key in node if key.startswith("$")]
    if not names:
        return None
    if len(node) != 1 or names[0] not in handlers:
        raise ValueError(f"Not a mapping function: {sorted(node)}")
    return names[0]
