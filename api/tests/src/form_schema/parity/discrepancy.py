"""The result type every parity check returns."""

import dataclasses
from enum import StrEnum


class DiscrepancyKind(StrEnum):
    """The kinds of discrepancy a parity check can report."""

    # JSON Schema parity: field validation
    UNMAPPED_GENERATED_INPUT = "generated input is unmapped"
    UNMAPPED_HANDWRITTEN_INPUT = "handwritten input is unmapped"
    REQUIREDNESS_DIFFERS = "requiredness differs"
    RULE_DIFFERS = "rule differs"

    # JSON Schema parity: field text
    TITLE_DIFFERS = "title differs"
    DESCRIPTION_DIFFERS = "description differs"

    # JSON Schema parity: field order
    OUT_OF_ORDER = "out of order"

    # JSON Schema parity: recorded differences
    NO_SUCH_GENERATED_INPUT = "no such generated input"
    NO_SUCH_HANDWRITTEN_INPUT = "no such handwritten input"
    MAPPED_TO_SAME_PATH = "mapped to the same path"
    ABSENT_FIELD_NOT_GENERATED = "declared absent but not a generated input"
    ABSENT_FIELD_NOT_HANDWRITTEN = "declared absent but not a handwritten input"
    RULE_ENTRY_NAMES_NO_INPUT = "recorded rule difference names no such input"
    TEXT_ENTRY_NAMES_NO_FIELD = "recorded text difference names no such field"
    TEXT_NO_LONGER_DIFFERS = "recorded text difference no longer differs"
    ORDER_NO_LONGER_DIFFERS = "recorded order difference no longer differs"

    # XML mapping parity: mapping vs XSD
    UNDECLARED_TARGET = "target isn't declared in the XSD"
    UNSOURCED_REQUIRED_ELEMENT = "required element has no source"
    ELEMENTS_OUT_OF_SEQUENCE = "elements out of sequence"

    # XML mapping parity: mapping vs form schema
    UNMAPPED_FORM_FIELD = "form field is unmapped"
    UNKNOWN_RULE_SOURCE = "rule source is unknown"

    # XML mapping parity: form schema vs XSD (also RULE_DIFFERS, above)
    RANGE_UNREADABLE = "range unreadable"

    # XML mapping parity: recorded differences
    UNMAPPED_FIELD_NOW_MAPPED = "recorded unmapped field is now mapped"
    UNMAPPED_FIELD_NOT_ON_FORM = "recorded unmapped field isn't on the form"
    UNKNOWN_SOURCE_NOW_ON_FORM = "recorded unknown source is now a form field"
    UNKNOWN_SOURCE_NOT_READ = "recorded unknown source is no longer read"
    RULE_ENTRY_NAMES_NO_ELEMENT = "recorded rule difference names no such element"
    RULE_ENTRY_ELEMENT_HAS_NO_TYPE = "recorded type difference names an element with no type"
    RULE_ENTRY_KEYWORD_NOT_DECLARED = "recorded rule difference names an undeclared keyword"
    RULE_NO_LONGER_DIFFERS = "recorded rule difference no longer differs"
    UNCHECKED_RULE_NOT_RECORDED = "unchecked rule not recorded"
    UNCHECKED_RULE_NOW_CHECKED = "recorded unchecked rule is now checked"


@dataclasses.dataclass(frozen=True)
class Discrepancy:
    """A discrepancy a check found between two form elements.

        Discrepancy(DiscrepancyKind.RULE_DIFFERS, "applicant.email",
                    "generated 60, handwritten (absent)", keyword="maxLength")
        str(...) -> "maxLength differs: applicant.email -- generated 60, handwritten (absent)"

    `keyword` names the validation keyword that differs, for `RULE_DIFFERS` only.
    """

    kind: DiscrepancyKind
    path: str
    detail: str = ""
    keyword: str | None = None

    @property
    def label(self) -> str:
        """The kind as it reads in a report, e.g. `"maxLength differs"` for `RULE_DIFFERS`."""
        return f"{self.keyword} differs" if self.keyword else self.kind

    def __str__(self) -> str:
        return f"{self.label}: {self.path}{f' -- {self.detail}' if self.detail else ''}"
