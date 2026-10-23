"""Check that matching fields, lists and groups have the same title and description.

Each check takes the `FormDiff` and both forms' text from `flatten_schema.texts()`. Case
and whitespace are ignored, so `"First  name"` and `"First Name"` match.
"""

from .... import paths
from ....discrepancy import Discrepancy, DiscrepancyKind
from ....paths import Path
from ..flatten_schema import FieldText
from ..form_diff import FormDiff
from .match import match_fields

ATTRIBUTE_KINDS = {
    "title": DiscrepancyKind.TITLE_DIFFERS,
    "description": DiscrepancyKind.DESCRIPTION_DIFFERS,
}

# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def differences(
    diff: FormDiff,
    generated: dict[Path, FieldText],
    handwritten: dict[Path, FieldText],
) -> list[Discrepancy]:
    """Return a discrepancy for each title or description that differs between matching
    nodes.

    Text set on only one side counts as a difference. Differences listed in
    `differing_text`, keyed `"path/title"` or `"path/description"`, are left out.
    """
    found = _all_differences(diff, generated, handwritten)
    return [d for key, d in found.items() if key not in diff.differing_text]


def stale_entries(
    diff: FormDiff,
    generated: dict[Path, FieldText],
    handwritten: dict[Path, FieldText],
) -> list[Discrepancy]:
    """Return `differing_text` entries that name a missing field, or whose two texts now
    match."""
    found = _all_differences(diff, generated, handwritten)
    out = []
    for key, reason in diff.differing_text.items():
        path = key.rsplit("/", 1)[0]
        if paths.split(path) not in generated:
            out.append(Discrepancy(DiscrepancyKind.TEXT_ENTRY_NAMES_NO_FIELD, path))
        elif key not in found:
            out.append(Discrepancy(DiscrepancyKind.TEXT_NO_LONGER_DIFFERS, key, reason))
    return out


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _all_differences(
    diff: FormDiff,
    generated: dict[Path, FieldText],
    handwritten: dict[Path, FieldText],
) -> dict[str, Discrepancy]:
    """Return `"path/attribute"` -> discrepancy for every difference, recorded or not."""
    out = {}
    for generated_path, handwritten_path in match_fields(diff, generated, handwritten).items():
        if generated_path not in generated or handwritten_path not in handwritten:
            continue
        where = paths.join(generated_path)
        for attribute, kind in ATTRIBUTE_KINDS.items():
            a = _normalized(getattr(generated[generated_path], attribute))
            b = _normalized(getattr(handwritten[handwritten_path], attribute))
            if a.casefold() == b.casefold():
                continue
            out[f"{where}/{attribute}"] = Discrepancy(
                kind,
                where,
                f"generated {repr(a) if a else '(absent)'}, "
                f"handwritten {repr(b) if b else '(absent)'}",
            )
    return out


def _normalized(text: str | None) -> str:
    """`"  First   Name "` -> `"First Name"`."""
    return " ".join((text or "").split())
