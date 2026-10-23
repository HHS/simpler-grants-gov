"""Differences between a form and its source that have been reviewed and accepted.

Fields that match and agree need no entry. Any other difference needs an entry in one of
the `FormDiff` fields, with the reason it's accepted. An entry that no longer matches a
real difference fails the suite.
"""

import dataclasses


@dataclasses.dataclass(frozen=True, kw_only=True)
class FormDiff:
    """A form's accepted differences from the source it's compared against."""

    #: Path in the form -> why the source has no matching field.
    #: e.g. {"fax_number": "no such field on this form -- it is `fax`"}
    absent_from_source: dict[str, str] = dataclasses.field(default_factory=dict)

    #: Path in the source -> why the form has no matching field.
    #: e.g. {"applicant_id": "no rule targets ApplicantID"}
    absent_from_definition: dict[str, str] = dataclasses.field(default_factory=dict)

    #: "path/keyword" -> the citation showing which side is wrong.
    #: e.g. {"applicant.country/enum": "UniversalCodes-V2.0.xsd spells CIV with U+2019"}
    differing_rules: dict[str, str] = dataclasses.field(default_factory=dict)
