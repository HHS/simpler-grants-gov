"""Tests for Project/Performance Site Location form XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/PerformanceSite_4_0-V4.0.xsd
"""

from datetime import date
from pathlib import Path
from typing import Any

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.project_performance_site_location import (
    FORM_XML_TRANSFORM_RULES as PERFORMANCE_SITE_TRANSFORM_RULES,
)
from src.form_schema.forms.project_performance_site_location import (
    ProjectPerformanceSiteLocation_v4_0,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
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

_FORM_NS = "http://apply.grants.gov/forms/PerformanceSite_4_0-V4.0"

_US_SITE = {
    "submitting_as_individual": False,
    "organization_name": "Example University",
    "uei": "ABCDEFGHIJ12",
    "address": {
        "street1": "123 Research Blvd",
        "street2": "Suite 400",
        "city": "Science City",
        "county": "Grant County",
        "state": "CA: California",
        "country": "USA: UNITED STATES",
        "zip_code": "90210-1234",
    },
    "congressional_district": "CA-033",
}

_INTL_SITE = {
    "submitting_as_individual": False,
    "organization_name": "International Research Institute",
    "address": {
        "street1": "10 Rue de la Paix",
        "city": "Paris",
        "country": "FRA: FRANCE",
    },
}

_INDIVIDUAL_US_SITE = {
    "submitting_as_individual": True,
    "address": {
        "street1": "456 Main St",
        "city": "Springfield",
        "country": "USA: UNITED STATES",
        "zip_code": "12345-6789",
        "state": "IL: Illinois",
    },
    "congressional_district": "IL-013",
}


class TestPerformanceSiteXMLGeneration:
    """Unit tests for Performance Site XML generation (no DB required)."""

    def _generate(self, data: dict) -> str:
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=data,
            transform_config=PERFORMANCE_SITE_TRANSFORM_RULES,
        )
        response = service.generate_xml(request)
        assert response.success is True, response.error_message
        return response.xml_data

    def test_us_primary_site_basic_fields(self):
        xml = self._generate({"primary_site": _US_SITE})

        assert f'xmlns:PerformanceSite_4_0="{_FORM_NS}"' in xml
        assert 'FormVersion="4.0"' in xml
        assert "<PerformanceSite_4_0:PerformanceSite_4_0" in xml
        assert "PrimarySite" in xml
        assert "Example University" in xml
        assert "123 Research Blvd" in xml
        assert "Science City" in xml
        assert "CA-033" in xml

    def test_international_primary_site_omits_us_fields(self):
        xml = self._generate({"primary_site": _INTL_SITE})

        assert "PrimarySite" in xml
        assert "Paris" in xml
        assert "FRA: FRANCE" in xml
        # US-only fields should be absent
        assert "ZipPostalCode" not in xml
        assert "CongressionalDistrictProgramProject" not in xml
        assert "<globLib:State" not in xml

    def test_individual_submitter_maps_yes(self):
        xml = self._generate({"primary_site": _INDIVIDUAL_US_SITE})

        assert "Individual>Y: Yes<" in xml
        # OrganizationName not provided — should be absent
        assert "OrganizationName" not in xml

    def test_additional_sites_produce_other_site_elements(self):
        data = {
            "primary_site": _US_SITE,
            "additional_sites": [_INTL_SITE, _INDIVIDUAL_US_SITE],
        }
        xml = self._generate(data)

        assert xml.count("OtherSite") == 4  # open + close tags x 2 sites

    def test_no_additional_sites_omits_other_site(self):
        xml = self._generate({"primary_site": _INTL_SITE})
        assert "OtherSite" not in xml

    def test_element_order_matches_xsd(self):
        """PrimarySite must precede OtherSite in the generated XML."""
        data = {
            "primary_site": _US_SITE,
            "additional_sites": [_INTL_SITE],
        }
        xml = self._generate(data)

        primary_pos = xml.find("PrimarySite")
        other_pos = xml.find("OtherSite")
        assert primary_pos < other_pos


_GLOB_NS = "http://apply.grants.gov/system/Global-V1.0"
_GLOB_LIB_NS = "http://apply.grants.gov/system/GlobalLibrary-V2.0"
_ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"

_ATTACHMENT_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
_ATTACHMENT_INFO = AttachmentInfo(
    filename="additional_locations.pdf",
    mime_type="application/pdf",
    file_location="additional_locations.pdf",
    hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
)


class TestPerformanceSiteLegacyParity:
    """Structural parity tests verifying the generated XML matches the legacy Grants.gov format.

    Legacy XML (from GrantApplication.xml downloaded from Grants.gov):

        <PerformanceSite_4_0:PerformanceSite_4_0
            xmlns:PerformanceSite_4_0="http://apply.grants.gov/forms/PerformanceSite_4_0-V4.0"
            xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"
            PerformanceSite_4_0:FormVersion="4.0">
          <PerformanceSite_4_0:PrimarySite>
            <PerformanceSite_4_0:Individual>N: No</PerformanceSite_4_0:Individual>
            <PerformanceSite_4_0:OrganizationName>Example University</PerformanceSite_4_0:OrganizationName>
            <PerformanceSite_4_0:SAMUEI>ABCDEFGHIJ12</PerformanceSite_4_0:SAMUEI>
            <PerformanceSite_4_0:Address>
              <globLib:Street1>123 Research Blvd</globLib:Street1>
              <globLib:Street2>Suite 400</globLib:Street2>
              <globLib:City>Science City</globLib:City>
              <globLib:County>Grant County</globLib:County>
              <globLib:State>CA: California</globLib:State>
              <globLib:ZipPostalCode>90210-1234</globLib:ZipPostalCode>
              <globLib:Country>USA: UNITED STATES</globLib:Country>
            </PerformanceSite_4_0:Address>
            <PerformanceSite_4_0:CongressionalDistrictProgramProject>CA-033</PerformanceSite_4_0:CongressionalDistrictProgramProject>
          </PerformanceSite_4_0:PrimarySite>
        </PerformanceSite_4_0:PerformanceSite_4_0>
    """

    def _generate(self, data: dict[str, Any]) -> lxml_etree._Element:
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=data, transform_config=PERFORMANCE_SITE_TRANSFORM_RULES
        )
        response = service.generate_xml(request)
        assert response.success, f"XML generation failed: {response.error_message}"
        return lxml_etree.fromstring(response.xml_data.encode())

    def _generate_with_attachment(
        self, data: dict[str, Any], attachment_uuid: str, attachment_info: AttachmentInfo
    ) -> lxml_etree._Element:
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=data,
            transform_config=PERFORMANCE_SITE_TRANSFORM_RULES,
            attachment_mapping={attachment_uuid: attachment_info},
        )
        response = service.generate_xml(request)
        assert response.success, f"XML generation failed: {response.error_message}"
        return lxml_etree.fromstring(response.xml_data.encode())

    def test_root_element_and_form_version(self):
        root = self._generate({"primary_site": _US_SITE})

        assert root.tag == f"{{{_FORM_NS}}}PerformanceSite_4_0"
        assert root.get(f"{{{_FORM_NS}}}FormVersion") == "4.0"

    def test_site_location_elements_use_form_namespace(self):
        """Individual, OrganizationName, SAMUEI, Address, CongressionalDistrictProgramProject
        are defined in SiteLocationDataType and must be in the PerformanceSite_4_0 namespace."""
        root = self._generate({"primary_site": _US_SITE})

        primary = root.find(f"{{{_FORM_NS}}}PrimarySite")
        assert primary is not None

        assert primary.find(f"{{{_FORM_NS}}}Individual") is not None
        assert primary.find(f"{{{_FORM_NS}}}OrganizationName") is not None
        assert primary.find(f"{{{_FORM_NS}}}SAMUEI") is not None
        assert primary.find(f"{{{_FORM_NS}}}Address") is not None
        assert primary.find(f"{{{_FORM_NS}}}CongressionalDistrictProgramProject") is not None

    def test_address_sub_elements_use_glob_lib_namespace(self):
        """Address child elements (Street1, City, State, etc.) must be in the globLib namespace."""
        root = self._generate({"primary_site": _US_SITE})

        address = root.find(f".//{{{_FORM_NS}}}Address")
        assert address is not None

        assert address.find(f"{{{_GLOB_LIB_NS}}}Street1") is not None
        assert address.find(f"{{{_GLOB_LIB_NS}}}City") is not None
        assert address.find(f"{{{_GLOB_LIB_NS}}}State") is not None
        assert address.find(f"{{{_GLOB_LIB_NS}}}ZipPostalCode") is not None
        assert address.find(f"{{{_GLOB_LIB_NS}}}Country") is not None

    def test_address_element_order_matches_xsd(self):
        """AddressDataTypeV3 sequence: Street1, Street2, City, County, State|Province,
        ZipPostalCode, Country."""
        root = self._generate({"primary_site": _US_SITE})
        address = root.find(f".//{{{_FORM_NS}}}Address")

        tags = [child.tag.split("}")[-1] for child in address]
        zip_idx = tags.index("ZipPostalCode")
        country_idx = tags.index("Country")
        assert zip_idx < country_idx, "ZipPostalCode must precede Country per XSD"

    def test_individual_maps_boolean_to_yes_no_code(self):
        root = self._generate({"primary_site": _US_SITE})
        individual = root.find(f".//{{{_FORM_NS}}}Individual")
        assert individual is not None
        assert individual.text == "N: No"

    def test_individual_true_maps_to_yes(self):
        root = self._generate({"primary_site": _INDIVIDUAL_US_SITE})
        individual = root.find(f".//{{{_FORM_NS}}}Individual")
        assert individual is not None
        assert individual.text == "Y: Yes"

    def test_additional_sites_use_other_site_element(self):
        data = {"primary_site": _US_SITE, "additional_sites": [_INTL_SITE]}
        root = self._generate(data)

        other_sites = root.findall(f"{{{_FORM_NS}}}OtherSite")
        assert len(other_sites) == 1
        assert other_sites[0].find(f"{{{_FORM_NS}}}Address") is not None

    def test_attachment_structure_matches_xsd(self):
        """AttachedFile element must be a direct child of the root in the form namespace,
        with att: content elements nested inside it (no extra inner wrapper)."""
        data = {
            "primary_site": _INTL_SITE,
            "additional_locations_attachment": _ATTACHMENT_UUID,
        }
        root = self._generate_with_attachment(data, _ATTACHMENT_UUID, _ATTACHMENT_INFO)

        attached_file = root.find(f"{{{_FORM_NS}}}AttachedFile")
        assert attached_file is not None, "AttachedFile must be a direct child of root"

        assert attached_file.find(f"{{{_ATT_NS}}}FileName") is not None
        assert attached_file.find(f"{{{_ATT_NS}}}MimeType") is not None
        assert attached_file.find(f"{{{_ATT_NS}}}FileLocation") is not None
        assert attached_file.find(f"{{{_GLOB_NS}}}HashValue") is not None

    def test_attachment_filename_content(self):
        data = {
            "primary_site": _INTL_SITE,
            "additional_locations_attachment": _ATTACHMENT_UUID,
        }
        root = self._generate_with_attachment(data, _ATTACHMENT_UUID, _ATTACHMENT_INFO)

        attached_file = root.find(f"{{{_FORM_NS}}}AttachedFile")
        assert attached_file.find(f"{{{_ATT_NS}}}FileName").text == "additional_locations.pdf"
        assert attached_file.find(f"{{{_ATT_NS}}}MimeType").text == "application/pdf"

    def test_no_spurious_inner_attachment_wrapper(self):
        """Regression: single_with_wrapper without file_element would create an extra
        AttachedFileFile element inside AttachedFile. Verify it's absent."""
        data = {
            "primary_site": _INTL_SITE,
            "additional_locations_attachment": _ATTACHMENT_UUID,
        }
        root = self._generate_with_attachment(data, _ATTACHMENT_UUID, _ATTACHMENT_INFO)

        attached_file = root.find(f"{{{_FORM_NS}}}AttachedFile")
        assert attached_file is not None

        inner_wrapper = attached_file.find(f"{{{_FORM_NS}}}AttachedFileFile")
        assert (
            inner_wrapper is None
        ), "AttachedFile must not contain a spurious AttachedFileFile inner wrapper"


_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "performance_site_4_0.xml"


class TestPerformanceSiteSnapshot:
    """Regression snapshot test pinning the full generated XML output.

    To regenerate after an intentional change, run the generation with the same
    input below and write the result to the snapshot file.
    """

    def test_full_xml_matches_snapshot(self):
        """Generated XML for a comprehensive case must match the stored snapshot."""
        data = {
            "primary_site": _US_SITE,
            "additional_sites": [_INTL_SITE, _INDIVIDUAL_US_SITE],
            "additional_locations_attachment": _ATTACHMENT_UUID,
        }
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=data,
            transform_config=PERFORMANCE_SITE_TRANSFORM_RULES,
            attachment_mapping={_ATTACHMENT_UUID: _ATTACHMENT_INFO},
        )
        response = service.generate_xml(request)
        assert response.success, response.error_message

        expected = _SNAPSHOT_PATH.read_text()
        assert response.xml_data == expected


class TestPerformanceSiteXSDValidation:
    """XSD validation tests for Performance Site Location form XML."""

    @pytest.fixture
    def xsd_validator(self):
        xsd_cache_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_cache_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds'.")
        xsd_path = xsd_cache_dir / "PerformanceSite_4_0-V4.0.xsd"
        if not xsd_path.exists():
            pytest.skip(
                "PerformanceSite_4_0-V4.0.xsd not found in cache. "
                "Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_cache_dir)

    def _extract_and_validate(self, xml_string: str, xsd_validator: XSDValidator) -> dict:
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)

        grant_ns = {"grant": "http://apply.grants.gov/system/MetaGrantApplication"}
        forms_element = root.find(".//grant:Forms", namespaces=grant_ns)
        assert forms_element is not None, "Forms element not found in submission XML"

        form_ns = f"{{{_FORM_NS}}}"
        elements = forms_element.findall(f".//{form_ns}PerformanceSite_4_0")
        assert len(elements) == 1, f"Expected 1 PerformanceSite_4_0 element, got {len(elements)}"

        form_xml = lxml_etree.tostring(elements[0], encoding="unicode")
        xsd_path = xsd_validator.xsd_dir / "PerformanceSite_4_0-V4.0.xsd"
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
        form = ProjectPerformanceSiteLocation_v4_0
        application = ApplicationFactory.create(competition=competition)
        competition_form = CompetitionFormFactory.create(competition=competition, form=form)
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response=response,
        )
        return application

    def test_us_site_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            {"primary_site": _US_SITE},
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

    def test_international_site_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            {"primary_site": _INTL_SITE},
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

    def test_with_additional_sites_validates_against_xsd(
        self, enable_factory_create, xsd_validator, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            {
                "primary_site": _US_SITE,
                "additional_sites": [_INTL_SITE, _INDIVIDUAL_US_SITE],
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
