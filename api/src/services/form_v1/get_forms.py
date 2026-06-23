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
    """Return one catalog entry per form_id at the highest major version."""
    versions_by_form: dict[uuid.UUID, list[Form]] = {}
    for form in form_template_registry.get_all():
        versions_by_form.setdefault(form.form_id, []).append(form)

    entries = []
    for form_versions in versions_by_form.values():
        form = max(
            form_versions,
            key=lambda f: int((f.form_version or "0").split(".")[0]),
        )
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
