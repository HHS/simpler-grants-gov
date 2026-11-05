"""Control how empty XML elements are written."""

from lxml import etree as lxml_etree


def write_closing_tags_for_empty_elements(
    root: lxml_etree._Element, element_names: list[str] | set[str]
) -> None:
    """Write the listed elements as <Name></Name> instead of <Name/> when they're empty.

    Both forms mean the same thing in XML, but some forms need to match the legacy
    Grants.gov output exactly, and it writes these elements with a closing tag. Only the
    elements named here (by local name) are touched. Parsing XML again loses this, so it
    has to be applied to the final tree right before it's written out.
    """
    if not element_names:
        return

    names = set(element_names)
    for element in root.iter():
        if (
            isinstance(element.tag, str)
            and lxml_etree.QName(element).localname in names
            and len(element) == 0
            and element.text is None
        ):
            element.text = ""
