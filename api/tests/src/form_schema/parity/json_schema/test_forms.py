"""Whether a generated form asks for the same things as the hand-written form it mirrors.

Both schemas are flattened to `{path: FormInput}` and held against the `FormDiff` the form
declares in `diffs/`. A difference neither the record accounts for nor the flattening
discards is a failure.

`test_generated_form_does_not_add_extra_fields` and its counterpart are the only checks
that can see a field one form has and the other lacks: neither schema sets
`additionalProperties`, so an unexpected field validates cleanly on both.

Titles and descriptions are compared apart from the rules, ignoring case and whitespace,
since they change what an applicant reads rather than what they may submit. Field order is
read from each form's UI schema, with sections and groups dropped, so regrouping the same
fields is not a difference.

The rule comparison reads a flattened schema, which is an approximation a validator never
has to make -- `merge_schema.py` folds `allOf`, and `if`/`then` branches are left where
they are. It reports every field and keyword that differs in one pass, where a validator
would need a payload that exercises each one.
"""

import importlib

import pytest

from src.form_schema.jsonschema_resolver import resolve_jsonschema
from tests.src.form_schema.parity.json_schema.harness import compare, flatten_schema, flatten_ui
from tests.src.form_schema.parity.json_schema.harness.form_diff import FormDiff

# One record per generated form, from `diffs/`. While it is empty every test below is
# collected once and skipped, since pytest has no form to parametrize it with.
DIFFS: list[FormDiff] = []


def _modules(diff):
    return (
        importlib.import_module(f"src.form_schema.forms.{diff.generated_module}"),
        importlib.import_module(f"src.form_schema.forms.{diff.handwritten_module}"),
    )


def _report(discrepancies) -> str:
    return "\n".join(f"  {d}" for d in discrepancies)


@pytest.fixture(scope="module", params=DIFFS, ids=lambda d: d.generated_module)
def diff(request):
    """One form pair's record. The fixtures below all read it, so a test taking several
    runs once per form rather than once per combination."""
    return request.param


@pytest.fixture(scope="module")
def schemas(diff):
    """One form pair's resolved JSON schemas, generated first."""
    generated, handwritten = _modules(diff)
    return (
        resolve_jsonschema(generated.FORM.form_json_schema),
        resolve_jsonschema(handwritten.FORM_JSON_SCHEMA),
    )


@pytest.fixture(scope="module")
def forms(diff, schemas):
    """One form pair: its record, and both sides' inputs."""
    return (diff, *(flatten_schema.inputs(schema) for schema in schemas))


@pytest.fixture(scope="module")
def wording(diff, schemas):
    """One form pair: its record, and the title and description of every node on each side."""
    return (diff, *(flatten_schema.texts(schema) for schema in schemas))


@pytest.fixture(scope="module")
def orders(diff):
    """One form pair: its record, and both sides' fields in the order their UI places them."""
    generated, handwritten = _modules(diff)
    return (
        diff,
        flatten_ui.field_order(generated.FORM.form_ui_schema),
        flatten_ui.field_order(handwritten.FORM_UI_SCHEMA),
    )


class TestGeneratedVsHandwritten:
    """Does the generated form ask for the same things, under the same rules?"""

    def test_generated_form_not_missing_handwritten_fields(self, forms):
        """A field an applicant can fill in on the form that ships and cannot on this one."""
        missing = [
            d for d in compare.unmatched_fields(*forms) if d.kind == "handwritten input is unmapped"
        ]
        assert not missing, "the hand-written form has fields this one does not:\n" + _report(
            missing
        )

    def test_generated_form_does_not_add_extra_fields(self, forms):
        """A field this form asks for that the form that ships does not."""
        extra = [
            d for d in compare.unmatched_fields(*forms) if d.kind == "generated input is unmapped"
        ]
        assert not extra, "this form has fields the hand-written one does not:\n" + _report(extra)

    def test_generated_form_requires_the_same_fields(self, forms):
        """A field mandatory on one form and optional on the other."""
        differing = [
            d for d in compare.rule_differences(*forms) if d.kind == "requiredness differs"
        ]
        assert not differing, "the two forms disagree about what is required:\n" + _report(
            differing
        )

    def test_generated_form_accepts_the_same_values(self, forms):
        """Every keyword that can make a payload invalid, reported keyword by keyword."""
        differing = [
            d for d in compare.rule_differences(*forms) if d.kind != "requiredness differs"
        ]
        assert not differing, "the two forms accept different values:\n" + _report(differing)

    def test_generated_form_words_fields_the_same(self, wording):
        """A label, heading or help text that reads differently, ignoring case and whitespace."""
        differing = compare.text_differences(*wording)
        assert not differing, "the two forms word their fields differently:\n" + _report(differing)

    def test_generated_form_orders_fields_the_same(self, orders):
        """A field met at a different point, ignoring how either form groups its fields."""
        differing = compare.order_differences(*orders)
        assert not differing, "the two forms place fields in a different order:\n" + _report(
            differing
        )


class TestRecordedDifferences:
    """Whether the record still describes real differences between real fields."""

    def test_recorded_differences_are_not_stale(self, forms, wording, orders):
        """An entry naming a field neither form has makes the rest of the record meaningless."""
        stale = (
            compare.stale_entries(*forms)
            + compare.stale_text_entries(*wording)
            + compare.stale_order_entries(*orders)
        )
        assert not stale, "recorded differences no longer describe real inputs:\n" + _report(stale)
