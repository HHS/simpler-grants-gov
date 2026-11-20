"""Real XML consumer output for NSF Deviation, including optional omission."""

from pathlib import Path

import pytest
from lxml import etree

from src.form_schema.forms.nsf_deviation_authorization_generated import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_NS = "http://apply.grants.gov/forms/NSF_DeviationAuthorization-V1.1"
_XSDS = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
_SNAPSHOT = Path(__file__).parent / "snapshots/nsf_deviation_authorization_1_1.xml"


def generate(data):
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(application_data=data, transform_config=FORM_XML_TRANSFORM_RULES)
    )
    assert response.success, response.error_message
    return response.xml_data


@pytest.mark.parametrize("value", [None, "x", "x" * 4000, "Déviation & <scope>\n第二行"])
def test_source_valid_output(value):
    xml = generate({} if value is None else {"deviation_authorization": value})
    root = etree.fromstring(xml.encode())
    assert root.tag == f"{{{_NS}}}NSF_DeviationAuthorization"
    assert root.get(f"{{{_NS}}}FormVersion") == "1.1"
    answer = root.find(f"{{{_NS}}}DeviationAuthorization")
    if value is None:
        assert answer is None
    else:
        assert answer is not None
        assert answer.text == value
    result = XSDValidator(_XSDS).validate_xml(xml, _XSDS / "NSF_DeviationAuthorization-V1.1.xsd")
    assert result["valid"], result


@pytest.mark.parametrize("value", ["", "x" * 4001])
def test_original_xsd_rejects_invalid_text(value):
    # The XML service is not the form validator; prove the original source guard independently.
    xml = generate({"deviation_authorization": value})
    if value == "":
        # The serializer omits empty values. Construct the present-empty source witness.
        root = etree.fromstring(xml.encode())
        etree.SubElement(root, f"{{{_NS}}}DeviationAuthorization")
        xml = etree.tostring(root, encoding="unicode")
    result = XSDValidator(_XSDS).validate_xml(xml, _XSDS / "NSF_DeviationAuthorization-V1.1.xsd")
    assert not result["valid"]


def test_snapshot():
    assert (
        generate({"deviation_authorization": "Approved deviation & scope <A>."})
        == _SNAPSHOT.read_text()
    )
