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

    def __str__(self) -> str:
        label = f"{self.keyword} differs" if self.keyword else self.kind
        return f"{label}: {self.path}{f' -- {self.detail}' if self.detail else ''}"
