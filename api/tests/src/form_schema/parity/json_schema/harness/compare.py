"""Compares a generated form's inputs against the hand-written form's.

    match_fields       which generated field is which hand-written field
    unmatched_fields   fields on either side matching nothing
    rule_differences   matched fields governed by different rules
    stale_entries      FormDiff entries no longer describing a real difference

`match_fields` runs first and the other three build on its result. Each takes the same
three arguments -- the record, and both sides flattened by `flatten_schema.inputs` -- and
returns `Discrepancy` objects that a `FormDiff` entry can suppress.
"""

from typing import Any

from ... import paths
from ...discrepancy import Discrepancy
from ...paths import Path
from .flatten_schema import FormInput
from .form_diff import FormDiff


def _shown(rules: dict[str, Any], keyword: str) -> str:
    """How a keyword's value reads in a failure message, or `(absent)` if unset."""
    return repr(rules[keyword]) if keyword in rules else "(absent)"


def match_fields(
    diff: FormDiff,
    generated: dict[Path, FormInput],
    handwritten: dict[Path, FormInput],
) -> dict[Path, Path]:
    """Generated path -> handwritten path, for every input that corresponds.

        both have `agency_name`              -> {("agency_name",): ("agency_name",)}
        renamed={"p.phone": "p.phone_number"} -> {("p", "phone"): ("p", "phone_number")}

    A declared rename wins over the identity match. A path already used as a rename's
    target is not also matched to itself: with `renamed={"a": "b"}` and both forms holding
    `a` and `b`, only `a -> b` is returned, and generated `b` and handwritten `a` are left
    for `unmatched_fields` to report.
    """
    renamed = {paths.parse(k): paths.parse(v) for k, v in diff.renamed.items()}
    taken = set(renamed.values())

    out = dict(renamed)
    for path in generated:
        if path in renamed or path in taken or path not in handwritten:
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
    declared_generated = {paths.parse(p) for p in diff.absent_from_source}
    declared_handwritten = {paths.parse(p) for p in diff.absent_from_definition}
    corresponding = match_fields(diff, generated, handwritten)
    matched_generated = set(corresponding)
    matched_handwritten = set(corresponding.values())

    out = []
    for path in sorted(set(generated) - matched_generated - declared_generated):
        out.append(Discrepancy("generated input is unmapped", paths.render(path)))
    for path in sorted(set(handwritten) - matched_handwritten - declared_handwritten):
        out.append(Discrepancy("handwritten input is unmapped", paths.render(path)))
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

    Suppressed per keyword by `differing_rules`, keyed `"path/keyword"`. Presentation is
    not compared -- that belongs to the UI checks.
    """
    recorded = diff.differing_rules
    out = []
    for generated_path, handwritten_path in match_fields(diff, generated, handwritten).items():
        if generated_path not in generated or handwritten_path not in handwritten:
            continue
        generated_rules = generated[generated_path]
        handwritten_rules = handwritten[handwritten_path]
        where = paths.render(generated_path)

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


def stale_entries(
    diff: FormDiff,
    generated: dict[Path, FormInput],
    handwritten: dict[Path, FormInput],
) -> list[Discrepancy]:
    """Record entries naming a field that does not exist on the side they claim.

    Covers all four registers: a `renamed` target the handwritten form lacks, a rename to
    the same path (which the identity match already handles), an `absent_from_*` key
    neither form has, and a `differing_rules` key whose path is gone.
    """
    out = []
    for generated_path, handwritten_path in match_fields(diff, generated, handwritten).items():
        if generated_path not in generated:
            out.append(Discrepancy("no such generated input", paths.render(generated_path)))
        if handwritten_path not in handwritten:
            out.append(Discrepancy("no such handwritten input", paths.render(handwritten_path)))
    for generated_path, handwritten_path in diff.renamed.items():
        if generated_path == handwritten_path:
            out.append(
                Discrepancy(
                    "rename to the same path",
                    generated_path,
                    "identical paths already correspond, so this entry says nothing",
                )
            )
    for path, reason in diff.absent_from_source.items():
        if paths.parse(path) not in generated:
            out.append(Discrepancy("declared absent but not a generated input", path, reason))
    for path, reason in diff.absent_from_definition.items():
        if paths.parse(path) not in handwritten:
            out.append(Discrepancy("declared absent but not a handwritten input", path, reason))
    for key in diff.differing_rules:
        path = key.rsplit("/", 1)[0]
        if paths.parse(path) not in generated:
            out.append(Discrepancy("recorded difference names no such input", path))
    return out
