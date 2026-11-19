"""Project Narrative Attachment uses the same field, limits and source wording."""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    generated_module="project_narrative_generated",
    handwritten_module="project_narrative_attachment",
    differing_text={
        "attachments.[]/title": (
            "The shared Attachment question titles each UUID Attachment; the hand-written "
            "shared attachment schema has no item title. The visible array label remains "
            "Project Narrative Files in both forms."
        ),
        "attachments.[]/description": (
            "The shared Attachment question adds Attach a file. to each UUID; the hand-written "
            "shared attachment schema has no item help. Both array fields retain the source "
            "requirement At least one file must be attached."
        ),
    },
)
