"""The mapping vocabulary: one handler per ``$`` word.

Each handler takes the current scope (the response, or an item inside ``$each``), its
argument, and ``transform``, which it calls to resolve any input that is itself a value. A
handler returns what its node yields, or None for nothing to write.

    $field       the answer at a dotted path
    $const       a fixed value
    $match       the ``case`` entry for a value, or ``default``
    $transform   a value changed by a function in ``value_transformers``
    $when        ``then`` or ``else``, as a condition holds
    $each        ``map`` once per item of a list, read relative to each item
    $attachment  the upload whose id is at a path
"""

import json
from typing import Any

from ..utils.attachment_mapping import AttachmentInfo
from ..value_transformers import apply_value_transformation
from .conditions import holds
from .paths import read
from .transform import Handler, Transform, is_empty

# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def default_handlers(attachments: dict[str, AttachmentInfo]) -> dict[str, Handler]:
    """Every handler, with ``$attachment`` resolving upload ids against ``attachments``, the
    submission's attachment records."""

    def attachment(scope: Any, path: str, _transform: Transform) -> AttachmentInfo | None:
        upload_id = read(scope, path)
        if is_empty(upload_id):
            return None
        if upload_id not in attachments:
            raise ValueError(
                f"Attachment UUID {upload_id} for field '{path}' not found in attachment mapping"
            )
        return attachments[upload_id]

    return {
        "$field": field,
        "$const": const,
        "$match": match,
        "$transform": transform_value,
        "$when": when,
        "$each": each,
        "$attachment": attachment,
    }


def field(scope: Any, path: str, _transform: Transform) -> Any:
    return read(scope, path)


def const(_scope: Any, value: Any, _transform: Transform) -> Any:
    return value


def match(scope: Any, argument: dict[str, Any], transform: Transform) -> Any:
    """The ``case`` entry for the value, or ``default``. A string is its own key; anything else
    is keyed as JSON writes it, so ``True`` matches ``"true"``. A value with neither is an
    error."""
    value = transform(scope, argument["value"])
    if is_empty(value):
        return None
    key = _case_key(value)
    if key in argument["case"]:
        return transform(scope, argument["case"][key])
    if "default" in argument:
        return transform(scope, argument["default"])
    raise ValueError(f"match has no case for {key!r} and no default")


def transform_value(scope: Any, argument: dict[str, Any], transform: Transform) -> Any:
    value = transform(scope, argument["value"])
    if is_empty(value):
        return None
    config = {"type": argument["name"], "params": argument.get("params", {})}
    return apply_value_transformation(value, config)


def when(scope: Any, argument: dict[str, Any], transform: Transform) -> Any:
    chosen = argument["then"] if holds(argument["condition"], scope) else argument.get("else")
    return None if chosen is None else transform(scope, chosen)


def each(scope: Any, argument: dict[str, Any], transform: Transform) -> list[Any] | None:
    items = transform(scope, argument["items"])
    if not isinstance(items, list):
        return None
    written = [transform(item, argument["map"]) for item in items]
    return [value for value in written if not is_empty(value)]


# =============================================================================
# HELPERS
# =============================================================================


def _case_key(value: Any) -> str:
    """A value as a ``case`` key. A whole-number float is keyed as an integer (``1.0`` as
    ``"1"``), as the form library's generator keys it."""
    if isinstance(value, str):
        return value
    if isinstance(value, float) and value.is_integer():
        return json.dumps(int(value))
    return json.dumps(value)
