"""The record of accepted differences between a generated form and the one it mirrors."""

import dataclasses

from ... import form_diff as shared


@dataclasses.dataclass(frozen=True, kw_only=True)
class FormDiff(shared.FormDiff):
    """Accepted differences between the generated form and the hand-written one.

    The definition is the generated form, the source the hand-written form it mirrors.
    Fields at the same path correspond automatically; anything else needs an entry.

    A `differing_rules` entry cites the Grants.gov schema showing the hand-written form is
    the one that disagrees with it. These are defects for Simpler Grants to fix.
    """

    generated_module: str
    handwritten_module: str

    #: Generated path -> the handwritten path meaning the same thing, where the two forms
    #: spell one field differently. e.g. {"p.phone": "p.phone_number"}
    renamed: dict[str, str] = dataclasses.field(default_factory=dict)
