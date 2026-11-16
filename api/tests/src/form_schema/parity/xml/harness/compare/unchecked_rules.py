"""Check that the `FormDiff` lists exactly the mapping rules the checks can't read.

A form with any unchecked rules skips the structural checks, so every skip has to be one
someone recorded.
"""

from ....discrepancy import Discrepancy, DiscrepancyKind
from ..flatten_form import FlatForm


def unrecorded(flat: FlatForm) -> list[Discrepancy]:
    """Return rules the checks can't read that `unchecked_rules` doesn't list."""
    return [
        Discrepancy(DiscrepancyKind.UNCHECKED_RULE_NOT_RECORDED, rule, why)
        for rule, why in sorted(flat.unchecked_rules.items())
        if rule not in flat.diff.unchecked_rules
    ]


def stale_entries(flat: FlatForm) -> list[Discrepancy]:
    """Return `unchecked_rules` entries for rules the checks can now read."""
    return [
        Discrepancy(DiscrepancyKind.UNCHECKED_RULE_NOW_CHECKED, rule, why)
        for rule, why in sorted(flat.diff.unchecked_rules.items())
        if rule not in flat.unchecked_rules
    ]
