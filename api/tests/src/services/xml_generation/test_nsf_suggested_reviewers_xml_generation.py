"""XML output for NSF Suggested Reviewers, validated against the original XSD."""

from pathlib import Path

import pytest
from lxml import etree

from src.form_schema.forms.nsf_suggested_reviewers_generated import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_NS = "http://apply.grants.gov/forms/NSF_SuggestedReviewers-V1.1"
_XSDS = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
_XSD = _XSDS / "NSF_SuggestedReviewers-V1.1.xsd"
_SNAPSHOT = Path(__file__).parent / "snapshots/nsf_suggested_reviewers_1_1.xml"

_ELEMENTS = {
    "suggested_reviewers": "SuggestedReviewers",
    "reviewers_not_to_include": "ReviewersNotToInclude",
}
_FULL = {
    "suggested_reviewers": "Dr. Ada Example, Example University; microbial ecology & <soils>.",
    "reviewers_not_to_include": '"Dr. Ben Example"; recent collaborator.',
}


def generate(data):
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(application_data=data, transform_config=FORM_XML_TRANSFORM_RULES)
    )
    assert response.success, response.error_message
    return response.xml_data


def assert_valid(xml):
    result = XSDValidator(_XSDS).validate_xml(xml, _XSD)
    assert result["valid"], result


@pytest.mark.parametrize(
    "data",
    [
        {},
        _FULL,
        {"suggested_reviewers": "x" * 4000},
        {"reviewers_not_to_include": "Réviseur\n第二行"},
    ],
    ids=["empty", "full", "max-length", "one-field"],
)
def test_xml_matches_answers_and_xsd(data):
    xml = generate(data)
    root = etree.fromstring(xml.encode())
    assert root.tag == f"{{{_NS}}}NSF_SuggestedReviewers"
    assert root.get(f"{{{_NS}}}FormVersion") == "1.1"
    for field, element in _ELEMENTS.items():
        node = root.find(f"{{{_NS}}}{element}")
        assert (node is None) == (field not in data)
        if node is not None:
            assert node.text == data[field]
    assert_valid(xml)


def test_xml_lists_elements_in_xsd_order():
    root = etree.fromstring(generate(_FULL).encode())
    assert [etree.QName(child).localname for child in root] == list(_ELEMENTS.values())


@pytest.mark.parametrize("field", list(_ELEMENTS))
def test_original_xsd_rejects_text_over_limit(field):
    xml = generate({field: "x" * 4001})
    assert not XSDValidator(_XSDS).validate_xml(xml, _XSD)["valid"]


def test_snapshot():
    assert generate(_FULL) == _SNAPSHOT.read_text()
