"""Test SF-424 and SF-LLL combined XML generation and comparison.

This test creates forms with data matching the Test-SFLLL.xml export,
generates XML, and compares the output to verify correctness.
Element ordering is not strictly enforced, but data, namespaces, and attributes must match.
"""

from datetime import date
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

import src.adapters.db as db
from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES as SF424_TRANSFORM_RULES
from src.form_schema.forms.sflll import FORM_XML_TRANSFORM_RULES as SFLLL_TRANSFORM_RULES
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.constants import Namespace
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)


def normalize_xml_element(element):
    """
    Recursively normalize an XML element for comparison.
    
    - Strips whitespace from text content
    - Sorts attributes by name
    - Recursively sorts child elements by tag name for consistent comparison
    
    Args:
        element: lxml Element to normalize
        
    Returns:
        Normalized element (modifies in place and returns)
    """
    # Normalize text content
    if element.text:
        element.text = element.text.strip() if element.text.strip() else None
    if element.tail:
        element.tail = element.tail.strip() if element.tail.strip() else None
    
    # Process children recursively
    for child in element:
        normalize_xml_element(child)
    
    return element


def xml_elements_equal(elem1, elem2, ignore_namespace_prefixes=True):
    """
    Compare two XML elements for equality, ignoring element order where appropriate.
    
    Args:
        elem1: First lxml Element
        elem2: Second lxml Element  
        ignore_namespace_prefixes: If True, only compare namespace URIs, not prefixes
        
    Returns:
        tuple: (bool: are_equal, str: difference_message)
    """
    # Compare tags (with optional namespace prefix ignoring)
    if ignore_namespace_prefixes:
        # Extract namespace and local name
        tag1 = lxml_etree.QName(elem1).localname if elem1.tag else elem1.tag
        tag2 = lxml_etree.QName(elem2).localname if elem2.tag else elem2.tag
        ns1 = lxml_etree.QName(elem1).namespace if elem1.tag else None
        ns2 = lxml_etree.QName(elem2).namespace if elem2.tag else None
        
        if tag1 != tag2:
            return False, f"Tag mismatch: {tag1} != {tag2}"
        if ns1 != ns2:
            return False, f"Namespace mismatch for {tag1}: {ns1} != {ns2}"
    else:
        if elem1.tag != elem2.tag:
            return False, f"Tag mismatch: {elem1.tag} != {elem2.tag}"
    
    # Compare text content (normalized)
    text1 = (elem1.text or "").strip()
    text2 = (elem2.text or "").strip()
    if text1 != text2:
        return False, f"Text mismatch in {elem1.tag}: '{text1}' != '{text2}'"
    
    # Compare attributes
    attrib1 = dict(elem1.attrib)
    attrib2 = dict(elem2.attrib)
    
    # When comparing attributes, also check namespace declarations
    if ignore_namespace_prefixes:
        # For namespace comparison, we compare the URIs not the prefixes
        # Remove xmlns declarations for comparison as prefixes may differ
        attrib1_filtered = {k: v for k, v in attrib1.items() if not k.startswith("{http://www.w3.org/2000/xmlns/}")}
        attrib2_filtered = {k: v for k, v in attrib2.items() if not k.startswith("{http://www.w3.org/2000/xmlns/}")}
        
        if attrib1_filtered != attrib2_filtered:
            return False, f"Attribute mismatch in {elem1.tag}: {attrib1_filtered} != {attrib2_filtered}"
    else:
        if attrib1 != attrib2:
            return False, f"Attribute mismatch in {elem1.tag}: {attrib1} != {attrib2}"
    
    # Compare children (order-independent for most cases)
    children1 = list(elem1)
    children2 = list(elem2)
    
    if len(children1) != len(children2):
        return False, f"Child count mismatch in {elem1.tag}: {len(children1)} != {len(children2)}"
    
    # For comparison, we try to match children by tag name
    # This allows for different ordering
    children1_by_tag = {}
    for child in children1:
        tag = lxml_etree.QName(child).localname if ignore_namespace_prefixes else child.tag
        if tag not in children1_by_tag:
            children1_by_tag[tag] = []
        children1_by_tag[tag].append(child)
    
    children2_by_tag = {}
    for child in children2:
        tag = lxml_etree.QName(child).localname if ignore_namespace_prefixes else child.tag
        if tag not in children2_by_tag:
            children2_by_tag[tag] = []
        children2_by_tag[tag].append(child)
    
    # Check that both have same tag types
    if set(children1_by_tag.keys()) != set(children2_by_tag.keys()):
        return False, f"Child tag mismatch in {elem1.tag}: {set(children1_by_tag.keys())} != {set(children2_by_tag.keys())}"
    
    # Now compare each group of children with same tag
    for tag, children_list1 in children1_by_tag.items():
        children_list2 = children2_by_tag[tag]
        
        if len(children_list1) != len(children_list2):
            return False, f"Child count for tag {tag} in {elem1.tag}: {len(children_list1)} != {len(children_list2)}"
        
        # For simplicity, compare in order (this assumes children with same tag maintain order)
        for child1, child2 in zip(children_list1, children_list2):
            equal, msg = xml_elements_equal(child1, child2, ignore_namespace_prefixes)
            if not equal:
                return False, msg
    
    return True, "Elements are equal"


@pytest.mark.xml_validation
class TestSF424SFLLLCombinedXML:
    """Test SF-424 and SF-LLL combined XML generation matching the Test-SFLLL.xml export."""

    @pytest.fixture
    def expected_xml_path(self):
        """Path to the expected SF-424 and SF-LLL combined XML file."""
        # Use path relative to this test file
        test_dir = Path(__file__).parent.parent.parent.parent
        return test_dir / "fixtures" / "xml" / "expected-sf424-sflll-combined.xml"

    @pytest.fixture
    def combined_application(self, enable_factory_create, db_session: db.Session):
        """Create an application with both SF-424 and SF-LLL forms matching Test-SFLLL.xml."""
        agency = AgencyFactory.create(agency_name="Simpler Grants.gov")

        opportunity = OpportunityFactory.create(
            opportunity_number="SIMP-LLL-01222026",
            opportunity_title="Testing LLL Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"  # Using a placeholder
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="SIMP-LLL-01222026",
            opening_date=date(2026, 1, 21),
            closing_date=date(2027, 1, 2),
            opportunity_assistance_listing=assistance_listing,
        )

        application = ApplicationFactory.create(
            competition=competition, application_name="My Test App"
        )

        # Create SF-424 form
        sf424_form = FormFactory.create(
            form_name="Application for Federal Assistance (SF-424)",
            short_form_name="SF424_4_0",
            form_version="4.0",
            json_to_xml_schema=SF424_TRANSFORM_RULES,
        )

        comp_form_424 = CompetitionFormFactory.create(competition=competition, form=sf424_form)
        
        # SF-424 data matching the Test-SFLLL.xml
        ApplicationFormFactory.create(
            application=application,
            competition_form=comp_form_424,
            application_response={
                "submission_type": "Application",
                "application_type": "New",
                "date_received": "2026-01-22",
                "applicant_id": "test",
                "federal_entity_identifier": "test",
                "organization_name": "test",
                "employer_taxpayer_identification_number": "001234567",
                "sam_uei": "00000000INDV",
                "applicant": {
                    "street1": "123 test st",
                    "city": "test",
                    "county": "test",
                    "state": "MD: Maryland",
                    "zip_code": "12345-1111",
                    "country": "USA: UNITED STATES",
                },
                "contact_person": {
                    "first_name": "test",
                    "last_name": "test",
                },
                "phone_number": "9012345678",
                "email": "test@example.com",
                "applicant_type_code": ["A: State Government"],
                "agency_name": "Simpler Grants.gov",
                "funding_opportunity_number": "SIMP-LLL-01222026",
                "funding_opportunity_title": "Testing LLL Opportunity",
                "project_title": "test",
                "congressional_district_applicant": "test",
                "congressional_district_program_project": "test",
                "project_start_date": "2026-01-20",
                "project_end_date": "2026-01-22",
                "federal_estimated_funding": "2.00",
                "applicant_estimated_funding": "2.00",
                "state_estimated_funding": "2.00",
                "local_estimated_funding": "2.00",
                "other_estimated_funding": "2.00",
                "program_income_estimated_funding": "2.00",
                "total_estimated_funding": "12.00",
                "state_review": "b. Program is subject to E.O. 12372 but has not been selected by the State for review.",
                "delinquent_federal_debt": False,
                "certification_agree": True,
                "authorized_representative": {
                    "first_name": "test",
                    "last_name": "test",
                },
                "authorized_representative_title": "test",
                "authorized_representative_phone_number": "4101231234",
                "authorized_representative_email": "test@example.com",
                "aor_signature": "Test User",
                "date_signed": "2026-01-22",
            },
        )

        # Create SF-LLL form
        sflll_form = FormFactory.create(
            form_name="Disclosure of Lobbying Activities (SF-LLL)",
            short_form_name="SFLLL_2_0",
            form_version="2.0",
            json_to_xml_schema=SFLLL_TRANSFORM_RULES,
        )

        comp_form_lll = CompetitionFormFactory.create(competition=competition, form=sflll_form)
        
        # SF-LLL data matching the Test-SFLLL.xml
        ApplicationFormFactory.create(
            application=application,
            competition_form=comp_form_lll,
            application_response={
                "federal_action_type": "Grant",
                "federal_action_status": "InitialAward",
                "report_type": "InitialFiling",
                "reporting_entity": {
                    "entity_type": "Prime",
                    "applicant_reporting_entity": {
                        "entity_type": "Prime",
                        "organization_name": "Name",
                        "address": {
                            "street1": "Street 1",
                            "street2": "street 2",
                            "city": "City",
                            "zip_code": "12345",
                        },
                    },
                },
                "federal_agency_department": "Test Agency",
                "federal_action_number": "1234",
                "award_amount": "4.00",
                "lobbying_registrant": {
                    "individual": {
                        "first_name": "Lobby",
                        "last_name": "Test",
                    },
                    "address": {
                        "street1": "123 Street",
                        "city": "City",
                    },
                },
                "individual_performing_service": {
                    "individual": {
                        "first_name": "Test",
                        "last_name": "Person",
                    },
                    "address": {
                        "street1": "123 Test St.",
                        "city": "City",
                    },
                },
                "signature_block": {
                    "name": {
                        "first_name": "SignName",
                        "last_name": "SignLast",
                    },
                    "signed_date": "2026-01-22",
                    "signature": "Test User",
                },
            },
        )

        return application

    def test_combined_sf424_sflll_xml_generation(
        self, combined_application, expected_xml_path, db_session
    ):
        """Test that generated SF-424 and SF-LLL XML matches the expected export structure."""
        # Verify expected file exists
        assert expected_xml_path.exists(), f"Expected XML file not found: {expected_xml_path}"

        # Create submission
        application_submission = ApplicationSubmissionFactory.create(
            application=combined_application,
            legacy_tracking_number=842161,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(combined_application, application_submission)
        generated_xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert generated_xml_string is not None
        assert len(generated_xml_string) > 0

        # Parse both XMLs
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        generated_root = lxml_etree.fromstring(generated_xml_string.encode("utf-8"), parser=parser)
        
        with open(expected_xml_path, "rb") as f:
            expected_root = lxml_etree.fromstring(f.read(), parser=parser)

        # Normalize both trees
        normalize_xml_element(generated_root)
        normalize_xml_element(expected_root)

        # Extract and compare the Forms section specifically
        # Forms element is a direct child, not namespaced in the same way
        grant_ns = "{http://apply.grants.gov/system/MetaGrantApplication}"
        generated_forms = generated_root.find(f".//grant:Forms", namespaces={'grant': 'http://apply.grants.gov/system/MetaGrantApplication'})
        if generated_forms is None:
            # Try without namespace prefix
            grant_ns = f"{{{Namespace.GRANT}}}"
            generated_forms = generated_root.find(f".//{grant_ns}Forms")
        
        expected_forms = expected_root.find(f".//grant:Forms", namespaces={'grant': 'http://apply.grants.gov/system/MetaGrantApplication'})
        if expected_forms is None:
            expected_forms = expected_root.find(f".//{grant_ns}Forms")

        assert generated_forms is not None, "Generated XML missing Forms element"
        assert expected_forms is not None, "Expected XML missing Forms element"

        # Compare SF-424 elements
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        generated_sf424 = generated_forms.find(f".//{sf424_ns}SF424_4_0")
        expected_sf424 = expected_forms.find(f".//{sf424_ns}SF424_4_0")

        assert generated_sf424 is not None, "Generated XML missing SF-424 form"
        assert expected_sf424 is not None, "Expected XML missing SF-424 form"

        # Compare SF-424 structure
        equal, msg = xml_elements_equal(generated_sf424, expected_sf424, ignore_namespace_prefixes=True)
        assert equal, f"SF-424 XML mismatch: {msg}\n\nGenerated SF-424:\n{lxml_etree.tostring(generated_sf424, encoding='unicode', pretty_print=True)[:2000]}\n\nExpected SF-424:\n{lxml_etree.tostring(expected_sf424, encoding='unicode', pretty_print=True)[:2000]}"

        # Compare SF-LLL elements
        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        generated_sflll = generated_forms.find(f".//{sflll_ns}LobbyingActivitiesDisclosure_2_0")
        expected_sflll = expected_forms.find(f".//{sflll_ns}LobbyingActivitiesDisclosure_2_0")

        assert generated_sflll is not None, "Generated XML missing SF-LLL form"
        assert expected_sflll is not None, "Expected XML missing SF-LLL form"

        # Compare SF-LLL structure
        equal, msg = xml_elements_equal(generated_sflll, expected_sflll, ignore_namespace_prefixes=True)
        assert equal, f"SF-LLL XML mismatch: {msg}\n\nGenerated SF-LLL:\n{lxml_etree.tostring(generated_sflll, encoding='unicode', pretty_print=True)[:2000]}\n\nExpected SF-LLL:\n{lxml_etree.tostring(expected_sflll, encoding='unicode', pretty_print=True)[:2000]}"

    def test_sf424_individual_form_xml_content(self, combined_application, db_session):
        """Test SF-424 form XML contains expected key elements and values."""
        application_submission = ApplicationSubmissionFactory.create(
            application=combined_application,
            legacy_tracking_number=77777777,
        )

        assembler = SubmissionXMLAssembler(combined_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract SF-424
        sf424_ns = "{http://apply.grants.gov/forms/SF424_4_0-V4.0}"
        sf424 = root.find(f".//{sf424_ns}SF424_4_0")
        assert sf424 is not None

        # Verify key fields
        assert sf424.find(f".//{sf424_ns}SubmissionType").text == "Application"
        assert sf424.find(f".//{sf424_ns}ApplicationType").text == "New"
        assert sf424.find(f".//{sf424_ns}OrganizationName").text == "test"
        assert sf424.find(f".//{sf424_ns}SAMUEI").text == "00000000INDV"
        assert sf424.find(f".//{sf424_ns}ProjectTitle").text == "test"
        
        # Verify funding amounts
        assert sf424.find(f".//{sf424_ns}FederalEstimatedFunding").text == "2.00"
        assert sf424.find(f".//{sf424_ns}TotalEstimatedFunding").text == "12.00"

    def test_sflll_individual_form_xml_content(self, combined_application, db_session):
        """Test SF-LLL form XML contains expected key elements and values."""
        application_submission = ApplicationSubmissionFactory.create(
            application=combined_application,
            legacy_tracking_number=88888888,
        )

        assembler = SubmissionXMLAssembler(combined_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract SF-LLL
        sflll_ns = "{http://apply.grants.gov/forms/SFLLL_2_0-V2.0}"
        sflll = root.find(f".//{sflll_ns}LobbyingActivitiesDisclosure_2_0")
        assert sflll is not None

        # Verify key fields
        assert sflll.find(f".//{sflll_ns}FederalActionType").text == "Grant"
        assert sflll.find(f".//{sflll_ns}FederalActionStatus").text == "InitialAward"
        assert sflll.find(f".//{sflll_ns}ReportType").text == "InitialFiling"
        
        # Verify reporting entity
        assert sflll.find(f".//{sflll_ns}OrganizationName").text == "Name"
        
        # Verify federal agency
        assert sflll.find(f".//{sflll_ns}FederalAgencyDepartment").text == "Test Agency"
        
        # Verify award amount
        assert sflll.find(f".//{sflll_ns}AwardAmount").text == "4.00"
