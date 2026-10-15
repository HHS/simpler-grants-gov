"""Tests for writing empty elements with a closing tag."""

import pytest
from lxml import etree as lxml_etree

from src.services.xml_generation.utils.closing_tags import write_closing_tags_for_empty_elements

XML = (
    '<f:Form xmlns:f="urn:form">'
    '<f:Item f:title="A"/>'
    '<f:Item f:title="B"><f:Amount>1.00</f:Amount></f:Item>'
    "<f:Other/>"
    "</f:Form>"
)


def _write(element_names) -> str:
    root = lxml_etree.fromstring(XML)
    write_closing_tags_for_empty_elements(root, element_names)
    return lxml_etree.tostring(root, encoding="unicode")


def test_listed_empty_elements_get_a_closing_tag():
    xml = _write(["Item"])

    assert '<f:Item f:title="A"></f:Item>' in xml
    # Elements with content and elements that aren't listed are left as they were
    assert '<f:Item f:title="B"><f:Amount>1.00</f:Amount></f:Item>' in xml
    assert "<f:Other/>" in xml


@pytest.mark.parametrize("element_names", [[], set()])
def test_nothing_changes_without_element_names(element_names):
    assert _write(element_names) == lxml_etree.tostring(
        lxml_etree.fromstring(XML), encoding="unicode"
    )


def test_xml_meaning_is_unchanged():
    root = lxml_etree.fromstring(_write(["Item", "Other"]))

    assert [lxml_etree.QName(el).localname for el in root.iter()] == [
        "Form",
        "Item",
        "Item",
        "Amount",
        "Other",
    ]
    assert root[0].get("{urn:form}title") == "A"
    assert not root[0].text
