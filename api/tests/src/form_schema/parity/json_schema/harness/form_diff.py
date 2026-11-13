"""Differences between a generated form and the hand-written form it mirrors that have been
reviewed and accepted.

Fields that match and agree need no entry. Any other difference needs an entry in one of
the `FormDiff` fields, with the reason it's accepted. An entry that no longer matches a
real difference fails the suite.
"""

import dataclasses


@dataclasses.dataclass(frozen=True, kw_only=True)
class FormDiff:
    """A generated form's accepted differences from the hand-written form it mirrors.

    Fields at the same path match without an entry.
    """

    generated_module: str
    handwritten_module: str

    #: Generated path -> why the hand-written form has no matching field.
    #: e.g. {"fax_number": "no such field on this form -- it is `fax`"}
    absent_from_source: dict[str, str] = dataclasses.field(default_factory=dict)

    #: Hand-written path -> why the generated form has no matching field.
    #: e.g. {"applicant_id": "the generated form doesn't ask for it"}
    absent_from_definition: dict[str, str] = dataclasses.field(default_factory=dict)

    #: "path/keyword" -> the citation showing which side is wrong.
    #: e.g. {"applicant.country/enum": "UniversalCodes-V2.0.xsd spells CIV with U+2019"}
    differing_rules: dict[str, str] = dataclasses.field(default_factory=dict)

    #: Generated path -> the hand-written path of the same field, where the two differ.
    #: e.g. {"contact.phone": "contact.phone_number"}
    mapped: dict[str, str] = dataclasses.field(default_factory=dict)

    #: "path/title" or "path/description" -> why the two forms word the field differently.
    #: e.g. {"key_contacts.[].email/title": "the Grants.gov form labels it E-mail"}
    differing_text: dict[str, str] = dataclasses.field(default_factory=dict)

    #: Generated path -> why the two forms place the field differently.
    #: e.g. {"key_contacts.[].title": "Grants.gov asks for the role before the name"}
    out_of_order: dict[str, str] = dataclasses.field(default_factory=dict)
