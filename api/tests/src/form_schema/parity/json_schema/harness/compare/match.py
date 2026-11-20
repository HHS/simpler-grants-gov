"""Pair each field on a generated form with the same field on the hand-written form."""

from collections.abc import Collection

from .... import paths
from ....paths import Path
from ..form_diff import FormDiff


def match_fields(
    diff: FormDiff,
    generated: Collection[Path],
    handwritten: Collection[Path],
) -> dict[Path, Path]:
    """Return generated path -> hand-written path for every pair of matching fields.

    Fields at the same path match, unless `diff.mapped` pairs one of them with a different
    path.

        both forms have `agency_name`       -> {("agency_name",): ("agency_name",)}
        mapped={"p.phone": "p.phone_number"} -> {("p", "phone"): ("p", "phone_number")}

    A path that is already the target of a mapping isn't also matched to itself. With
    `mapped={"a": "b"}` and both forms having `a` and `b`, only `a -> b` is returned.
    """
    mapped = {paths.split(k): paths.split(v) for k, v in diff.mapped.items()}
    taken = set(mapped.values())

    out = dict(mapped)
    for path in generated:
        if path in mapped or path in taken or path not in handwritten:
            continue
        out[path] = path
    return out
