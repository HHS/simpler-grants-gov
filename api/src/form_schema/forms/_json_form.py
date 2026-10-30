"""Build a Form from a form.json and the schema files beside it."""

import json
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any, NamedTuple

from pydantic import BaseModel, ConfigDict, ValidationError

from src.constants.lookup_constants import FormRenderer, FormType
from src.db.models.competition_models import Form

JSON_FORM_FILENAME = "form.json"
CHECKSUM_FILENAME = "checksum"  # written by the lock-form-version task


class FormJson(BaseModel):
    """The fields a form.json declares, mirroring the Form dataclass it builds.

    Keep the fields in sync with Form: TestFormJsonMatchesForm in test_json_form.py
    checks their names, types and defaults, and lists the fields that intentionally
    differ, like form_instruction, which the get_form service sets on each request.
    """

    # Strict, so "false" isn't read as a boolean or "683" as an integer. A string still
    # fills a UUID, date or enum field when validating JSON text, since JSON has no such types.
    model_config = ConfigDict(strict=True, extra="forbid")

    form_id: uuid.UUID
    form_name: str
    short_form_name: str
    form_version: str
    agency_code: str
    form_json_schema: dict
    form_ui_schema: dict | list  # a list for the SGG renderer, an object for JSON Forms
    omb_number: str | None = None
    expiration_date: date | None = None
    legacy_form_id: int | None = None
    active_at: datetime | None = None
    inactive_at: datetime | None = None
    form_instruction_id: uuid.UUID | None = None
    form_rule_schema: dict | None = None
    json_to_xml_schema: dict | None = None
    form_type: FormType | None = None
    sgg_version: str | None = None
    is_deprecated: bool | None = None
    form_renderer: FormRenderer = FormRenderer.SGG


class SchemaFile(NamedTuple):
    """A large Form document that a form.json can keep in a separate file."""

    module_attribute: str
    filename: str


# Keyed by the Form field each schema file fills.
SCHEMA_FILES = {
    "form_json_schema": SchemaFile("FORM_JSON_SCHEMA", "json_schema.json"),
    "form_ui_schema": SchemaFile("FORM_UI_SCHEMA", "ui_schema.json"),
    "form_rule_schema": SchemaFile("FORM_RULE_SCHEMA", "rule_schema.json"),
    "json_to_xml_schema": SchemaFile("FORM_XML_TRANSFORM_RULES", "xml_transform.json"),
}


def load_json_form(form_path: Path) -> Form:
    """Read a form.json, merge in its schema files, and build the Form."""
    data = _read_json(form_path)

    if not isinstance(data, dict):
        raise ValueError(f"{form_path}: expected a JSON object at the top level")

    _check_no_unknown_files(form_path.parent)
    data = _merge_schema_files(data, form_path.parent)

    return build_form_from_dict(data, form_path)


def build_form_from_dict(data: dict[str, Any], path: Path) -> Form:
    """Build a Form from decoded JSON, parsing the fields JSON can't represent."""
    try:
        # Validate JSON text, not the dict: strict mode reads a string as a UUID, date or
        # enum only when it parses JSON.
        form_json = FormJson.model_validate_json(json.dumps(data))
    except ValidationError as err:
        errors = "; ".join(f"{error['loc'][0]}: {error['msg']}" for error in err.errors())
        raise ValueError(f"{path}: {errors}") from err

    return Form(**form_json.model_dump())


def schema_file_paths(version_dir: Path) -> list[Path]:
    """Return the schema files present in a version directory, in a fixed order."""
    paths = [version_dir / schema_file.filename for schema_file in SCHEMA_FILES.values()]
    return [path for path in paths if path.exists()]


def _read_json(path: Path) -> Any:
    """Decode a JSON file, naming the file in the error if it doesn't parse."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        raise ValueError(f"{path}: invalid JSON: {err}") from err


def _check_no_unknown_files(version_dir: Path) -> None:
    """Reject files the loader would skip, like a misspelled schema file."""
    known = {
        JSON_FORM_FILENAME,
        CHECKSUM_FILENAME,
        *(schema_file.filename for schema_file in SCHEMA_FILES.values()),
    }
    unknown = sorted(
        path.name
        for path in version_dir.iterdir()
        if path.is_file() and not path.name.startswith(".") and path.name not in known
    )
    if unknown:
        raise ValueError(
            f"{version_dir}: unknown file(s): {', '.join(unknown)}. "
            f"Allowed files: {', '.join(sorted(known))}"
        )


def _merge_schema_files(data: dict[str, Any], version_dir: Path) -> dict[str, Any]:
    """Add each schema file present to the decoded form.json."""
    merged = dict(data)

    for field, schema_file in SCHEMA_FILES.items():
        path = version_dir / schema_file.filename
        if not path.exists():
            continue
        if field in merged:
            raise ValueError(
                f"{path}: {field} is declared both inline in {JSON_FORM_FILENAME} and in "
                f"{schema_file.filename}; a field must be declared exactly once"
            )
        merged[field] = _read_json(path)

    return merged
