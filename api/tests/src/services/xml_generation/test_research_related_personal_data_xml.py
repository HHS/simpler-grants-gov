from pathlib import Path

from lxml import etree

from src.form_schema.forms.research_related_personal_data_generated import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator


def test_each_person_keeps_their_own_answers():
    def director(name, races):
        return {"name": {"first_name": name, "last_name": "Example"}, "race": races}

    answers = {
        "project_director": director("Casey", ["Asian", "White"]),
        "co_project_director": [
            director("Alex", ["White"]),
            director("Robin", ["Do Not Wish to Provide"]),
        ],
    }
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(application_data=answers, transform_config=FORM_XML_TRANSFORM_RULES)
    )
    assert response.success, response.error_message
    root = etree.fromstring(response.xml_data.encode())
    assert [
        (p.findtext(".//{*}FirstName"), [r.text for r in p.findall("{*}Race")]) for p in root
    ] == [("Casey", ["Asian", "White"]), ("Alex", ["White"]), ("Robin", ["Do Not Wish to Provide"])]
    validator = XSDValidator(Path(__file__).parents[4] / "src/services/xml_generation/xsds")
    result = validator.validate_xml(
        response.xml_data, validator.xsd_dir / "RR_PersonalData_1_2-V1.2.xsd"
    )
    assert result["valid"], result["error_message"]
