"""Tests for SF-424 Short form XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424_Short_3_0-V3.0.xsd
"""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.sf424_short import (
    FORM_XML_TRANSFORM_RULES as SF424_SHORT_TRANSFORM_RULES,
)
from src.form_schema.forms.sf424_short import SF424Short_v3_0
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.validation.xsd_validator import XSDValidator
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)

NS = "http://apply.grants.gov/forms/SF424_Short_3_0-V3.0"
GLOB_NS = "http://apply.grants.gov/system/GlobalLibrary-V2.0"


def _generate(application_data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_data, transform_config=SF424_SHORT_TRANSFORM_RULES
        )
    )
    assert response.success is True
    assert response.xml_data is not None
    return response.xml_data


_CONTACT = {
    "name": {
        "first_name": "Jane",
        "last_name": "Doe",
    },
    "title": "Project Director",
    "email": "jane.doe@example.org",
    "phone_number": "555-123-4567",
    "address": {
        "street1": "123 Main St",
        "city": "Washington",
        "state": "DC: District of Columbia",
        "zip_code": "20001",
        "country": "USA: UNITED STATES",
    },
}

_MINIMAL_DATA = {
    "agency_name": "Department of Research",
    "funding_opportunity_number": "TEST-SF424S-FON-001",
    "funding_opportunity_title": "SF-424 Short Test Opportunity",
    "organization_name": "Test Research University",
    "applicant": {
        "street1": "123 Main St",
        "city": "Washington",
        "state": "DC: District of Columbia",
        "zip_code": "20001",
        "country": "USA: UNITED STATES",
    },
    "applicant_type_code": ["C: City or Township Government"],
    "employer_taxpayer_identification_number": "123456789",
    "sam_uei": "TEST12345678",
    "congressional_district_applicant": "DC-001",
    "project_title": "SF-424 Short XSD Validation Test",
    "project_description": "A test project for XSD validation.",
    "project_start_date": "2025-01-01",
    "project_end_date": "2025-12-31",
    "project_director": _CONTACT,
    "same_as_project_director": False,
    "contact_person": _CONTACT,
    "application_certification": True,
    "authorized_representative": {
        "first_name": "Bob",
        "last_name": "Smith",
    },
    "authorized_representative_title": "Director",
    "authorized_representative_email": "bob.smith@example.org",
    "authorized_representative_phone_number": "555-987-6543",
}


class TestSF424ShortXMLGeneration:
    def test_root_element_and_version(self):
        """Root element is SF424_Short_3_0 with FormVersion=3.0."""
        xml_data = _generate({"agency_name": "Test Agency"})
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        assert root.tag == f"{{{NS}}}SF424_Short_3_0"
        assert root.get(f"{{{NS}}}FormVersion") == "3.0"

    def test_namespace_declaration(self):
        """Generated XML includes the SF424_Short_3_0 namespace declaration."""
        xml_data = _generate({"agency_name": "Test Agency"})
        assert f'xmlns="{NS}"' in xml_data

    def test_agency_name_maps_to_element(self):
        """agency_name maps to AgencyName element."""
        xml_data = _generate({"agency_name": "Department of Health"})
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        assert root.find(f"{{{NS}}}AgencyName").text == "Department of Health"

    def test_optional_fields_excluded_when_absent(self):
        """Optional fields with no value are excluded from the XML."""
        xml_data = _generate({"agency_name": "Test Agency"})
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        assert root.find(f"{{{NS}}}CFDANumber") is None
        assert root.find(f"{{{NS}}}ApplicantWebAddress") is None

    def test_applicant_address_nested(self):
        """applicant address fields are nested under Address with globLib namespace."""
        xml_data = _generate(
            {
                "applicant": {
                    "street1": "456 Oak Ave",
                    "city": "Boston",
                    "state": "MA: Massachusetts",
                    "zip_code": "02115",
                    "country": "USA: UNITED STATES",
                }
            }
        )
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        address = root.find(f"{{{NS}}}Address")
        assert address is not None
        assert address.find(f"{{{GLOB_NS}}}Street1").text == "456 Oak Ave"
        assert address.find(f"{{{GLOB_NS}}}City").text == "Boston"
        assert address.find(f"{{{GLOB_NS}}}ZipPostalCode").text == "02115"

    def test_applicant_type_code_one_to_many(self):
        """Multiple applicant type codes map to indexed ApplicantTypeCode elements."""
        xml_data = _generate(
            {
                "applicant_type_code": [
                    "A: State Government",
                    "C: City or Township Government",
                ]
            }
        )
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        assert root.find(f"{{{NS}}}ApplicantTypeCode1").text == "A: State Government"
        assert root.find(f"{{{NS}}}ApplicantTypeCode2").text == "C: City or Township Government"
        assert root.find(f"{{{NS}}}ApplicantTypeCode3") is None

    def test_project_director_group_nested(self):
        """project_director maps to ProjectDirectorGroup with globLib sub-elements."""
        xml_data = _generate({"project_director": _CONTACT})
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        group = root.find(f"{{{NS}}}ProjectDirectorGroup")
        assert group is not None

        name = group.find(f"{{{GLOB_NS}}}Name")
        assert name is not None
        assert name.find(f"{{{GLOB_NS}}}FirstName").text == "Jane"
        assert name.find(f"{{{GLOB_NS}}}LastName").text == "Doe"

        assert group.find(f"{{{GLOB_NS}}}Title").text == "Project Director"
        assert group.find(f"{{{GLOB_NS}}}Email").text == "jane.doe@example.org"
        assert group.find(f"{{{GLOB_NS}}}Phone").text == "555-123-4567"

    def test_contact_person_group_nested(self):
        """contact_person maps to ContactPersonGroup with globLib sub-elements."""
        xml_data = _generate({"contact_person": _CONTACT})
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        group = root.find(f"{{{NS}}}ContactPersonGroup")
        assert group is not None
        assert group.find(f"{{{GLOB_NS}}}Title").text == "Project Director"
        assert group.find(f"{{{GLOB_NS}}}Email").text == "jane.doe@example.org"

    def test_same_as_project_director_boolean_transform(self):
        """same_as_project_director True maps to 'Y: Yes', False maps to 'N: No'."""
        xml_true = _generate({"same_as_project_director": True})
        root = lxml_etree.fromstring(xml_true.encode("utf-8"))
        assert root.find(f"{{{NS}}}SameAsProjectDirector").text == "Y: Yes"

        xml_false = _generate({"same_as_project_director": False})
        root = lxml_etree.fromstring(xml_false.encode("utf-8"))
        assert root.find(f"{{{NS}}}SameAsProjectDirector").text == "N: No"

    def test_application_certification_boolean_transform(self):
        """application_certification True maps to 'Y: Yes'."""
        xml_data = _generate({"application_certification": True})
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        assert root.find(f"{{{NS}}}ApplicationCertification").text == "Y: Yes"

    def test_authorized_representative_nested(self):
        """authorized_representative maps to AuthorizedRepresentative with globLib name fields."""
        xml_data = _generate(
            {
                "authorized_representative": {
                    "prefix": "Dr",
                    "first_name": "Alice",
                    "last_name": "Johnson",
                    "suffix": "PhD",
                }
            }
        )
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        ar = root.find(f"{{{NS}}}AuthorizedRepresentative")
        assert ar is not None
        assert ar.find(f"{{{GLOB_NS}}}PrefixName").text == "Dr"
        assert ar.find(f"{{{GLOB_NS}}}FirstName").text == "Alice"
        assert ar.find(f"{{{GLOB_NS}}}LastName").text == "Johnson"
        assert ar.find(f"{{{GLOB_NS}}}SuffixName").text == "PhD"

    def test_contact_person_optional_name_fields(self):
        """Optional name fields (prefix, middle_name, suffix) are included when present."""
        contact_with_all_name_fields = {
            **_CONTACT,
            "name": {
                "prefix": "Dr",
                "first_name": "Alice",
                "middle_name": "Marie",
                "last_name": "Johnson",
                "suffix": "PhD",
            },
            "fax": "555-000-0000",
        }
        xml_data = _generate({"contact_person": contact_with_all_name_fields})
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        group = root.find(f"{{{NS}}}ContactPersonGroup")
        name = group.find(f"{{{GLOB_NS}}}Name")

        assert name.find(f"{{{GLOB_NS}}}PrefixName").text == "Dr"
        assert name.find(f"{{{GLOB_NS}}}MiddleName").text == "Marie"
        assert name.find(f"{{{GLOB_NS}}}SuffixName").text == "PhD"
        assert group.find(f"{{{GLOB_NS}}}Fax").text == "555-000-0000"

    def test_date_received_included_as_null_when_absent(self):
        """date_received uses null_handling=include_null so an empty element is always emitted."""
        xml_data = _generate({"agency_name": "Test Agency"})
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        # date_received must be present (possibly empty) due to include_null handling
        assert root.find(f"{{{NS}}}DateReceived") is not None


# ---------------------------------------------------------------------------
# Snapshot data — comprehensive case covering all required + key optional fields
# ---------------------------------------------------------------------------

_SNAPSHOT_DATA = {
    "agency_name": "Department of Health and Human Services",
    "assistance_listing_number": "93.456",
    "assistance_listing_program_title": "Public Health Research Grants",
    "funding_opportunity_number": "HHS-2025-001",
    "funding_opportunity_title": "SF-424 Short Snapshot Test Opportunity",
    "organization_name": "State University Research Foundation",
    "applicant": {
        "street1": "456 University Ave",
        "street2": "Suite 200",
        "city": "Boston",
        "state": "MA: Massachusetts",
        "zip_code": "02115",
        "country": "USA: UNITED STATES",
    },
    "applicant_web_address": "https://example.edu",
    "applicant_type_code": ["A: State Government", "X: Other (specify)"],
    "applicant_type_other_specify": "Research Consortium",
    "employer_taxpayer_identification_number": "987654321",
    "sam_uei": "UNIRESEARCH12",
    "congressional_district_applicant": "MA-008",
    "project_title": "Advanced Research in Public Health",
    "project_description": "A comprehensive study on public health outcomes.",
    "project_start_date": "2025-03-01",
    "project_end_date": "2026-02-28",
    "project_director": {
        "name": {
            "first_name": "Jane",
            "last_name": "Doe",
        },
        "title": "Principal Investigator",
        "email": "jane.doe@example.edu",
        "phone_number": "617-555-0001",
        "address": {
            "street1": "456 University Ave",
            "city": "Boston",
            "state": "MA: Massachusetts",
            "zip_code": "02115",
            "country": "USA: UNITED STATES",
        },
    },
    "same_as_project_director": False,
    "contact_person": {
        "name": {
            "prefix": "Dr",
            "first_name": "Alice",
            "middle_name": "Marie",
            "last_name": "Johnson",
            "suffix": "PhD",
        },
        "title": "Grants Administrator",
        "email": "alice.johnson@example.edu",
        "phone_number": "617-555-0002",
        "fax": "617-555-0003",
        "address": {
            "street1": "456 University Ave",
            "city": "Boston",
            "state": "MA: Massachusetts",
            "zip_code": "02115",
            "country": "USA: UNITED STATES",
        },
    },
    "application_certification": True,
    "authorized_representative": {
        "prefix": "Dr",
        "first_name": "Robert",
        "middle_name": "James",
        "last_name": "Williams",
        "suffix": "Jr",
    },
    "authorized_representative_title": "Vice President for Research",
    "authorized_representative_email": "r.williams@example.edu",
    "authorized_representative_phone_number": "617-555-0099",
    "authorized_representative_fax": "617-555-0100",
    "aor_signature": "r.williams@example.edu",
    "authorized_representative_date_signed": "2025-02-15",
}

_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "sf424_short_3_0.xml"


class TestSF424ShortSnapshot:
    """Regression snapshot test pinning the full generated XML output.

    To regenerate after an intentional change, delete snapshots/sf424_short_3_0.xml
    and re-run the test — it will create the file on first run.
    """

    def test_full_xml_matches_snapshot(self):
        """Generated XML for a comprehensive case must match the stored snapshot."""
        xml_data = _generate(_SNAPSHOT_DATA)

        if not _SNAPSHOT_PATH.exists():
            _SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
            _SNAPSHOT_PATH.write_text(xml_data)
            pytest.skip("Snapshot created — re-run to validate")

        assert xml_data == _SNAPSHOT_PATH.read_text()


class TestSF424ShortXSDValidation:
    """XSD validation tests for SF-424 Short form XML."""

    @pytest.fixture
    def xsd_validator(self):
        xsd_cache_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_cache_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds'.")
        xsd_path = xsd_cache_dir / "SF424_Short_3_0-V3.0.xsd"
        if not xsd_path.exists():
            pytest.skip(
                "SF424_Short_3_0-V3.0.xsd not found in cache. "
                "Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _extract_and_validate(self, xml_string: str, xsd_validator: XSDValidator) -> dict:
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        grant_ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=grant_ns)
        assert forms_element is not None, "Forms element not found in submission XML"

        form_ns = f"{{{NS}}}"
        elements = forms_element.findall(f".//{form_ns}SF424_Short_3_0")
        assert len(elements) == 1, f"Expected 1 SF424_Short_3_0 element, got {len(elements)}"

        form_xml = lxml_etree.tostring(elements[0], encoding="unicode")
        xsd_path = xsd_validator.xsd_dir / "SF424_Short_3_0-V3.0.xsd"
        return xsd_validator.validate_xml(form_xml, xsd_path)

    def _make_application(self, enable_factory_create, response: dict):
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
        assistance_listing = OpportunityAssistanceListingFactory.create(opportunity=opportunity)
        competition = CompetitionFactory.create(
            opportunity=opportunity,
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )
        application = ApplicationFactory.create(competition=competition)
        competition_form = CompetitionFormFactory.create(
            competition=competition, form=SF424Short_v3_0
        )
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response=response,
        )
        return application

    def test_minimal_valid_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(enable_factory_create, _MINIMAL_DATA)
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=55555551
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"

    def test_full_valid_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(enable_factory_create, _SNAPSHOT_DATA)
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=55555552
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"
