"""Tests for loading a form version from either supported definition format."""

import dataclasses
import json
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pytest

from src.constants.lookup_constants import FormRenderer, FormType
from src.db.models.competition_models import Form, FormInstruction
from src.form_schema.forms._loader import (
    _SCHEMA_DOCUMENTS,
    JSON_FORM_FILENAME,
    PYTHON_FORM_FILENAME,
    build_form_from_dict,
    find_form_source,
    form_source_files,
    load_versioned_form,
)
from src.form_schema.forms.sf424 import SF424_v4_0


def _json_default(value: Any) -> str:
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    raise TypeError(f"cannot serialize {type(value)!r}")


def _form_to_json_dict(form: Form) -> dict[str, Any]:
    """Serialize a Form the way an emitter would, dropping runtime-populated fields."""
    data = dataclasses.asdict(form)
    data.pop("form_instruction", None)
    return json.loads(json.dumps(data, default=_json_default))


def _without_runtime_state(form: Form) -> Form:
    """A copy with the fields no form declares for itself cleared.

    get_form() assigns form_instruction onto the registry's Form in place, so any earlier
    test that fetched this form leaves it populated for the rest of the session. A form.json
    cannot carry it -- it is a database row, resolved per request -- so it is cleared on both
    sides rather than compared.
    """
    return dataclasses.replace(form, form_instruction=None)


def _write_version(
    tmp_path: Path, filename: str, contents: str, form_name: str = "my_form"
) -> Path:
    version_dir = tmp_path / form_name / "1" / "0"
    version_dir.mkdir(parents=True, exist_ok=True)
    (version_dir / filename).write_text(contents)
    return tmp_path / form_name


def _write_split_version(
    tmp_path: Path, payload: dict[str, Any], form_name: str = "my_form"
) -> Path:
    """Write a form the way the emitter does: an envelope plus one file per schema."""
    version_dir = tmp_path / form_name / "1" / "0"
    version_dir.mkdir(parents=True, exist_ok=True)

    envelope = dict(payload)
    for field, document in _SCHEMA_DOCUMENTS.items():
        if field not in envelope:
            continue
        (version_dir / document.filename).write_text(json.dumps(envelope.pop(field)))
    (version_dir / JSON_FORM_FILENAME).write_text(json.dumps(envelope))

    return tmp_path / form_name


class TestJsonFormEquivalence:
    """A form.json must produce exactly the Form its Python equivalent produces."""

    def test_round_trip_of_a_real_form_is_identical(self, tmp_path: Path) -> None:
        payload = _form_to_json_dict(SF424_v4_0)
        form_dir = _write_version(tmp_path, JSON_FORM_FILENAME, json.dumps(payload))

        module = load_versioned_form(form_dir, "1.0")

        assert _without_runtime_state(module.FORM) == _without_runtime_state(SF424_v4_0)

    def test_round_trip_holds_after_get_form_has_populated_form_instruction(
        self, tmp_path: Path
    ) -> None:
        """The registry hands out one Form per process and get_form() writes to it.

        get_form() assigns form_instruction onto that shared object, so whether this form
        has been fetched earlier in the session changes what a naive comparison sees. The
        round-trip must hold either way.
        """
        payload = _form_to_json_dict(SF424_v4_0)
        form_dir = _write_version(tmp_path, JSON_FORM_FILENAME, json.dumps(payload))

        original = SF424_v4_0.form_instruction
        try:
            SF424_v4_0.form_instruction = FormInstruction(  # type: ignore[assignment]
                form_instruction_id=uuid.uuid4()
            )
            module = load_versioned_form(form_dir, "1.0")
            assert _without_runtime_state(module.FORM) == _without_runtime_state(SF424_v4_0)
        finally:
            SF424_v4_0.form_instruction = original

    def test_module_exposes_the_same_attributes_as_a_python_form(self, tmp_path: Path) -> None:
        payload = _form_to_json_dict(SF424_v4_0)
        form_dir = _write_version(tmp_path, JSON_FORM_FILENAME, json.dumps(payload))

        module = load_versioned_form(form_dir, "1.0")

        assert module.FORM_JSON_SCHEMA == SF424_v4_0.form_json_schema
        assert module.FORM_UI_SCHEMA == SF424_v4_0.form_ui_schema
        assert module.FORM_RULE_SCHEMA == SF424_v4_0.form_rule_schema
        assert module.FORM_XML_TRANSFORM_RULES == SF424_v4_0.json_to_xml_schema


class TestSchemaFiles:
    """A form.json may hold its large schemas in sibling files instead of inline."""

    def test_split_form_matches_the_inline_form_it_was_split_from(self, tmp_path: Path) -> None:
        """The split is a layout choice, so it must not change the Form that comes out."""
        payload = _form_to_json_dict(SF424_v4_0)

        inline_dir = _write_version(
            tmp_path, JSON_FORM_FILENAME, json.dumps(payload), form_name="inline"
        )
        split_dir = _write_split_version(tmp_path, payload, form_name="split")

        inline = load_versioned_form(inline_dir, "1.0")
        split = load_versioned_form(split_dir, "1.0")

        assert _without_runtime_state(split.FORM) == _without_runtime_state(inline.FORM)
        assert _without_runtime_state(split.FORM) == _without_runtime_state(SF424_v4_0)

    def test_a_real_form_is_split_into_the_expected_files(self, tmp_path: Path) -> None:
        """The envelope keeps the scalars; each schema present becomes its own file."""
        payload = _form_to_json_dict(SF424_v4_0)
        form_dir = _write_split_version(tmp_path, payload)
        version_dir = form_dir / "1" / "0"

        envelope = json.loads((version_dir / JSON_FORM_FILENAME).read_text())
        assert not set(envelope) & set(_SCHEMA_DOCUMENTS)
        assert envelope["form_name"] == SF424_v4_0.form_name

        assert json.loads((version_dir / "json_schema.json").read_text()) == (
            SF424_v4_0.form_json_schema
        )
        assert json.loads((version_dir / "ui_schema.json").read_text()) == SF424_v4_0.form_ui_schema

    def test_an_absent_schema_file_leaves_its_field_unset(self, tmp_path: Path) -> None:
        """A form with no rules writes no rule_schema.json, and must still load."""
        payload = {
            "form_id": "1623b310-85be-496a-b84b-34bdee22a68a",
            "form_name": "Example",
            "short_form_name": "Example_1_0",
            "form_version": "1.0",
            "agency_code": "SGG",
            "form_json_schema": {"type": "object"},
            "form_ui_schema": [],
        }
        form_dir = _write_split_version(tmp_path, payload)

        assert not (form_dir / "1" / "0" / "rule_schema.json").exists()

        module = load_versioned_form(form_dir, "1.0")

        assert module.FORM_JSON_SCHEMA == {"type": "object"}
        assert module.FORM_RULE_SCHEMA is None
        assert module.FORM_XML_TRANSFORM_RULES is None

    def test_declaring_a_field_both_inline_and_in_a_schema_file_is_rejected(
        self, tmp_path: Path
    ) -> None:
        """Two declarations drift; preferring one silently would hide the stale other."""
        payload = {
            "form_id": "1623b310-85be-496a-b84b-34bdee22a68a",
            "form_name": "Example",
            "short_form_name": "Example_1_0",
            "form_version": "1.0",
            "agency_code": "SGG",
            "form_json_schema": {"type": "object"},
            "form_ui_schema": [],
        }
        form_dir = _write_version(tmp_path, JSON_FORM_FILENAME, json.dumps(payload))
        (form_dir / "1" / "0" / "json_schema.json").write_text('{"type": "string"}')

        with pytest.raises(ValueError, match="declared both inline"):
            load_versioned_form(form_dir, "1.0")

    def test_a_malformed_schema_file_names_the_file(self, tmp_path: Path) -> None:
        payload = {
            "form_id": "1623b310-85be-496a-b84b-34bdee22a68a",
            "form_name": "Example",
            "short_form_name": "Example_1_0",
            "form_version": "1.0",
            "agency_code": "SGG",
            "form_ui_schema": [],
        }
        form_dir = _write_version(tmp_path, JSON_FORM_FILENAME, json.dumps(payload))
        (form_dir / "1" / "0" / "json_schema.json").write_text("{not json")

        with pytest.raises(ValueError, match=r"json_schema\.json: invalid JSON"):
            load_versioned_form(form_dir, "1.0")


class TestJsonCoercion:
    """JSON cannot represent UUIDs, enums, dates or datetimes, so the loader coerces them."""

    def _minimal(self, **overrides: Any) -> dict[str, Any]:
        data: dict[str, Any] = {
            "form_id": "1623b310-85be-496a-b84b-34bdee22a68a",
            "form_name": "Example",
            "short_form_name": "Example_1_0",
            "form_version": "1.0",
            "agency_code": "SGG",
            "form_json_schema": {},
            "form_ui_schema": [],
        }
        data.update(overrides)
        return data

    def test_uuid_fields_are_coerced(self) -> None:
        form = build_form_from_dict(
            self._minimal(form_instruction_id="bf48a93f-d445-426f-a8fb-289bf93a2434"),
            Path("form.json"),
        )
        assert form.form_id == uuid.UUID("1623b310-85be-496a-b84b-34bdee22a68a")
        assert form.form_instruction_id == uuid.UUID("bf48a93f-d445-426f-a8fb-289bf93a2434")

    def test_form_type_is_coerced_to_the_enum(self) -> None:
        form = build_form_from_dict(self._minimal(form_type="SF424"), Path("form.json"))
        assert form.form_type is FormType.SF424

    def test_form_renderer_is_coerced_to_the_enum(self) -> None:
        form = build_form_from_dict(self._minimal(form_renderer="jsonforms"), Path("form.json"))
        assert form.form_renderer is FormRenderer.JSON_FORMS

    def test_form_renderer_defaults_to_sgg(self) -> None:
        form = build_form_from_dict(self._minimal(), Path("form.json"))
        assert form.form_renderer is FormRenderer.SGG

    def test_datetime_fields_are_coerced(self) -> None:
        form = build_form_from_dict(
            self._minimal(active_at="2026-01-15T00:00:00"), Path("form.json")
        )
        assert form.active_at == datetime(2026, 1, 15, 0, 0, 0)

    def test_date_fields_are_coerced(self) -> None:
        form = build_form_from_dict(self._minimal(expiration_date="2029-03-31"), Path("form.json"))
        assert form.expiration_date == date(2029, 3, 31)


class TestJsonValidation:
    """A malformed form.json must fail loudly at import rather than register silently."""

    def _minimal(self) -> dict[str, Any]:
        return {
            "form_id": "1623b310-85be-496a-b84b-34bdee22a68a",
            "form_name": "Example",
            "short_form_name": "Example_1_0",
            "form_version": "1.0",
            "agency_code": "SGG",
            "form_json_schema": {},
            "form_ui_schema": [],
        }

    def test_unknown_field_is_rejected(self) -> None:
        data = self._minimal() | {"form_nmae": "typo"}
        with pytest.raises(ValueError, match="unknown field"):
            build_form_from_dict(data, Path("form.json"))

    def test_missing_required_field_is_rejected(self) -> None:
        data = self._minimal()
        del data["form_name"]
        with pytest.raises(ValueError, match="form_name"):
            build_form_from_dict(data, Path("form.json"))

    def test_invalid_uuid_is_rejected(self) -> None:
        data = self._minimal() | {"form_id": "not-a-uuid"}
        with pytest.raises(ValueError, match="not a valid UUID"):
            build_form_from_dict(data, Path("form.json"))

    def test_unknown_form_type_is_rejected(self) -> None:
        data = self._minimal() | {"form_type": "NotAForm"}
        with pytest.raises(ValueError, match="not a known FormType"):
            build_form_from_dict(data, Path("form.json"))

    def test_unknown_form_renderer_is_rejected(self) -> None:
        data = self._minimal() | {"form_renderer": "rjsf"}
        with pytest.raises(ValueError, match="not a known FormRenderer"):
            build_form_from_dict(data, Path("form.json"))

    def test_invalid_datetime_is_rejected(self) -> None:
        data = self._minimal() | {"active_at": "the fifteenth"}
        with pytest.raises(ValueError, match="not a valid ISO 8601"):
            build_form_from_dict(data, Path("form.json"))

    def test_malformed_json_is_rejected(self, tmp_path: Path) -> None:
        form_dir = _write_version(tmp_path, JSON_FORM_FILENAME, "{not json")
        with pytest.raises(ValueError, match="invalid JSON"):
            load_versioned_form(form_dir, "1.0")

    def test_non_object_json_is_rejected(self, tmp_path: Path) -> None:
        form_dir = _write_version(tmp_path, JSON_FORM_FILENAME, "[]")
        with pytest.raises(ValueError, match="expected a JSON object"):
            load_versioned_form(form_dir, "1.0")


class TestSourceResolution:
    def test_python_form_still_loads(self, tmp_path: Path) -> None:
        form_dir = _write_version(
            tmp_path, PYTHON_FORM_FILENAME, "FORM_JSON_SCHEMA = {'ok': True}\n"
        )
        module = load_versioned_form(form_dir, "1.0")
        assert module.FORM_JSON_SCHEMA == {"ok": True}

    def test_declaring_both_formats_is_rejected(self, tmp_path: Path) -> None:
        form_dir = _write_version(tmp_path, PYTHON_FORM_FILENAME, "FORM_JSON_SCHEMA = {}\n")
        (form_dir / "1" / "0" / JSON_FORM_FILENAME).write_text("{}")

        with pytest.raises(ValueError, match="exactly one"):
            load_versioned_form(form_dir, "1.0")

    def test_declaring_neither_format_is_rejected(self, tmp_path: Path) -> None:
        version_dir = tmp_path / "my_form" / "1" / "0"
        version_dir.mkdir(parents=True)

        with pytest.raises(FileNotFoundError, match="No form_json.py or form.json"):
            find_form_source(version_dir)

    def test_python_form_is_its_only_source_file(self, tmp_path: Path) -> None:
        form_dir = _write_version(tmp_path, PYTHON_FORM_FILENAME, "FORM_JSON_SCHEMA = {}\n")
        version_dir = form_dir / "1" / "0"

        assert form_source_files(version_dir) == [version_dir / PYTHON_FORM_FILENAME]

    def test_json_form_source_files_include_its_schema_files(self, tmp_path: Path) -> None:
        form_dir = _write_split_version(
            tmp_path, {"form_name": "My Form", "form_ui_schema": {}, "form_json_schema": {}}
        )
        version_dir = form_dir / "1" / "0"

        assert form_source_files(version_dir) == [
            version_dir / JSON_FORM_FILENAME,
            version_dir / "json_schema.json",
            version_dir / "ui_schema.json",
        ]
