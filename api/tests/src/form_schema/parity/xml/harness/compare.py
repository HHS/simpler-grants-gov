"""Compares a form's XML mapping against the XSD it targets and the form's own schema.

`flatten()` reads all three documents into paths, so every check below is a dictionary
comparison and no fixture has to populate the right field for a mistake to surface.

    mapping vs XSD    undeclared_targets, unsourced_elements, out_of_order_elements
    mapping vs form   unmatched_fields
    form vs XSD       rule_differences
    the record        stale_entries, unrecorded_skips

Every function takes a `FlatForm`; `xml/test_harness.py` builds them by hand. Only the
`mapping vs form` and `form vs XSD` comparisons consult the record -- a target naming an
undeclared element, or a required element nothing feeds, fails with no way to record an
exception.
"""

import dataclasses
import importlib
import itertools

from tests.src.form_schema.parity import paths
from tests.src.form_schema.parity.discrepancy import Discrepancy, DiscrepancyKind
from tests.src.form_schema.parity.json_schema.harness import flatten_schema
from tests.src.form_schema.parity.json_schema.harness.flatten_schema import FormInput
from tests.src.form_schema.parity.paths import Path
from tests.src.form_schema.parity.xml.harness import flatten_transform, flatten_xsd
from tests.src.form_schema.parity.xml.harness.form_diff import FormDiff

#: For each bound, which direction makes the form the looser of the two.
LOOSER = {"maxLength": "above", "maximum": "above", "minLength": "below", "minimum": "below"}

#: `minimum`/`maximum` say nothing about a string, so a form holding a decimal as text --
#: which every money field does, to keep a cent off binary floating point -- carries the
#: range in its pattern instead. These are read from the pattern rather than looked up.
FROM_PATTERN = ("minimum", "maximum")


@dataclasses.dataclass(frozen=True)
class FlatForm:
    """One form's mapping, flattened, beside the two documents it is held against."""

    diff: FormDiff

    #: Element path -> the response field feeding it, or None where it takes no value.
    targets: dict[Path, str | None]

    #: Rule key -> why its wire structure could not be derived. Empty for a readable form.
    unreadable: dict[str, str]

    #: The Grants.gov XSD the mapping targets.
    declared: dict[Path, flatten_xsd.Element]

    #: Elements the attachment transformer builds from an upload rather than the mapping.
    attachments: frozenset[str]

    #: The form's own fields, for reading the rules that govern one.
    by_path: dict[Path, FormInput]

    #: The same fields rendered as dotted strings, for comparing against rule sources.
    inputs: frozenset[str]

    #: Element path -> the `value_transform` types its rule declares.
    transformed: dict[Path, frozenset[str]]

    @property
    def sources(self) -> set[str]:
        """Every response field some rule reads."""
        return {source for source in self.targets.values() if source}


def flatten(diff: FormDiff) -> FlatForm:
    """Read one form's mapping, the schema it targets, and its own fields."""
    module = importlib.import_module(f"src.form_schema.forms.{diff.module}")
    # A hand-written form exports module-level constants; a generated one exports the Form
    # the loader built from its form.json.
    generated = getattr(module, "FORM", None)
    mapping = generated.json_to_xml_schema if generated else module.FORM_XML_TRANSFORM_RULES
    targets, unreadable = flatten_transform.read(mapping)
    own_schema = generated.form_json_schema if generated else module.FORM_JSON_SCHEMA

    return FlatForm(
        diff=diff,
        targets=targets,
        unreadable=unreadable,
        declared=flatten_xsd.elements(
            flatten_transform.xsd_of(mapping), flatten_transform.root_of(mapping)
        ),
        attachments=flatten_transform.attachment_elements(mapping),
        by_path=flatten_schema.inputs(module.FORM_JSON_SCHEMA),
        inputs=frozenset(paths.join(p) for p in flatten_schema.inputs(own_schema)),
        transformed=flatten_transform.transformed(mapping),
    )


# --- reading one element at a time -----------------------------------------


def _reaches(field: str, sources: set[str]) -> bool:
    """Whether some rule reads `field`, or reads a field that contains it."""
    return any(field == s or field.startswith(s + ".") for s in sources)


def _governed(flat: FlatForm):
    """Yields `(element path, response field, form rules, element)` per element.

        ("Applicant", "Street1"), "applicant.street1",
        {"type": "string", "maxLength": 55}, Element(...)

    Only elements fed by exactly one field. Skips containers, and skips a source naming a
    subtree rather than one input -- an attachment field, or the array behind a
    `one_to_many` expansion.
    """
    for path, source in flat.targets.items():
        if source is None:
            continue
        governed = flat.by_path.get(paths.split(source))
        element = flat.declared.get(path)
        if governed is None or element is None:
            continue
        yield path, source, governed.rules, element


def _reconciled(flat: FlatForm, path: Path, keyword: str) -> bool:
    """Whether a `value_transform` on this element could account for a `keyword` difference.

    `boolean_to_yes_no` accounts for a type difference, `truncate_string` for `maxLength`.
    `flatten_transform.RECONCILED_BY` holds the mapping; nothing accounts for a numeric
    bound.
    """
    declared = flat.transformed.get(path, frozenset())
    return bool(declared & flatten_transform.RECONCILED_BY.get(keyword, frozenset()))


def _recorded(flat: FlatForm, path: Path, keyword: str) -> bool:
    """Whether `differing_rules` holds an entry for this element and keyword."""
    return f"{paths.join(path)}/{keyword}" in flat.diff.differing_rules


def _from_attachment(path: Path, attachments: frozenset[str]) -> bool:
    """Whether an element's value comes from an uploaded file rather than the mapping."""
    return bool(path) and path[0] in attachments and len(path) > 1


# --- the mapping against the XSD -------------------------------------------


def undeclared_targets(flat: FlatForm) -> list[Discrepancy]:
    """Targets naming nothing the schema declares.

    Catches a misspelled target, one at the wrong nesting level, or an element a schema
    revision renamed or removed.
    """
    return [
        Discrepancy(DiscrepancyKind.UNDECLARED_TARGET, paths.join(path))
        for path in sorted(flat.targets)
        if path not in flat.declared
    ]


def unsourced_elements(flat: FlatForm) -> list[Discrepancy]:
    """Elements the schema requires that nothing feeds.

    Attachment subtrees are exempt: they come from the uploaded file, not the mapping.
    """
    return [
        Discrepancy(DiscrepancyKind.UNSOURCED_REQUIRED_ELEMENT, paths.join(path))
        for path, element in sorted(flat.declared.items())
        if element.required
        and path not in flat.targets
        and not _from_attachment(path, flat.attachments)
    ]


def out_of_order_elements(flat: FlatForm) -> list[Discrepancy]:
    """Parents whose children the mapping declares out of schema sequence order.

    The transformer emits in mapping order and Grants.gov declares `xs:sequence`, so this
    is load-bearing -- and maintained only as key order in a Python dictionary.
    """
    ordered = [
        path for path in flat.targets if path in flat.declared and flat.declared[path].position >= 0
    ]

    out = []
    for parent, group in itertools.groupby(sorted(ordered, key=lambda p: p[:-1]), lambda p: p[:-1]):
        siblings = set(group)
        as_mapped = [p for p in ordered if p in siblings]
        as_declared = sorted(siblings, key=lambda p: flat.declared[p].position)
        if as_mapped != as_declared:
            out.append(
                Discrepancy(
                    DiscrepancyKind.ELEMENTS_OUT_OF_SEQUENCE,
                    paths.join(parent) or "(root)",
                    f"mapped {[p[-1] for p in as_mapped]}, "
                    f"schema declares {[p[-1] for p in as_declared]}",
                )
            )
    return out


# --- the mapping against the form ------------------------------------------


def unmatched_fields(flat: FlatForm) -> list[Discrepancy]:
    """Fields no rule reads, and rules reading fields the form does not have.

    Returns kind `"form field is unmapped"` or `"rule source is unknown"`; the callers in
    `test_forms.py` filter on which. A field no rule reads is an answer that never appears
    in the submission. A rule reading a field that does not exist still targets an element
    that is mapped, so the XSD-side checks see nothing.

    Suppressed by `absent_from_definition` and `absent_from_source` respectively.
    """
    out = [
        Discrepancy(DiscrepancyKind.UNMAPPED_FORM_FIELD, field)
        for field in sorted(flat.inputs)
        if not _reaches(field, flat.sources) and field not in flat.diff.absent_from_definition
    ]
    out += [
        Discrepancy(DiscrepancyKind.UNKNOWN_RULE_SOURCE, source)
        for source in sorted(flat.sources)
        if not any(field == source or field.startswith(source + ".") for field in flat.inputs)
        and source not in flat.diff.absent_from_source
    ]
    return out


# --- the form against the XSD ----------------------------------------------


def rule_differences(flat: FlatForm) -> list[Discrepancy]:
    """Where the form permits something the element it feeds cannot carry.

    Returns `RULE_DIFFERS` with `keyword` set to `enum`, a bound or `type`, or
    `RANGE_UNREADABLE`, so a caller can report the three comparisons separately.

    Containment, not equality -- a form stricter than the wire passes. Declaring no bound
    where the element declares one counts as looser. A money field is a string, so its
    range comes from its pattern; a pattern `flatten_xsd.implied_range` cannot parse is
    reported as `range unreadable`, since nothing then checks it.

    Suppressed per keyword by `differing_rules`, or by a `value_transform` that could
    account for the difference.
    """
    return [found for _, found in _rule_findings(flat)]


def _rule_findings(flat: FlatForm, consult_record: bool = True):
    """`rule_differences` as `(keyword, finding)` pairs; `stale_entries` sets the record aside."""

    def recorded(path: Path, keyword: str) -> bool:
        return consult_record and _recorded(flat, path, keyword)

    for path, source, governed, element in _governed(flat):
        where, feeds = paths.join(path), f"<- {source}"

        listed = element.rules.get("enum")
        if (
            "enum" in governed
            and isinstance(listed, frozenset)
            and not _reconciled(flat, path, "enum")
            and not recorded(path, "enum")
        ):
            if extra := sorted(set(governed["enum"]) - listed):
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
            # A `minLength` of 0 asks nothing of anyone -- a string is never shorter than
            # that -- so a form declaring no minimum is not looser than it.
            if keyword == "minLength" and limit == 0:
                continue
            if _reconciled(flat, path, keyword) or recorded(path, keyword):
                continue

            declared = governed.get(keyword)
            if keyword in FROM_PATTERN and governed.get("type") == "string":
                permitted = flatten_xsd.implied_range(governed.get("pattern", ""))
                if permitted is None:
                    yield (
                        keyword,
                        Discrepancy(
                            DiscrepancyKind.RANGE_UNREADABLE,
                            where,
                            f"{feeds}: the element bounds {keyword} at {limit}, the field is a "
                            f"string, and its pattern {governed.get('pattern', '(none)')!r} does "
                            f"not say what range it permits -- so nothing checks it",
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
        declared_type = governed.get("type")
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


# --- the record against all three ------------------------------------------


def stale_entries(flat: FlatForm) -> list[Discrepancy]:
    """Record entries that no longer describe a real difference.

    A field now mapped or gone from the form, a source that now resolves or is no longer
    read, and a `differing_rules` key naming an element or keyword the XSD no longer has,
    or one the form now satisfies.
    """
    out = [
        Discrepancy(
            DiscrepancyKind.ABSENT_FIELD_NOW_MAPPED, field, "remove from `absent_from_definition`"
        )
        for field in sorted(flat.diff.absent_from_definition)
        if _reaches(field, flat.sources)
    ]
    out += [
        Discrepancy(
            DiscrepancyKind.ABSENT_FIELD_NOT_ON_FORM, field, "remove from `absent_from_definition`"
        )
        for field in sorted(flat.diff.absent_from_definition)
        if field not in flat.inputs
    ]
    out += [
        Discrepancy(
            DiscrepancyKind.UNKNOWN_SOURCE_NOW_EXISTS, source, "remove from `absent_from_source`"
        )
        for source in sorted(flat.diff.absent_from_source)
        if any(field == source or field.startswith(source + ".") for field in flat.inputs)
    ]
    out += [
        Discrepancy(
            DiscrepancyKind.UNKNOWN_SOURCE_NOT_READ, source, "remove from `absent_from_source`"
        )
        for source in sorted(flat.diff.absent_from_source)
        if source not in flat.sources
    ]

    # A recorded rule difference has to still name a mapped element and a rule it declares,
    # and the comparison has to still find it with the record set aside.
    by_element = {paths.join(path): element for path, element in flat.declared.items()}
    differing = {
        f"{found.path}/{keyword}" for keyword, found in _rule_findings(flat, consult_record=False)
    }
    for entry in sorted(flat.diff.differing_rules):
        element, _, keyword = entry.rpartition("/")
        declared = by_element.get(element)
        if declared is None:
            out.append(
                Discrepancy(
                    DiscrepancyKind.RULE_ENTRY_NAMES_NO_ELEMENT,
                    entry,
                    "remove from `differing_rules`",
                )
            )
        elif keyword == "type" and declared.primitive is None:
            out.append(
                Discrepancy(
                    DiscrepancyKind.RULE_ENTRY_ELEMENT_HAS_NO_TYPE,
                    entry,
                    "remove from `differing_rules`",
                )
            )
        elif keyword != "type" and keyword not in declared.rules:
            out.append(
                Discrepancy(
                    DiscrepancyKind.RULE_ENTRY_KEYWORD_NOT_DECLARED,
                    entry,
                    "remove from `differing_rules`",
                )
            )
        elif entry not in differing:
            out.append(
                Discrepancy(
                    DiscrepancyKind.RULE_NO_LONGER_DIFFERS, entry, "remove from `differing_rules`"
                )
            )
    return out


def unrecorded_skips(flat: FlatForm) -> list[Discrepancy]:
    """Disagreements between what `flatten_transform.read` could not derive and what
    `unreadable` claims, in both directions.

    Keeps the skip honest: a form cannot quietly become unreadable and skip every
    structural check, and a record cannot keep claiming a rule that now reads fine.
    """
    out = [
        Discrepancy(DiscrepancyKind.UNREADABLE_RULE_NOT_RECORDED, rule, why)
        for rule, why in sorted(flat.unreadable.items())
        if rule not in flat.diff.unreadable
    ]
    out += [
        Discrepancy(DiscrepancyKind.RECORDED_RULE_NOW_READABLE, rule, why)
        for rule, why in sorted(flat.diff.unreadable.items())
        if rule not in flat.unreadable
    ]
    return out
