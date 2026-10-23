"""Differences between a form's XML mapping, its JSON Schema and the Grants.gov XSD that have
been reviewed and accepted."""

import dataclasses


@dataclasses.dataclass(frozen=True, kw_only=True)
class FormDiff:
    """A form's accepted differences between its XML mapping, its JSON Schema and the
    Grants.gov XSD.

    Differences between the mapping and the XSD alone (undeclared elements, required
    elements with no source, element order) can't be recorded, so they always fail.
    """

    #: Package under `src.form_schema.forms` that exports the form.
    module: str

    #: Form field -> why no mapping rule reads it, so its answer isn't submitted.
    #: e.g. {"applicant_id": "no rule targets ApplicantID"}
    unmapped_fields: dict[str, str] = dataclasses.field(default_factory=dict)

    #: Field a mapping rule reads -> why the form doesn't have it.
    #: e.g. {"fax_number": "the form's field is `fax`"}
    unknown_sources: dict[str, str] = dataclasses.field(default_factory=dict)

    #: "element path/keyword" -> why the form accepts a value the element can't carry.
    #: e.g. {"Applicant.Country/enum": "the form offers CIV with a straight apostrophe"}
    differing_rules: dict[str, str] = dataclasses.field(default_factory=dict)

    #: Rule key -> why the parity checks can't read it, e.g. its XML structure depends on
    #: the applicant's data. A form with any of these skips the structural checks, so every
    #: entry needs a reason.
    #: e.g. {"budget_sections": "conditional_transform.type 'array_decomposition'"}
    unchecked_rules: dict[str, str] = dataclasses.field(default_factory=dict)
