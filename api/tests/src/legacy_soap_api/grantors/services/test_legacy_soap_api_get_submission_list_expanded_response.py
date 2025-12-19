import logging
from datetime import datetime

import pytest
import pytz

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.legacy_soap_api.grantors import schemas
from src.legacy_soap_api.grantors.services.get_submission_list_expanded_response import (
    get_submission_list_expanded_response,
)
from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPInvalidEnvelope, SOAPRequest
from src.legacy_soap_api.soap_payload_handler import get_soap_operation_dict
from tests.lib.data_factories import setup_cert_user
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    OrganizationFactory,
    SamGovEntityFactory,
)

TZ_EST = pytz.timezone("America/New_York")
DT_NAIVE = datetime(2025, 9, 9, 8, 15, 17)
DT_EST_AWARE = TZ_EST.localize(DT_NAIVE)


def setup_application_submission(
    agency,
    legacy_package_id="PK00118065",
    sam_gov_entity=None,
    application_status=ApplicationStatus.ACCEPTED,
    opportunity_assistance_listing=True,
    has_organization=True,
    legacy_competition_id=1,
):
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
        legacy_package_id=legacy_package_id,
        legacy_competition_id=legacy_competition_id,
        opportunity_assistance_listing=(
            OpportunityAssistanceListingFactory.create(opportunity=opportunity)
            if opportunity_assistance_listing
            else None
        ),
    )
    application_kwargs = dict(
        competition=competition,
        application_status=application_status,
        submitted_at=DT_EST_AWARE,
    )
    if has_organization:
        application_kwargs = application_kwargs | {
            "organization": (
                OrganizationFactory.create(sam_gov_entity=sam_gov_entity)
                if sam_gov_entity
                else OrganizationFactory.create()
            )
        }
    application = ApplicationFactory.create(**application_kwargs)
    return ApplicationSubmissionFactory.create(application=application)


class TestLegacySoapApiGrantorGetSubmissionListExpanded:
    def test_get_submission_list_expanded_response(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(agency, sam_gov_entity=sam_gov_entity)
        application = submission.application
        db_session.commit()
        db_session.refresh(application.competition)
        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        get_submission_list_expanded_request_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_request_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{application.competition.opportunity.opportunity_number}",
                            "CFDANumber": application.competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Validated",
                            "SubmissionTitle": application.application_name,
                            "PackageID": application.competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": "Yes",
                            "ActiveExclusions": "Yes",
                            "UEI": sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_no_filter(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        sam_gov_entity_1 = SamGovEntityFactory.create(
            has_debt_subject_to_offset=False, has_exclusion_status=False
        )
        submission_1 = setup_application_submission(
            agency, legacy_package_id="PKG00118065", sam_gov_entity=sam_gov_entity_1
        )

        sam_gov_entity_2 = SamGovEntityFactory.create(
            has_debt_subject_to_offset=False, has_exclusion_status=False
        )
        submission_2 = setup_application_submission(
            agency,
            legacy_package_id="PKG00000005",
            sam_gov_entity=sam_gov_entity_2,
            application_status=ApplicationStatus.SUBMITTED,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        opportunity_1 = submission_1.application.competition.opportunity
        opportunity_2 = submission_2.application.competition.opportunity
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest") or {}
        get_submission_list_expanded_request_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_request_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected_1 = {
            "FundingOpportunityNumber": f"{opportunity_1.opportunity_number}",
            "CFDANumber": submission_1.application.competition.opportunity_assistance_listing.assistance_listing_number,
            "GrantsGovTrackingNumber": f"GRANT{submission_1.legacy_tracking_number}",
            "GrantsGovApplicationStatus": "Validated",
            "SubmissionTitle": submission_1.application.application_name,
            "PackageID": submission_1.application.competition.legacy_package_id,
            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
            "SubmissionMethod": "web",
            "DelinquentFederalDebt": "No",
            "ActiveExclusions": "No",
            "UEI": sam_gov_entity_1.uei,
        }
        expected_2 = {
            "FundingOpportunityNumber": f"{opportunity_2.opportunity_number}",
            "CFDANumber": submission_2.application.competition.opportunity_assistance_listing.assistance_listing_number,
            "GrantsGovTrackingNumber": f"GRANT{submission_2.legacy_tracking_number}",
            "GrantsGovApplicationStatus": "Received",
            "SubmissionTitle": submission_2.application.application_name,
            "PackageID": submission_2.application.competition.legacy_package_id,
            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
            "SubmissionMethod": "web",
            "DelinquentFederalDebt": "No",
            "ActiveExclusions": "No",
            "UEI": sam_gov_entity_2.uei,
        }
        available_application_number = soap_envelope_dict["Body"][
            "ns2:GetSubmissionListExpandedResponse"
        ]["ns2:AvailableApplicationNumber"]
        assert available_application_number == 2
        expanded_application_info = soap_envelope_dict["Body"][
            "ns2:GetSubmissionListExpandedResponse"
        ]["ns2:SubmissionInfo"]
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
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            sam_gov_entity=sam_gov_entity,
            application_status=ApplicationStatus.SUBMITTED,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")
        application = submission.application
        competition = application.competition

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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{competition.opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": "Yes",
                            "ActiveExclusions": "Yes",
                            "UEI": sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_grants_gov_tracking_number_filters_just_the_last_one_entered(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission_1 = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        submission_2 = setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")
        application = submission_1.application
        competition = application.competition
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission_2.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission_1.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{competition.opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission_1.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": f"{'Yes' if application.organization.sam_gov_entity.has_debt_subject_to_offset else 'No'}",
                            "ActiveExclusions": f"{'Yes' if application.organization.sam_gov_entity.has_exclusion_status else 'No'}",
                            "UEI": application.organization.sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_cfda_number_filters_just_the_last_one_entered(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission_1 = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        db_session.commit()
        submission_2 = setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")
        application_1 = submission_1.application
        competition_1 = application_1.competition
        competition_2 = submission_2.application.competition
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>OpportunityID</gran:FilterType>"
            f"<gran:FilterValue>{competition_2.opportunity.legacy_opportunity_id}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>OpportunityID</gran:FilterType>"
            f"<gran:FilterValue>{competition_1.opportunity.legacy_opportunity_id}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{competition_1.opportunity.opportunity_number}",
                            "CFDANumber": competition_1.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission_1.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application_1.application_name,
                            "PackageID": competition_1.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": f"{'Yes' if application_1.organization.sam_gov_entity.has_debt_subject_to_offset else 'No'}",
                            "ActiveExclusions": f"{'Yes' if application_1.organization.sam_gov_entity.has_exclusion_status else 'No'}",
                            "UEI": application_1.organization.sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_opportunity_ids_filters_just_the_last_one_entered(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission_1 = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        submission_2 = setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")
        application_1 = submission_1.application
        competition_1 = application_1.competition
        competition_2 = submission_2.application.competition
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>{competition_2.opportunity_assistance_listing.assistance_listing_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>{competition_1.opportunity_assistance_listing.assistance_listing_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{competition_1.opportunity.opportunity_number}",
                            "CFDANumber": competition_1.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission_1.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application_1.application_name,
                            "PackageID": competition_1.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": f"{'Yes' if application_1.organization.sam_gov_entity.has_debt_subject_to_offset else 'No'}",
                            "ActiveExclusions": f"{'Yes' if application_1.organization.sam_gov_entity.has_exclusion_status else 'No'}",
                            "UEI": application_1.organization.sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_filters_cfda_number_successfully(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(
            agency, application_status=ApplicationStatus.SUBMITTED, sam_gov_entity=sam_gov_entity
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(
            agency, legacy_package_id="PK000001", application_status=ApplicationStatus.SUBMITTED
        )
        setup_application_submission(
            agency, legacy_package_id="PK000002", application_status=ApplicationStatus.SUBMITTED
        )

        application = submission.application
        competition = application.competition
        opportunity = competition.opportunity

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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": f"{'Yes' if sam_gov_entity.has_debt_subject_to_offset else 'No'}",
                            "ActiveExclusions": f"{'Yes' if sam_gov_entity.has_exclusion_status else 'No'}",
                            "UEI": sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_filters_funding_opportunity_number_successfully(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(
            agency, application_status=ApplicationStatus.SUBMITTED, sam_gov_entity=sam_gov_entity
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(
            agency, legacy_package_id="PK000001", application_status=ApplicationStatus.SUBMITTED
        )
        setup_application_submission(
            agency, legacy_package_id="PK000002", application_status=ApplicationStatus.SUBMITTED
        )

        application = submission.application
        competition = application.competition
        opportunity = competition.opportunity

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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": "Yes",
                            "ActiveExclusions": "Yes",
                            "UEI": sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_filters_status_successfully(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(
            agency, application_status=ApplicationStatus.SUBMITTED, sam_gov_entity=sam_gov_entity
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(
            agency, legacy_package_id="PK000001", application_status=ApplicationStatus.ACCEPTED
        )
        setup_application_submission(
            agency, legacy_package_id="PK000002", application_status=ApplicationStatus.ACCEPTED
        )

        application = submission.application
        competition = application.competition
        opportunity = competition.opportunity

        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>Status</gran:FilterType>"
            "<gran:FilterValue>Processing</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": "Yes",
                            "ActiveExclusions": "Yes",
                            "UEI": sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_filters_all_three_filters_successfully(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(
            agency, application_status=ApplicationStatus.SUBMITTED, sam_gov_entity=sam_gov_entity
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(
            agency, legacy_package_id="PK000001", application_status=ApplicationStatus.SUBMITTED
        )
        setup_application_submission(
            agency, legacy_package_id="PK000002", application_status=ApplicationStatus.SUBMITTED
        )

        application = submission.application
        competition = application.competition
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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": "Yes",
                            "ActiveExclusions": "Yes",
                            "UEI": sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_application_list_expanded_response_does_not_return_none_fields(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
        competition = CompetitionFactory(
            opportunity=opportunity,
            legacy_package_id="PKG00118065",
            opportunity_assistance_listing=OpportunityAssistanceListingFactory.create(
                opportunity=opportunity
            ),
        )
        application = ApplicationFactory.create(
            competition=competition,
            application_status=None,
            submitted_at=None,
            organization=OrganizationFactory.create(sam_gov_entity=None),
        )
        submission = ApplicationSubmissionFactory.create(application=application)
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        db_session.commit()
        db_session.refresh(competition)
        db_session.refresh(application)
        opportunity_1 = OpportunityFactory.create(agency_code=agency.agency_code)
        competition_1 = CompetitionFactory(
            opportunity=opportunity_1,
            opportunity_assistance_listing=OpportunityAssistanceListingFactory.create(
                opportunity=opportunity_1
            ),
        )
        application_1 = ApplicationFactory.create(
            competition=competition_1,
            application_status=ApplicationStatus.SUBMITTED,
            submitted_at=DT_EST_AWARE,
            organization=OrganizationFactory.create(),
        )
        ApplicationSubmissionFactory.create(application=application_1)
        opportunity_2 = OpportunityFactory.create(agency_code=agency.agency_code)
        competition_2 = CompetitionFactory(
            opportunity=opportunity_2,
            opportunity_assistance_listing=OpportunityAssistanceListingFactory.create(
                opportunity=opportunity_2
            ),
        )
        application_2 = ApplicationFactory.create(
            competition=competition_2,
            application_status=ApplicationStatus.SUBMITTED,
            submitted_at=DT_EST_AWARE,
            organization=OrganizationFactory.create(),
        )
        ApplicationSubmissionFactory.create(application=application_2)
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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
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
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_handles_competition_with_no_opportunity_assistance_listing(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency, legacy_package_id="PKG00118065", opportunity_assistance_listing=False
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_request_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_request_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 0,
                    "ns2:SubmissionInfo": [],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_excludes_sam_gov_entity_data_if_no_organization(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
            has_organization=False,
        )
        application = submission.application
        competition = application.competition
        opportunity = competition.opportunity
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        db_session.commit()

        setup_application_submission(
            agency,
            legacy_package_id="PKG00000005",
            application_status=ApplicationStatus.SUBMITTED,
            has_organization=False,
        )
        setup_application_submission(
            agency,
            legacy_package_id="PKG00000006",
            application_status=ApplicationStatus.SUBMITTED,
            has_organization=False,
        )

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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_filters_by_certificate_agency(
        self, db_session, enable_factory_create
    ):
        agency_1 = AgencyFactory.create()
        agency_2 = AgencyFactory.create()
        submission = setup_application_submission(
            agency_1,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
        )
        _, _, soap_client_certificate = setup_cert_user(agency_2, {Privilege.LEGACY_AGENCY_VIEWER})
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
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        get_submission_list_expanded_request_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_request_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 0,
                    "ns2:SubmissionInfo": [],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_filters_by_opportunity_id_successfully(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
            sam_gov_entity=sam_gov_entity,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(
            agency, legacy_package_id="PKG00000001", application_status=ApplicationStatus.ACCEPTED
        )
        setup_application_submission(
            agency, legacy_package_id="PKG00000002", application_status=ApplicationStatus.ACCEPTED
        )
        application = submission.application
        competition = application.competition

        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>OpportunityID</gran:FilterType>"
            f"<gran:FilterValue>{competition.opportunity.legacy_opportunity_id}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{competition.opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": "Yes",
                            "ActiveExclusions": "Yes",
                            "UEI": sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_logs_filters_by_status_successfully(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
            sam_gov_entity=sam_gov_entity,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(
            agency, legacy_package_id="PKG00000001", application_status=ApplicationStatus.ACCEPTED
        )
        setup_application_submission(
            agency, legacy_package_id="PKG00000002", application_status=ApplicationStatus.ACCEPTED
        )
        application = submission.application
        competition = application.competition
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>Status</gran:FilterType>"
            "<gran:FilterValue>Processing</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        result = get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetSubmissionListExpandedResponse")
        expected = {
            "Body": {
                "ns2:GetSubmissionListExpandedResponse": {
                    "ns2:Success": True,
                    "ns2:AvailableApplicationNumber": 1,
                    "ns2:SubmissionInfo": [
                        {
                            "FundingOpportunityNumber": f"{competition.opportunity.opportunity_number}",
                            "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                            "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                            "GrantsGovApplicationStatus": "Received",
                            "SubmissionTitle": application.application_name,
                            "PackageID": competition.legacy_package_id,
                            "ns2:ReceivedDateTime": "2025-09-09T08:15:17-04:00",
                            "SubmissionMethod": "web",
                            "DelinquentFederalDebt": "Yes",
                            "ActiveExclusions": "Yes",
                            "UEI": sam_gov_entity.uei,
                        }
                    ],
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_submission_list_expanded_response_logs_filters_by_legacy_competition_id(
        self, db_session, enable_factory_create, caplog
    ):
        caplog.set_level(logging.INFO)
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency,
            legacy_competition_id=1,
            application_status=ApplicationStatus.SUBMITTED,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(agency, legacy_competition_id=2)
        setup_application_submission(agency, legacy_competition_id=3)
        application = submission.application
        competition = application.competition
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CompetitionID</gran:FilterType>"
            f"<gran:FilterValue>{competition.legacy_competition_id}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        assert (
            f"GetSubmissionListExpanded Filter: CompetitionIDs ['{competition.legacy_competition_id}']"
            in caplog.messages
        )

    def test_get_submission_list_expanded_response_logs_filters_by_package_id(
        self, db_session, enable_factory_create, caplog
    ):
        caplog.set_level(logging.INFO)
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(
            agency, legacy_package_id="PKG00000001", application_status=ApplicationStatus.ACCEPTED
        )
        setup_application_submission(
            agency, legacy_package_id="PKG00000002", application_status=ApplicationStatus.ACCEPTED
        )
        application = submission.application
        competition = application.competition
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>PackageID</gran:FilterType>"
            f"<gran:FilterValue>{competition.legacy_package_id}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_request_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_request_schema, soap_request
        )
        assert (
            f"GetSubmissionListExpanded Filter: PackageIDs ['{competition.legacy_package_id}']"
            in caplog.messages
        )

    def test_get_submission_list_expanded_response_logs_filters_by_submission_title(
        self, db_session, enable_factory_create, caplog
    ):
        caplog.set_level(logging.INFO)
        agency = AgencyFactory.create()
        setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
        )
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        setup_application_submission(
            agency, legacy_package_id="PKG00000001", application_status=ApplicationStatus.ACCEPTED
        )
        setup_application_submission(
            agency, legacy_package_id="PKG00000002", application_status=ApplicationStatus.ACCEPTED
        )
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>SubmissionTitle</gran:FilterType>"
            "<gran:FilterValue>This is my submission</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = SOAPRequest(
            data=request_xml,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        value = get_soap_operation_dict(request_xml, "GetSubmissionListExpandedRequest")
        get_submission_list_expanded_rquest_schema = schemas.GetSubmissionListExpandedRequest(
            **value
        )
        get_submission_list_expanded_response(
            db_session, get_submission_list_expanded_rquest_schema, soap_request
        )
        assert (
            "GetSubmissionListExpanded Filter: SubmissionTitles ['This is my submission']"
            in caplog.messages
        )
