from datetime import datetime

import pytest
import pytz
from sqlalchemy import func, select

from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import ApplicationSubmission
from src.db.models.opportunity_models import Opportunity
from src.legacy_soap_api.grantors import schemas
from src.legacy_soap_api.grantors.services.get_submission_list_expanded_response import (
    get_submission_list_expanded_response,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPInvalidEnvelope
from src.legacy_soap_api.soap_payload_handler import get_soap_operation_dict
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    ApplicationSubmissionFactory,
    OpportunityAssistanceListingFactory,
    OrganizationFactory,
)

TZ_EST = pytz.timezone("America/New_York")


@pytest.fixture(autouse=True)
def transactional_session(db_session):
    cascade_delete_from_db_table(db_session, Opportunity)


class TestLegacySoapApiGrantorGetSubmissionListExpanded:
    def test_get_submission_list_expanded_response(self, db_session, enable_factory_create):
        submission = ApplicationSubmissionFactory.create()
        application = submission.application
        dt_naive = datetime(2025, 9, 9, 8, 15, 17)
        dt_est_aware = TZ_EST.localize(dt_naive)
        application.submitted_at = dt_est_aware
        application.organization = OrganizationFactory()
        sam_gov_entity = application.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        application.application_status = ApplicationStatus.ACCEPTED
        competition = application.competition
        competition.legacy_package_id = "PKG00118065"
        competition.opportunity_assistance_listing = OpportunityAssistanceListingFactory(
            opportunity=competition.opportunity
        )
        db_session.commit()
        db_session.refresh(competition)
        opportunity = competition.opportunity
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_request_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_request_schema
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "GetSubmissionListExpandedResponse": {
                        "Success": True,
                        "AvailableApplicationNumber": 1,
                        "SubmissionInfo": [
                            {
                                "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                                "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                                "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                                "GrantsGovApplicationStatus": "Validated",
                                "SubmissionTitle": application.application_name,
                                "PackageID": competition.legacy_package_id,
                                "n2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                                "SubmissionMethod": "web",
                                "DelinquentFederalDebt": "Yes",
                                "ActiveExclusions": "Yes",
                                "UEI": application.organization.sam_gov_entity.uei,
                            }
                        ],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_no_filter(
        self, db_session, enable_factory_create
    ):
        submission_1 = ApplicationSubmissionFactory.create()
        application_1 = submission_1.application
        application_1.application_status = ApplicationStatus.ACCEPTED
        application_1.organization = OrganizationFactory()
        sam_gov_entity = application_1.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        competition_1 = application_1.competition
        competition_1.legacy_package_id = "PKG00118065"
        competition_1.organization_assisttance_listing = OpportunityAssistanceListingFactory(
            opportunity=competition_1.opportunity
        )
        submission_2 = ApplicationSubmissionFactory.create()
        application_2 = submission_2.application
        application_2.organization = OrganizationFactory()
        sam_gov_entity = application_2.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = False
        sam_gov_entity.has_exclusion_status = False
        dt_naive = datetime(2025, 9, 9, 8, 15, 17)
        dt_est_aware = TZ_EST.localize(dt_naive)
        application_1.submitted_at = dt_est_aware
        application_2.submitted_at = dt_est_aware
        application_2.application_status = ApplicationStatus.SUBMITTED
        competition_2 = application_2.competition
        competition_2.legacy_package_id = "PKG00000005"
        competition_2.organization_assisttance_listing = OpportunityAssistanceListingFactory(
            opportunity=competition_2.opportunity
        )
        db_session.commit()
        db_session.refresh(competition_1)
        db_session.refresh(competition_2)
        db_session.refresh(application_1)
        db_session.refresh(application_2)
        opportunity_1 = competition_1.opportunity
        opportunity_2 = competition_2.opportunity
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest") or {}
        get_submission_list_expanded_request_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_request_schema
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected_1 = {
            "FundingOpportunityNumber": f"{opportunity_1.opportunity_number}",
            "CFDANumber": competition_1.opportunity_assistance_listing.assistance_listing_number,
            "GrantsGovTrackingNumber": f"GRANT{submission_1.legacy_tracking_number}",
            "GrantsGovApplicationStatus": "Validated",
            "SubmissionTitle": application_1.application_name,
            "PackageID": competition_1.legacy_package_id,
            "n2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
            "SubmissionMethod": "web",
            "DelinquentFederalDebt": "Yes",
            "ActiveExclusions": "Yes",
            "UEI": application_1.organization.sam_gov_entity.uei,
        }
        expected_2 = {
            "FundingOpportunityNumber": f"{opportunity_2.opportunity_number}",
            "CFDANumber": competition_2.opportunity_assistance_listing.assistance_listing_number,
            "GrantsGovTrackingNumber": f"GRANT{submission_2.legacy_tracking_number}",
            "GrantsGovApplicationStatus": "Received",
            "SubmissionTitle": application_2.application_name,
            "PackageID": competition_2.legacy_package_id,
            "n2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
            "SubmissionMethod": "web",
            "DelinquentFederalDebt": "No",
            "ActiveExclusions": "No",
            "UEI": application_2.organization.sam_gov_entity.uei,
        }
        available_application_number = soap_envelope_dict["Envelope"]["Body"][
            "GetSubmissionListExpandedResponse"
        ]["AvailableApplicationNumber"]
        assert available_application_number == 2
        expanded_application_info = soap_envelope_dict["Envelope"]["Body"][
            "GetSubmissionListExpandedResponse"
        ]["SubmissionInfo"]
        assert len(expanded_application_info) == 2
        assert expected_1 in expanded_application_info
        assert expected_2 in expanded_application_info

    def test_get_submission_list_expanded_response_no_filter_cannot_have_empty_expandedapplicationfilter(
        self, db_session, enable_factory_create
    ):
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest") or {}
        with pytest.raises(SOAPInvalidEnvelope) as e:
            schemas.GetSubmissionListExpandedRequest(**value)
        assert (
            f"{e.value}"
            == "The content of element 'ExpandedApplicationFilter' is not complete. One of '{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterType}' is expected."
        )

    def test_get_submission_list_expanded_response_filters_legacy_tracking_number_successfully(
        self, db_session, enable_factory_create
    ):
        submission = ApplicationSubmissionFactory.create()
        application = submission.application
        application.application_status = ApplicationStatus.SUBMITTED
        application.organization = OrganizationFactory()
        dt_naive = datetime(2025, 9, 9, 8, 15, 17)
        dt_est_aware = TZ_EST.localize(dt_naive)
        application.submitted_at = dt_est_aware
        sam_gov_entity = application.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        competition = application.competition
        competition.organization_assisttance_listing = OpportunityAssistanceListingFactory(
            opportunity=competition.opportunity
        )
        competition.legacy_package_id = "PKG00118065"
        db_session.commit()
        db_session.refresh(competition)
        db_session.refresh(application)
        db_session.refresh(sam_gov_entity)
        opportunity = competition.opportunity
        ApplicationSubmissionFactory.create()
        ApplicationSubmissionFactory.create()
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "GetSubmissionListExpandedResponse": {
                        "Success": True,
                        "AvailableApplicationNumber": 1,
                        "SubmissionInfo": [
                            {
                                "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                                "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                                "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                                "GrantsGovApplicationStatus": "Received",
                                "SubmissionTitle": application.application_name,
                                "PackageID": competition.legacy_package_id,
                                "n2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                                "SubmissionMethod": "web",
                                "DelinquentFederalDebt": "Yes",
                                "ActiveExclusions": "Yes",
                                "UEI": application.organization.sam_gov_entity.uei,
                            }
                        ],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected
        stmt = select(func.count()).select_from(ApplicationSubmission)
        submission_count = db_session.scalar(stmt)
        assert submission_count == 3

    def test_get_submission_list_expanded_response_filters_cfda_number_successfully(
        self, db_session, enable_factory_create
    ):
        submission = ApplicationSubmissionFactory.create()
        application = submission.application
        application.application_status = ApplicationStatus.SUBMITTED
        application.organization = OrganizationFactory()
        dt_naive = datetime(2025, 9, 9, 8, 15, 17)
        dt_est_aware = TZ_EST.localize(dt_naive)
        application.submitted_at = dt_est_aware
        sam_gov_entity = application.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        competition = application.competition
        competition.opportunity_assistance_listing = OpportunityAssistanceListingFactory(
            opportunity=competition.opportunity
        )
        competition.legacy_package_id = "PKG00118065"
        db_session.commit()
        db_session.refresh(competition)
        db_session.refresh(application)
        db_session.refresh(sam_gov_entity)
        opportunity = competition.opportunity
        ApplicationSubmissionFactory.create()
        ApplicationSubmissionFactory.create()
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>{competition.opportunity_assistance_listing.assistance_listing_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "GetSubmissionListExpandedResponse": {
                        "Success": True,
                        "AvailableApplicationNumber": 1,
                        "SubmissionInfo": [
                            {
                                "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                                "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                                "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                                "GrantsGovApplicationStatus": "Received",
                                "SubmissionTitle": application.application_name,
                                "PackageID": competition.legacy_package_id,
                                "n2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                                "SubmissionMethod": "web",
                                "DelinquentFederalDebt": "Yes",
                                "ActiveExclusions": "Yes",
                                "UEI": application.organization.sam_gov_entity.uei,
                            }
                        ],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected
        stmt = select(func.count()).select_from(ApplicationSubmission)
        submission_count = db_session.scalar(stmt)
        assert submission_count == 3

    def test_get_submission_list_expanded_response_filters_funding_opportunity_number_successfully(
        self, db_session, enable_factory_create
    ):
        submission = ApplicationSubmissionFactory.create()
        application = submission.application
        application.application_status = ApplicationStatus.SUBMITTED
        application.organization = OrganizationFactory()
        dt_naive = datetime(2025, 9, 9, 8, 15, 17)
        dt_est_aware = TZ_EST.localize(dt_naive)
        application.submitted_at = dt_est_aware
        sam_gov_entity = application.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        competition = application.competition
        competition.opportunity_assistance_listing = OpportunityAssistanceListingFactory(
            opportunity=competition.opportunity
        )
        competition.legacy_package_id = "PKG00118065"
        db_session.commit()
        db_session.refresh(competition)
        db_session.refresh(application)
        db_session.refresh(sam_gov_entity)
        opportunity = competition.opportunity
        ApplicationSubmissionFactory.create()
        ApplicationSubmissionFactory.create()
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>FundingOpportunityNumber</gran:FilterType>"
            f"<gran:FilterValue>{competition.opportunity.opportunity_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "GetSubmissionListExpandedResponse": {
                        "Success": True,
                        "AvailableApplicationNumber": 1,
                        "SubmissionInfo": [
                            {
                                "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                                "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                                "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                                "GrantsGovApplicationStatus": "Received",
                                "SubmissionTitle": application.application_name,
                                "PackageID": competition.legacy_package_id,
                                "n2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                                "SubmissionMethod": "web",
                                "DelinquentFederalDebt": "Yes",
                                "ActiveExclusions": "Yes",
                                "UEI": application.organization.sam_gov_entity.uei,
                            }
                        ],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected
        stmt = select(func.count()).select_from(ApplicationSubmission)
        submission_count = db_session.scalar(stmt)
        assert submission_count == 3

    def test_get_submission_list_expanded_response_filters_all_three_filters_successfully(
        self, db_session, enable_factory_create
    ):
        submission = ApplicationSubmissionFactory.create()
        application = submission.application
        application.application_status = ApplicationStatus.SUBMITTED
        application.organization = OrganizationFactory()
        dt_naive = datetime(2025, 9, 9, 8, 15, 17)
        dt_est_aware = TZ_EST.localize(dt_naive)
        application.submitted_at = dt_est_aware
        sam_gov_entity = application.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        competition = application.competition
        competition.opportunity_assistance_listing = OpportunityAssistanceListingFactory(
            opportunity=competition.opportunity
        )
        competition.legacy_package_id = "PKG00118065"
        db_session.commit()
        db_session.refresh(competition)
        db_session.refresh(application)
        db_session.refresh(sam_gov_entity)
        opportunity = competition.opportunity
        ApplicationSubmissionFactory.create()
        ApplicationSubmissionFactory.create()
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>{competition.opportunity_assistance_listing.assistance_listing_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>FundingOpportunityNumber</gran:FilterType>"
            f"<gran:FilterValue>{competition.opportunity.opportunity_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "GetSubmissionListExpandedResponse": {
                        "Success": True,
                        "AvailableApplicationNumber": 1,
                        "SubmissionInfo": [
                            {
                                "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                                "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                                "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                                "GrantsGovApplicationStatus": "Received",
                                "SubmissionTitle": application.application_name,
                                "PackageID": competition.legacy_package_id,
                                "n2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                                "SubmissionMethod": "web",
                                "DelinquentFederalDebt": "Yes",
                                "ActiveExclusions": "Yes",
                                "UEI": application.organization.sam_gov_entity.uei,
                            }
                        ],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected
        stmt = select(func.count()).select_from(ApplicationSubmission)
        submission_count = db_session.scalar(stmt)
        assert submission_count == 3

    def test_get_application_list_expanded_response_does_not_return_none_fields(
        self, db_session, enable_factory_create
    ):
        submission = ApplicationSubmissionFactory.create()
        application = submission.application
        application.application_status = None
        application.submitted_at = None
        competition = application.competition
        competition.organization_assisttance_listing = OpportunityAssistanceListingFactory(
            opportunity=competition.opportunity
        )
        competition.legacy_package_id = "PKG00118065"
        db_session.commit()
        db_session.refresh(competition)
        db_session.refresh(application)
        opportunity = competition.opportunity
        ApplicationSubmissionFactory.create()
        ApplicationSubmissionFactory.create()
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "GetSubmissionListExpandedResponse": {
                        "Success": True,
                        "AvailableApplicationNumber": 1,
                        "SubmissionInfo": [
                            {
                                "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                                "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                                "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                                "SubmissionTitle": application.application_name,
                                "PackageID": competition.legacy_package_id,
                                "SubmissionMethod": "web",
                            }
                        ],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected
        stmt = select(func.count()).select_from(ApplicationSubmission)
        submission_count = db_session.scalar(stmt)
        assert submission_count == 3

    def test_get_submission_list_expanded_response_handles_competition_with_no_opportunity_assistance_listing(
        self, db_session, enable_factory_create
    ):
        submission = ApplicationSubmissionFactory.create()
        application = submission.application
        dt_naive = datetime(2025, 9, 9, 8, 15, 17)
        dt_est_aware = TZ_EST.localize(dt_naive)
        application.submitted_at = dt_est_aware
        application.organization = OrganizationFactory()
        sam_gov_entity = application.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        application.application_status = ApplicationStatus.ACCEPTED
        competition = application.competition
        competition.legacy_package_id = "PKG00118065"
        competition.opportunity_assistance_listing = None
        db_session.commit()
        db_session.refresh(competition)
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            "<gran:FilterValue>XYZ-1234</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_request_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_request_schema
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "GetSubmissionListExpandedResponse": {
                        "Success": True,
                        "AvailableApplicationNumber": 0,
                        "SubmissionInfo": [],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected
