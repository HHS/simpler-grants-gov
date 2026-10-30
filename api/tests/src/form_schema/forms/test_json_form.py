"""Tests for building a Form from a form.json and its schema files."""

import dataclasses
import json
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pytest

from src.constants.lookup_constants import FormRenderer, FormType
from src.db.models.competition_models import Form, FormInstruction
from src.form_schema.forms._json_form import (
    JSON_FORM_FILENAME,
    build_form_from_dict,
    load_json_form,
)
from src.form_schema.forms.sf424 import SF424_v4_0

# Where each large Form document goes when a form.json is split into schema files.
SCHEMA_FILENAMES = {
    "form_json_schema": "json_schema.json",
    "form_ui_schema": "ui_schema.json",
    "form_rule_schema": "rule_schema.json",
    "json_to_xml_schema": "xml_transform.json",
}

MINIMAL_FORM: dict[str, Any] = {
    "form_id": "1623b310-85be-496a-b84b-34bdee22a68a",
    "form_name": "Example",
    "short_form_name": "Example_1_0",
    "form_version": "1.0",
    "agency_code": "SGG",
    "form_json_schema": {},
    "form_ui_schema": [],
}


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
    """Clear form_instruction, which get_form() sets on the shared registry Form."""
    return dataclasses.replace(form, form_instruction=None)


def _write_inline(tmp_path: Path, data: dict[str, Any] | str, name: str = "inline") -> Path:
    """Write a form.json with every field inline, and return its path."""
    version_dir = tmp_path / name
    version_dir.mkdir(parents=True, exist_ok=True)
    contents = data if isinstance(data, str) else json.dumps(data)
    (version_dir / JSON_FORM_FILENAME).write_text(contents)
    return version_dir / JSON_FORM_FILENAME


def _write_split(tmp_path: Path, data: dict[str, Any], name: str = "split") -> Path:
    """Write a form.json with each large document in its schema file, and return its path."""
    version_dir = tmp_path / name
    version_dir.mkdir(parents=True, exist_ok=True)

    envelope = dict(data)
    for field, filename in SCHEMA_FILENAMES.items():
        if field in envelope:
            (version_dir / filename).write_text(json.dumps(envelope.pop(field)))
    (version_dir / JSON_FORM_FILENAME).write_text(json.dumps(envelope))

    return version_dir / JSON_FORM_FILENAME


class TestLoadJsonForm:
    def test_real_form_round_trips(self, tmp_path: Path) -> None:
        form_path = _write_inline(tmp_path, _form_to_json_dict(SF424_v4_0))

        form = load_json_form(form_path)

        assert _without_runtime_state(form) == _without_runtime_state(SF424_v4_0)

    def test_round_trip_ignores_form_instruction(self, tmp_path: Path) -> None:
        """get_form() sets form_instruction on the shared registry Form, so a test that
        ran earlier may have set it. The round trip should work either way."""
        form_path = _write_inline(tmp_path, _form_to_json_dict(SF424_v4_0))

        original = SF424_v4_0.form_instruction
        try:
            SF424_v4_0.form_instruction = FormInstruction(  # type: ignore[assignment]
                form_instruction_id=uuid.uuid4()
            )
            form = load_json_form(form_path)
            assert _without_runtime_state(form) == _without_runtime_state(SF424_v4_0)
        finally:
            SF424_v4_0.form_instruction = original

    def test_split_form_matches_inline_form(self, tmp_path: Path) -> None:
        data = _form_to_json_dict(SF424_v4_0)

        inline = load_json_form(_write_inline(tmp_path, data))
        split = load_json_form(_write_split(tmp_path, data))

        assert _without_runtime_state(split) == _without_runtime_state(inline)

    def test_absent_schema_file_leaves_field_unset(self, tmp_path: Path) -> None:
        form = load_json_form(_write_split(tmp_path, MINIMAL_FORM))

        assert form.form_json_schema == {}
        assert form.form_rule_schema is None
        assert form.json_to_xml_schema is None

    def test_field_both_inline_and_in_schema_file_rejected(self, tmp_path: Path) -> None:
        form_path = _write_inline(tmp_path, MINIMAL_FORM)
        (form_path.parent / "json_schema.json").write_text('{"type": "string"}')

        with pytest.raises(ValueError, match="declared both inline"):
            load_json_form(form_path)

    def test_malformed_schema_file_named_in_error(self, tmp_path: Path) -> None:
        data = {k: v for k, v in MINIMAL_FORM.items() if k != "form_json_schema"}
        form_path = _write_inline(tmp_path, data)
        (form_path.parent / "json_schema.json").write_text("{not json")

        with pytest.raises(ValueError, match=r"json_schema\.json: invalid JSON"):
            load_json_form(form_path)

    def test_malformed_form_json_rejected(self, tmp_path: Path) -> None:
        with pytest.raises(ValueError, match="invalid JSON"):
            load_json_form(_write_inline(tmp_path, "{not json"))

    def test_non_object_form_json_rejected(self, tmp_path: Path) -> None:
        with pytest.raises(ValueError, match="expected a JSON object"):
            load_json_form(_write_inline(tmp_path, "[]"))

    def test_misspelled_schema_file_rejected(self, tmp_path: Path) -> None:
        form_path = _write_split(tmp_path, MINIMAL_FORM)
        (form_path.parent / "rule_schemas.json").write_text("{}")

        with pytest.raises(ValueError, match=r"unknown file\(s\): rule_schemas\.json"):
            load_json_form(form_path)

    def test_checksum_and_hidden_files_allowed(self, tmp_path: Path) -> None:
        form_path = _write_split(tmp_path, MINIMAL_FORM)
        (form_path.parent / "checksum").write_text("abc\n")
        (form_path.parent / ".DS_Store").write_text("")

        assert load_json_form(form_path).form_name == "Example"

    def test_non_ascii_text_read_as_utf8(self, tmp_path: Path) -> None:
        form_path = _write_inline(tmp_path, MINIMAL_FORM | {"form_name": "Café"})

        assert load_json_form(form_path).form_name == "Café"


class TestBuildFormFromDict:
    @pytest.mark.parametrize(
        ("field", "value", "expected"),
        [
            (
                "form_id",
                "bf48a93f-d445-426f-a8fb-289bf93a2434",
                uuid.UUID("bf48a93f-d445-426f-a8fb-289bf93a2434"),
            ),
            (
                "form_instruction_id",
                "bf48a93f-d445-426f-a8fb-289bf93a2434",
                uuid.UUID("bf48a93f-d445-426f-a8fb-289bf93a2434"),
            ),
            ("active_at", "2026-01-15T00:00:00", datetime(2026, 1, 15)),
            ("expiration_date", "2029-03-31", date(2029, 3, 31)),
            ("form_type", "SF424", FormType.SF424),
            ("form_renderer", "jsonforms", FormRenderer.JSON_FORMS),
        ],
    )
    def test_string_field_parsed(self, field: str, value: str, expected: Any) -> None:
        form = build_form_from_dict(MINIMAL_FORM | {field: value}, Path("form.json"))
        assert getattr(form, field) == expected

    @pytest.mark.parametrize(
        ("field", "value", "error"),
        [
            ("form_id", "not-a-uuid", "not a valid UUID"),
            ("active_at", "the fifteenth", "not a valid ISO 8601 datetime"),
            ("expiration_date", "March", "not a valid ISO 8601 date"),
            ("form_type", "NotAForm", "not a known FormType"),
            ("form_renderer", "rjsf", r"not a known FormRenderer \(sgg, jsonforms\)"),
        ],
    )
    def test_unparseable_field_rejected(self, field: str, value: str, error: str) -> None:
        with pytest.raises(ValueError, match=error):
            build_form_from_dict(MINIMAL_FORM | {field: value}, Path("form.json"))

    def test_form_renderer_defaults_to_sgg(self) -> None:
        form = build_form_from_dict(MINIMAL_FORM, Path("form.json"))
        assert form.form_renderer is FormRenderer.SGG

    def test_unknown_field_rejected(self) -> None:
        with pytest.raises(ValueError, match="unknown field"):
            build_form_from_dict(MINIMAL_FORM | {"form_nmae": "typo"}, Path("form.json"))

    def test_missing_required_field_rejected(self) -> None:
        data = {k: v for k, v in MINIMAL_FORM.items() if k != "form_name"}
        with pytest.raises(ValueError, match="form_name"):
            build_form_from_dict(data, Path("form.json"))
