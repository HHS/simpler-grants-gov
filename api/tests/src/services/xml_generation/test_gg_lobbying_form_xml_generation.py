"""Tests for GG_LobbyingForm XML generation.

This module tests the XML generation for the Grants.gov Lobbying Form (GG_LobbyingForm),
ensuring that the generated XML matches the legacy Grants.gov XML output format.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd
"""

from datetime import date
from pathlib import Path
from typing import Any

import freezegun
import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.gg_lobbying_form import (
    FORM_XML_TRANSFORM_RULES as GG_LOBBYING_FORM_TRANSFORM_RULES,
)
from src.form_schema.forms.gg_lobbying_form import GG_LobbyingForm_v1_1
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.validation.xsd_validator import XSDValidator
from tests.lib.data_factories import setup_application_for_form_validation
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

XSD_PATH = Path(__file__).parents[4] / "src/services/xml_generation/xsds/GG_LobbyingForm-V1.1.xsd"

NS = {
    "GG": "http://apply.grants.gov/forms/GG_LobbyingForm-V1.1",
    "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}

# HumanNameDataType sequence in GlobalLibrary-V2.0
NAME_ELEMENTS = {
    "prefix": "PrefixName",
    "first_name": "FirstName",
    "middle_name": "MiddleName",
    "last_name": "LastName",
    "suffix": "SuffixName",
}

# Only what the JSON schema requires; signature and date are filled in on submit
SCHEMA_MINIMAL_DATA = {
    "organization_name": "Minimal Test Org",
    "authorized_representative_name": {"first_name": "John", "last_name": "Doe"},
    "authorized_representative_title": "Director",
}

# maxLength of each field. The JSON schema and the GlobalLibrary/XSD types use the same
# limits, so a value the form accepts also fits in the XML.
MAX_LENGTHS = {
    "organization_name": ("ApplicantName", 60),
    "authorized_representative_title": ("AuthorizedRepresentativeTitle", 45),
    "authorized_representative_signature": ("AuthorizedRepresentativeSignature", 144),
    "authorized_representative_name.prefix": ("PrefixName", 10),
    "authorized_representative_name.first_name": ("FirstName", 35),
    "authorized_representative_name.middle_name": ("MiddleName", 25),
    "authorized_representative_name.last_name": ("LastName", 60),
    "authorized_representative_name.suffix": ("SuffixName", 10),
}

FULL_DATA = {
    "organization_name": "National Research Foundation",
    "authorized_representative_name": {
        "prefix": "Dr.",
        "first_name": "Emily",
        "middle_name": "Rose",
        "last_name": "Chen",
        "suffix": "PhD",
    },
    "authorized_representative_title": "Principal Investigator",
    "authorized_representative_signature": "Emily R. Chen, PhD",
    "submitted_date": "2025-01-15",
}


def _generate(application_data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )
    )
    assert response.success is True, response.error_message
    return response.xml_data


def _root(xml_data: str) -> lxml_etree._Element:
    return lxml_etree.fromstring(xml_data.encode("utf-8"))


def _local_names(element: lxml_etree._Element) -> list[str]:
    return [lxml_etree.QName(child).localname for child in element]


def _xsd_sequence() -> list[str]:
    """Element names, in order, of the LobbyingForm sequence in the XSD."""
    xsd = lxml_etree.parse(str(XSD_PATH))
    xs = {"xs": "http://www.w3.org/2001/XMLSchema"}
    return [
        element.get("name")
        for element in xsd.findall(
            "xs:element[@name='LobbyingForm']/xs:complexType/xs:sequence/xs:element", xs
        )
    ]


_DROP = object()


def _with(data: dict, field: str, value: Any) -> dict:
    """Copy of the data with a (dotted) field set to value, or left out for _DROP."""
    data = {key: dict(item) if isinstance(item, dict) else item for key, item in data.items()}
    *parents, name = field.split(".")
    target = data
    for parent in parents:
        target = target[parent]
    if value is _DROP:
        del target[name]
    else:
        target[name] = value
    return data


def _without(data: dict, field: str, as_none: bool) -> dict:
    """Copy of the data with a (dotted) field left out, or set to None."""
    return _with(data, field, None if as_none else _DROP)


def _form_xml_from_submission(application_response: dict) -> str:
    """The LobbyingForm element from a full submission XML built with the real form."""
    competition = CompetitionFactory.create(
        opportunity=OpportunityFactory.create(), competition_forms=[]
    )
    application = ApplicationFactory.create(competition=competition)
    ApplicationFormFactory.create(
        application=application,
        competition_form=CompetitionFormFactory.create(
            competition=competition, form=GG_LobbyingForm_v1_1
        ),
        application_response=application_response,
    )
    submission = ApplicationSubmissionFactory.create(
        application=application, legacy_tracking_number=12477124
    )

    xml_string = SubmissionXMLAssembler(application, submission).generate_complete_submission_xml()

    forms = lxml_etree.fromstring(xml_string.encode("utf-8")).find(
        ".//{http://apply.grants.gov/system/MetaGrantApplication}Forms"
    )
    form_elements = forms.findall(f"{{{NS['GG']}}}LobbyingForm")
    assert len(form_elements) == 1
    return lxml_etree.tostring(form_elements[0], encoding="unicode")


class TestGGLobbyingFormXMLGeneration:
    """Test cases for GG_LobbyingForm XML generation service."""

    def test_generate_gg_lobbying_form_xml_basic_success(self):
        """Test basic GG_LobbyingForm XML generation with minimal required data."""
        # Minimal GG_LobbyingForm data matching the XSD requirements
        application_data = {
            "organization_name": "Test Research Organization",
            "authorized_representative_name": {
                "first_name": "John",
                "last_name": "Smith",
            },
            "authorized_representative_title": "Principal Investigator",
            "authorized_representative_signature": "John Smith",
            "submitted_date": "2025-01-15",
        }

        # Create service and request
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        # Verify response
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        root = _root(response.xml_data)
        assert root.tag == f"{{{NS['GG']}}}LobbyingForm"
        assert _local_names(root) == _xsd_sequence()
        assert root.findtext("GG:ApplicantName", namespaces=NS) == "Test Research Organization"
        assert (
            root.findtext("GG:AuthorizedRepresentativeTitle", namespaces=NS)
            == "Principal Investigator"
        )
        assert root.findtext("GG:AuthorizedRepresentativeSignature", namespaces=NS) == "John Smith"
        assert root.findtext("GG:SubmittedDate", namespaces=NS) == "2025-01-15"

        name = root.find("GG:AuthorizedRepresentativeName", NS)
        assert _local_names(name) == ["FirstName", "LastName"]
        assert name.findtext("globLib:FirstName", namespaces=NS) == "John"
        assert name.findtext("globLib:LastName", namespaces=NS) == "Smith"

    def test_generate_gg_lobbying_form_xml_with_full_name(self):
        """Test GG_LobbyingForm XML generation with full name including prefix/suffix."""
        application_data = {
            "organization_name": "National Institute of Science",
            "authorized_representative_name": {
                "prefix": "Dr.",
                "first_name": "Robert",
                "middle_name": "James",
                "last_name": "Williams",
                "suffix": "Jr.",
            },
            "authorized_representative_title": "Senior Scientist",
            "authorized_representative_signature": "Robert J. Williams Jr.",
            "submitted_date": "2025-03-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        name = _root(response.xml_data).find("GG:AuthorizedRepresentativeName", NS)

        # Each name part sits directly under AuthorizedRepresentativeName, in the
        # GlobalLibrary namespace
        assert [(child.tag, child.text) for child in name] == [
            (f"{{{NS['globLib']}}}PrefixName", "Dr."),
            (f"{{{NS['globLib']}}}FirstName", "Robert"),
            (f"{{{NS['globLib']}}}MiddleName", "James"),
            (f"{{{NS['globLib']}}}LastName", "Williams"),
            (f"{{{NS['globLib']}}}SuffixName", "Jr."),
        ]

    def test_generate_gg_lobbying_form_xml_namespace_and_version(self):
        """Test that GG_LobbyingForm XML includes proper namespace and version attribute."""
        application_data = {
            "organization_name": "Test Organization",
            "authorized_representative_name": {
                "first_name": "Test",
                "last_name": "User",
            },
            "authorized_representative_title": "Director",
            "authorized_representative_signature": "Test User",
            "submitted_date": "2025-01-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        root = _root(response.xml_data)

        assert root.nsmap["GG_LobbyingForm"] == NS["GG"]
        assert root.nsmap["globLib"] == NS["globLib"]
        # The XSD sets attributeFormDefault="qualified", so FormVersion has to be in the
        # form namespace; a plain FormVersion attribute would fail validation
        assert root.attrib == {f"{{{NS['GG']}}}FormVersion": "1.1"}

    def test_generate_gg_lobbying_form_xml_element_order_matches_xsd(self):
        """Test that XML elements are in the correct order per XSD sequence."""
        application_data = {
            "organization_name": "Test Organization",
            "authorized_representative_name": {
                "prefix": "Dr.",
                "first_name": "Test",
                "middle_name": "M",
                "last_name": "User",
                "suffix": "PhD",
            },
            "authorized_representative_title": "Director",
            "authorized_representative_signature": "Test User",
            "submitted_date": "2025-01-01",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=GG_LOBBYING_FORM_TRANSFORM_RULES,
        )

        response = service.generate_xml(request)

        assert response.success is True
        root = _root(response.xml_data)

        # Parsed rather than found by position, so a missing element can't pass
        assert _local_names(root) == _xsd_sequence()
        name = root.find("GG:AuthorizedRepresentativeName", NS)
        assert _local_names(name) == list(NAME_ELEMENTS.values())

    def test_schema_minimal_data_writes_only_required_elements(self):
        """With only the 3 schema-required fields, signature, date and the optional name
        parts are left out of the XML entirely."""
        root = _root(_generate(SCHEMA_MINIMAL_DATA))

        assert _local_names(root) == [
            "ApplicantName",
            "AuthorizedRepresentativeName",
            "AuthorizedRepresentativeTitle",
        ]
        assert root.findtext("GG:ApplicantName", namespaces=NS) == "Minimal Test Org"
        assert root.findtext("GG:AuthorizedRepresentativeTitle", namespaces=NS) == "Director"

        name = root.find("GG:AuthorizedRepresentativeName", NS)
        assert _local_names(name) == ["FirstName", "LastName"]
        assert name.findtext("globLib:FirstName", namespaces=NS) == "John"
        assert name.findtext("globLib:LastName", namespaces=NS) == "Doe"

    @pytest.mark.parametrize("as_none", [False, True], ids=["missing", "null"])
    @pytest.mark.parametrize(
        "field,element",
        [
            ("authorized_representative_signature", "AuthorizedRepresentativeSignature"),
            ("submitted_date", "SubmittedDate"),
        ],
    )
    def test_omitted_optional_field_is_excluded(self, field, element, as_none):
        root = _root(_generate(_without(FULL_DATA, field, as_none)))

        assert _local_names(root) == [name for name in _xsd_sequence() if name != element]

    @pytest.mark.parametrize("as_none", [False, True], ids=["missing", "null"])
    @pytest.mark.parametrize("name_part", ["prefix", "middle_name", "suffix"])
    def test_omitted_optional_name_part_is_excluded(self, name_part, as_none):
        data = _without(FULL_DATA, f"authorized_representative_name.{name_part}", as_none)

        name = _root(_generate(data)).find("GG:AuthorizedRepresentativeName", NS)

        assert _local_names(name) == [
            element for part, element in NAME_ELEMENTS.items() if part != name_part
        ]


class TestGGLobbyingFormXSDValidation:
    """XSD validation tests for GG_LobbyingForm XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with directory."""
        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds' to download schemas.")
        # Check if GG_LobbyingForm XSD exists
        gg_lobbying_form_xsd_path = xsd_dir / "GG_LobbyingForm-V1.1.xsd"
        if not gg_lobbying_form_xsd_path.exists():
            pytest.skip(
                "GG_LobbyingForm-V1.1.xsd not found. Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_dir)

    def _get_xsd_file_path(self, xsd_validator: XSDValidator, xsd_url: str):
        """Convert XSD URL to file path."""
        xsd_filename = xsd_url.split("/")[-1]
        return xsd_validator.xsd_dir / xsd_filename

    @pytest.fixture
    def gg_lobbying_form_application(self, enable_factory_create, seed_form_registry):
        """Create an application with GG_LobbyingForm form and realistic data."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-GG-LOBBYING-001",
            opportunity_title="GG_LobbyingForm Test Opportunity",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.001"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-GG-LOBBYING-COMP-001",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        gg_lobbying_form = GG_LobbyingForm_v1_1

        application = ApplicationFactory.create(
            competition=competition, application_name="GG_LobbyingForm Test Application"
        )

        # Create competition form
        competition_form = CompetitionFormFactory.create(
            competition=competition, form=gg_lobbying_form
        )

        # Create application form with XSD-compliant data
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "organization_name": "National Research Foundation",
                "authorized_representative_name": {
                    "prefix": "Dr.",
                    "first_name": "Emily",
                    "middle_name": "Rose",
                    "last_name": "Chen",
                    "suffix": "PhD",
                },
                "authorized_representative_title": "Principal Investigator",
                "authorized_representative_signature": "Emily R. Chen, PhD",
                "submitted_date": "2025-01-15",
            },
        )

        return application

    def test_gg_lobbying_form_submission_xml_validates_against_xsd(
        self, gg_lobbying_form_application, xsd_validator
    ):
        """Test that complete GG_LobbyingForm submission XML validates against XSD schema."""
        # Create application submission
        application_submission = ApplicationSubmissionFactory.create(
            application=gg_lobbying_form_application,
            legacy_tracking_number=99999999,
        )

        # Generate complete submission XML
        assembler = SubmissionXMLAssembler(gg_lobbying_form_application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        # Verify XML was generated
        assert xml_string is not None
        assert len(xml_string) > 0

        # Parse complete XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        # Extract GG_LobbyingForm form element
        gg_lobbying_ns = "{http://apply.grants.gov/forms/GG_LobbyingForm-V1.1}"
        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        assert forms_element is not None, "Forms element not found in submission XML"

        gg_lobbying_elements = forms_element.findall(f".//{gg_lobbying_ns}LobbyingForm")
        assert len(gg_lobbying_elements) == 1, "Expected exactly one LobbyingForm element"

        # Validate GG_LobbyingForm form against XSD
        gg_lobbying_element = gg_lobbying_elements[0]
        gg_lobbying_xml = lxml_etree.tostring(gg_lobbying_element, encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd"
        )
        validation_result = xsd_validator.validate_xml(gg_lobbying_xml, xsd_path)

        # Assert validation passed
        assert validation_result["valid"], (
            f"GG_LobbyingForm XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{gg_lobbying_xml[:2000]}"
        )

    def test_gg_lobbying_form_minimal_data_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        """Every element the XSD requires, with none of the optional name parts, validates."""
        agency = AgencyFactory.create()

        opportunity = OpportunityFactory.create(
            opportunity_number="TEST-GG-LOBBYING-MIN-001",
            opportunity_title="GG_LobbyingForm Minimal Test",
            agency_code=agency.agency_code,
        )

        assistance_listing = OpportunityAssistanceListingFactory.create(
            opportunity=opportunity, assistance_listing_number="93.002"
        )

        competition = CompetitionFactory.create(
            opportunity=opportunity,
            public_competition_id="TEST-GG-LOBBYING-MIN-COMP",
            opening_date=date(2025, 1, 1),
            closing_date=date(2025, 12, 31),
            opportunity_assistance_listing=assistance_listing,
            competition_forms=[],
        )

        gg_lobbying_form = GG_LobbyingForm_v1_1

        application = ApplicationFactory.create(
            competition=competition, application_name="GG_LobbyingForm Minimal Test Application"
        )

        competition_form = CompetitionFormFactory.create(
            competition=competition, form=gg_lobbying_form
        )

        # Minimal data per the XSD, which also requires signature and date
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response={
                "organization_name": "Minimal Test Org",
                "authorized_representative_name": {
                    "first_name": "John",
                    "last_name": "Doe",
                },
                "authorized_representative_title": "Director",
                "authorized_representative_signature": "John Doe",
                "submitted_date": "2025-01-01",
            },
        )

        application_submission = ApplicationSubmissionFactory.create(
            application=application,
            legacy_tracking_number=88888888,
        )

        assembler = SubmissionXMLAssembler(application, application_submission)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        assert xml_string is not None

        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        gg_lobbying_ns = "{http://apply.grants.gov/forms/GG_LobbyingForm-V1.1}"
        ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=ns)
        gg_lobbying_elements = forms_element.findall(f".//{gg_lobbying_ns}LobbyingForm")
        assert len(gg_lobbying_elements) == 1

        gg_lobbying_xml = lxml_etree.tostring(gg_lobbying_elements[0], encoding="unicode")

        xsd_path = self._get_xsd_file_path(
            xsd_validator, "https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd"
        )
        validation_result = xsd_validator.validate_xml(gg_lobbying_xml, xsd_path)

        assert validation_result["valid"], (
            f"GG_LobbyingForm minimal validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{gg_lobbying_xml}"
        )

    def test_schema_minimal_xml_is_not_xsd_valid_before_submit(self, xsd_validator):
        """Signature and date are optional in the JSON schema but required by the XSD,
        so the form XML only becomes valid once submit fills them in."""
        result = xsd_validator.validate_xml(_generate(SCHEMA_MINIMAL_DATA), XSD_PATH)

        assert not result["valid"]
        assert "AuthorizedRepresentativeSignature" in result["error_message"]

    def test_special_characters_are_escaped(self, xsd_validator):
        """Names and titles can contain characters that have to be escaped in XML."""
        organization = 'R&D <Labs> "West" & Sons\''
        title = "VP, Research & Development <Ops>"
        data = _with(
            _with(FULL_DATA, "organization_name", organization),
            "authorized_representative_title",
            title,
        )

        xml_data = _generate(data)
        root = _root(xml_data)

        assert "R&amp;D &lt;Labs&gt;" in xml_data
        assert root.findtext("GG:ApplicantName", namespaces=NS) == organization
        assert root.findtext("GG:AuthorizedRepresentativeTitle", namespaces=NS) == title
        result = xsd_validator.validate_xml(xml_data, XSD_PATH)
        assert result["valid"], result["error_message"]

    def test_values_at_max_length_are_xsd_valid(self, xsd_validator):
        data = FULL_DATA
        for field, (_, max_length) in MAX_LENGTHS.items():
            data = _with(data, field, "x" * max_length)

        xml_data = _generate(data)
        root = _root(xml_data)

        # Written in full, nothing is cut off
        for element, max_length in MAX_LENGTHS.values():
            (value,) = root.xpath(f".//*[local-name()='{element}']/text()")
            assert value == "x" * max_length, element
        result = xsd_validator.validate_xml(xml_data, XSD_PATH)
        assert result["valid"], result["error_message"]

    @pytest.mark.parametrize("field", MAX_LENGTHS)
    def test_value_over_max_length_is_rejected(self, enable_factory_create, xsd_validator, field):
        """One character over the limit fails the XSD, and the form validation already
        rejects it, so it never gets as far as the XML."""
        element, max_length = MAX_LENGTHS[field]
        data = _with(FULL_DATA, field, "x" * (max_length + 1))

        result = xsd_validator.validate_xml(_generate(data), XSD_PATH)
        assert not result["valid"]
        assert element in result["error_message"]
        assert "maxLength" in result["error_message"]

        application_form = setup_application_for_form_validation(
            data,
            json_schema=GG_LobbyingForm_v1_1.form_json_schema,
            rule_schema=GG_LobbyingForm_v1_1.form_rule_schema,
        )
        errors = validate_application_form(application_form, ApplicationAction.MODIFY)
        assert [error.field for error in errors] == [f"$.{field}"]

    @pytest.mark.parametrize("submitted_date", ["01/15/2025", "2025-13-01", "today"])
    def test_invalid_submitted_date_fails_xsd(self, xsd_validator, submitted_date):
        xml_data = _generate(_with(FULL_DATA, "submitted_date", submitted_date))

        result = xsd_validator.validate_xml(xml_data, XSD_PATH)

        assert not result["valid"]
        assert "SubmittedDate" in result["error_message"]

    @freezegun.freeze_time("2025-06-15 12:00:00", tz_offset=0)
    def test_schema_minimal_form_is_xsd_valid_after_submit(
        self, enable_factory_create, seed_form_registry, xsd_validator
    ):
        """Starts from only what the schema requires. Submitting fills in the signature and
        date, and the result is valid both on its own and inside a full submission."""
        application_form = setup_application_for_form_validation(
            dict(SCHEMA_MINIMAL_DATA),
            json_schema=GG_LobbyingForm_v1_1.form_json_schema,
            rule_schema=GG_LobbyingForm_v1_1.form_rule_schema,
            user_email="signer@example.com",
        )
        assert validate_application_form(application_form, ApplicationAction.SUBMIT) == []

        xml_data = _generate(application_form.application_response)
        root = _root(xml_data)

        assert _local_names(root) == _xsd_sequence()
        assert (
            root.findtext("GG:AuthorizedRepresentativeSignature", namespaces=NS)
            == "signer@example.com"
        )
        assert root.findtext("GG:SubmittedDate", namespaces=NS) == "2025-06-15"
        result = xsd_validator.validate_xml(xml_data, XSD_PATH)
        assert result["valid"], result["error_message"]

        # Same data through the submission assembler, as it would be sent to Grants.gov
        form_xml = _form_xml_from_submission(application_form.application_response)
        assert _local_names(_root(form_xml)) == _xsd_sequence()
        result = xsd_validator.validate_xml(form_xml, XSD_PATH)
        assert result["valid"], result["error_message"]
