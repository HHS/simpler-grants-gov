"""Builders for the XML harness tests' hand-built inputs."""

from typing import Any

from ...json_schema.harness.flatten_schema import FormInput
from ...paths import Path
from . import flatten_xsd
from .flatten_form import FlatForm
from .form_diff import FormDiff

NOTHING_DECLARED = FormDiff(module="a_form")

#: A money pattern `flatten_xsd.implied_range` can read: up to 14 digits and two decimals.
FOURTEEN_DIGITS = r"^\d{1,14}([.]\d{2})?$"


def declaring(**fields: Any) -> FormDiff:
    """A `FormDiff` with the given entries. `declaring(unmapped_fields={"a": "why"})`."""
    return FormDiff(module="a_form", **fields)


def flat(**overrides: Any) -> FlatForm:
    """An empty `FlatForm` with the given parts, so each test sets only what it's about."""
    parts: dict[str, Any] = {
        "diff": NOTHING_DECLARED,
        "targets": {},
        "unchecked_rules": {},
        "xsd_elements": {},
        "attachments": frozenset(),
        "fields": {},
        "transformed": {},
    }
    return FlatForm(**{**parts, **overrides})


def element(
    required: bool = False, position: int = 0, primitive: str | None = None, **rules: Any
) -> flatten_xsd.Element:
    """One XSD element. `element(required=True, maxLength=60)`."""
    return flatten_xsd.Element(
        required=required, position=position, primitive=primitive, rules=rules
    )


def field(required: bool = False, **rules: Any) -> FormInput:
    """One form field and its rules. `field(type="string", maxLength=60)`."""
    return FormInput(required=required, rules=rules)


def named_fields(*names: str) -> dict[Path, FormInput]:
    """Form fields with no rules, for checks that only read which fields exist."""
    return {tuple(name.split(".")): field() for name in names}


def labels(found: list[Any]) -> list[str]:
    """Each discrepancy's label, e.g. `"maxLength differs"`."""
    return [d.label for d in found]
