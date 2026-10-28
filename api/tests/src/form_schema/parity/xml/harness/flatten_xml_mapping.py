"""Flatten a form's XML mapping in the format shaped like the XML (`xml_mapping.json`) into
the same element paths and form fields `flatten_transform` reads from XML transform rules,
so every check reads either format.

    {"root": {"Form": {"Applicant": {"globLib:Street1": {"$field": "applicant.street1"}}}}}
    -> ({("Applicant",): None, ("Applicant", "Street1"): "applicant.street1"}, {})

Element paths drop namespace prefixes, as the rules' targets do. A group of elements, and an
element repeated by `each`, takes no value from the form, so its field is None. Inside
`each`, fields are read below the list's `[]`, as is a numbered element's entry (`types.0`).
Both branches of a `when` are read, and a `required` value as the value it wraps.
"""

from typing import Any

from ...paths import ARRAY, Path

#: The `format` a mapping in this shape declares.
XML_MAPPING_FORMAT = "xml-mapping"


def is_xml_mapping(mapping: dict[str, Any]) -> bool:
    return mapping.get("format") == XML_MAPPING_FORMAT


# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def read(mapping: dict[str, Any]) -> tuple[dict[Path, str | None], dict[str, str]]:
    """Return the element each value produces, keyed by element path, with the form field it's
    filled from. Every value in this format can be checked, so nothing is unchecked. An
    element both branches of a `when` write keeps the field either one reads."""
    targets: dict[Path, str | None] = {}
    for path, value, prefix in _walk(mapping):
        targets[path] = targets.get(path) or _source(value, prefix)
    return targets, {}


def root_of(mapping: dict[str, Any]) -> str:
    """Return the name of the XML document's root element."""
    (key,) = mapping["root"]
    return _name(key)


def xsd_of(mapping: dict[str, Any]) -> str:
    """Return the file name of the XSD the mapping targets."""
    return mapping.get("xsd_url", "").split("/")[-1]


def attachment_elements(mapping: dict[str, Any]) -> frozenset[str]:
    """Return the elements built from uploaded files rather than from the mapping."""
    return frozenset(path[-1] for path, value, _ in _walk(mapping) if "$attachment" in value)


def transformed(mapping: dict[str, Any]) -> dict[Path, frozenset[str]]:
    """Return the transformation each element's value is written through, keyed by path. A
    `match` lists the values it writes, as a `map_values` transform does."""
    out: dict[Path, frozenset[str]] = {}
    for path, value, _ in _walk(mapping):
        if "$transform" in value:
            out[path] = frozenset({value["$transform"]["name"]})
        elif "$match" in value:
            out[path] = frozenset({"map_values"})
    return out


# =============================================================================
# HELPERS
# =============================================================================


def _name(key: str) -> str:
    """`globLib:Street1` -> `Street1`, `@Form:FormVersion` -> `@FormVersion`."""
    attribute = key.startswith("@")
    name = key.removeprefix("@").rpartition(":")[2]
    return f"@{name}" if attribute else name


def _is_function(value: Any) -> bool:
    """A function's one key starts with `$`; a literal `case` entry counts as one too."""
    return not isinstance(value, dict) or any(key.startswith("$") for key in value)


def _walk(mapping: dict[str, Any]) -> list[tuple[Path, dict[str, Any], str]]:
    """Every element and attribute below the root: its path, its value, and the path of the
    list item its fields are read below ("" outside any `each`)."""
    out: list[tuple[Path, dict[str, Any], str]] = []

    def visit(path: Path, value: Any, prefix: str) -> None:
        if not isinstance(value, dict):
            return  # a literal `case` entry or `default` reads no field
        if not _is_function(value):
            out.append((path, value, prefix))
            for key, child in value.items():
                visit((*path, _name(key)), child, prefix)
        elif "$each" in value:
            items = _source(value["$each"]["items"], prefix)
            out.append((path, value, prefix))
            visit_contents(path, value["$each"]["map"], f"{items}.{ARRAY}")
        elif "$required" in value:
            visit(path, value["$required"], prefix)
        elif "$when" in value:
            visit(path, value["$when"]["then"], prefix)
            if "else" in value["$when"]:
                visit(path, value["$when"]["else"], prefix)
        elif "$match" in value:
            # The element reads the matched field, and any field a branch reads.
            out.append((path, value, prefix))
            match = value["$match"]
            for branch in [*match["case"].values(), match.get("default")]:
                visit(path, branch, prefix)
        else:
            out.append((path, value, prefix))

    def visit_contents(path: Path, value: dict[str, Any], prefix: str) -> None:
        """An `each`'s map writes the repeated element itself, so it adds no step."""
        if _is_function(value):
            visit(path, value, prefix)
            return
        for key, child in value.items():
            visit((*path, _name(key)), child, prefix)

    ((_, content),) = mapping["root"].items()
    for key, child in content.items():
        visit((_name(key),), child, "")
    return out


def _source(value: Any, prefix: str) -> str | None:
    """The form field a value is filled from, or None if it takes no value from the form."""
    if not isinstance(value, dict):
        return None
    if "$field" in value:
        return _join(prefix, value["$field"])
    if "$attachment" in value:
        return _join(prefix, value["$attachment"])
    if "$transform" in value:
        return _source(value["$transform"]["value"], prefix)
    if "$required" in value:
        return _source(value["$required"], prefix)
    if "$match" in value:
        return _source(value["$match"]["value"], prefix)
    if "$when" in value:
        return _source(value["$when"]["then"], prefix) or _source(
            value["$when"].get("else"), prefix
        )
    return None


def _join(prefix: str, path: str) -> str:
    """A field below `prefix`. A whole-number step reads one entry of a list, so it stands for
    any item: `types.0` -> `types.[]`."""
    steps = [ARRAY if step.isdecimal() else step for step in path.split(".")]
    return ".".join([prefix, *steps] if prefix else steps)
