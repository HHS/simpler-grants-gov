"""The per-form record of accepted differences.

Each side compares a form definition against a source. Fields that correspond and agree
need no declaration; everything else goes in one of three registers, keyed by path with a
reason as the value.

    absent_from_source      the definition has it, the source does not
    absent_from_definition  the source has it, the definition does not reach it
    differing_rules         both have it, under different rules

`compare.stale_entries` holds every entry to both documents, so an entry that
stops describing a real difference fails the suite. An entry records a defect to fix, not
an exemption from fixing it.

Each comparison subclasses this to name the documents it reads and add what it alone
needs: `json_schema/` adds `renamed`.
"""

import dataclasses


@dataclasses.dataclass(frozen=True, kw_only=True)
class FormDiff:
    """One form's accepted differences from the source it is compared against."""

    #: Path in the definition -> why the source has nothing corresponding.
    #: e.g. {"fax_number": "no such field on this form -- it is `fax`"}
    absent_from_source: dict[str, str] = dataclasses.field(default_factory=dict)

    #: Path in the source -> why the definition reaches nothing corresponding.
    #: e.g. {"applicant_id": "no rule targets ApplicantID"}
    absent_from_definition: dict[str, str] = dataclasses.field(default_factory=dict)

    #: "path/keyword" -> the citation showing which side is wrong.
    #: e.g. {"applicant.country/enum": "UniversalCodes-V2.0.xsd spells CIV with U+2019"}
    differing_rules: dict[str, str] = dataclasses.field(default_factory=dict)
