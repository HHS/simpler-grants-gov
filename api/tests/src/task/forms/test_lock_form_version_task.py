"""Tests for the checksum that locks a form version."""

import hashlib
import json
from pathlib import Path

from src.task.forms.lock_form_version_task import compute_version_hash


def _write_form(tmp_path: Path, files: dict[str, str]) -> tuple[Path, Path]:
    form_dir = tmp_path / "my_form"
    version_dir = form_dir / "1" / "0"
    version_dir.mkdir(parents=True)
    (form_dir / "config.py").write_text("FORM_ID = 'abc'\n")
    for name, contents in files.items():
        (version_dir / name).write_text(contents)
    return form_dir, version_dir


def test_python_form_hashes_its_definition_and_config(tmp_path: Path) -> None:
    form_dir, version_dir = _write_form(tmp_path, {"form_json.py": "FORM_JSON_SCHEMA = {}\n"})

    expected = hashlib.sha256(
        (version_dir / "form_json.py").read_bytes() + (form_dir / "config.py").read_bytes()
    ).hexdigest()
    assert compute_version_hash(form_dir, version_dir) == expected


def test_changing_a_schema_file_changes_the_hash(tmp_path: Path) -> None:
    form_dir, version_dir = _write_form(
        tmp_path,
        {
            "form.json": json.dumps({"form_name": "My Form"}),
            "ui_schema.json": json.dumps({"type": "VerticalLayout", "elements": []}),
        },
    )
    before = compute_version_hash(form_dir, version_dir)

    (version_dir / "ui_schema.json").write_text(json.dumps({"type": "Group", "elements": []}))

    assert compute_version_hash(form_dir, version_dir) != before
