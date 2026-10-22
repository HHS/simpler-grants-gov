"""Reads a Grants.gov XSD into `{path: Element}`.

    SF424_4_0-V4.0.xsd
    -> {("Applicant", "Street1"): Element(required=True, position=0, primitive="string",
                                          rules={"maxLength": 55}),
        ("@formVersion",):        Element(required=False, position=-1)}

A path is element names from the root's children down; an attribute is a step prefixed
`@` and carries position -1, since attributes are unordered. The counterpart over JSON
Schema is `../../json_schema/harness/flatten_schema.py`.

Reads the XSDs the API vendors under `src/services/xml_generation/xsds/`. `xmlschema`
follows imports into `GlobalLibrary` and `UniversalCodes`, so an element typed
`globLib:AddressDataTypeV3` arrives with its children and facets resolved.
"""

import dataclasses
import re
from decimal import Decimal
from pathlib import Path as FilePath

import xmlschema
from xmlschema.validators import XsdGroup

from ...paths import Path

XSD_DIR = FilePath(__file__).parents[6] / "src/services/xml_generation/xsds"

# Guards against a self-referential type; Grants.gov nests nowhere near this deep.
MAX_DEPTH = 8

#: XSD facet -> the JSON Schema keyword meaning the same thing. `totalDigits`,
#: `fractionDigits` and `whiteSpace` have no equivalent and are not carried.
FACETS = {
    "minLength": "minLength",
    "maxLength": "maxLength",
    "enumeration": "enum",
    "minInclusive": "minimum",
    "maxInclusive": "maximum",
    "pattern": "pattern",
}

#: xs: primitive -> the JSON Schema type a form would declare for it.
PRIMITIVES = {
    "string": "string",
    "anyURI": "string",
    "token": "string",
    "date": "string",
    "dateTime": "string",
    "boolean": "boolean",
    "decimal": "number",
    "double": "number",
    "float": "number",
    "int": "integer",
    "integer": "integer",
    "long": "integer",
}


@dataclasses.dataclass(frozen=True)
class Element:
    """One element or attribute declaration, and what the schema demands of it."""

    required: bool
    #: Place in the parent's sequence, or -1 for an attribute, which is unordered.
    position: int
    #: The xs: primitive the value reduces to, or None if the element has no simple content.
    primitive: str | None = None
    #: Restrictions keyed by JSON Schema keyword, to line up with `json_schema/flatten_schema.py`.
    #: Lengths and bounds are numbers; `enum` is a frozenset.
    rules: dict[str, object] = dataclasses.field(default_factory=dict)


#: A decimal held as a string, bounded by how many digits it may carry. Grants.gov types
#: money as `xs:decimal` with `minInclusive`/`maxInclusive`, while a form holds it as a
#: string so a cent is never lost to binary floating point -- which means the form cannot
#: use `minimum`/`maximum` at all and has to carry the range in its pattern instead.
DIGIT_BOUNDED = re.compile(r"^\^\\d\{1,(\d+)\}\(\[\.\]\\d\{2\}\)\?\$$")


def implied_range(pattern: str) -> tuple[Decimal, Decimal] | None:
    """The range a money pattern permits, or None if it is not a shape we can read.

    Returning None matters as much as returning a range: it is the difference between "the
    form is within the element's bounds" and "nobody has checked", and the caller reports
    the second rather than passing over it.
    """
    match = DIGIT_BOUNDED.match(pattern)
    if match is None:
        return None
    digits = int(match.group(1))
    return Decimal(0), Decimal(10) ** digits - Decimal("0.01")


def _constraints(declaration) -> tuple[str | None, dict[str, object]]:
    """An element's primitive type and its restrictions, in JSON Schema vocabulary."""
    xsd_type = declaration.type
    primitive = getattr(getattr(xsd_type, "primitive_type", None), "local_name", None)

    rules: dict[str, object] = {}
    for key, facet in (getattr(xsd_type, "facets", None) or {}).items():
        name = str(key).split("}")[-1]

        # `length` fixes both ends at once; JSON Schema has no single keyword for it.
        if name == "length":
            rules["minLength"] = rules["maxLength"] = facet.value
            continue

        keyword = FACETS.get(name)
        if keyword is None:
            continue
        rules[keyword] = frozenset(facet.enumeration) if keyword == "enum" else facet.value

    return primitive, rules


def _children(declaration) -> XsdGroup | None:
    """The model group holding an element's children, or None if it has none.

    An element carrying only text and attributes is a leaf here, even though XSD calls its
    type complex.
    """
    content = getattr(declaration.type, "content", None)
    return content if isinstance(content, XsdGroup) else None


def _in_order(group: XsdGroup) -> list[tuple[object, bool]]:
    """One content model flattened to `(declaration, individually_required)` in order.

    A member of an `xs:choice` is never individually required: the schema asks for one of
    the alternatives, not for that one.

    Raises on a model group nested more than one level deep. No Grants.gov schema nests
    further, so the case has no known correct handling to implement.
    """
    out: list[tuple[object, bool]] = []
    for item in group.iter_model():
        if not isinstance(item, XsdGroup):
            out.append((item, item.min_occurs >= 1))
            continue
        for member in item.iter_model():
            if isinstance(member, XsdGroup):
                raise NotImplementedError(
                    f"model group nested more than one level deep: {group.model} "
                    f"containing {item.model} containing {member.model}"
                )
            out.append((member, False))
    return out


def elements(xsd_filename: str, root: str) -> dict[Path, Element]:
    """Every element and attribute the schema declares, by path."""
    path = XSD_DIR / xsd_filename
    if not path.exists():
        raise FileNotFoundError(f"{path} is not vendored under {XSD_DIR}")

    schema = xmlschema.XMLSchema(str(path))
    if root not in schema.elements:
        declared = ", ".join(sorted(schema.elements))
        raise KeyError(f"{xsd_filename} declares no root element {root!r}. Declared: {declared}")

    out: dict[Path, Element] = {}
    seen: set[Path] = set()

    def descend(declaration, here: Path, depth: int) -> None:
        if depth > MAX_DEPTH:
            raise RecursionError(f"{xsd_filename}: nested past {MAX_DEPTH} levels at {here}")
        if here in seen:
            return
        seen.add(here)

        for name in declaration.attributes:
            out[*here, "@" + name.split("}")[-1]] = Element(required=False, position=-1)

        group = _children(declaration)
        if group is None:
            return

        for position, (child, required) in enumerate(_in_order(group)):
            primitive, rules = _constraints(child)
            out[*here, child.local_name] = Element(
                required=required, position=position, primitive=primitive, rules=rules
            )
            descend(child, (*here, child.local_name), depth + 1)

    descend(schema.elements[root], (), 0)
    return out
