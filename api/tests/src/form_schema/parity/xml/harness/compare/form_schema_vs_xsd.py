"""Check that each form field only accepts values that are valid against the
corresponding XSD element.

A field stricter than its element passes. A field that accepts a value that may be
rejected by the XSD (e.g. a field with a greater `maxLength` than its equivalent XSD)
fails.
"""

from collections.abc import Iterator
from typing import Any, NamedTuple

from .... import paths
from ....discrepancy import Discrepancy, DiscrepancyKind
from ....paths import Path
from .. import flatten_transform, flatten_xsd
from ..flatten_form import FlatForm

#: Bound -> the direction in which a field's value is looser than its element's.
LOOSER = {"maxLength": "above", "maximum": "above", "minLength": "below", "minimum": "below"}

#: Bounds a money field (a string) states in its pattern instead.
FROM_PATTERN = ("minimum", "maximum")


class MappedField(NamedTuple):
    """An XSD element and the one form field it's filled from."""

    element_path: Path
    field_path: str
    field_rules: dict[str, Any]
    element: flatten_xsd.Element


# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def rule_differences(flat: FlatForm) -> list[Discrepancy]:
    """Return each enum value, bound or type a field accepts that its element doesn't allow.

    Returns `RULE_DIFFERS` with `keyword` set to `enum`, a bound or `type`, or
    `RANGE_NOT_IN_PATTERN` for a money field whose pattern doesn't state a range. Differences
    listed in `differing_rules`, or that a declared `value_transform` accounts for, are
    left out.
    """
    return [found for _, found in _findings(flat)]


def stale_entries(flat: FlatForm) -> list[Discrepancy]:
    """Return `differing_rules` entries that no longer describe a difference: the element or
    keyword is gone, or the field no longer accepts more than the element."""
    by_element = {paths.join(path): element for path, element in flat.xsd_elements.items()}
    differing = {f"{found.path}/{keyword}" for keyword, found in _findings(flat, use_diff=False)}

    out = []
    for entry in sorted(flat.diff.differing_rules):
        element_path, _, keyword = entry.rpartition("/")
        element = by_element.get(element_path)
        if element is None:
            kind = DiscrepancyKind.RULE_ENTRY_NAMES_NO_ELEMENT
        elif keyword == "type" and element.primitive is None:
            kind = DiscrepancyKind.RULE_ENTRY_ELEMENT_HAS_NO_TYPE
        elif keyword != "type" and keyword not in element.rules:
            kind = DiscrepancyKind.RULE_ENTRY_KEYWORD_NOT_DECLARED
        elif entry not in differing:
            kind = DiscrepancyKind.RULE_NO_LONGER_DIFFERS
        else:
            continue
        out.append(Discrepancy(kind, entry, "remove from `differing_rules`"))
    return out


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _findings(flat: FlatForm, use_diff: bool = True) -> Iterator[tuple[str, Discrepancy]]:
    """Yield `(keyword, discrepancy)` for each difference. With `use_diff=False`, include
    differences `differing_rules` lists, so `stale_entries` can tell which still exist."""

    def recorded(path: Path, keyword: str) -> bool:
        return use_diff and f"{paths.join(path)}/{keyword}" in flat.diff.differing_rules

    for mapped in _mapped_fields(flat):
        path, rules, element = mapped.element_path, mapped.field_rules, mapped.element
        where, feeds = paths.join(path), f"<- {mapped.field_path}"

        listed = element.rules.get("enum")
        if (
            "enum" in rules
            and isinstance(listed, frozenset)
            and not _reconciled(flat, path, "enum")
            and not recorded(path, "enum")
        ):
            if extra := sorted(set(rules["enum"]) - listed):
                yield (
                    "enum",
                    Discrepancy(
                        DiscrepancyKind.RULE_DIFFERS, where, f"{feeds}: {extra}", keyword="enum"
                    ),
                )

        for keyword, direction in LOOSER.items():
            limit = element.rules.get(keyword)
            if limit is None:
                continue
            # A minLength of 0 doesn't constrain anything.
            if keyword == "minLength" and limit == 0:
                continue
            if _reconciled(flat, path, keyword) or recorded(path, keyword):
                continue

            declared = rules.get(keyword)
            if keyword in FROM_PATTERN and rules.get("type") == "string":
                permitted = flatten_xsd.implied_range(rules.get("pattern", ""))
                if permitted is None:
                    yield (
                        keyword,
                        Discrepancy(
                            DiscrepancyKind.RANGE_NOT_IN_PATTERN,
                            where,
                            f"{feeds}: the element's {keyword} is {limit}, and the field's "
                            f"pattern {rules.get('pattern', '(none)')!r} doesn't state a range",
                        ),
                    )
                    continue
                declared = permitted[0] if keyword == "minimum" else permitted[1]

            if declared is None:
                yield (
                    keyword,
                    Discrepancy(
                        DiscrepancyKind.RULE_DIFFERS,
                        where,
                        f"{feeds}: none, element {limit}",
                        keyword=keyword,
                    ),
                )
            elif (declared > limit) if direction == "above" else (declared < limit):
                yield (
                    keyword,
                    Discrepancy(
                        DiscrepancyKind.RULE_DIFFERS,
                        where,
                        f"{feeds}: {declared} against element {limit}",
                        keyword=keyword,
                    ),
                )

        expected = flatten_xsd.PRIMITIVES.get(element.primitive or "")
        declared_type = rules.get("type")
        if (
            expected
            and declared_type
            and declared_type != expected
            and not _reconciled(flat, path, "type")
            and not recorded(path, "type")
        ):
            yield (
                "type",
                Discrepancy(
                    DiscrepancyKind.RULE_DIFFERS,
                    where,
                    f"{feeds}: form {declared_type}, element xs:{element.primitive}, "
                    f"no value_transform declared",
                    keyword="type",
                ),
            )


def _mapped_fields(flat: FlatForm) -> Iterator[MappedField]:
    """Yield each XSD element that's filled from exactly one form field, with that field.

    Leaves out containers, and rules that read a whole subtree, such as an attachment or
    the list behind a `one_to_many` rule.
    """
    for element_path, field_path in flat.targets.items():
        if field_path is None:
            continue
        field = flat.fields.get(paths.split(field_path))
        element = flat.xsd_elements.get(element_path)
        if field is None or element is None:
            continue
        yield MappedField(element_path, field_path, field.rules, element)


def _reconciled(flat: FlatForm, path: Path, keyword: str) -> bool:
    """Return whether the element's `value_transform` accounts for a difference in `keyword`."""
    declared = flat.transformed.get(path, frozenset())
    return bool(declared & flatten_transform.RECONCILED_BY.get(keyword, frozenset()))
