import uuid

import jsonref
import pytest

from src.db.models.competition_models import Form
from src.form_schema.forms import _ALL_FORMS, init_form_registry
from src.form_schema.registry.form_template_registry import (
    FormTemplateKey,
    FormTemplateRegistry,
    form_template_registry,
)


def _make_form(
    form_id: uuid.UUID | None = None,
    json_schema: dict | None = None,
) -> Form:
    return Form(
        form_id=form_id or uuid.uuid4(),
        form_name="Test Form",
        short_form_name="TEST",
        form_version="1.0",
        agency_code="TST",
        form_json_schema=(
            json_schema if json_schema is not None else {"type": "object", "properties": {}}
        ),
        form_ui_schema=[],
    )


# ---------------------------------------------------------------------------
# FormTemplateKey
# ---------------------------------------------------------------------------


def test_form_template_key_is_a_named_tuple():
    form_id = uuid.uuid4()
    key = FormTemplateKey(form_id=form_id, major_version=1)
    assert key.form_id == form_id
    assert key.major_version == 1


def test_module_level_singleton_exists():
    assert isinstance(form_template_registry, FormTemplateRegistry)


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_register_and_get_returns_form():
    registry = FormTemplateRegistry()
    form = _make_form()

    registry.register(form, major_version=1)

    result = registry.get_by_id_and_major_version(FormTemplateKey(form.form_id, 1))
    assert result is form


def test_get_all_returns_all_registered_forms():
    registry = FormTemplateRegistry()
    form_a = _make_form()
    form_b = _make_form()

    registry.register(form_a, major_version=1)
    registry.register(form_b, major_version=1)

    result = registry.get_all()
    assert len(result) == 2
    assert form_a in result
    assert form_b in result


def test_get_all_empty_registry():
    registry = FormTemplateRegistry()
    assert registry.get_all() == []


def test_same_form_id_different_major_versions():
    registry = FormTemplateRegistry()
    form_id = uuid.uuid4()
    form_v1 = _make_form(form_id=form_id)
    form_v2 = _make_form(form_id=form_id)

    registry.register(form_v1, major_version=1)
    registry.register(form_v2, major_version=2)

    assert registry.get_by_id_and_major_version(FormTemplateKey(form_id, 1)) is form_v1
    assert registry.get_by_id_and_major_version(FormTemplateKey(form_id, 2)) is form_v2


def test_register_resolves_json_schema_refs():
    registry = FormTemplateRegistry()
    schema_with_ref = {
        "type": "object",
        "properties": {
            "field": {"$ref": "#/$defs/my_def"},
        },
        "$defs": {
            "my_def": {"type": "string"},
        },
    }
    form = _make_form(json_schema=schema_with_ref)

    registry.register(form, major_version=1)

    # After registration the $ref should be inlined
    assert form.form_json_schema["properties"]["field"] == {"type": "string"}


def test_instances_are_isolated():
    registry_a = FormTemplateRegistry()
    registry_b = FormTemplateRegistry()
    form = _make_form()

    registry_a.register(form, major_version=1)

    assert registry_a.get_all() == [form]
    assert registry_b.get_all() == []


# ---------------------------------------------------------------------------
# register() raise cases
# ---------------------------------------------------------------------------


def test_register_raises_for_non_uuid_form_id():
    registry = FormTemplateRegistry()
    form = _make_form()
    form.form_id = "not-a-uuid"  # type: ignore[assignment]

    with pytest.raises(ValueError, match="uuid.UUID"):
        registry.register(form, major_version=1)


def test_register_raises_for_zero_major_version():
    registry = FormTemplateRegistry()
    form = _make_form()

    with pytest.raises(ValueError, match="positive integer"):
        registry.register(form, major_version=0)


def test_register_raises_for_negative_major_version():
    registry = FormTemplateRegistry()
    form = _make_form()

    with pytest.raises(ValueError, match="positive integer"):
        registry.register(form, major_version=-1)


def test_register_raises_for_non_integer_major_version():
    registry = FormTemplateRegistry()
    form = _make_form()

    with pytest.raises(ValueError, match="positive integer"):
        registry.register(form, major_version=1.0)  # type: ignore[arg-type]


def test_register_raises_for_bool_major_version():
    registry = FormTemplateRegistry()
    form = _make_form()

    with pytest.raises(ValueError, match="positive integer"):
        registry.register(form, major_version=True)  # type: ignore[arg-type]


def test_register_raises_for_duplicate_key():
    registry = FormTemplateRegistry()
    form_id = uuid.uuid4()
    form_a = _make_form(form_id=form_id)
    form_b = _make_form(form_id=form_id)

    registry.register(form_a, major_version=1)

    with pytest.raises(ValueError, match="already registered"):
        registry.register(form_b, major_version=1)


def test_register_raises_for_unresolvable_ref():
    registry = FormTemplateRegistry()
    bad_schema = {
        "type": "object",
        "properties": {
            "field": {"$ref": "#/$defs/does_not_exist"},
        },
    }
    form = _make_form(json_schema=bad_schema)

    with pytest.raises(jsonref.JsonRefError):
        registry.register(form, major_version=1)


# ---------------------------------------------------------------------------
# get_by_id_and_major_version() raise case
# ---------------------------------------------------------------------------


def test_get_raises_for_unregistered_form():
    registry = FormTemplateRegistry()

    with pytest.raises(ValueError, match="No form registered"):
        registry.get_by_id_and_major_version(FormTemplateKey(uuid.uuid4(), 1))


def test_get_raises_for_wrong_major_version():
    registry = FormTemplateRegistry()
    form = _make_form()
    registry.register(form, major_version=1)

    with pytest.raises(ValueError, match="No form registered"):
        registry.get_by_id_and_major_version(FormTemplateKey(form.form_id, 2))


# ---------------------------------------------------------------------------
# Startup wiring / integration behavior
# ---------------------------------------------------------------------------


def test_all_forms_are_registered_on_startup():
    # Clear any forms accumulated by other tests (this singleton is shared across the suite)
    # then re-initialize to verify exactly the expected forms are registered.
    form_template_registry._registry.clear()
    init_form_registry()

    forms = form_template_registry.get_all()

    assert len(forms) == len(_ALL_FORMS)
