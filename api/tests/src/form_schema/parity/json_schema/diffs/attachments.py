"""All fifteen upload slots retain their source numbering, order and validation."""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    generated_module="attachments_generated",
    handwritten_module="attachment_form",
    differing_text={
        **{
            f"att{slot}/title": (
                "The definition uses the Grants.gov prompt 'Please attach Attachment' and the "
                "slot number. The handwritten field says 'Attachment' and the same number."
            )
            for slot in range(1, 16)
        },
        **{
            f"att{slot}/description": (
                "The definition uses the Grants.gov help 'Click to add this attachment.' "
                "The handwritten help names the slot by its ordinal position."
            )
            for slot in range(1, 16)
        },
    },
)
