"""Check that matching fields are shown in the same relative order.

Each check takes the `FormDiff` and both forms' fields from `flatten_ui.field_order()`.
Only fields both forms show are compared, so a field one form lacks doesn't move the
others.
"""

from .... import paths
from ....discrepancy import Discrepancy, DiscrepancyKind
from ....paths import Path
from ..form_diff import FormDiff
from .match import match_fields

# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def differences(
    diff: FormDiff,
    generated: list[Path],
    handwritten: list[Path],
) -> list[Discrepancy]:
    """Return the fewest matching fields that would need to move for both forms to show
    their fields in the same order.

        generated:   a, d, b, c, e
        handwritten: a, b, c, d, e
        -> d (After a · before b in generated, After c · before e in handwritten)

    Fields listed in `out_of_order`, keyed by generated path, are left out.
    """
    found = _all_differences(diff, generated, handwritten)
    return [d for key, d in found.items() if key not in diff.out_of_order]


def stale_entries(
    diff: FormDiff,
    generated: list[Path],
    handwritten: list[Path],
) -> list[Discrepancy]:
    """Return `out_of_order` entries for fields that are no longer out of order."""
    found = _all_differences(diff, generated, handwritten)
    return [
        Discrepancy(DiscrepancyKind.ORDER_NO_LONGER_DIFFERS, path, reason)
        for path, reason in diff.out_of_order.items()
        if path not in found
    ]


def neighbors(sequence: list[str], at: int) -> str:
    """Describe the position of `sequence[at]` by the entries on either side of it.

    neighbors(["a", "b", "c"], 1) -> "After a · before c"
    neighbors(["a", "b", "c"], 0) -> "First · before b"
    neighbors(["a", "b", "c"], 2) -> "After b · last"
    """
    before = sequence[at - 1] if at > 0 else None
    after = sequence[at + 1] if at + 1 < len(sequence) else None
    return " · ".join([
        f"After {before}" if before else "First",
        f"before {after}" if after else "last",
    ])


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _all_differences(
    diff: FormDiff,
    generated: list[Path],
    handwritten: list[Path],
) -> dict[str, Discrepancy]:
    """Return generated path -> discrepancy for every out-of-order field, recorded or not."""
    generated_at = {path: i for i, path in enumerate(generated)}
    handwritten_at = {path: i for i, path in enumerate(handwritten)}
    placed = sorted(
        (
            (generated_path, handwritten_path)
            for generated_path, handwritten_path in match_fields(
                diff, generated_at, handwritten_at
            ).items()
            if generated_path in generated_at and handwritten_path in handwritten_at
        ),
        key=lambda pair: generated_at[pair[0]],
    )
    # Each side's sequence holds only the fields both show, so a neighbor is always a
    # field the other form has too.
    generated_sequence = [g for g, _ in placed]
    handwritten_sequence = sorted((h for _, h in placed), key=handwritten_at.__getitem__)
    kept = _longest_increasing([handwritten_at[h] for _, h in placed])

    out = {}
    for i, (generated_path, handwritten_path) in enumerate(placed):
        if i in kept:
            continue
        here = neighbors([_relative(g, generated_path) for g in generated_sequence], i)
        there = neighbors(
            [_relative(h, handwritten_path) for h in handwritten_sequence],
            handwritten_sequence.index(handwritten_path),
        )
        where = paths.join(generated_path)
        out[where] = Discrepancy(
            DiscrepancyKind.OUT_OF_ORDER, where, f"generated: {here}; handwritten: {there}"
        )
    return out


def _longest_increasing(values: list[int]) -> set[int]:
    """Return the indices of one longest strictly increasing subsequence of `values`.

        [0, 6, 7, 1, 2, 3] -> {0, 3, 4, 5}

    Ties go to the earliest predecessor and the earliest longest run, matching
    `forms/parity/harness/compare.ts`.
    """
    length = [1] * len(values)
    previous = [-1] * len(values)
    for i in range(len(values)):
        for j in range(i):
            if values[j] < values[i] and length[j] + 1 > length[i]:
                length[i] = length[j] + 1
                previous[i] = j
    kept = set()
    i = length.index(max(length)) if length else -1
    while i != -1:
        kept.add(i)
        i = previous[i]
    return kept


def _relative(path: Path, to: Path) -> str:
    """Return `path` without the leading steps it shares with `to`, keeping at least its
    last step.

        _relative(("contacts", "[]", "name", "suffix"), ("contacts", "[]", "title"))
        -> "name.suffix"
    """
    shared = 0
    while shared < min(len(path), len(to)) - 1 and path[shared] == to[shared]:
        shared += 1
    return paths.join(path[shared:])
