"""Check that two forms have the same fields and validate them the same way.

Each check takes the `FormDiff` and both forms' fields from `flatten_schema.inputs()`.
"""

from typing import Any

from .... import paths
from ....discrepancy import Discrepancy, DiscrepancyKind
from ....paths import Path
from ..flatten_schema import FormInput
from ..form_diff import FormDiff
from .match import match_fields

# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def unmatched_fields(
    diff: FormDiff,
    generated: dict[Path, FormInput],
    handwritten: dict[Path, FormInput],
) -> list[Discrepancy]:
    """Return fields on either form that match no field on the other.

    Fields listed in `absent_from_source` (generated) or `absent_from_definition`
    (hand-written) are left out.
    """
    declared_generated = {paths.split(p) for p in diff.absent_from_source}
    declared_handwritten = {paths.split(p) for p in diff.absent_from_definition}
    matched = match_fields(diff, generated, handwritten)
    matched_generated = set(matched)
    matched_handwritten = set(matched.values())

    out = []
    for path in sorted(set(generated) - matched_generated - declared_generated):
        out.append(Discrepancy(DiscrepancyKind.UNMAPPED_GENERATED_INPUT, paths.join(path)))
    for path in sorted(set(handwritten) - matched_handwritten - declared_handwritten):
        out.append(Discrepancy(DiscrepancyKind.UNMAPPED_HANDWRITTEN_INPUT, paths.join(path)))
    return out


def rule_differences(
    diff: FormDiff,
    generated: dict[Path, FormInput],
    handwritten: dict[Path, FormInput],
) -> list[Discrepancy]:
    """Return a discrepancy for each requiredness or validation keyword that differs between
    matching fields.

    A keyword set on only one side counts as a difference. Differences listed in
    `differing_rules`, keyed `"path/required"` or `"path/<keyword>"`, are left out.
    """
    recorded = diff.differing_rules
    out = []
    for generated_path, handwritten_path in match_fields(diff, generated, handwritten).items():
        if generated_path not in generated or handwritten_path not in handwritten:
            continue
        generated_input = generated[generated_path]
        handwritten_input = handwritten[handwritten_path]
        where = paths.join(generated_path)

        if (
            generated_input.required != handwritten_input.required
            and f"{where}/required" not in recorded
        ):
            out.append(
                Discrepancy(
                    DiscrepancyKind.REQUIREDNESS_DIFFERS,
                    where,
                    f"generated {'required' if generated_input.required else 'optional'}, "
                    f"handwritten {'required' if handwritten_input.required else 'optional'}",
                )
            )

        a, b = generated_input.rules, handwritten_input.rules
        for keyword in sorted(set(a) | set(b)):
            if a.get(keyword) == b.get(keyword) or f"{where}/{keyword}" in recorded:
                continue
            out.append(
                Discrepancy(
                    DiscrepancyKind.RULE_DIFFERS,
                    where,
                    f"generated {_shown(a, keyword)}, handwritten {_shown(b, keyword)}",
                    keyword=keyword,
                )
            )
    return out


def stale_entries(
    diff: FormDiff,
    generated: dict[Path, FormInput],
    handwritten: dict[Path, FormInput],
) -> list[Discrepancy]:
    """Return `FormDiff` entries about fields and rules that name a field that doesn't
    exist.

    Covers `mapped`, `absent_from_source`, `absent_from_definition` and `differing_rules`.
    A mapping from a path to itself is also reported, since matching paths already pair up.
    """
    out = []
    for generated_path, handwritten_path in match_fields(diff, generated, handwritten).items():
        if generated_path not in generated:
            out.append(
                Discrepancy(DiscrepancyKind.NO_SUCH_GENERATED_INPUT, paths.join(generated_path))
            )
        if handwritten_path not in handwritten:
            out.append(
                Discrepancy(DiscrepancyKind.NO_SUCH_HANDWRITTEN_INPUT, paths.join(handwritten_path))
            )
    for source, target in diff.mapped.items():
        if source == target:
            out.append(Discrepancy(DiscrepancyKind.MAPPED_TO_SAME_PATH, source))
    for path, reason in diff.absent_from_source.items():
        if paths.split(path) not in generated:
            out.append(Discrepancy(DiscrepancyKind.ABSENT_FIELD_NOT_GENERATED, path, reason))
    for path, reason in diff.absent_from_definition.items():
        if paths.split(path) not in handwritten:
            out.append(Discrepancy(DiscrepancyKind.ABSENT_FIELD_NOT_HANDWRITTEN, path, reason))
    for key in diff.differing_rules:
        path = key.rsplit("/", 1)[0]
        if paths.split(path) not in generated:
            out.append(Discrepancy(DiscrepancyKind.RULE_ENTRY_NAMES_NO_INPUT, path))
    return out


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _shown(rules: dict[str, Any], keyword: str) -> str:
    """Return a keyword's value as it reads in a failure message, or `(absent)`."""
    return repr(rules[keyword]) if keyword in rules else "(absent)"
