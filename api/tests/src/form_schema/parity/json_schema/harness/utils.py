"""Builders for the harness tests' hand-built inputs."""

from ...paths import Path
from .compare.match import match_fields
from .flatten_schema import FieldText, FormInput
from .form_diff import FormDiff

NOTHING_DECLARED = FormDiff(generated_module="g", handwritten_module="h")


def declaring(**fields) -> FormDiff:
    """A `FormDiff` with the given entries. `declaring(mapped={"a": "b"})`."""
    return FormDiff(generated_module="g", handwritten_module="h", **fields)


def named_inputs(*names: str) -> dict[Path, FormInput]:
    """Optional fields with no rules, for checks that only read which fields exist."""
    return {tuple(name.split(".")): FormInput(required=False, rules={}) for name in names}


def field(required: bool = False, **rules) -> FormInput:
    """One field and its rules. `field(type="string", maxLength=60)`."""
    return FormInput(required=required, rules=rules)


def worded(title: str | None = None, description: str | None = None) -> FieldText:
    """One node's text. `worded("Email", "Where we will reach you.")`."""
    return FieldText(title=title, description=description)


def placed(*names: str) -> list[Path]:
    """Fields in the order a UI schema shows them."""
    return [tuple(name.split(".")) for name in names]


def matched(diff, generated, handwritten) -> dict[str, str]:
    """`match_fields()` with dotted paths, for readable assertions."""
    return {".".join(k): ".".join(v) for k, v in match_fields(diff, generated, handwritten).items()}


def kinds(discrepancies) -> list[str]:
    return [d.kind for d in discrepancies]
