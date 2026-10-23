"""Accepted differences between a generated form and the hand-written form it mirrors."""

import dataclasses

from ... import form_diff as shared


@dataclasses.dataclass(frozen=True, kw_only=True)
class FormDiff(shared.FormDiff):
    """A generated form's accepted differences from the hand-written form it mirrors.

    The generated form is the "form" in the inherited fields, and the hand-written form is
    the "source". Fields at the same path match without an entry.
    """

    generated_module: str
    handwritten_module: str

    #: Generated path -> the hand-written path of the same field, where the two differ.
    #: e.g. {"contact.phone": "contact.phone_number"}
    mapped: dict[str, str] = dataclasses.field(default_factory=dict)

    #: "path/title" or "path/description" -> why the two forms word the field differently.
    #: e.g. {"key_contacts.[].email/title": "the Grants.gov form labels it E-mail"}
    differing_text: dict[str, str] = dataclasses.field(default_factory=dict)

    #: Generated path -> why the two forms place the field differently.
    #: e.g. {"key_contacts.[].title": "Grants.gov asks for the role before the name"}
    out_of_order: dict[str, str] = dataclasses.field(default_factory=dict)
