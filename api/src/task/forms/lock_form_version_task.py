import hashlib
import logging
import re
from pathlib import Path

import click
from grants_shared.util.local import error_if_not_local

from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)

FORMS_DIR = Path(__file__).parents[2] / "form_schema" / "forms"


def compute_version_hash(form_dir: Path, version_dir: Path) -> str:
    """Return the SHA-256 hex digest of form_json.py + config.py for a version directory.

    Always hashes form_json.py first, then config.py, so the digest is stable.
    """
    form_json_path = version_dir / "form_json.py"
    config_path = form_dir / "config.py"

    if not form_json_path.exists():
        raise FileNotFoundError(f"form_json.py not found: {form_json_path}")
    if not config_path.exists():
        raise FileNotFoundError(f"config.py not found: {config_path}")

    h = hashlib.sha256()
    h.update(form_json_path.read_bytes())
    h.update(config_path.read_bytes())
    return h.hexdigest()


def get_version_dir(form_name: str, version: str) -> tuple[Path, Path]:
    """Return (form_dir, version_dir) for the given form name and version string."""
    if not re.fullmatch(r"\d+\.\d+", version):
        raise ValueError(f"version must be in MAJOR.MINOR format, got {version!r}")

    major, minor = version.split(".")
    form_dir = FORMS_DIR / form_name
    version_dir = form_dir / major / minor

    if not form_dir.is_dir():
        raise ValueError(f"no form directory found at {form_dir}")
    if not version_dir.is_dir():
        raise ValueError(f"no version directory found at {version_dir}")

    return form_dir, version_dir


@task_blueprint.cli.command(
    "lock-form-version",
    help="Hash form_json.py + config.py for a form version and write to a checksum file.",
)
@click.option("--form", required=True, help="Form directory name, e.g. sf424")
@click.option("--version", required=True, help="Version in MAJOR.MINOR format, e.g. 1.0")
def lock_form_version(form: str, version: str) -> None:
    error_if_not_local()
    try:
        form_dir, version_dir = get_version_dir(form, version)
    except ValueError as e:
        raise click.BadParameter(str(e)) from e
    checksum = compute_version_hash(form_dir, version_dir)
    checksum_path = version_dir / "checksum"
    checksum_path.write_text(checksum + "\n")
    click.echo(f"Wrote checksum for {form} v{version} → {checksum_path}")
    logger.info(
        "Locked form version", extra={"form": form, "version": version, "checksum": checksum}
    )
