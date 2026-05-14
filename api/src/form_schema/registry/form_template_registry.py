import uuid

from src.db.models.competition_models import Form
from src.form_schema.jsonschema_resolver import resolve_jsonschema


class FormTemplateRegistry:
    """
    In-memory cache of form template definitions, keyed by (form_id, major_version).

    Resolves all $ref references at registration time so callers always receive fully
    inlined schemas. Raises immediately on any invalid input or broken $ref so the
    application fails fast rather than serving partial data.

    Production code uses a module-level instance; tests that need isolation should
    instantiate FormTemplateRegistry() directly.
    """

    def __init__(self) -> None:
        self._registry: dict[tuple[uuid.UUID, int], Form] = {}

    def register(self, form: Form, major_version: int) -> None:
        """Register a form at the given major version.

        Raises:
            ValueError: if form_id is not a uuid.UUID instance, major_version is not a
                        positive integer, or the (form_id, major_version) pair is already
                        registered.
            jsonref.JsonRefError: if $ref resolution of form_json_schema fails.
        """
        if not isinstance(form.form_id, uuid.UUID):
            raise ValueError(
                f"form.form_id must be a uuid.UUID instance, got {type(form.form_id).__name__}"
            )
        if (
            not isinstance(major_version, int)
            or isinstance(major_version, bool)
            or major_version <= 0
        ):
            raise ValueError(f"major_version must be a positive integer, got {major_version!r}")

        key = (form.form_id, major_version)
        if key in self._registry:
            raise ValueError(
                f"Form already registered: form_id={form.form_id}, major_version={major_version}"
            )

        # Resolve $refs at registration time; raises jsonref.JsonRefError on failure.
        # Mutates form_json_schema in place — these are module-level form objects and
        # resolving an already-resolved schema is idempotent.
        form.form_json_schema = resolve_jsonschema(form.form_json_schema)

        self._registry[key] = form

    def get_by_id_and_major_version(self, form_id: uuid.UUID, major_version: int) -> Form:
        """Return the registered form for the given (form_id, major_version) pair.

        Raises:
            ValueError: if no form is registered with that key.
        """
        form = self._registry.get((form_id, major_version))
        if form is None:
            raise ValueError(
                f"No form registered with form_id={form_id}, major_version={major_version}"
            )
        return form

    def get_all(self) -> list[Form]:
        """Return all registered forms."""
        return list(self._registry.values())
