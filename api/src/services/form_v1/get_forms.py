import uuid
from dataclasses import dataclass

from src.db.models.competition_models import Form
from src.form_schema.registry.form_template_registry import form_template_registry


@dataclass
class FormVersion:
    major_version: int
    minor_version: int
    legacy_form_version: str | None


@dataclass
class FormCatalog:
    form_id: uuid.UUID
    name: str
    short_name: str
    current_version: FormVersion


def get_forms() -> list[FormCatalog]:
    """Return one catalog entry per form_id at the highest registered major version."""
    versions_by_form: dict[uuid.UUID, list[tuple[int, Form]]] = {}
    for key, form in form_template_registry._registry.items():
        versions_by_form.setdefault(key.form_id, []).append((key.major_version, form))

    entries = []
    for form_versions in versions_by_form.values():
        max_major, form = max(form_versions, key=lambda x: x[0])
        # Parse the minor version from the form's own version string (e.g. "4.0" -> minor=0)
        # major_version comes from the registry key, not this string
        parts = (form.form_version or "").split(".")
        minor = int(parts[1]) if len(parts) > 1 else 0

        entries.append(
            FormCatalog(
                form_id=form.form_id,
                name=form.form_name,
                short_name=form.short_form_name,
                current_version=FormVersion(
                    major_version=max_major,
                    minor_version=minor,
                    legacy_form_version=form.sgg_version,
                ),
            )
        )

    return entries
