import importlib
import re
import uuid
from pathlib import Path

import pytest

from src.form_schema.forms._loader import FORM_SOURCE_FILENAMES

FORMS_ROOT = Path(__file__).parents[4] / "src" / "form_schema" / "forms"
SKIP = {"__pycache__"}


def get_form_dirs() -> list[Path]:
    return sorted(d for d in FORMS_ROOT.iterdir() if d.is_dir() and d.name not in SKIP)


@pytest.mark.parametrize("form_dir", get_form_dirs(), ids=lambda d: d.name)
def test_config_exists(form_dir: Path) -> None:
    assert (form_dir / "config.py").exists(), f"{form_dir.name}/config.py is missing"


@pytest.mark.parametrize("form_dir", get_form_dirs(), ids=lambda d: d.name)
def test_config_fields(form_dir: Path) -> None:
    mod = importlib.import_module(f"src.form_schema.forms.{form_dir.name}.config")
    assert hasattr(mod, "FORM_ID"), f"{form_dir.name}/config.py missing FORM_ID"
    assert isinstance(mod.FORM_ID, uuid.UUID), f"{form_dir.name} FORM_ID must be a uuid.UUID"
    assert hasattr(mod, "SHORT_FORM_NAME"), f"{form_dir.name}/config.py missing SHORT_FORM_NAME"
    assert isinstance(mod.SHORT_FORM_NAME, str), f"{form_dir.name} SHORT_FORM_NAME must be a str"


@pytest.mark.parametrize("form_dir", get_form_dirs(), ids=lambda d: d.name)
def test_versioned_form_definition_exists(form_dir: Path) -> None:
    """Every form must declare at least one version as form_json.py or form.json."""
    versioned = [
        p
        for filename in FORM_SOURCE_FILENAMES
        for p in form_dir.rglob(filename)
        if re.fullmatch(r"\d+", p.parent.name) and re.fullmatch(r"\d+", p.parent.parent.name)
    ]
    expected = " or ".join(FORM_SOURCE_FILENAMES)
    assert versioned, f"{form_dir.name} has no {expected} at <major>/<minor>/"


@pytest.mark.parametrize("form_dir", get_form_dirs(), ids=lambda d: d.name)
def test_version_declares_only_one_definition(form_dir: Path) -> None:
    """A version directory must not declare both formats — there would be no single source."""
    version_dirs = {
        p.parent
        for filename in FORM_SOURCE_FILENAMES
        for p in form_dir.rglob(filename)
        if re.fullmatch(r"\d+", p.parent.name) and re.fullmatch(r"\d+", p.parent.parent.name)
    }
    for version_dir in sorted(version_dirs):
        present = [name for name in FORM_SOURCE_FILENAMES if (version_dir / name).exists()]
        assert len(present) == 1, (
            f"{form_dir.name} {version_dir.parent.name}.{version_dir.name} "
            f"declares {', '.join(present)}; expected exactly one"
        )


@pytest.mark.parametrize("form_dir", get_form_dirs(), ids=lambda d: d.name)
def test_init_imports_successfully(form_dir: Path) -> None:
    mod = importlib.import_module(f"src.form_schema.forms.{form_dir.name}")
    assert mod is not None
