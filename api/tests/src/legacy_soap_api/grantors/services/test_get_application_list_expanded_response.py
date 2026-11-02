import io
import logging
from datetime import datetime

import pytest
import pytz

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.legacy_soap_api.grantors import schemas
from src.legacy_soap_api.grantors.services import (
    get_application_list_expanded,
    get_application_list_expanded_response,
)
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPAuth,
    SOAPClientCertificate,
    SOAPClientCertificateLookupError,
    SOAPClientUserDoesNotHavePermission,
)
from src.legacy_soap_api.legacy_soap_api_config import (
    GRANTOR_SOAP_ACTION_PATH,
    SimplerSoapAPI,
    SOAPOperationConfig,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest, SoapRequestStreamer
from src.legacy_soap_api.soap_payload_handler import get_soap_operation_dict
from src.util.datetime_util import make_timezone_aware
from tests.lib.data_factories import setup_cert_user
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    LegacyOrganizationCertificateFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    OrganizationFactory,
    SamGovEntityFactory,
)

TZ_EST = pytz.timezone("America/New_York")
DT_NAIVE = datetime(2025, 9, 9, 8, 15, 17)
DT_EST_AWARE = TZ_EST.localize(DT_NAIVE)
DT_EST_AWARE_EARLIER = make_timezone_aware(datetime(2025, 8, 1, 8, 15, 17), "America/New_York")


def setup_application_submission(
    agency,
    legacy_package_id="PK00118065",
    sam_gov_entity=None,
    application_status=ApplicationStatus.ACCEPTED,
    opportunity_assistance_listing=True,
    has_organization=True,
    legacy_competition_id=1001,
    submitted_at=DT_EST_AWARE,
    public_competition_id="ABC-134-56789",
):
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
        legacy_package_id=legacy_package_id,
        legacy_competition_id=legacy_competition_id,
        public_competition_id=public_competition_id,
        opportunity_assistance_listing=(
            OpportunityAssistanceListingFactory.create(opportunity=opportunity)
            if opportunity_assistance_listing
            else None
        ),
    )
    application_kwargs = dict(
        competition=competition,
        application_status=application_status,
        submitted_at=submitted_at,
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


def make_soap_config():
    return SOAPOperationConfig(
        request_operation_name="GetApplicationListExpandedRequest",
        response_operation_name="GetApplicationListExpandedResponse",
        privileges={Privilege.LEGACY_AGENCY_VIEWER},
        soap_action=f"{GRANTOR_SOAP_ACTION_PATH}/GetApplicationListExpanded",
    )


def make_soap_request(request_xml, soap_client_certificate):
    return SOAPRequest(
        data=SoapRequestStreamer(stream=io.BytesIO(request_xml.encode("utf-8"))),
        full_path="x",
        headers={},
        method="POST",
        api_name=SimplerSoapAPI.GRANTORS,
        operation_name="GetApplicationListExpandedRequest",
        auth=SOAPAuth(certificate=soap_client_certificate),
    )


def make_request_xml(tracking_number=None, filter_type=None, filter_value=None):
    filter_block = ""
    if filter_type and filter_value is not None:
        filter_block += (
            "<gran:ExpandedApplicationFilter>"
            f"<gran:FilterType>{filter_type}</gran:FilterType>"
            f"<gran:FilterValue>{filter_value}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
        )
    if tracking_number:
        filter_block += (
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
        )
    return (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:GetApplicationListExpandedRequest>"
        f"{filter_block}"
        "</agen:GetApplicationListExpandedRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    )


class TestLegacySoapApiGrantorGetApplicationListExpanded:
    def test_get_application_list_expanded_response(self, db_session, enable_factory_create):
        """Full field-level assertion on a well-formed submission with SAM.gov entity data."""
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=True, has_exclusion_status=True
        )
        submission = setup_application_submission(agency, sam_gov_entity=sam_gov_entity)
        application = submission.application
        db_session.commit()
        db_session.refresh(application.competition)

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = make_request_xml(f"GRANT{submission.legacy_tracking_number}")
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetApplicationListExpandedResponse")

        expected = {
            "Envelope": {
                "Body": {
                    "ns2:GetApplicationListExpandedResponse": {
                        "ns2:Success": True,
                        "ns2:AvailableApplicationNumber": 1,
                        "ns2:ExpandedApplicationInfo": [
                            {
                                "FundingOpportunityNumber": application.competition.opportunity.opportunity_number,
                                "CFDANumber": application.competition.opportunity_assistance_listing.assistance_listing_number,
                                "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                                "GrantsGovApplicationStatus": "Validated",
                                "SubmissionTitle": application.application_name,
                                "PackageID": application.competition.legacy_package_id,
                                "CompetitionID": f"{application.competition.public_competition_id}",
                                "ns2:ReceivedDateTime": "2025-09-09T08:15:17.000-04:00",
                                "SubmissionMethod": "web",
                                "DelinquentFederalDebt": "Yes",
                                "ActiveExclusions": "Yes",
                            }
                        ],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_application_list_expanded_response_does_not_include_uei(
        self, db_session, enable_factory_create
    ):
        """UEI is not in the SOAP Proxy supported fields table for GetApplicationListExpanded."""
        agency = AgencyFactory.create()
        sam_gov_entity = SamGovEntityFactory.create(
            has_debt_subject_to_offset=False, has_exclusion_status=False
        )
        submission = setup_application_submission(agency, sam_gov_entity=sam_gov_entity)
        application = submission.application
        db_session.commit()
        db_session.refresh(application.competition)

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = make_request_xml(f"GRANT{submission.legacy_tracking_number}")
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetApplicationListExpandedResponse")
        info = soap_envelope_dict["Envelope"]["Body"]["ns2:GetApplicationListExpandedResponse"][
            "ns2:ExpandedApplicationInfo"
        ][0]

        assert "UEI" not in info
        assert "CompetitionID" in info

    def test_get_application_list_expanded_response_fails_if_user_does_not_have_legacy_agency_viewer_privilege(
        self, db_session, enable_factory_create
    ):
        """A cert without LEGACY_AGENCY_VIEWER privilege is rejected before any DB query."""
        agency = AgencyFactory.create()
        submission = setup_application_submission(agency)
        db_session.commit()

        _, _, soap_client_certificate, _ = setup_cert_user(
            agency, {Privilege.GET_SUBMITTED_APPLICATIONS}
        )
        request_xml = make_request_xml(f"GRANT{submission.legacy_tracking_number}")
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )

        with pytest.raises(SOAPClientUserDoesNotHavePermission):
            get_application_list_expanded(
                db_session=db_session,
                request=request_schema,
                soap_request=soap_request,
                soap_config=make_soap_config(),
            )

    def test_get_application_list_expanded_response_no_filter_returns_only_agency_submissions(
        self, db_session, enable_factory_create
    ):
        """With no filter, only submissions belonging to the cert's agency are returned."""
        agency = AgencyFactory.create()
        other_agency = AgencyFactory.create()
        submission = setup_application_submission(agency)
        setup_application_submission(other_agency)
        db_session.commit()

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = make_request_xml()
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **(get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest") or {})
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert (
            result.expanded_application_info[0].grants_gov_tracking_number
            == f"GRANT{submission.legacy_tracking_number}"
        )

    def test_get_application_list_expanded_response_filters_by_tracking_number(
        self, db_session, enable_factory_create
    ):
        """GrantsGovTrackingNumber filter returns exactly the matching submission."""
        agency = AgencyFactory.create()
        submission = setup_application_submission(agency)
        setup_application_submission(agency)
        db_session.commit()

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = make_request_xml(f"GRANT{submission.legacy_tracking_number}")
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert (
            result.expanded_application_info[0].grants_gov_tracking_number
            == f"GRANT{submission.legacy_tracking_number}"
        )

    def test_get_application_list_expanded_response_filters_by_cfda_number(
        self, db_session, enable_factory_create
    ):
        """CFDANumber filter returns only the submission whose assistance listing matches."""
        agency = AgencyFactory.create()
        submission = setup_application_submission(agency)
        setup_application_submission(agency)
        db_session.commit()
        db_session.refresh(submission.application.competition)

        cfda = (
            submission.application.competition.opportunity_assistance_listing.assistance_listing_number
        )

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>{cfda}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert result.expanded_application_info[0].cfda_number == cfda

    def test_get_application_list_expanded_response_filters_by_status(
        self, db_session, enable_factory_create
    ):
        """Status filter "Validated" maps to ApplicationStatus.ACCEPTED and excludes other statuses."""
        agency = AgencyFactory.create()
        accepted_submission = setup_application_submission(
            agency, application_status=ApplicationStatus.ACCEPTED
        )
        setup_application_submission(agency, application_status=ApplicationStatus.SUBMITTED)
        db_session.commit()

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>Status</gran:FilterType>"
            "<gran:FilterValue>Validated</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert (
            result.expanded_application_info[0].grants_gov_tracking_number
            == f"GRANT{accepted_submission.legacy_tracking_number}"
        )

    def test_get_application_list_expanded_response_does_not_return_none_fields(
        self, db_session, enable_factory_create
    ):
        """Fields that have no data should be omitted from the serialized envelope."""
        agency = AgencyFactory.create()
        setup_application_submission(
            agency,
            application_status=ApplicationStatus.IN_PROGRESS,
            submitted_at=None,
            has_organization=False,
        )
        db_session.commit()

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = make_request_xml()
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **(get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest") or {})
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetApplicationListExpandedResponse")
        info = soap_envelope_dict["Envelope"]["Body"]["ns2:GetApplicationListExpandedResponse"][
            "ns2:ExpandedApplicationInfo"
        ][0]

        assert "ns2:ReceivedDateTime" not in info
        assert "GrantsGovApplicationStatus" not in info
        assert "DelinquentFederalDebt" not in info
        assert "ActiveExclusions" not in info

    def test_get_application_list_expanded_response_fails_if_privileges_are_not_set_on_config(
        self, db_session, enable_factory_create, caplog
    ):
        """A SOAPOperationConfig with no privileges raises and logs a config misconfiguration warning."""
        caplog.set_level(logging.INFO)
        agency = AgencyFactory.create()
        submission = setup_application_submission(agency)
        db_session.commit()

        # Config with no privileges set
        soap_config_no_privs = SOAPOperationConfig(
            request_operation_name="GetApplicationListExpandedRequest",
            response_operation_name="GetApplicationListExpandedResponse",
            soap_action=f"{GRANTOR_SOAP_ACTION_PATH}/GetApplicationListExpanded",
        )
        _, _, soap_client_certificate, _ = setup_cert_user(
            agency, {Privilege.GET_SUBMITTED_APPLICATIONS}
        )
        request_xml = make_request_xml(f"GRANT{submission.legacy_tracking_number}")
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )

        with pytest.raises(SOAPClientUserDoesNotHavePermission):
            get_application_list_expanded(
                db_session=db_session,
                request=request_schema,
                soap_request=soap_request,
                soap_config=soap_config_no_privs,
            )
        records = [r for r in caplog.records if "Soap Config privileges not set" in r.message]
        assert len(records) == 1

    def test_get_application_list_expanded_response_fails_if_no_agency_on_cert(
        self, db_session, enable_factory_create, caplog
    ):
        """A certificate with no associated agency raises SOAPClientCertificateLookupError."""
        caplog.set_level(logging.INFO)
        agency = AgencyFactory.create()
        submission = setup_application_submission(agency)
        db_session.commit()

        soap_config_no_privs = SOAPOperationConfig(
            request_operation_name="GetApplicationListExpandedRequest",
            response_operation_name="GetApplicationListExpandedResponse",
            soap_action=f"{GRANTOR_SOAP_ACTION_PATH}/GetApplicationListExpanded",
        )
        legacy_certificate = LegacyOrganizationCertificateFactory.create(agency=None)
        soap_client_certificate = SOAPClientCertificate(
            serial_number=legacy_certificate.serial_number,
            cert="123",
            fingerprint="456",
            legacy_certificate=legacy_certificate,
        )
        request_xml = make_request_xml(f"GRANT{submission.legacy_tracking_number}")
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )

        with pytest.raises(SOAPClientCertificateLookupError):
            get_application_list_expanded(
                db_session=db_session,
                request=request_schema,
                soap_request=soap_request,
                soap_config=soap_config_no_privs,
            )
        records = [r for r in caplog.records if "certificate does not have agency" in r.message]
        assert len(records) == 1

    def test_get_application_list_expanded_response_no_filter_returns_two_submissions_sorted_by_date(
        self, db_session, enable_factory_create
    ):
        """With no filter, all agency submissions are returned sorted most-recent first; other agencies excluded."""
        agency = AgencyFactory.create(is_multilevel_agency=False)
        other_agency = AgencyFactory.create(is_multilevel_agency=False)

        submission_1 = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            submitted_at=DT_EST_AWARE,
        )
        submission_2 = setup_application_submission(
            agency,
            legacy_package_id="PKG00000005",
            application_status=ApplicationStatus.SUBMITTED,
            submitted_at=DT_EST_AWARE_EARLIER,
        )
        other_submission = setup_application_submission(
            other_agency, legacy_package_id="PKG99999999"
        )

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = make_request_xml()
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **(get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest") or {})
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )

        assert result.available_application_number == 2
        tracking_numbers = [a.grants_gov_tracking_number for a in result.expanded_application_info]
        # sorted most-recent first
        assert tracking_numbers[0] == f"GRANT{submission_1.legacy_tracking_number}"
        assert tracking_numbers[1] == f"GRANT{submission_2.legacy_tracking_number}"
        # other agency excluded
        assert not any(
            a.grants_gov_tracking_number == f"GRANT{other_submission.legacy_tracking_number}"
            for a in result.expanded_application_info
        )

    def test_get_application_list_expanded_response_multi_level_agency_sees_sub_agency_submissions(
        self, db_session, enable_factory_create
    ):
        """A multilevel agency cert returns submissions from both the parent and its sub-agencies."""
        agency = AgencyFactory.create(is_multilevel_agency=True)
        # Sub-agency code must start with "{parent_code}-" to match the LIKE filter
        sub_agency = AgencyFactory.create(
            sub_agency_code=agency.agency_code,
            agency_code=f"{agency.agency_code}-SUB",
        )

        submission_1 = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            submitted_at=DT_EST_AWARE,
        )
        submission_2 = setup_application_submission(
            sub_agency,
            legacy_package_id="PKG00000005",
            application_status=ApplicationStatus.SUBMITTED,
            submitted_at=DT_EST_AWARE_EARLIER,
        )

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = make_request_xml()
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **(get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest") or {})
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )

        assert result.available_application_number == 2
        tracking_numbers = {a.grants_gov_tracking_number for a in result.expanded_application_info}
        assert f"GRANT{submission_1.legacy_tracking_number}" in tracking_numbers
        assert f"GRANT{submission_2.legacy_tracking_number}" in tracking_numbers

    def test_get_application_list_expanded_response_tracking_number_last_one_wins(
        self, db_session, enable_factory_create
    ):
        """When multiple GrantsGovTrackingNumber filters are provided, the last one wins."""
        agency = AgencyFactory.create()
        submission_1 = setup_application_submission(
            agency, legacy_package_id="PKG00118065", application_status=ApplicationStatus.SUBMITTED
        )
        submission_2 = setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        # Two GrantsGovTrackingNumber filters — last one (submission_1) should win
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission_2.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission_1.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert (
            result.expanded_application_info[0].grants_gov_tracking_number
            == f"GRANT{submission_1.legacy_tracking_number}"
        )

    def test_get_application_list_expanded_response_cfda_last_one_wins(
        self, db_session, enable_factory_create
    ):
        """When multiple CFDANumber filters are provided, the last one wins."""
        agency = AgencyFactory.create()
        submission_1 = setup_application_submission(
            agency, legacy_package_id="PKG00118065", application_status=ApplicationStatus.SUBMITTED
        )
        submission_2 = setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")
        db_session.commit()
        db_session.refresh(submission_1.application.competition)
        db_session.refresh(submission_2.application.competition)

        cfda_1 = (
            submission_1.application.competition.opportunity_assistance_listing.assistance_listing_number
        )
        cfda_2 = (
            submission_2.application.competition.opportunity_assistance_listing.assistance_listing_number
        )

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>{cfda_2}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>{cfda_1}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert result.expanded_application_info[0].cfda_number == cfda_1

    def test_get_application_list_expanded_response_opportunity_id_last_one_wins(
        self, db_session, enable_factory_create
    ):
        """When multiple OpportunityID filters are provided, the last one wins."""
        agency = AgencyFactory.create()
        submission_1 = setup_application_submission(
            agency, legacy_package_id="PKG00118065", application_status=ApplicationStatus.SUBMITTED
        )
        submission_2 = setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")
        db_session.commit()
        db_session.refresh(submission_1.application.competition)
        db_session.refresh(submission_2.application.competition)

        opp_id_1 = submission_1.application.competition.opportunity.legacy_opportunity_id
        opp_id_2 = submission_2.application.competition.opportunity.legacy_opportunity_id

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>OpportunityID</gran:FilterType>"
            f"<gran:FilterValue>{opp_id_2}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>OpportunityID</gran:FilterType>"
            f"<gran:FilterValue>{opp_id_1}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert (
            result.expanded_application_info[0].grants_gov_tracking_number
            == f"GRANT{submission_1.legacy_tracking_number}"
        )

    def test_get_application_list_expanded_response_filters_by_funding_opportunity_number(
        self, db_session, enable_factory_create
    ):
        """FundingOpportunityNumber filter returns only the submission whose opportunity number matches."""
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency, legacy_package_id="PKG00118065", application_status=ApplicationStatus.SUBMITTED
        )
        setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")
        db_session.commit()
        db_session.refresh(submission.application.competition)

        opp_number = submission.application.competition.opportunity.opportunity_number

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>FundingOpportunityNumber</gran:FilterType>"
            f"<gran:FilterValue>{opp_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert result.expanded_application_info[0].funding_opportunity_number == opp_number

    def test_get_application_list_expanded_response_filters_by_opportunity_id(
        self, db_session, enable_factory_create
    ):
        """OpportunityID filter returns only the submission whose legacy opportunity ID matches."""
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency, legacy_package_id="PKG00118065", application_status=ApplicationStatus.SUBMITTED
        )
        setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")
        db_session.commit()
        db_session.refresh(submission.application.competition)

        opp_id = submission.application.competition.opportunity.legacy_opportunity_id

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>OpportunityID</gran:FilterType>"
            f"<gran:FilterValue>{opp_id}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 1
        assert (
            result.expanded_application_info[0].grants_gov_tracking_number
            == f"GRANT{submission.legacy_tracking_number}"
        )

    def test_get_application_list_expanded_response_cross_agency_tracking_number_returns_empty(
        self, db_session, enable_factory_create
    ):
        """A tracking number belonging to a different agency returns no results for the requesting cert."""
        agency_1 = AgencyFactory.create()
        agency_2 = AgencyFactory.create()
        submission = setup_application_submission(
            agency_1,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
        )
        # cert belongs to agency_2; tracking number belongs to agency_1
        _, _, soap_client_certificate, _ = setup_cert_user(
            agency_2, {Privilege.LEGACY_AGENCY_VIEWER}
        )
        request_xml = make_request_xml(f"GRANT{submission.legacy_tracking_number}")
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 0
        assert result.expanded_application_info == []

    def test_get_application_list_expanded_response_handles_competition_with_no_opportunity_assistance_listing(
        self, db_session, enable_factory_create
    ):
        """A competition with no assistance listing returns empty when filtered by CFDANumber."""
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            opportunity_assistance_listing=False,
        )
        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        db_session.commit()
        db_session.refresh(submission.application.competition)

        # CFDA filter can't match — competition has no listing
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>GRANT{submission.legacy_tracking_number}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            "<gran:FilterValue>XYZ-1234</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        assert result.available_application_number == 0
        assert result.expanded_application_info == []

    def test_get_application_list_expanded_response_excludes_sam_gov_entity_data_if_no_organization(
        self, db_session, enable_factory_create
    ):
        """DelinquentFederalDebt and ActiveExclusions are absent when the application has no organization."""
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency,
            legacy_package_id="PKG00118065",
            application_status=ApplicationStatus.SUBMITTED,
            has_organization=False,
        )
        application = submission.application
        competition = application.competition

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        db_session.commit()
        db_session.refresh(competition)

        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
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
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        proxy_response = SOAPResponse(data=b"", status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        soap_envelope_dict = result.to_soap_envelope_dict("GetApplicationListExpandedResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "ns2:GetApplicationListExpandedResponse": {
                        "ns2:Success": True,
                        "ns2:AvailableApplicationNumber": 1,
                        "ns2:ExpandedApplicationInfo": [
                            {
                                "FundingOpportunityNumber": competition.opportunity.opportunity_number,
                                "CFDANumber": competition.opportunity_assistance_listing.assistance_listing_number,
                                "GrantsGovTrackingNumber": f"GRANT{submission.legacy_tracking_number}",
                                "GrantsGovApplicationStatus": "Received",
                                "SubmissionTitle": application.application_name,
                                "PackageID": competition.legacy_package_id,
                                "CompetitionID": f"{competition.public_competition_id}",
                                "ns2:ReceivedDateTime": "2025-09-09T08:15:17.000-04:00",
                                "SubmissionMethod": "web",
                                # DelinquentFederalDebt, ActiveExclusions absent — no SAM data
                            }
                        ],
                    }
                }
            }
        }
        assert soap_envelope_dict == expected

    def test_get_application_list_expanded_response_unrecognized_status_returns_no_results(
        self, db_session, enable_factory_create
    ):
        """Simpler returns no results for a Status value it cannot map to an internal application status.
        The proxy may still contribute results — this test verifies the proxy's entry IS included
        while Simpler's DB entries are not."""
        agency = AgencyFactory.create()
        simpler_submission_1 = setup_application_submission(
            agency, application_status=ApplicationStatus.SUBMITTED
        )
        simpler_submission_2 = setup_application_submission(
            agency, legacy_package_id="PKG00000001", application_status=ApplicationStatus.ACCEPTED
        )

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>Status</gran:FilterType>"
            "<gran:FilterValue>XYZ</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )

        # Proxy returns one application that matched on its side (e.g. Status "XYZ" is a
        # legacy-only status value). Simpler ignores it because there is no DB equivalent.
        legacy_only_tracking_number = "GRANT00839196"
        proxy_data = (
            b'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
            b"<soap:Body>"
            b'<Response xmlns:ns2="http://apply.grants.gov/system/ApplicantWebServices-V2.0">'
            b"<ns2:ExpandedApplicationInfo>"
            b"<GrantsGovTrackingNumber>GRANT00839196</GrantsGovTrackingNumber>"
            b"</ns2:ExpandedApplicationInfo>"
            b"</Response>"
            b"</soap:Body>"
            b"</soap:Envelope>"
        )
        proxy_response = SOAPResponse(data=proxy_data, status_code=200, headers={})

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        # Simpler returns [] because "XYZ" is unrecognized
        assert simpler_applications == []

        result = get_application_list_expanded_response(
            simpler_applications=simpler_applications,
            proxy_response=proxy_response,
        )
        tracking_numbers = {
            app.grants_gov_tracking_number for app in result.expanded_application_info
        }
        # Proxy result IS returned
        assert legacy_only_tracking_number in tracking_numbers
        # Simpler DB submissions are NOT returned
        assert f"GRANT{simpler_submission_1.legacy_tracking_number}" not in tracking_numbers
        assert f"GRANT{simpler_submission_2.legacy_tracking_number}" not in tracking_numbers
        assert result.available_application_number == 1

    @pytest.mark.parametrize(
        "filter_type,filter_value",
        [
            ("Status", "XYZ"),
            ("GrantsGovTrackingNumber", "GRANT9999999999"),
            ("CFDANumber", "99.999"),
            ("FundingOpportunityNumber", "FON-DOES-NOT-EXIST"),
            ("OpportunityID", "9999999"),
        ],
    )
    def test_get_application_list_expanded_no_results_when_filter_matches_nothing(
        self, db_session, enable_factory_create, filter_type, filter_value
    ):
        """AC: When no applications meet the filtering criteria, return no applications.
        This covers all supported filter types — whether the value is gibberish (e.g. Status='XYZ')
        or simply doesn't match any data in the DB."""
        agency = AgencyFactory.create()
        setup_application_submission(agency, application_status=ApplicationStatus.ACCEPTED)

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = make_request_xml(filter_type=filter_type, filter_value=filter_value)
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        assert simpler_applications == []

    def test_get_application_list_expanded_unrecognized_status_ignored_when_other_filters_present(
        self, db_session, enable_factory_create
    ):
        """When Status is unrecognized but other filters are present, Status is ignored and the
        other filters apply normally. Verified against the live Grants.gov training endpoint."""
        agency = AgencyFactory.create()
        matching_submission = setup_application_submission(
            agency, application_status=ApplicationStatus.ACCEPTED
        )
        setup_application_submission(agency, application_status=ApplicationStatus.ACCEPTED)

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        tracking_number = f"GRANT{matching_submission.legacy_tracking_number}"
        request_xml = make_request_xml(
            filter_type="Status",
            filter_value="XYZ",
            tracking_number=tracking_number,
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )

        simpler_applications = get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        assert len(simpler_applications) == 1
        assert simpler_applications[0].grants_gov_tracking_number == tracking_number

    def test_get_application_list_expanded_response_logs_competition_id_filter(
        self, db_session, enable_factory_create, caplog
    ):
        """CompetitionID is an unsupported filter — it is logged but not applied to the DB query."""
        caplog.set_level(logging.INFO)
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency, legacy_competition_id=1234, application_status=ApplicationStatus.SUBMITTED
        )
        setup_application_submission(agency, legacy_competition_id=2345)
        setup_application_submission(agency, legacy_competition_id=3456)

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        competition = submission.application.competition
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CompetitionID</gran:FilterType>"
            f"<gran:FilterValue>{competition.public_competition_id}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        record = next(
            (
                r
                for r in caplog.records
                if "GetApplicationListExpanded Filter: CompetitionIDs" in r.message
            ),
            None,
        )
        assert record
        assert record.competition_ids == f"['{competition.public_competition_id}']"

    def test_get_application_list_expanded_response_logs_package_id_filter(
        self, db_session, enable_factory_create, caplog
    ):
        """PackageID is an unsupported filter — it is logged but not applied to the DB query."""
        caplog.set_level(logging.INFO)
        agency = AgencyFactory.create()
        submission = setup_application_submission(
            agency, legacy_package_id="PKG00118065", application_status=ApplicationStatus.SUBMITTED
        )
        setup_application_submission(agency, legacy_package_id="PKG00000001")
        setup_application_submission(agency, legacy_package_id="PKG00000002")

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        competition = submission.application.competition
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>PackageID</gran:FilterType>"
            f"<gran:FilterValue>{competition.legacy_package_id}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        record = next(
            (
                r
                for r in caplog.records
                if "GetApplicationListExpanded Filter: PackageIDs" in r.message
            ),
            None,
        )
        assert record
        assert record.package_ids == f"['{competition.legacy_package_id}']"

    def test_get_application_list_expanded_response_logs_submission_title_filter(
        self, db_session, enable_factory_create, caplog
    ):
        """SubmissionTitle is an unsupported filter — it is logged but not applied to the DB query."""
        caplog.set_level(logging.INFO)
        agency = AgencyFactory.create()
        setup_application_submission(agency, application_status=ApplicationStatus.SUBMITTED)
        setup_application_submission(agency)
        setup_application_submission(agency)

        _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>SubmissionTitle</gran:FilterType>"
            "<gran:FilterValue>My test submission</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_request = make_soap_request(request_xml, soap_client_certificate)
        request_schema = schemas.GetApplicationListExpandedRequest(
            **get_soap_operation_dict(request_xml, "GetApplicationListExpandedRequest")
        )
        get_application_list_expanded(
            db_session=db_session,
            request=request_schema,
            soap_request=soap_request,
            soap_config=make_soap_config(),
        )
        record = next(
            (
                r
                for r in caplog.records
                if "GetApplicationListExpanded Filter: SubmissionTitles" in r.message
            ),
            None,
        )
        assert record
        assert record.submission_titles == "['My test submission']"
