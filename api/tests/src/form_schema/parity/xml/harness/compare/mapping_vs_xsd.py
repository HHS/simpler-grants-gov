"""Check that the elements a form's XML mapping produces match the ones the XSD declares.

Differences here can't be recorded in the `FormDiff`, so they always fail.
"""

import itertools

from .... import paths
from ....discrepancy import Discrepancy, DiscrepancyKind
from ....paths import Path
from ..flatten_form import FlatForm

# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def undeclared_targets(flat: FlatForm) -> list[Discrepancy]:
    """Return mapped elements the XSD doesn't declare, e.g. a misspelled target, one at the
    wrong level, or one a newer XSD renamed."""
    return [
        Discrepancy(DiscrepancyKind.UNDECLARED_TARGET, paths.join(path))
        for path in sorted(flat.targets)
        if path not in flat.xsd_elements
    ]


def unsourced_elements(flat: FlatForm) -> list[Discrepancy]:
    """Return required elements no mapping rule produces.

    Elements under an attachment are left out, since they're built from the uploaded file.
    """
    return [
        Discrepancy(DiscrepancyKind.UNSOURCED_REQUIRED_ELEMENT, paths.join(path))
        for path, element in sorted(flat.xsd_elements.items())
        if element.required
        and path not in flat.targets
        and not _from_attachment(path, flat.attachments)
    ]


def out_of_order_elements(flat: FlatForm) -> list[Discrepancy]:
    """Return each parent whose children the mapping produces in a different order from the
    XSD's sequence.

    The XML is written in mapping order, so this is the only thing keeping it valid.
    Attributes have no order and are left out.
    """
    ordered = [
        path
        for path in flat.targets
        if path in flat.xsd_elements and flat.xsd_elements[path].position >= 0
    ]

    out = []
    for parent, group in itertools.groupby(sorted(ordered, key=lambda p: p[:-1]), lambda p: p[:-1]):
        siblings = set(group)
        as_mapped = [p for p in ordered if p in siblings]
        as_declared = sorted(siblings, key=lambda p: flat.xsd_elements[p].position)
        if as_mapped != as_declared:
            out.append(
                Discrepancy(
                    DiscrepancyKind.ELEMENTS_OUT_OF_SEQUENCE,
                    paths.join(parent) or "(root)",
                    f"mapped {[p[-1] for p in as_mapped]}, "
                    f"XSD declares {[p[-1] for p in as_declared]}",
                )
            )
    return out


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _from_attachment(path: Path, attachments: frozenset[str]) -> bool:
    """Return whether an element sits under an attachment element."""
    return len(path) > 1 and path[0] in attachments
