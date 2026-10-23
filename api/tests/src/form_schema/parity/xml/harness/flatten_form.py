"""Flatten a form's XML mapping, its JSON Schema and the Grants.gov XSD it targets into one
`FlatForm`, which every XML check reads."""

import dataclasses
import importlib
from typing import Any

from ...json_schema.harness import flatten_schema
from ...json_schema.harness.flatten_schema import FormInput
from ...paths import Path, join
from . import flatten_transform, flatten_xsd
from .form_diff import FormDiff


@dataclasses.dataclass(frozen=True)
class FlatForm:
    """A form's XML mapping, JSON Schema fields and XSD elements, flattened to paths."""

    diff: FormDiff

    #: Element path -> the form field it's filled from, or None if it takes no value.
    targets: dict[Path, str | None]

    #: Rule key -> why the checks can't read it. See `FormDiff.unchecked_rules`.
    unchecked_rules: dict[str, str]

    #: Every element and attribute the XSD declares.
    xsd_elements: dict[Path, flatten_xsd.Element]

    #: Elements built from uploaded files rather than from the mapping.
    attachments: frozenset[str]

    #: The form's fields, from `flatten_schema.inputs()`.
    fields: dict[Path, FormInput]

    #: Element path -> the `value_transform` types its rule declares.
    transformed: dict[Path, frozenset[str]]

    @property
    def sources(self) -> set[str]:
        """Every form field a mapping rule reads."""
        return {source for source in self.targets.values() if source}

    @property
    def field_paths(self) -> frozenset[str]:
        """Every form field, as a dotted path."""
        return frozenset(join(path) for path in self.fields)


# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def load(diff: FormDiff) -> FlatForm:
    """Import the form `diff.module` names and flatten it."""
    module = importlib.import_module(f"src.form_schema.forms.{diff.module}")
    # A hand-written form exports module-level constants. A generated one exports a `Form`.
    generated = getattr(module, "FORM", None)
    if generated is not None:
        return flatten(diff, generated.json_to_xml_schema, generated.form_json_schema)
    return flatten(diff, module.FORM_XML_TRANSFORM_RULES, module.FORM_JSON_SCHEMA)


def flatten(diff: FormDiff, mapping: dict[str, Any], json_schema: dict[str, Any]) -> FlatForm:
    """Flatten a form's XML mapping, its JSON Schema and the XSD the mapping targets.

    A form with unchecked rules gets no `fields`, since the checks that read them are
    skipped.
    """
    targets, unchecked = flatten_transform.read(mapping)
    return FlatForm(
        diff=diff,
        targets=targets,
        unchecked_rules=unchecked,
        xsd_elements=flatten_xsd.elements(
            flatten_transform.xsd_of(mapping), flatten_transform.root_of(mapping)
        ),
        attachments=flatten_transform.attachment_elements(mapping),
        fields={} if unchecked else flatten_schema.inputs(json_schema),
        transformed=flatten_transform.transformed(mapping),
    )
