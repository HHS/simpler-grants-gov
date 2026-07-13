"""Tests for Key Contacts form XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd
"""

from lxml import etree as lxml_etree

from src.form_schema.forms.key_contacts import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService

KC_NS = "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0"
GLOB_NS = "http://apply.grants.gov/system/GlobalLibrary-V2.0"


def test_key_contacts_xml_structure():
    """Generate XML for multiple key contacts and verify the RoleOnProject array structure."""
    application_data = {
        "applicant_organization_name": "Acme Corporation",
        "key_contacts": [
            {
                "project_role": "Principal Investigator",
                "name": {"prefix": "Dr.", "first_name": "Sue", "last_name": "Storm"},
                "address": {
                    "street1": "123 Main St",
                    "city": "Placeville",
                    "state": "WY: Wyoming",
                    "zip_code": "56789",
                    "country": "USA: UNITED STATES",
                },
                "phone": "1234567890",
                "email": "sue@example.com",
            },
            {
                "project_role": "Project Manager",
                "name": {"first_name": "Joe", "last_name": "Smith"},
                "address": {
                    "street1": "456 Rio",
                    "city": "Montevideo",
                    "country": "URY: URUGUAY",
                },
                "phone": "5556667777",
                "email": "joe@place.com",
            },
        ],
    }

    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )
    )
    assert response.success is True

    root = lxml_etree.fromstring(response.xml_data.encode("utf-8"))
    assert root.tag == f"{{{KC_NS}}}Key_Contacts_2_0"
    assert root.get(f"{{{KC_NS}}}FormVersion") == "2.0"
    assert root.find(f"{{{KC_NS}}}ApplicantOrganizationName").text == "Acme Corporation"

    # Each key contact maps to a RoleOnProject element (form namespace), in order
    roles = root.findall(f"{{{KC_NS}}}RoleOnProject")
    assert len(roles) == 2

    pi = roles[0]
    assert pi.find(f"{{{KC_NS}}}ContactProjectRole").text == "Principal Investigator"

    # Name/Address are form-namespace wrappers with globLib children (per GlobalLibrary types)
    name = pi.find(f"{{{KC_NS}}}ContactName")
    assert name.find(f"{{{GLOB_NS}}}FirstName").text == "Sue"
    assert name.find(f"{{{GLOB_NS}}}LastName").text == "Storm"

    address = pi.find(f"{{{KC_NS}}}ContactAddress")
    assert address.find(f"{{{GLOB_NS}}}Street1").text == "123 Main St"
    assert address.find(f"{{{GLOB_NS}}}State").text == "WY: Wyoming"
    assert address.find(f"{{{GLOB_NS}}}Country").text == "USA: UNITED STATES"

    assert pi.find(f"{{{KC_NS}}}ContactPhone").text == "1234567890"
    assert pi.find(f"{{{KC_NS}}}ContactEmail").text == "sue@example.com"
