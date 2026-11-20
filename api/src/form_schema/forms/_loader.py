"""Load a form version from its form_json.py or form.json."""

import importlib.util
import types
from pathlib import Path

from src.form_schema.forms._json_form import (
    JSON_FORM_FILENAME,
    SCHEMA_FILES,
    load_json_form,
    schema_file_paths,
)

PYTHON_FORM_FILENAME = "form_json.py"
DEFINITION_FILENAMES = (PYTHON_FORM_FILENAME, JSON_FORM_FILENAME)


def load_versioned_form(path: Path, version: str) -> types.ModuleType:
    major, minor = version.split(".")
    form_path = find_definition_file(path / major / minor)
    module_name = f"{path.name}._v{major}_{minor}"
    if form_path.name == JSON_FORM_FILENAME:
        return _load_json_form_module(form_path, module_name)
    spec = importlib.util.spec_from_file_location(module_name, form_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load form module from {form_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def find_definition_file(version_dir: Path) -> Path:
    """Return the one definition file (form_json.py or form.json) in a version directory."""
    present = [version_dir / name for name in DEFINITION_FILENAMES if (version_dir / name).exists()]

    if not present:
        expected = " or ".join(DEFINITION_FILENAMES)
        raise FileNotFoundError(f"No {expected} found in {version_dir}")
    if len(present) > 1:
        names = ", ".join(p.name for p in present)
        raise ValueError(f"{version_dir} contains {names}; a version must declare exactly one")

    return present[0]


def version_files(version_dir: Path) -> list[Path]:
    """Return the definition file, then any schema files, that a version is built from."""
    form_path = find_definition_file(version_dir)
    if form_path.name != JSON_FORM_FILENAME:
        return [form_path]
    return [form_path, *schema_file_paths(version_dir)]


def _load_json_form_module(form_path: Path, module_name: str) -> types.ModuleType:
    """Wrap a form.json's Form in a module with the attributes a form_json.py exposes."""
    form = load_json_form(form_path)
    attributes = {"FORM": form} | {
        schema_file.module_attribute: getattr(form, field)
        for field, schema_file in SCHEMA_FILES.items()
    }

    module = types.ModuleType(module_name)
    module.__file__ = str(form_path)
    for name, value in attributes.items():
        setattr(module, name, value)

    return module
