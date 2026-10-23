"""Check that a form's XML mapping reads every form field, and only fields the form has.

A field no rule reads is left out of the XML. Most Grants.gov elements are optional, so
the XML still validates and nothing else catches it.
"""

from ....discrepancy import Discrepancy, DiscrepancyKind
from ..flatten_form import FlatForm

# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def unmatched_fields(flat: FlatForm) -> list[Discrepancy]:
    """Return form fields no rule reads (`UNMAPPED_FORM_FIELD`), and fields rules read that
    the form doesn't have (`UNKNOWN_RULE_SOURCE`).

    Fields listed in `unmapped_fields` and `unknown_sources` are left out.
    """
    out = [
        Discrepancy(DiscrepancyKind.UNMAPPED_FORM_FIELD, field)
        for field in sorted(flat.field_paths)
        if not _read_by_rule(field, flat.sources) and field not in flat.diff.unmapped_fields
    ]
    out += [
        Discrepancy(DiscrepancyKind.UNKNOWN_RULE_SOURCE, source)
        for source in sorted(flat.sources)
        if not _on_form(source, flat.field_paths) and source not in flat.diff.unknown_sources
    ]
    return out


def stale_entries(flat: FlatForm) -> list[Discrepancy]:
    """Return `unmapped_fields` and `unknown_sources` entries that no longer describe a
    difference."""
    out = [
        Discrepancy(
            DiscrepancyKind.UNMAPPED_FIELD_NOW_MAPPED, field, "remove from `unmapped_fields`"
        )
        for field in sorted(flat.diff.unmapped_fields)
        if _read_by_rule(field, flat.sources)
    ]
    out += [
        Discrepancy(
            DiscrepancyKind.UNMAPPED_FIELD_NOT_ON_FORM, field, "remove from `unmapped_fields`"
        )
        for field in sorted(flat.diff.unmapped_fields)
        if field not in flat.field_paths
    ]
    out += [
        Discrepancy(
            DiscrepancyKind.UNKNOWN_SOURCE_NOW_ON_FORM, source, "remove from `unknown_sources`"
        )
        for source in sorted(flat.diff.unknown_sources)
        if _on_form(source, flat.field_paths)
    ]
    out += [
        Discrepancy(
            DiscrepancyKind.UNKNOWN_SOURCE_NOT_READ, source, "remove from `unknown_sources`"
        )
        for source in sorted(flat.diff.unknown_sources)
        if source not in flat.sources
    ]
    return out


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _read_by_rule(field: str, sources: set[str]) -> bool:
    """Return whether a rule reads `field`, or a field that contains it."""
    return any(field == s or field.startswith(s + ".") for s in sources)


def _on_form(source: str, field_paths: frozenset[str]) -> bool:
    """Return whether `source` is a form field, or contains one."""
    return any(field == source or field.startswith(source + ".") for field in field_paths)
