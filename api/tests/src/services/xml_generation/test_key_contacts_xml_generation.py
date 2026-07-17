"""Tests for Key Contacts form XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd
"""

from datetime import date
from pathlib import Path
from typing import Any

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.key_contacts import FORM_XML_TRANSFORM_RULES
from src.form_schema.forms.key_contacts import KeyContacts_v2_0
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

KC_NS = "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0"
GLOB_NS = "http://apply.grants.gov/system/GlobalLibrary-V2.0"

# --------------------------------------------------------------------------- #
# Shared test fixtures                                                          #
# --------------------------------------------------------------------------- #

_US_CONTACT = {
    "project_role": "Principal Investigator",
    "name": {
        "prefix": "Dr.",
        "first_name": "Jane",
        "middle_name": "A.",
        "last_name": "Smith",
        "suffix": "PhD",
    },
    "title": "Senior Researcher",
    "organizational_affiliation": "Acme Research Division",
    "address": {
        "street1": "123 Main Street",
        "street2": "Suite 400",
        "city": "Washington",
        "state": "DC: District of Columbia",
        "zip_code": "20001",
        "country": "USA: UNITED STATES",
    },
    "phone": "2025550100",
    "fax": "2025550199",
    "email": "jane.smith@acme.org",
}

_MINIMAL_CONTACT = {
    "project_role": "Project Manager",
    "name": {
        "first_name": "Joe",
        "last_name": "Smith",
    },
    "address": {
        "street1": "456 Oak Ave",
        "city": "Springfield",
        "state": "IL: Illinois",
        "zip_code": "62701",
        "country": "USA: UNITED STATES",
    },
    "phone": "5555550100",
    "email": "joe.smith@example.com",
}

_INTL_CONTACT = {
    "project_role": "International Collaborator",
    "name": {
        "first_name": "Marie",
        "last_name": "Curie",
    },
    "address": {
        "street1": "10 Rue de la Paix",
        "city": "Paris",
        "province": "Île-de-France",
        "country": "FRA: FRANCE",
    },
    "phone": "331234567890",
    "email": "m.curie@paris.fr",
}

# --------------------------------------------------------------------------- #
# Legacy standalone test (kept for backward compatibility)                      #
# --------------------------------------------------------------------------- #


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


# --------------------------------------------------------------------------- #
# String-based structural tests (fast, no DB)                                  #
# --------------------------------------------------------------------------- #


class TestKeyContactsXMLGeneration:
    """Unit tests for Key Contacts XML generation (no DB required)."""

    def _generate(self, data: dict) -> str:
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=data,
            transform_config=FORM_XML_TRANSFORM_RULES,
        )
        response = service.generate_xml(request)
        assert response.success is True, response.error_message
        return response.xml_data

    def test_root_element_and_form_version(self):
        xml = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        assert f'xmlns:Key_Contacts_2_0="{KC_NS}"' in xml
        assert 'FormVersion="2.0"' in xml
        assert "<Key_Contacts_2_0:Key_Contacts_2_0" in xml

    def test_applicant_organization_name(self):
        xml = self._generate(
            {
                "applicant_organization_name": "My University",
                "key_contacts": [_MINIMAL_CONTACT],
            }
        )

        assert "My University" in xml
        assert "ApplicantOrganizationName" in xml

    def test_single_contact_required_fields(self):
        xml = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        assert "Project Manager" in xml
        assert "Joe" in xml
        assert "Smith" in xml
        assert "456 Oak Ave" in xml
        assert "5555550100" in xml
        assert "joe.smith@example.com" in xml

    def test_optional_name_fields_included_when_present(self):
        xml = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_US_CONTACT]}
        )

        assert "PrefixName" in xml
        assert "Dr." in xml
        assert "MiddleName" in xml
        assert "A." in xml
        assert "SuffixName" in xml
        assert "PhD" in xml

    def test_optional_name_fields_omitted_when_absent(self):
        xml = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        assert "PrefixName" not in xml
        assert "MiddleName" not in xml
        assert "SuffixName" not in xml

    def test_optional_contact_fields_included_when_present(self):
        xml = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_US_CONTACT]}
        )

        assert "ContactTitle" in xml
        assert "Senior Researcher" in xml
        assert "ContactOrganizationalAffiliation" in xml
        assert "Acme Research Division" in xml
        assert "ContactFax" in xml
        assert "2025550199" in xml

    def test_optional_contact_fields_omitted_when_absent(self):
        xml = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        assert "ContactTitle" not in xml
        assert "ContactOrganizationalAffiliation" not in xml
        assert "ContactFax" not in xml

    def test_multiple_contacts_produce_multiple_role_elements(self):
        data = {
            "applicant_organization_name": "Test Org",
            "key_contacts": [_US_CONTACT, _MINIMAL_CONTACT, _INTL_CONTACT],
        }
        xml = self._generate(data)

        # open + close tags for 3 contacts
        assert xml.count("RoleOnProject>") == 6

    def test_international_address_uses_province_not_state(self):
        xml = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_INTL_CONTACT]}
        )

        assert "Province" in xml
        assert "Île-de-France" in xml
        assert "FRA: FRANCE" in xml
        assert "<globLib:State" not in xml

    def test_us_address_omits_province(self):
        xml = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        assert "<globLib:State" in xml
        assert "Province" not in xml

    def test_element_order_matches_xsd(self):
        """ApplicantOrganizationName must precede RoleOnProject in generated XML."""
        data = {
            "applicant_organization_name": "Test Org",
            "key_contacts": [_US_CONTACT, _INTL_CONTACT],
        }
        xml = self._generate(data)

        org_pos = xml.find("ApplicantOrganizationName")
        role_pos = xml.find("RoleOnProject")
        assert org_pos < role_pos


# --------------------------------------------------------------------------- #
# lxml-based parity tests (verify exact element/namespace structure)           #
# --------------------------------------------------------------------------- #


class TestKeyContactsLegacyParity:
    """Structural parity tests verifying the generated XML matches the legacy Grants.gov format.

    Legacy XML (from GrantApplication.xml downloaded from Grants.gov):

        <Key_Contacts_2_0:Key_Contacts_2_0
            xmlns:Key_Contacts_2_0="http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0"
            xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"
            Key_Contacts_2_0:FormVersion="2.0">
          <Key_Contacts_2_0:ApplicantOrganizationName>...</Key_Contacts_2_0:ApplicantOrganizationName>
          <Key_Contacts_2_0:RoleOnProject>
            <Key_Contacts_2_0:ContactProjectRole>...</Key_Contacts_2_0:ContactProjectRole>
            <Key_Contacts_2_0:ContactName>
              <globLib:FirstName>...</globLib:FirstName>
              <globLib:LastName>...</globLib:LastName>
            </Key_Contacts_2_0:ContactName>
            <Key_Contacts_2_0:ContactAddress>
              <globLib:Street1>...</globLib:Street1>
              <globLib:City>...</globLib:City>
              <globLib:Country>...</globLib:Country>
            </Key_Contacts_2_0:ContactAddress>
            <Key_Contacts_2_0:ContactPhone>...</Key_Contacts_2_0:ContactPhone>
            <Key_Contacts_2_0:ContactEmail>...</Key_Contacts_2_0:ContactEmail>
          </Key_Contacts_2_0:RoleOnProject>
        </Key_Contacts_2_0:Key_Contacts_2_0>
    """

    def _generate(self, data: dict[str, Any]) -> lxml_etree._Element:
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=data, transform_config=FORM_XML_TRANSFORM_RULES
        )
        response = service.generate_xml(request)
        assert response.success, f"XML generation failed: {response.error_message}"
        return lxml_etree.fromstring(response.xml_data.encode())

    def test_root_element_and_form_version(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        assert root.tag == f"{{{KC_NS}}}Key_Contacts_2_0"
        assert root.get(f"{{{KC_NS}}}FormVersion") == "2.0"

    def test_applicant_organization_name_element(self):
        root = self._generate(
            {"applicant_organization_name": "Example Corp", "key_contacts": [_MINIMAL_CONTACT]}
        )

        org_name = root.find(f"{{{KC_NS}}}ApplicantOrganizationName")
        assert org_name is not None
        assert org_name.text == "Example Corp"

    def test_role_on_project_in_form_namespace(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        roles = root.findall(f"{{{KC_NS}}}RoleOnProject")
        assert len(roles) == 1

    def test_contact_name_wrapper_in_form_namespace(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        role = root.find(f"{{{KC_NS}}}RoleOnProject")
        contact_name = role.find(f"{{{KC_NS}}}ContactName")
        assert contact_name is not None

    def test_name_sub_elements_use_glob_lib_namespace(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_US_CONTACT]}
        )

        contact_name = root.find(f".//{{{KC_NS}}}ContactName")
        assert contact_name.find(f"{{{GLOB_NS}}}PrefixName") is not None
        assert contact_name.find(f"{{{GLOB_NS}}}FirstName") is not None
        assert contact_name.find(f"{{{GLOB_NS}}}MiddleName") is not None
        assert contact_name.find(f"{{{GLOB_NS}}}LastName") is not None
        assert contact_name.find(f"{{{GLOB_NS}}}SuffixName") is not None

    def test_name_sub_elements_values(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_US_CONTACT]}
        )

        contact_name = root.find(f".//{{{KC_NS}}}ContactName")
        assert contact_name.find(f"{{{GLOB_NS}}}PrefixName").text == "Dr."
        assert contact_name.find(f"{{{GLOB_NS}}}FirstName").text == "Jane"
        assert contact_name.find(f"{{{GLOB_NS}}}MiddleName").text == "A."
        assert contact_name.find(f"{{{GLOB_NS}}}LastName").text == "Smith"
        assert contact_name.find(f"{{{GLOB_NS}}}SuffixName").text == "PhD"

    def test_optional_name_fields_absent_when_not_provided(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        contact_name = root.find(f".//{{{KC_NS}}}ContactName")
        assert contact_name.find(f"{{{GLOB_NS}}}PrefixName") is None
        assert contact_name.find(f"{{{GLOB_NS}}}MiddleName") is None
        assert contact_name.find(f"{{{GLOB_NS}}}SuffixName") is None

    def test_contact_address_in_form_namespace(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        role = root.find(f"{{{KC_NS}}}RoleOnProject")
        address = role.find(f"{{{KC_NS}}}ContactAddress")
        assert address is not None

    def test_address_sub_elements_use_glob_lib_namespace(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_US_CONTACT]}
        )

        address = root.find(f".//{{{KC_NS}}}ContactAddress")
        assert address.find(f"{{{GLOB_NS}}}Street1") is not None
        assert address.find(f"{{{GLOB_NS}}}Street2") is not None
        assert address.find(f"{{{GLOB_NS}}}City") is not None
        assert address.find(f"{{{GLOB_NS}}}State") is not None
        assert address.find(f"{{{GLOB_NS}}}ZipPostalCode") is not None
        assert address.find(f"{{{GLOB_NS}}}Country") is not None

    def test_us_address_has_state_not_province(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        address = root.find(f".//{{{KC_NS}}}ContactAddress")
        assert address.find(f"{{{GLOB_NS}}}State") is not None
        assert address.find(f"{{{GLOB_NS}}}Province") is None

    def test_international_address_has_province_not_state(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_INTL_CONTACT]}
        )

        address = root.find(f".//{{{KC_NS}}}ContactAddress")
        assert address.find(f"{{{GLOB_NS}}}Province") is not None
        assert address.find(f"{{{GLOB_NS}}}State") is None
        assert address.find(f"{{{GLOB_NS}}}ZipPostalCode") is None

    def test_contact_title_and_org_affiliation_present_when_provided(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_US_CONTACT]}
        )

        role = root.find(f"{{{KC_NS}}}RoleOnProject")
        title = role.find(f"{{{KC_NS}}}ContactTitle")
        assert title is not None
        assert title.text == "Senior Researcher"

        affiliation = role.find(f"{{{KC_NS}}}ContactOrganizationalAffiliation")
        assert affiliation is not None
        assert affiliation.text == "Acme Research Division"

    def test_contact_title_and_org_affiliation_absent_when_not_provided(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        role = root.find(f"{{{KC_NS}}}RoleOnProject")
        assert role.find(f"{{{KC_NS}}}ContactTitle") is None
        assert role.find(f"{{{KC_NS}}}ContactOrganizationalAffiliation") is None

    def test_fax_present_when_provided(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_US_CONTACT]}
        )

        role = root.find(f"{{{KC_NS}}}RoleOnProject")
        fax = role.find(f"{{{KC_NS}}}ContactFax")
        assert fax is not None
        assert fax.text == "2025550199"

    def test_fax_absent_when_not_provided(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        role = root.find(f"{{{KC_NS}}}RoleOnProject")
        assert role.find(f"{{{KC_NS}}}ContactFax") is None

    def test_multiple_contacts_count(self):
        data = {
            "applicant_organization_name": "Test Org",
            "key_contacts": [_US_CONTACT, _MINIMAL_CONTACT, _INTL_CONTACT],
        }
        root = self._generate(data)

        roles = root.findall(f"{{{KC_NS}}}RoleOnProject")
        assert len(roles) == 3

    def test_contacts_appear_in_order(self):
        data = {
            "applicant_organization_name": "Test Org",
            "key_contacts": [_US_CONTACT, _INTL_CONTACT],
        }
        root = self._generate(data)

        roles = root.findall(f"{{{KC_NS}}}RoleOnProject")
        assert roles[0].find(f"{{{KC_NS}}}ContactProjectRole").text == "Principal Investigator"
        assert roles[1].find(f"{{{KC_NS}}}ContactProjectRole").text == "International Collaborator"

    def test_contact_phone_and_email_in_form_namespace(self):
        root = self._generate(
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]}
        )

        role = root.find(f"{{{KC_NS}}}RoleOnProject")
        assert role.find(f"{{{KC_NS}}}ContactPhone") is not None
        assert role.find(f"{{{KC_NS}}}ContactEmail") is not None
        assert role.find(f"{{{KC_NS}}}ContactPhone").text == "5555550100"
        assert role.find(f"{{{KC_NS}}}ContactEmail").text == "joe.smith@example.com"


# --------------------------------------------------------------------------- #
# Snapshot regression test                                                      #
# --------------------------------------------------------------------------- #

_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "key_contacts_2_0.xml"

# Data used to generate the pinned snapshot. Must stay in sync with the file.
# To regenerate: make generate-xml form=Key_Contacts json='<json below>'
_SNAPSHOT_DATA = {
    "applicant_organization_name": "Acme Corporation",
    "key_contacts": [
        {
            "project_role": "Principal Investigator",
            "name": {"prefix": "Dr.", "first_name": "Jane", "last_name": "Smith"},
            "title": "Senior Researcher",
            "address": {
                "street1": "123 Main Street",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
                "country": "USA: UNITED STATES",
            },
            "phone": "2025550100",
            "email": "jane.smith@acme.org",
        }
    ],
}


class TestKeyContactsSnapshot:
    """Regression snapshot test pinning the full generated XML output.

    To regenerate after an intentional change, run:
        make generate-xml form=Key_Contacts json='{"applicant_organization_name":"Acme Corporation","key_contacts":[{"project_role":"Principal Investigator","name":{"prefix":"Dr.","first_name":"Jane","last_name":"Smith"},"title":"Senior Researcher","address":{"street1":"123 Main Street","city":"Washington","state":"DC: District of Columbia","zip_code":"20001","country":"USA: UNITED STATES"},"phone":"2025550100","email":"jane.smith@acme.org"}]}'
    and write the output to snapshots/key_contacts_2_0.xml.
    """

    def test_full_xml_matches_snapshot(self):
        """Generated XML for a single-contact case must match the stored snapshot."""
        response = XMLGenerationService().generate_xml(
            XMLGenerationRequest(
                application_data=_SNAPSHOT_DATA, transform_config=FORM_XML_TRANSFORM_RULES
            )
        )
        assert response.success, response.error_message

        expected = _SNAPSHOT_PATH.read_text()
        assert response.xml_data == expected


# --------------------------------------------------------------------------- #
# XSD validation tests (require seeded form registry + XSD cache)              #
# --------------------------------------------------------------------------- #


class TestKeyContactsXSDValidation:
    """XSD validation tests for Key Contacts form XML."""

    @pytest.fixture
    def xsd_validator(self):
        xsd_cache_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_cache_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds'.")
        xsd_path = xsd_cache_dir / "Key_Contacts_2_0-V2.0.xsd"
        if not xsd_path.exists():
            pytest.skip(
                "Key_Contacts_2_0-V2.0.xsd not found in cache. "
                "Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _extract_and_validate(self, xml_string: str, xsd_validator: XSDValidator) -> dict:
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        grant_ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=grant_ns)
        assert forms_element is not None, "Forms element not found in submission XML"

        form_ns = f"{{{KC_NS}}}"
        elements = forms_element.findall(f".//{form_ns}Key_Contacts_2_0")
        assert len(elements) == 1, f"Expected 1 Key_Contacts_2_0 element, got {len(elements)}"

        form_xml = lxml_etree.tostring(elements[0], encoding="unicode")
        xsd_path = xsd_validator.xsd_dir / "Key_Contacts_2_0-V2.0.xsd"
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
        form = KeyContacts_v2_0
        application = ApplicationFactory.create(competition=competition)
        competition_form = CompetitionFormFactory.create(competition=competition, form=form)
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response=response,
        )
        return application

    def test_single_us_contact_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            {"applicant_organization_name": "Test Org", "key_contacts": [_MINIMAL_CONTACT]},
        )
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=11111111
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"

    def test_full_contact_with_all_optional_fields_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            {"applicant_organization_name": "Acme Corp", "key_contacts": [_US_CONTACT]},
        )
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=22222222
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"

    def test_multiple_contacts_validate_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            {
                "applicant_organization_name": "Multi-Contact Org",
                "key_contacts": [_US_CONTACT, _MINIMAL_CONTACT, _INTL_CONTACT],
            },
        )
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=33333333
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"

    def test_international_contact_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            {"applicant_organization_name": "Global Org", "key_contacts": [_INTL_CONTACT]},
        )
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=44444444
        )
        assembler = SubmissionXMLAssembler(application, submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        result = self._extract_and_validate(xml_string, xsd_validator)
        assert result[
            "valid"
        ], f"XSD validation failed:\n{result['error_message']}\nXML:\n{xml_string[:3000]}"
