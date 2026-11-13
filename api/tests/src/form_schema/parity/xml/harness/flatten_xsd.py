"""Flatten a Grants.gov XSD into the elements and attributes it declares, keyed by path.

    Key_Contacts_2_0-V2.0.xsd
    -> {("RoleOnProject", "ContactEmail"): Element(required=True, position=7,
                                                   primitive="string",
                                                   rules={"minLength": 1, "maxLength": 60}),
        ("@FormVersion",): Element(required=False, position=-1), ...}

A path starts below the root element. An attribute's step starts with `@`. Imported types,
such as `globLib:AddressDataTypeV3`, are resolved with their children and facets.
"""

import dataclasses
import re
from decimal import Decimal
from pathlib import Path as FilePath
from typing import Any

import xmlschema
from xmlschema.validators import XsdGroup

from ...paths import Path

XSD_DIR = FilePath(__file__).parents[6] / "src/services/xml_generation/xsds"

# Guards against a self-referential type. Grants.gov schemas nest far less deeply.
MAX_DEPTH = 8

#: XSD facet -> the JSON Schema keyword with the same meaning. `totalDigits`,
#: `fractionDigits` and `whiteSpace` have no equivalent and are left out.
FACETS = {
    "minLength": "minLength",
    "maxLength": "maxLength",
    "enumeration": "enum",
    "minInclusive": "minimum",
    "maxInclusive": "maximum",
    "pattern": "pattern",
}

#: XSD primitive type -> the JSON Schema type a form field would declare for it.
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

#: A money pattern: up to N digits and an optional two-digit decimal, e.g.
#: `^\d{1,14}([.]\d{2})?$`. Forms store money as strings, so their range is in the pattern.
DIGIT_BOUNDED = re.compile(r"^\^\\d\{1,(\d+)\}\(\[\.\]\\d\{2\}\)\?\$$")


@dataclasses.dataclass(frozen=True)
class Element:
    """An element or attribute declared in an XSD, with its required status, position and
    constraints.

        Element(required=True, position=0, primitive="string", rules={"maxLength": 55})
    """

    required: bool
    #: Position among its siblings, or -1 for an attribute, which has no order.
    position: int
    #: The XSD primitive type of its value, or None if it contains other elements.
    primitive: str | None = None
    #: Constraints keyed by JSON Schema keyword. `enum` is a frozenset.
    rules: dict[str, object] = dataclasses.field(default_factory=dict)


# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def elements(xsd_filename: str, root: str) -> dict[Path, Element]:
    """Return every element and attribute declared under `root` in a vendored XSD, keyed by
    path.

    Raises `FileNotFoundError` if the XSD isn't vendored, or `KeyError` if it doesn't
    declare `root`.
    """
    path = XSD_DIR / xsd_filename
    if not path.exists():
        raise FileNotFoundError(f"{path} is not vendored under {XSD_DIR}")

    schema = xmlschema.XMLSchema(str(path))
    if root not in schema.elements:
        declared = ", ".join(sorted(schema.elements))
        raise KeyError(f"{xsd_filename} declares no root element {root!r}. Declared: {declared}")

    out: dict[Path, Element] = {}
    seen: set[Path] = set()

    def descend(declaration: Any, here: Path, depth: int) -> None:
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


def implied_range(pattern: str) -> tuple[Decimal, Decimal] | None:
    """Return the range of values a money pattern accepts, or None if it isn't a money
    pattern.

        implied_range(r"^\\d{1,14}([.]\\d{2})?$") -> (Decimal("0"), Decimal("99999999999999.99"))
    """
    match = DIGIT_BOUNDED.match(pattern)
    if match is None:
        return None
    digits = int(match.group(1))
    return Decimal(0), Decimal(10) ** digits - Decimal("0.01")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _constraints(declaration: Any) -> tuple[str | None, dict[str, object]]:
    """Return an element's primitive type and its constraints, keyed by JSON Schema keyword."""
    xsd_type = declaration.type
    primitive = getattr(getattr(xsd_type, "primitive_type", None), "local_name", None)

    rules: dict[str, object] = {}
    for key, facet in (getattr(xsd_type, "facets", None) or {}).items():
        name = str(key).split("}")[-1]

        # `length` fixes both bounds, which JSON Schema states as two keywords.
        if name == "length":
            rules["minLength"] = rules["maxLength"] = facet.value
            continue

        keyword = FACETS.get(name)
        if keyword is None:
            continue
        rules[keyword] = frozenset(facet.enumeration) if keyword == "enum" else facet.value

    return primitive, rules


def _children(declaration: Any) -> XsdGroup | None:
    """Return the group containing an element's child elements, or None if it has none."""
    content = getattr(declaration.type, "content", None)
    return content if isinstance(content, XsdGroup) else None


def _in_order(group: XsdGroup) -> list[tuple[Any, bool]]:
    """Return a group's child elements in order, each with whether it's required.

    A member of an `xs:choice` is never required on its own, since any one of the choices
    satisfies the schema.

    Raises `NotImplementedError` on a group nested more than one level deep, which Grants.gov
    schemas don't use.
    """
    out: list[tuple[Any, bool]] = []
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
