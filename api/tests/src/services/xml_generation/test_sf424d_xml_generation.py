"""Tests for SF-424D XML generation."""

from lxml import etree as lxml_etree

from src.form_schema.forms.sf424d import FORM_XML_TRANSFORM_RULES as SF424D_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


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
