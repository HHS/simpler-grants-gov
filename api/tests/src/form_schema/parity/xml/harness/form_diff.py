"""The record of known gaps in one form's XML mapping.

The definition is the form's `json_to_xml_schema`. The source the three inherited
registers speak of is the form's own JSON Schema.

The Grants.gov XSD, the other document this side reads, has no register: a target naming
an element the schema does not declare, or a required element nothing feeds, fails with
no way to record an exception.
"""

import dataclasses

from ...form_diff import FormDiff as _Base


@dataclasses.dataclass(frozen=True, kw_only=True)
class FormDiff(_Base):
    """Known gaps between one form's XML mapping and the documents it is held against.

    The inherited registers, in this side's terms:

        absent_from_definition  a form field no rule reads, so the answer never reaches
                                the submission. Every such element is optional in the XSD,
                                so the document still validates and XSD checking cannot
                                see it.   e.g. {"applicant_id": "no rule targets ..."}

        absent_from_source      a rule reading a field the form does not have. The element
                                it targets is mapped, so the XSD-side checks see nothing.
                                e.g. {"fax_number": "no such field -- it is `fax`"}

        differing_rules         keyed "element path/keyword", citing the form permitting
                                something the element cannot carry.
                                e.g. {"Applicant.Country/enum": "..."}
    """

    #: Package under `src.form_schema.forms` exporting `FORM_JSON_SCHEMA` and
    #: `FORM_XML_TRANSFORM_RULES`.
    module: str

    #: Rule key -> why its wire structure cannot be derived from the declaration. A form
    #: with any of these is skipped by the structural checks.
    #: e.g. {"budget_sections": "conditional_transform.type 'array_decomposition'"}
    unreadable: dict[str, str] = dataclasses.field(default_factory=dict)
