"""The finding type every check returns."""

import dataclasses


@dataclasses.dataclass(frozen=True)
class Discrepancy:
    """One finding.

        Discrepancy("maxLength differs", "applicant.email", "generated 60, handwritten (absent)")
        str(...) -> "maxLength differs: applicant.email -- generated 60, handwritten (absent)"

    `kind` is what tests filter on, so keep it stable; `detail` is free text.
    """

    kind: str
    path: str
    detail: str = ""

    def __str__(self) -> str:
        return f"{self.kind}: {self.path}{f' -- {self.detail}' if self.detail else ''}"
