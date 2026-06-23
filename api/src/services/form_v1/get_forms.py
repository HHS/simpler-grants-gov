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
        _registry_major, form = max(form_versions, key=lambda x: x[0])
        # The registry key selects which form to serve (internal routing).
        # Both major and minor are parsed from the form's own version string so
        # users see the actual form version, not the internal registry key.
        parts = (form.form_version or "").split(".")
        major = int(parts[0]) if len(parts) > 0 else 0
        minor = int(parts[1]) if len(parts) > 1 else 0

        entries.append(
            FormCatalog(
                form_id=form.form_id,
                name=form.form_name,
                short_name=form.short_form_name,
                current_version=FormVersion(
                    major_version=major,
                    minor_version=minor,
                    legacy_form_version=form.sgg_version,
                ),
            )
        )

    return entries
