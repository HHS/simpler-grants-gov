"""Tests for SF-424D XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424D-V1.1.xsd
"""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.sf424d import FORM_XML_TRANSFORM_RULES as SF424D_TRANSFORM_RULES
from src.form_schema.forms.sf424d import SF424d_v1_1
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


class TestSF424DXMLGeneration:
    """Test suite for SF-424D XML generation."""

    def test_generate_sf424d_xml_matches_legacy_format(self):
        """Test that generated XML matches legacy Grants.gov XML format exactly."""

        # Input data matching the legacy XML sample
        application_data = {
            "signature": "MH",
            "title": "M",
            "applicant_organization": "Org",
            "date_signed": "2026-02-07",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424D_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Parse the generated XML
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        # Define namespaces for XPath queries
        namespaces = {
            "SF424D": "http://apply.grants.gov/forms/SF424D-V1.1",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        }

        # Verify root element and attributes
        assert root.tag == "{http://apply.grants.gov/forms/SF424D-V1.1}Assurances"
        assert root.get("{http://apply.grants.gov/forms/SF424D-V1.1}programType") == "Construction"
        assert root.get("{http://apply.grants.gov/system/Global-V1.0}coreSchemaVersion") == "1.1"

        # Verify FormVersionIdentifier is present and is the first child element
        form_version = root.find("glob:FormVersionIdentifier", namespaces)
        assert form_version is not None, "FormVersionIdentifier element is missing"
        assert form_version.text == "1.1", "FormVersionIdentifier should be '1.1'"

        # Verify FormVersionIdentifier is the FIRST child element
        first_child = next(iter(root))
        assert (
            first_child.tag == "{http://apply.grants.gov/system/Global-V1.0}FormVersionIdentifier"
        ), "FormVersionIdentifier must be the first child element per XSD"

        # Verify AuthorizedRepresentative structure
        auth_rep = root.find("SF424D:AuthorizedRepresentative", namespaces)
        assert auth_rep is not None, "AuthorizedRepresentative element should exist"

        rep_name = auth_rep.find("SF424D:RepresentativeName", namespaces)
        assert rep_name is not None, "RepresentativeName should exist"
        assert rep_name.text == "MH", "RepresentativeName should match input exactly"

        rep_title = auth_rep.find("SF424D:RepresentativeTitle", namespaces)
        assert rep_title is not None, "RepresentativeTitle should exist"
        assert rep_title.text == "M", "RepresentativeTitle should match input"

        # Verify ApplicantOrganizationName
        org_name = root.find("SF424D:ApplicantOrganizationName", namespaces)
        assert org_name is not None, "ApplicantOrganizationName should exist"
        assert org_name.text == "Org", "ApplicantOrganizationName should match input"

        # Verify SubmittedDate
        submitted_date = root.find("SF424D:SubmittedDate", namespaces)
        assert submitted_date is not None, "SubmittedDate should exist"
        assert submitted_date.text == "2026-02-07", "SubmittedDate should match input"

        # Verify element order (critical for XSD compliance)
        children = list(root)
        child_tags = [child.tag for child in children]

        # Expected order per XSD schema
        expected_order = [
            "{http://apply.grants.gov/system/Global-V1.0}FormVersionIdentifier",
            "{http://apply.grants.gov/forms/SF424D-V1.1}AuthorizedRepresentative",
            "{http://apply.grants.gov/forms/SF424D-V1.1}ApplicantOrganizationName",
            "{http://apply.grants.gov/forms/SF424D-V1.1}SubmittedDate",
        ]

        assert child_tags == expected_order, (
            f"Element order should match XSD schema. "
            f"Expected: {expected_order}, Got: {child_tags}"
        )

        # Verify the generated XML contains the expected structure (string comparison)
        assert "<glob:FormVersionIdentifier>1.1</glob:FormVersionIdentifier>" in xml_data
        assert "<SF424D:AuthorizedRepresentative>" in xml_data
        assert "<SF424D:RepresentativeName>MH</SF424D:RepresentativeName>" in xml_data
        assert "<SF424D:RepresentativeTitle>M</SF424D:RepresentativeTitle>" in xml_data
        assert "</SF424D:AuthorizedRepresentative>" in xml_data
        assert (
            "<SF424D:ApplicantOrganizationName>Org</SF424D:ApplicantOrganizationName>" in xml_data
        )
        assert "<SF424D:SubmittedDate>2026-02-07</SF424D:SubmittedDate>" in xml_data

    def test_generate_sf424d_xml_namespaces_match_legacy(self):
        """Test that generated XML includes all namespace declarations matching legacy format.

        Legacy Grants.gov XML includes specific namespace declarations that must be present
        for proper XSD validation and submission compatibility.
        """
        application_data = {
            "signature": "MH",
            "title": "M",
            "applicant_organization": "Org",
            "date_signed": "2026-02-07",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424D_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify all required namespace declarations are present
        required_namespaces = {
            'xmlns:SF424D="http://apply.grants.gov/forms/SF424D-V1.1"',
            'xmlns:att="http://apply.grants.gov/system/Attachments-V1.0"',
            'xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"',
            'xmlns:glob="http://apply.grants.gov/system/Global-V1.0"',
        }

        for namespace_decl in required_namespaces:
            assert namespace_decl in xml_data, (
                f"Missing namespace declaration: {namespace_decl}\n"
                f"Generated XML root element:\n{xml_data[:500]}"
            )

        # Verify namespace prefixes are used correctly in attributes
        assert 'SF424D:programType="Construction"' in xml_data
        assert 'glob:coreSchemaVersion="1.1"' in xml_data

        # Parse XML to verify namespace declarations are valid
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        # Verify namespace map includes all expected namespaces
        nsmap = root.nsmap
        assert nsmap.get("SF424D") == "http://apply.grants.gov/forms/SF424D-V1.1"
        assert nsmap.get("att") == "http://apply.grants.gov/system/Attachments-V1.0"
        assert nsmap.get("globLib") == "http://apply.grants.gov/system/GlobalLibrary-V2.0"
        assert nsmap.get("glob") == "http://apply.grants.gov/system/Global-V1.0"

    def test_generate_sf424d_xml_with_only_title(self):
        """Test SF-424D XML generation with only title field (no signature)."""
        application_data = {
            "title": "Director",
            "applicant_organization": "Test Organization",
            "date_signed": "2026-02-07",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424D_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Parse the generated XML
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        namespaces = {
            "SF424D": "http://apply.grants.gov/forms/SF424D-V1.1",
        }

        # AuthorizedRepresentative should be present with only RepresentativeTitle
        # (compose_object includes element if any field is present)
        auth_rep = root.find("SF424D:AuthorizedRepresentative", namespaces)
        assert auth_rep is not None, "AuthorizedRepresentative should exist with title"

        # RepresentativeName should not be present (no signature provided)
        rep_name = auth_rep.find("SF424D:RepresentativeName", namespaces)
        assert rep_name is None, "RepresentativeName should not exist without signature"

        # RepresentativeTitle should be present
        rep_title = auth_rep.find("SF424D:RepresentativeTitle", namespaces)
        assert rep_title is not None, "RepresentativeTitle should exist"
        assert rep_title.text == "Director"

        # Other fields should still be present
        org_name = root.find("SF424D:ApplicantOrganizationName", namespaces)
        assert org_name is not None
        assert org_name.text == "Test Organization"

        submitted_date = root.find("SF424D:SubmittedDate", namespaces)
        assert submitted_date is not None
        assert submitted_date.text == "2026-02-07"

    def test_generate_sf424d_xml_with_only_signature(self):
        """Test SF-424D XML generation with only signature field (no title)."""
        application_data = {
            "signature": "Alice Johnson",
            "applicant_organization": "Research Institute",
            "date_signed": "2026-04-15",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424D_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        root = lxml_etree.fromstring(response.xml_data.encode("utf-8"))

        namespaces = {
            "SF424D": "http://apply.grants.gov/forms/SF424D-V1.1",
        }

        # AuthorizedRepresentative should be present with only RepresentativeName
        auth_rep = root.find("SF424D:AuthorizedRepresentative", namespaces)
        assert auth_rep is not None, "AuthorizedRepresentative should exist with signature"

        rep_name = auth_rep.find("SF424D:RepresentativeName", namespaces)
        assert rep_name is not None, "RepresentativeName should exist"
        assert rep_name.text == "Alice Johnson"

        # RepresentativeTitle should not be present (no title provided)
        rep_title = auth_rep.find("SF424D:RepresentativeTitle", namespaces)
        assert rep_title is None, "RepresentativeTitle should not exist without title"

        org_name = root.find("SF424D:ApplicantOrganizationName", namespaces)
        assert org_name is not None
        assert org_name.text == "Research Institute"

        submitted_date = root.find("SF424D:SubmittedDate", namespaces)
        assert submitted_date is not None
        assert submitted_date.text == "2026-04-15"

    def test_generate_sf424d_xml_without_signature_or_title(self):
        """Test that AuthorizedRepresentative is omitted when both signature and title are absent.

        compose_object returns None when none of its mapped fields are present, so the
        wrapper element should be excluded entirely rather than emitted empty.
        """
        application_data = {
            "applicant_organization": "Test Organization",
            "date_signed": "2026-02-07",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424D_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        namespaces = {
            "SF424D": "http://apply.grants.gov/forms/SF424D-V1.1",
        }

        assert root.find("SF424D:AuthorizedRepresentative", namespaces) is None
        assert "AuthorizedRepresentative" not in xml_data

        # Remaining elements are still emitted in XSD order
        child_tags = [child.tag for child in root]
        assert child_tags == [
            "{http://apply.grants.gov/system/Global-V1.0}FormVersionIdentifier",
            "{http://apply.grants.gov/forms/SF424D-V1.1}ApplicantOrganizationName",
            "{http://apply.grants.gov/forms/SF424D-V1.1}SubmittedDate",
        ]

    def test_generate_sf424d_xml_without_date_signed(self):
        """Test that SubmittedDate is excluded when date_signed is absent."""
        application_data = {
            "signature": "MH",
            "title": "M",
            "applicant_organization": "Org",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424D_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))

        namespaces = {
            "SF424D": "http://apply.grants.gov/forms/SF424D-V1.1",
        }

        assert root.find("SF424D:SubmittedDate", namespaces) is None
        assert "SubmittedDate" not in xml_data


class TestSF424DXSDValidation:
    """XSD validation tests for SF-424D form XML."""

    SF424D_XSD_URL = "https://apply07.grants.gov/apply/forms/schemas/SF424D-V1.1.xsd"
    SF424D_NS = "{http://apply.grants.gov/forms/SF424D-V1.1}"
    GRANT_NS = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with directory."""
        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds' to download schemas.")
        sf424d_xsd_path = xsd_dir / "SF424D-V1.1.xsd"
        if not sf424d_xsd_path.exists():
            pytest.skip(
                "SF424D-V1.1.xsd not found. Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_dir / xsd_filename

    def _create_sf424d_application(self, suffix: str, application_response: dict):
        """Create an application containing an SF-424D form with the given response."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number=f"TEST-SF424D-{suffix}",
            opportunity_title=f"SF-424D Test Opportunity {suffix}",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="11.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id=f"TEST-SF424D-COMP-{suffix}",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        application = ApplicationFactory.create(
            competition=competition, application_name=f"SF-424D Test Application {suffix}"
        )

        competition_form = CompetitionFormFactory.create(competition=competition, form=SF424d_v1_1)

        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response=application_response,
        )

        return application

    def _extract_sf424d_xml(self, application, legacy_tracking_number: int) -> str:
        """Generate the full submission XML and return just the SF-424D Assurances element."""
        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=legacy_tracking_number,
        )

        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None
        assert len(xml_string) > 0

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        forms_element = root.find(".//grant:Forms", namespaces=self.GRANT_NS)
        assert forms_element is not None, "Forms element not found in submission XML"

        sf424d_elements = forms_element.findall(f".//{self.SF424D_NS}Assurances")
        assert len(sf424d_elements) == 1, "Expected exactly one SF424D Assurances element"

        return lxml_etree.tostring(sf424d_elements[0], encoding="unicode")

    def test_sf424d_submission_xml_validates_against_xsd(
        self, enable_factory_create, seed_form_registry, xsd_validator
    ):
        """Test that complete SF-424D submission XML validates against XSD schema."""
        application = self._create_sf424d_application(
            "001",
            {
                "signature": "Emily R. Chen, PhD",
                "title": "Principal Investigator",
                "applicant_organization": "National Construction Foundation",
                "date_signed": "2025-01-15",
            },
        )

        sf424d_xml = self._extract_sf424d_xml(application, legacy_tracking_number=77777777)

        xsd_path = self._get_xsd_file_path(xsd_validator, self.SF424D_XSD_URL)
        validation_result = xsd_validator.validate_xml(sf424d_xml, xsd_path)

        assert validation_result["valid"], (
            f"SF-424D XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{sf424d_xml[:2000]}"
        )

    def test_sf424d_minimal_data_validates_against_xsd(
        self, enable_factory_create, seed_form_registry, xsd_validator
    ):
        """Test that SF-424D with minimal required data validates against XSD."""
        # Minimal data - only fields required by the form JSON schema (all XSD elements are optional)
        application = self._create_sf424d_application(
            "MIN-001",
            {
                "applicant_organization": "Minimal Test Org",
                "title": "Director",
            },
        )

        sf424d_xml = self._extract_sf424d_xml(application, legacy_tracking_number=88888888)

        xsd_path = self._get_xsd_file_path(xsd_validator, self.SF424D_XSD_URL)
        validation_result = xsd_validator.validate_xml(sf424d_xml, xsd_path)

        assert validation_result["valid"], (
            f"SF-424D minimal validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{sf424d_xml}"
        )

    def _generate_and_validate(self, xsd_validator: XSDValidator, application_data: dict):
        """Generate SF-424D XML directly from form data and validate it against the XSD."""
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=SF424D_TRANSFORM_RULES
        )
        response = service.generate_xml(request)
        assert response.success is True

        xsd_path = self._get_xsd_file_path(xsd_validator, self.SF424D_XSD_URL)
        return response.xml_data, xsd_validator.validate_xml(response.xml_data, xsd_path)

    # XSD maxLength for each field: SignatureDataType (144), HumanTitleDataType (45),
    # OrganizationNameDataType (60) in GlobalLibrary-V2.0
    MAX_LENGTHS = {
        "signature": 144,
        "title": 45,
        "applicant_organization": 60,
    }

    @pytest.mark.parametrize("field,max_length", MAX_LENGTHS.items())
    def test_sf424d_field_at_max_length_validates_against_xsd(
        self, xsd_validator, field, max_length
    ):
        """A value at exactly the XSD maximum length is accepted."""
        application_data = {
            "signature": "MH",
            "title": "M",
            "applicant_organization": "Org",
            "date_signed": "2026-02-07",
        } | {field: "a" * max_length}

        xml_data, validation_result = self._generate_and_validate(xsd_validator, application_data)

        assert validation_result["valid"], (
            f"SF-424D {field} at max length {max_length} failed XSD validation:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{xml_data}"
        )

    @pytest.mark.parametrize("field,max_length", MAX_LENGTHS.items())
    def test_sf424d_field_over_max_length_fails_xsd(self, xsd_validator, field, max_length):
        """A value one character over the XSD maximum length is rejected.

        XML generation does not enforce lengths itself (JSON schema validation does
        that upstream), so this confirms the XSD acts as a backstop.
        """
        application_data = {
            "signature": "MH",
            "title": "M",
            "applicant_organization": "Org",
            "date_signed": "2026-02-07",
        } | {field: "a" * (max_length + 1)}

        _, validation_result = self._generate_and_validate(xsd_validator, application_data)

        assert validation_result["valid"] is False
        assert "length" in validation_result["error_message"].lower()

    def test_sf424d_invalid_date_fails_xsd(self, xsd_validator):
        """A non-date SubmittedDate passes through generation but is rejected by the XSD."""
        application_data = {
            "signature": "MH",
            "title": "M",
            "applicant_organization": "Org",
            "date_signed": "not-a-date",
        }

        _, validation_result = self._generate_and_validate(xsd_validator, application_data)

        assert validation_result["valid"] is False
        assert "SubmittedDate" in validation_result["error_message"]

    def test_sf424d_xml_escaping(self, xsd_validator):
        """Characters requiring XML escaping are serialized correctly and still validate."""
        application_data = {
            "signature": "O'Brien & Sons",
            "title": 'VP "R&D"',
            "applicant_organization": "Smith & Co <Construction>",
            "date_signed": "2026-02-07",
        }

        xml_data, validation_result = self._generate_and_validate(xsd_validator, application_data)

        # Raw XML contains escaped entities, never the bare characters inside text
        assert "Smith &amp; Co &lt;Construction&gt;" in xml_data
        assert "<Construction>" not in xml_data
        # Guard against double-escaping
        assert "&amp;amp;" not in xml_data

        # Parsed values round-trip to the original input
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        namespaces = {"SF424D": "http://apply.grants.gov/forms/SF424D-V1.1"}
        assert (
            root.find("SF424D:AuthorizedRepresentative/SF424D:RepresentativeName", namespaces).text
            == "O'Brien & Sons"
        )
        assert (
            root.find("SF424D:AuthorizedRepresentative/SF424D:RepresentativeTitle", namespaces).text
            == 'VP "R&D"'
        )
        assert (
            root.find("SF424D:ApplicantOrganizationName", namespaces).text
            == "Smith & Co <Construction>"
        )

        assert validation_result["valid"], (
            f"SF-424D escaped XML failed XSD validation:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{xml_data}"
        )
