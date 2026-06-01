"""Tests for Project/Performance Site Location form XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/PerformanceSite_4_0-V4.0.xsd
"""

from datetime import date
from pathlib import Path

import grants_shared.adapters.db as db
import pytest
from lxml import etree as lxml_etree

from src.db.models.competition_models import Form
from src.form_schema.forms.project_performance_site_location import (
    FORM_XML_TRANSFORM_RULES as PERFORMANCE_SITE_TRANSFORM_RULES,
)
from src.form_schema.forms.project_performance_site_location import (
    ProjectPerformanceSiteLocation_v4_0,
)
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


@pytest.mark.xml_validation
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


@pytest.mark.xml_validation
class TestPerformanceSiteXSDValidation:
    """XSD validation tests for Performance Site Location form XML."""

    @pytest.fixture
    def xsd_validator(self):
        xsd_cache_dir = Path(__file__).parent.parent.parent.parent.parent / "xsd_cache"
        if not xsd_cache_dir.exists():
            pytest.skip("XSD cache directory not found. Run 'flask task fetch-xsds'.")
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

        ns = f"{{{_FORM_NS}}}"
        forms_element = root.find(".//Forms")
        assert forms_element is not None, "Forms element not found in submission XML"

        elements = forms_element.findall(f".//{ns}PerformanceSite_4_0")
        assert len(elements) == 1, f"Expected 1 PerformanceSite_4_0 element, got {len(elements)}"

        form_xml = lxml_etree.tostring(elements[0], encoding="unicode")
        xsd_path = xsd_validator.xsd_cache_dir / "PerformanceSite_4_0-V4.0.xsd"
        return xsd_validator.validate_xml(form_xml, xsd_path)

    def _make_application(self, enable_factory_create, db_session: db.Session, response: dict):
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
        form = db_session.get(Form, ProjectPerformanceSiteLocation_v4_0.form_id)
        application = ApplicationFactory.create(competition=competition)
        competition_form = CompetitionFormFactory.create(competition=competition, form=form)
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response=response,
        )
        return application

    def test_us_site_validates_against_xsd(
        self, enable_factory_create, xsd_validator, db_session, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            db_session,
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
        self, enable_factory_create, xsd_validator, db_session, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            db_session,
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
        self, enable_factory_create, xsd_validator, db_session, seed_form_registry
    ):
        application = self._make_application(
            enable_factory_create,
            db_session,
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
