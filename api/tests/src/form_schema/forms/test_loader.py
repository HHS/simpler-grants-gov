"""Tests for finding and loading a form version's definition file."""

import dataclasses
import json
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pytest

from src.form_schema.forms._json_form import JSON_FORM_FILENAME
from src.form_schema.forms._loader import (
    PYTHON_FORM_FILENAME,
    find_definition_file,
    load_versioned_form,
    version_files,
)
from src.form_schema.forms.sf424 import SF424_v4_0


def _json_default(value: Any) -> str:
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    raise TypeError(f"cannot serialize {type(value)!r}")


def _write_version(tmp_path: Path, filename: str, contents: str) -> Path:
    version_dir = tmp_path / "my_form" / "1" / "0"
    version_dir.mkdir(parents=True, exist_ok=True)
    (version_dir / filename).write_text(contents)
    return tmp_path / "my_form"


class TestLoadVersionedForm:
    def test_python_form_loads(self, tmp_path: Path) -> None:
        form_dir = _write_version(
            tmp_path, PYTHON_FORM_FILENAME, "FORM_JSON_SCHEMA = {'ok': True}\n"
        )
        module = load_versioned_form(form_dir, "1.0")
        assert module.FORM_JSON_SCHEMA == {"ok": True}

    def test_json_form_exposes_python_form_attributes(self, tmp_path: Path) -> None:
        data = dataclasses.asdict(SF424_v4_0)
        data.pop("form_instruction")
        form_dir = _write_version(
            tmp_path, JSON_FORM_FILENAME, json.dumps(data, default=_json_default)
        )

        module = load_versioned_form(form_dir, "1.0")

        assert module.FORM.form_id == SF424_v4_0.form_id
        assert module.FORM_JSON_SCHEMA == SF424_v4_0.form_json_schema
        assert module.FORM_UI_SCHEMA == SF424_v4_0.form_ui_schema
        assert module.FORM_RULE_SCHEMA == SF424_v4_0.form_rule_schema
        assert module.FORM_XML_TRANSFORM_RULES == SF424_v4_0.json_to_xml_schema


class TestFindDefinitionFile:
    def test_both_formats_rejected(self, tmp_path: Path) -> None:
        form_dir = _write_version(tmp_path, PYTHON_FORM_FILENAME, "FORM_JSON_SCHEMA = {}\n")
        (form_dir / "1" / "0" / JSON_FORM_FILENAME).write_text("{}")

        with pytest.raises(ValueError, match="exactly one"):
            find_definition_file(form_dir / "1" / "0")

    def test_neither_format_rejected(self, tmp_path: Path) -> None:
        version_dir = tmp_path / "my_form" / "1" / "0"
        version_dir.mkdir(parents=True)

        with pytest.raises(FileNotFoundError, match="No form_json.py or form.json"):
            find_definition_file(version_dir)


class TestVersionFiles:
    def test_python_form_is_only_file(self, tmp_path: Path) -> None:
        form_dir = _write_version(tmp_path, PYTHON_FORM_FILENAME, "FORM_JSON_SCHEMA = {}\n")
        version_dir = form_dir / "1" / "0"

        assert version_files(version_dir) == [version_dir / PYTHON_FORM_FILENAME]

    def test_json_form_followed_by_its_schema_files(self, tmp_path: Path) -> None:
        form_dir = _write_version(tmp_path, JSON_FORM_FILENAME, "{}")
        version_dir = form_dir / "1" / "0"
        (version_dir / "ui_schema.json").write_text("{}")
        (version_dir / "json_schema.json").write_text("{}")

        assert version_files(version_dir) == [
            version_dir / JSON_FORM_FILENAME,
            version_dir / "json_schema.json",
            version_dir / "ui_schema.json",
        ]
