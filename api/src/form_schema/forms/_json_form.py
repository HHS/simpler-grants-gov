"""Build a Form from a form.json and the schema files beside it."""

import dataclasses
import json
import uuid
from collections.abc import Callable
from datetime import date, datetime
from pathlib import Path
from typing import Any, NamedTuple

from src.constants.lookup_constants import FormRenderer, FormType
from src.db.models.competition_models import Form

JSON_FORM_FILENAME = "form.json"

# Set by the get_form service on each request, so a form.json never declares it.
_EXCLUDED_FIELDS = frozenset({"form_instruction"})


class _FieldParser(NamedTuple):
    """How to parse a Form field that JSON stores as a string."""

    parse: Callable[[str], Any]
    expected: str  # what the value should be, for the error message


def _enum_parser(enum: type[FormType] | type[FormRenderer]) -> _FieldParser:
    valid = ", ".join(member.value for member in enum)
    return _FieldParser(enum, f"a known {enum.__name__} ({valid})")


_FIELD_PARSERS = {
    "form_id": _FieldParser(uuid.UUID, "a valid UUID"),
    "form_instruction_id": _FieldParser(uuid.UUID, "a valid UUID"),
    "active_at": _FieldParser(datetime.fromisoformat, "a valid ISO 8601 datetime"),
    "inactive_at": _FieldParser(datetime.fromisoformat, "a valid ISO 8601 datetime"),
    "expiration_date": _FieldParser(date.fromisoformat, "a valid ISO 8601 date"),
    "form_type": _enum_parser(FormType),
    "form_renderer": _enum_parser(FormRenderer),
}


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

    data = _merge_schema_files(data, form_path.parent)

    return build_form_from_dict(data, form_path)


def build_form_from_dict(data: dict[str, Any], path: Path) -> Form:
    """Build a Form from decoded JSON, parsing the fields JSON can't represent."""
    allowed = {f.name for f in dataclasses.fields(Form)} - _EXCLUDED_FIELDS

    unknown = sorted(set(data) - allowed)
    if unknown:
        raise ValueError(
            f"{path}: unknown field(s): {', '.join(unknown)}. "
            f"Allowed fields: {', '.join(sorted(allowed))}"
        )

    kwargs = dict(data)

    for field, parser in _FIELD_PARSERS.items():
        value = kwargs.get(field)
        if isinstance(value, str):
            try:
                kwargs[field] = parser.parse(value)
            except ValueError as err:
                raise ValueError(f"{path}: {field} is not {parser.expected}: {value!r}") from err

    try:
        return Form(**kwargs)
    except TypeError as err:
        raise ValueError(f"{path}: {err}") from err


def schema_file_paths(version_dir: Path) -> list[Path]:
    """Return the schema files present in a version directory, in a fixed order."""
    paths = [version_dir / schema_file.filename for schema_file in SCHEMA_FILES.values()]
    return [path for path in paths if path.exists()]


def _read_json(path: Path) -> Any:
    """Decode a JSON file, naming the file in the error if it doesn't parse."""
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as err:
        raise ValueError(f"{path}: invalid JSON: {err}") from err


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
