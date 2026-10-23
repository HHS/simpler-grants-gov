"""Compares a generated form's inputs against the hand-written form's.

    match_fields       which generated field is which hand-written field
    unmatched_fields   fields on either side matching nothing
    rule_differences   matched fields governed by different rules
    stale_entries      FormDiff entries no longer describing a real difference

    text_differences     matched nodes titled or described differently
    stale_text_entries   `differing_text` entries no longer describing a real difference

    order_differences    matched fields placed in a different order
    stale_order_entries  `out_of_order` entries no longer describing a real difference

`match_fields` runs first and the others build on its result. Each takes the same
three arguments -- the record, and both sides flattened by `flatten_schema.inputs` -- and
returns `Discrepancy` objects that a `FormDiff` entry can suppress. The two text checks
take both sides flattened by `flatten_schema.texts` instead, and the two order checks
both sides flattened by `flatten_ui.field_order`.
"""

from collections.abc import Collection
from typing import Any

from ... import paths
from ...discrepancy import Discrepancy
from ...paths import Path
from .flatten_schema import FieldText, FormInput
from .form_diff import FormDiff

# The text an applicant reads beside a field, each compared on its own.
TEXT_ATTRIBUTES = ("title", "description")


def _shown(rules: dict[str, Any], keyword: str) -> str:
    """How a keyword's value reads in a failure message, or `(absent)` if unset."""
    return repr(rules[keyword]) if keyword in rules else "(absent)"


def _normalized(text: str | None) -> str:
    """`"  First   Name "` -> `"First Name"`: whitespace runs collapsed, ends trimmed."""
    return " ".join((text or "").split())


def match_fields(
    diff: FormDiff,
    generated: Collection[Path],
    handwritten: Collection[Path],
) -> dict[Path, Path]:
    """Generated path -> handwritten path, for every input that corresponds.

        both have `agency_name`              -> {("agency_name",): ("agency_name",)}
        mapped={"p.phone": "p.phone_number"} -> {("p", "phone"): ("p", "phone_number")}

    A declared rename wins over the identity match. A path already used as a rename's
    target is not also matched to itself: with `mapped={"a": "b"}` and both forms holding
    `a` and `b`, only `a -> b` is returned, and generated `b` and handwritten `a` are left
    for `unmatched_fields` to report.

    Reads only which paths each side has, so it matches inputs and placed fields alike.
    """
    mapped = {paths.split(k): paths.split(v) for k, v in diff.mapped.items()}
    taken = set(mapped.values())

    out = dict(mapped)
    for path in generated:
        if path in mapped or path in taken or path not in handwritten:
            continue
        out[path] = path
    return out


def unmatched_fields(
    diff: FormDiff,
    generated: dict[Path, FormInput],
    handwritten: dict[Path, FormInput],
) -> list[Discrepancy]:
    """Inputs matching nothing and not declared absent.

    Returns kind `"generated input is unmapped"` or `"handwritten input is unmapped"`; the
    callers in `test_forms.py` filter on which. An unaccounted handwritten input is a field
    an applicant can fill in on the form that ships and cannot on the generated one.
    """
    declared_generated = {paths.split(p) for p in diff.absent_from_source}
    declared_handwritten = {paths.split(p) for p in diff.absent_from_definition}
    corresponding = match_fields(diff, generated, handwritten)
    matched_generated = set(corresponding)
    matched_handwritten = set(corresponding.values())

    out = []
    for path in sorted(set(generated) - matched_generated - declared_generated):
        out.append(Discrepancy("generated input is unmapped", paths.join(path)))
    for path in sorted(set(handwritten) - matched_handwritten - declared_handwritten):
        out.append(Discrepancy("handwritten input is unmapped", paths.join(path)))
    return out


def rule_differences(
    diff: FormDiff,
    generated: dict[Path, FormInput],
    handwritten: dict[Path, FormInput],
) -> list[Discrepancy]:
    """Matched inputs governed by different rules, one Discrepancy per keyword.

    Returns kind `"requiredness differs"` or `"<keyword> differs"`, so a caller can report
    the two separately. A keyword one side omits counts as a difference: `maxLength` 60
    against none is reported as `generated 60, handwritten (absent)`.

    Suppressed per keyword by `differing_rules`, keyed `"path/keyword"`. Titles and
    descriptions are `text_differences`' business.
    """
    recorded = diff.differing_rules
    out = []
    for generated_path, handwritten_path in match_fields(diff, generated, handwritten).items():
        if generated_path not in generated or handwritten_path not in handwritten:
            continue
        generated_rules = generated[generated_path]
        handwritten_rules = handwritten[handwritten_path]
        where = paths.join(generated_path)

        if (
            generated_rules.required != handwritten_rules.required
            and f"{where}/required" not in recorded
        ):
            out.append(
                Discrepancy(
                    "requiredness differs",
                    where,
                    f"generated {'required' if generated_rules.required else 'optional'}, "
                    f"handwritten {'required' if handwritten_rules.required else 'optional'}",
                )
            )

        a, b = generated_rules.rules, handwritten_rules.rules
        for keyword in sorted(set(a) | set(b)):
            if a.get(keyword) == b.get(keyword):
                continue
            if f"{where}/{keyword}" in recorded:
                continue
            out.append(
                Discrepancy(
                    f"{keyword} differs",
                    where,
                    f"generated {_shown(a, keyword)}, handwritten {_shown(b, keyword)}",
                )
            )
    return out


def _all_text_differences(
    diff: FormDiff,
    generated: dict[Path, FieldText],
    handwritten: dict[Path, FieldText],
) -> dict[str, Discrepancy]:
    """`"path/attribute"` -> the difference, recorded or not."""
    out = {}
    for generated_path, handwritten_path in match_fields(diff, generated, handwritten).items():
        if generated_path not in generated or handwritten_path not in handwritten:
            continue
        where = paths.join(generated_path)
        for attribute in TEXT_ATTRIBUTES:
            a = _normalized(getattr(generated[generated_path], attribute))
            b = _normalized(getattr(handwritten[handwritten_path], attribute))
            if a.casefold() == b.casefold():
                continue
            out[f"{where}/{attribute}"] = Discrepancy(
                f"{attribute} differs",
                where,
                f"generated {repr(a) if a else '(absent)'}, "
                f"handwritten {repr(b) if b else '(absent)'}",
            )
    return out


def text_differences(
    diff: FormDiff,
    generated: dict[Path, FieldText],
    handwritten: dict[Path, FieldText],
) -> list[Discrepancy]:
    """Matched nodes whose title or description reads differently: inputs, and the lists
    and groups holding them, such as `contacts` and `contacts.[].name`.

    Returns kind `"title differs"` or `"description differs"`. Case and whitespace are
    ignored, so `"First  name"` and `"First Name"` agree; any other change of wording is
    reported, as is text one side states and the other does not.

    Suppressed per attribute by `differing_text`, keyed `"path/title"` or
    `"path/description"`.
    """
    found = _all_text_differences(diff, generated, handwritten)
    return [d for key, d in found.items() if key not in diff.differing_text]


def stale_entries(
    diff: FormDiff,
    generated: dict[Path, FormInput],
    handwritten: dict[Path, FormInput],
) -> list[Discrepancy]:
    """Record entries naming a field that does not exist on the side they claim.

    Covers the four registers about inputs: a `mapped` target the handwritten form lacks,
    a rename to the same path (which the identity match already handles), an
    `absent_from_*` key neither form has, and a `differing_rules` key whose path is gone.
    `differing_text` is `stale_text_entries`' business.
    """
    out = []
    for generated_path, handwritten_path in match_fields(diff, generated, handwritten).items():
        if generated_path not in generated:
            out.append(Discrepancy("no such generated input", paths.join(generated_path)))
        if handwritten_path not in handwritten:
            out.append(Discrepancy("no such handwritten input", paths.join(handwritten_path)))
    for generated_path, handwritten_path in diff.mapped.items():
        if generated_path == handwritten_path:
            out.append(
                Discrepancy(
                    "rename to the same path",
                    generated_path,
                    "identical paths already correspond, so this entry says nothing",
                )
            )
    for path, reason in diff.absent_from_source.items():
        if paths.split(path) not in generated:
            out.append(Discrepancy("declared absent but not a generated input", path, reason))
    for path, reason in diff.absent_from_definition.items():
        if paths.split(path) not in handwritten:
            out.append(Discrepancy("declared absent but not a handwritten input", path, reason))
    for key in diff.differing_rules:
        path = key.rsplit("/", 1)[0]
        if paths.split(path) not in generated:
            out.append(Discrepancy("recorded difference names no such input", path))
    return out


def stale_text_entries(
    diff: FormDiff,
    generated: dict[Path, FieldText],
    handwritten: dict[Path, FieldText],
) -> list[Discrepancy]:
    """`differing_text` entries whose path is gone, or whose two texts now agree."""
    found = _all_text_differences(diff, generated, handwritten)
    out = []
    for key, reason in diff.differing_text.items():
        path = key.rsplit("/", 1)[0]
        if paths.split(path) not in generated:
            out.append(Discrepancy("recorded difference names no such field", path))
        elif key not in found:
            out.append(Discrepancy("recorded text difference no longer differs", key, reason))
    return out


def _longest_increasing(values: list[int]) -> set[int]:
    """Indices of one longest strictly increasing subsequence of `values`.

        [0, 6, 7, 1, 2, 3] -> {0, 3, 4, 5}

    The same choice as `forms/parity/harness/compare.ts`, so both suites report the same
    fields: the earliest predecessor wins a tie, and the earliest longest run ends it.
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
    """`path` without the steps it shares with `to`, keeping at least its last.

    `("contacts", "[]", "name", "suffix")` beside `("contacts", "[]", "title")` reads
    `name.suffix`.
    """
    shared = 0
    while shared < min(len(path), len(to)) - 1 and path[shared] == to[shared]:
        shared += 1
    return paths.join(path[shared:])


def neighbors(sequence: list[str], at: int) -> str:
    """Where `sequence[at]` sits, named by the entries either side of it.

        neighbors(["a", "b", "c"], 1) -> "After a · before c"
        neighbors(["a", "b", "c"], 0) -> "First · before b"
        neighbors(["a", "b", "c"], 2) -> "After b · last"

    A position by index would shift whenever a field is added; a neighbor does not.
    """
    before = sequence[at - 1] if at > 0 else None
    after = sequence[at + 1] if at + 1 < len(sequence) else None
    return " · ".join(
        [f"After {before}" if before else "First", f"before {after}" if after else "last"]
    )


def _all_order_differences(
    diff: FormDiff,
    generated: list[Path],
    handwritten: list[Path],
) -> dict[str, Discrepancy]:
    """Generated path -> the difference, recorded or not."""
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
    # Each side's sequence holds only the fields both place, so a neighbor is always a
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
        out[where] = Discrepancy("out of order", where, f"generated: {here}; handwritten: {there}")
    return out


def order_differences(
    diff: FormDiff,
    generated: list[Path],
    handwritten: list[Path],
) -> list[Discrepancy]:
    """The fewest matched fields that, moved, give both forms the same order.

    Only fields both forms place are compared, so a field one side lacks moves nothing, and
    grouping is not read at all. The fields are taken in the generated form's order, and
    those whose hand-written positions form one longest increasing run stay put; the rest
    are reported, so one misplaced field does not flag everything after it. Each is placed
    by its neighbors on both sides rather than by index.

    Suppressed per field by `out_of_order`, keyed by the generated path.
    """
    found = _all_order_differences(diff, generated, handwritten)
    return [d for key, d in found.items() if key not in diff.out_of_order]


def stale_order_entries(
    diff: FormDiff,
    generated: list[Path],
    handwritten: list[Path],
) -> list[Discrepancy]:
    """`out_of_order` entries naming a field that is no longer out of order."""
    found = _all_order_differences(diff, generated, handwritten)
    return [
        Discrepancy("recorded order difference no longer differs", path, reason)
        for path, reason in diff.out_of_order.items()
        if path not in found
    ]
