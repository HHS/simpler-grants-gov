"""Tests for building a Form from a form.json and its schema files."""

import dataclasses
import json
import typing
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pytest

from src.constants.lookup_constants import FormRenderer, FormType
from src.db.models.competition_models import Form, FormInstruction
from src.form_schema.forms._json_form import (
    JSON_FORM_FILENAME,
    FormJson,
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


class TestFormJsonMatchesForm:
    """FormJson declares every Form field with the same type and default, except these."""

    # Set by the get_form service on each request, so a form.json never declares it.
    FORM_ONLY_FIELDS = frozenset({"form_instruction"})
    # A field here must also be dropped before build_form_from_dict passes it to Form.
    FORM_JSON_ONLY_FIELDS: frozenset[str] = frozenset()
    # Form annotates form_ui_schema as dict, but SGG forms store a list there.
    DIFFERENT_TYPE_FIELDS = frozenset({"form_ui_schema"})

    form_fields = {f.name: f for f in dataclasses.fields(Form)}
    form_types = typing.get_type_hints(Form)
    json_fields = FormJson.model_fields
    shared_fields = sorted(set(form_fields) - FORM_ONLY_FIELDS)

    def test_same_field_names(self) -> None:
        assert set(self.json_fields) - self.FORM_JSON_ONLY_FIELDS == set(self.shared_fields)

    def test_same_field_types(self) -> None:
        same_type_fields = set(self.shared_fields) - self.DIFFERENT_TYPE_FIELDS
        json_types = {name: self.json_fields[name].annotation for name in same_type_fields}
        form_types = {name: self.form_types[name] for name in same_type_fields}
        assert json_types == form_types

    def test_same_field_defaults(self) -> None:
        json_defaults = {
            name: dataclasses.MISSING if field.is_required() else field.default
            for name, field in self.json_fields.items()
            if name in self.shared_fields
        }
        form_defaults = {name: self.form_fields[name].default for name in self.shared_fields}
        assert json_defaults == form_defaults

    def test_divergent_fields_listed_on_the_right_side(self) -> None:
        """Catch an exception that no longer applies, like a field since added to both."""
        assert self.FORM_ONLY_FIELDS <= set(self.form_fields) - set(self.json_fields)
        assert self.FORM_JSON_ONLY_FIELDS <= set(self.json_fields) - set(self.form_fields)
        for name in self.DIFFERENT_TYPE_FIELDS:
            assert self.json_fields[name].annotation != self.form_types[name], name


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
            ("form_id", "not-a-uuid", "form_id: Input should be a valid UUID"),
            ("active_at", "the fifteenth", "active_at: Input should be a valid datetime"),
            ("active_at", 1768435200, "active_at: Input should be a valid datetime"),
            ("expiration_date", "March", "expiration_date: Input should be a valid date"),
            ("form_type", "NotAForm", "form_type: Input should be 'SF424'"),
            ("form_renderer", "rjsf", "form_renderer: Input should be 'sgg' or 'jsonforms'"),
        ],
    )
    def test_unparseable_field_rejected(self, field: str, value: Any, error: str) -> None:
        with pytest.raises(ValueError, match=error):
            build_form_from_dict(MINIMAL_FORM | {field: value}, Path("form.json"))

    @pytest.mark.parametrize(
        ("field", "value", "error"),
        [
            ("is_deprecated", "false", "is_deprecated: Input should be a valid boolean"),
            ("form_id", 123, "form_id: UUID input should be a string"),
            ("form_renderer", None, "form_renderer: Input should be 'sgg' or 'jsonforms'"),
            ("form_name", None, "form_name: Input should be a valid string"),
            ("legacy_form_id", "683", "legacy_form_id: Input should be a valid integer"),
            ("legacy_form_id", True, "legacy_form_id: Input should be a valid integer"),
            ("form_json_schema", [], "form_json_schema: Input should be an object"),
            ("form_ui_schema", "", "form_ui_schema: Input should be an object"),
        ],
    )
    def test_wrong_json_type_rejected(self, field: str, value: Any, error: str) -> None:
        with pytest.raises(ValueError, match=error):
            build_form_from_dict(MINIMAL_FORM | {field: value}, Path("form.json"))

    @pytest.mark.parametrize("field", ["omb_number", "form_instruction_id", "is_deprecated"])
    def test_null_allowed_for_optional_field(self, field: str) -> None:
        form = build_form_from_dict(MINIMAL_FORM | {field: None}, Path("form.json"))
        assert getattr(form, field) is None

    def test_every_bad_field_reported(self) -> None:
        data = MINIMAL_FORM | {"is_deprecated": "false", "legacy_form_id": "683"}
        with pytest.raises(ValueError, match="legacy_form_id: .*; is_deprecated: "):
            build_form_from_dict(data, Path("form.json"))

    def test_form_renderer_defaults_to_sgg(self) -> None:
        form = build_form_from_dict(MINIMAL_FORM, Path("form.json"))
        assert form.form_renderer is FormRenderer.SGG

    def test_unknown_field_rejected(self) -> None:
        with pytest.raises(ValueError, match="form_nmae: Extra inputs are not permitted"):
            build_form_from_dict(MINIMAL_FORM | {"form_nmae": "typo"}, Path("form.json"))

    def test_missing_required_field_rejected(self) -> None:
        data = {k: v for k, v in MINIMAL_FORM.items() if k != "form_name"}
        with pytest.raises(ValueError, match="form_name"):
            build_form_from_dict(data, Path("form.json"))
