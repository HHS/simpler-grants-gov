"""Validates whether two forms have functional parity, which includes (generally in order
of priority):

- Field validation: Does each field in both forms have a matching field in the other, and
  are matching fields validated against the same constraints?
- Field text: Do matching fields have the same labels and help text?
- Field order: Do matching fields appear in the same relative order?
- Recorded differences: Does every difference recorded in `diffs/` still exist?
"""

import importlib

import pytest

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.json_schema.diffs import key_contacts
from tests.src.form_schema.parity.json_schema.harness import flatten_schema, flatten_ui
from tests.src.form_schema.parity.json_schema.harness.compare import (
    field_order,
    field_text,
    field_validation,
)
from tests.src.form_schema.parity.json_schema.harness.form_diff import FormDiff

# One `FormDiff` per generated form, from `diffs/`.
DIFFS: list[FormDiff] = [key_contacts.DIFF]


def _modules(diff):
    return (
        importlib.import_module(f"src.form_schema.forms.{diff.generated_module}"),
        importlib.import_module(f"src.form_schema.forms.{diff.handwritten_module}"),
    )


def _report(discrepancies) -> str:
    return "\n".join(f"  {d}" for d in discrepancies)


@pytest.fixture(scope="module", params=DIFFS, ids=lambda d: d.generated_module)
def diff(request):
    """One form pair's `FormDiff`. Module-scoped, so each fixture below runs once per form."""
    return request.param


@pytest.fixture(scope="module")
def forms(diff):
    """The `FormDiff`, and both forms' fields from `flatten_schema.inputs()`."""
    generated, handwritten = _modules(diff)
    return (
        diff,
        flatten_schema.inputs(generated.FORM.form_json_schema),
        flatten_schema.inputs(handwritten.FORM_JSON_SCHEMA),
    )


@pytest.fixture(scope="module")
def wording(diff):
    """The `FormDiff`, and both forms' text from `flatten_schema.texts()`."""
    generated, handwritten = _modules(diff)
    return (
        diff,
        flatten_schema.texts(generated.FORM.form_json_schema),
        flatten_schema.texts(handwritten.FORM_JSON_SCHEMA),
    )


@pytest.fixture(scope="module")
def orders(diff):
    """The `FormDiff`, and both forms' fields in the order their UI schemas show them."""
    generated, handwritten = _modules(diff)
    return (
        diff,
        flatten_ui.field_order(generated.FORM.form_ui_schema),
        flatten_ui.field_order(handwritten.FORM_UI_SCHEMA),
    )


class TestFieldValidation:
    """Do both forms have the same fields, required and validated the same way?"""

    def test_generated_form_not_missing_handwritten_fields(self, forms):
        missing = [
            d
            for d in field_validation.unmatched_fields(*forms)
            if d.kind == DiscrepancyKind.UNMAPPED_HANDWRITTEN_INPUT
        ]
        assert not missing, "the hand-written form has fields this one does not:\n" + _report(
            missing
        )

    def test_generated_form_does_not_add_extra_fields(self, forms):
        extra = [
            d
            for d in field_validation.unmatched_fields(*forms)
            if d.kind == DiscrepancyKind.UNMAPPED_GENERATED_INPUT
        ]
        assert not extra, "this form has fields the hand-written one does not:\n" + _report(extra)

    def test_generated_form_requires_the_same_fields(self, forms):
        differing = [
            d
            for d in field_validation.rule_differences(*forms)
            if d.kind == DiscrepancyKind.REQUIREDNESS_DIFFERS
        ]
        assert not differing, "the two forms disagree about what is required:\n" + _report(
            differing
        )

    def test_generated_form_accepts_the_same_values(self, forms):
        differing = [
            d
            for d in field_validation.rule_differences(*forms)
            if d.kind == DiscrepancyKind.RULE_DIFFERS
        ]
        assert not differing, "the two forms accept different values:\n" + _report(differing)


class TestFieldText:
    """Do matching fields, lists and groups have the same text, ignoring case and whitespace?"""

    def test_generated_form_words_fields_the_same(self, wording):
        differing = field_text.differences(*wording)
        assert not differing, "the two forms word their fields differently:\n" + _report(differing)


class TestFieldOrder:
    """Do matching fields appear in the same relative order, however each form groups them?"""

    def test_generated_form_orders_fields_the_same(self, orders):
        differing = field_order.differences(*orders)
        assert not differing, "the two forms place fields in a different order:\n" + _report(
            differing
        )


class TestRecordedDifferences:
    """Does every difference recorded in the `FormDiff` still exist?"""

    def test_recorded_differences_are_not_stale(self, forms, wording, orders):
        stale = (
            field_validation.stale_entries(*forms)
            + field_text.stale_entries(*wording)
            + field_order.stale_entries(*orders)
        )
        assert not stale, "recorded differences no longer describe real inputs:\n" + _report(stale)
