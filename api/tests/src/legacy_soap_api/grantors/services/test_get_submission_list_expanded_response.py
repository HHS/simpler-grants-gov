import io

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.grantors.services import get_submission_list_expanded_response
from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas import (
    SOAPRequest,
    SoapRequestStreamer,
    SOAPResponse,
)
from src.legacy_soap_api.soap_payload_handler import SOAPPayload, get_soap_operation_dict
from tests.lib.data_factories import setup_cert_user
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    ApplicationSubmissionRetrievedFactory,
    ApplicationSubmissionTrackingNumberFactory,
    CompetitionFactory,
    OpportunityFactory,
)


def _make_soap_request(soap_client_certificate, tracking_number, status):
    request_xml = (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:GetSubmissionListExpandedRequest>"
        "<gran:ExpandedApplicationFilter>"
        "<gran:FilterType>Status</gran:FilterType>"
        f"<gran:FilterValue>{status}</gran:FilterValue>"
        "</gran:ExpandedApplicationFilter>"
        "</agen:GetSubmissionListExpandedRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    )
    return SOAPRequest(
        data=SoapRequestStreamer(stream=io.BytesIO(request_xml.encode("utf-8"))),
        full_path="x",
        headers={},
        method="POST",
        api_name=SimplerSoapAPI.GRANTORS,
        operation_name="GetSubmissionListExpandedRequest",
        auth=SOAPAuth(certificate=soap_client_certificate),
    )


def _make_operation_config():
    return SOAPOperationConfig(
        request_operation_name="GetSubmissionListExpandedRequest",
        response_operation_name="GetSubmissionListExpandedResponse",
        privileges={Privilege.LEGACY_AGENCY_VIEWER},
        always_call_simpler=True,
    )


def _setup_submission(agency, application_status=ApplicationStatus.ACCEPTED):
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory.create(opportunity=opportunity)
    application = ApplicationFactory.create(
        competition=competition,
        application_status=application_status,
    )
    return ApplicationSubmissionFactory.create(application=application)


class TestGetSubmissionListExpandedResponseStatusFilter:
    def test_get_submission_list_expanded_filters_on_agency_tracking_number_assigned(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        ApplicationSubmissionTrackingNumberFactory.create(application_submission=submission)
        for _ in range(3):
            sub = _setup_submission(agency, ApplicationStatus.ACCEPTED)
            ApplicationSubmissionRetrievedFactory.create(
                application_submission=sub,
            )
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        soap_request = _make_soap_request(
            soap_client_certificate, tracking_number, "Agency Tracking Number Assigned"
        )
        payload = SOAPPayload(soap_payload=soap_request.data.head().decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantor_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        result = get_submission_list_expanded_response(
            db_session=db_session,
            request=schema,
            soap_request=soap_request,
            proxy_response=SOAPResponse(data="", status_code=200, headers={}),
            soap_config=_make_operation_config(),
        )
        assert result.success is True
        assert result.available_application_number == 1
        assert result.submission_info[0].grants_gov_tracking_number == tracking_number
        assert (
            result.submission_info[0].grants_gov_application_status
            == "Agency Tracking Number Assigned"
        )

    def test_get_submission_list_expanded_agency_tracking_number_assigned_filter_supercedes_received_by_agency(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        ApplicationSubmissionTrackingNumberFactory.create(application_submission=submission)
        ApplicationSubmissionRetrievedFactory.create(application_submission=submission)
        for _ in range(3):
            sub = _setup_submission(agency, ApplicationStatus.ACCEPTED)
            ApplicationSubmissionRetrievedFactory.create(
                application_submission=sub,
            )
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        soap_request = _make_soap_request(
            soap_client_certificate, tracking_number, "Agency Tracking Number Assigned"
        )
        payload = SOAPPayload(soap_payload=soap_request.data.head().decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantor_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        result = get_submission_list_expanded_response(
            db_session=db_session,
            request=schema,
            soap_request=soap_request,
            proxy_response=SOAPResponse(data="", status_code=200, headers={}),
            soap_config=_make_operation_config(),
        )
        assert result.success is True
        assert result.available_application_number == 1
        assert result.submission_info[0].grants_gov_tracking_number == tracking_number
        assert (
            result.submission_info[0].grants_gov_application_status
            == "Agency Tracking Number Assigned"
        )

    def test_get_submission_list_expanded_filters_on_received_by_agency(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        ApplicationSubmissionRetrievedFactory.create(
            application_submission=submission,
        )
        submission.application_submission_tracking_numbers = []
        db_session.add(submission)
        for _ in range(3):
            sub = _setup_submission(agency, ApplicationStatus.ACCEPTED)
            ApplicationSubmissionTrackingNumberFactory.create(application_submission=sub)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        soap_request = _make_soap_request(
            soap_client_certificate, tracking_number, "Received by Agency"
        )
        payload = SOAPPayload(soap_payload=soap_request.data.head().decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantor_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        result = get_submission_list_expanded_response(
            db_session=db_session,
            request=schema,
            soap_request=soap_request,
            proxy_response=SOAPResponse(data="", status_code=200, headers={}),
            soap_config=_make_operation_config(),
        )
        assert result.success is True
        assert result.available_application_number == 1
        assert result.submission_info[0].grants_gov_tracking_number == tracking_number
        assert result.submission_info[0].grants_gov_application_status == "Received by Agency"

    def test_get_submission_list_expanded_received_by_tracking_number_filter_does_not_return_agency_tracking_number_assigned_status(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        ApplicationSubmissionTrackingNumberFactory.create(application_submission=submission)
        ApplicationSubmissionRetrievedFactory.create(application_submission=submission)
        for _ in range(3):
            _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        soap_request = _make_soap_request(
            soap_client_certificate, tracking_number, "Received by Agency"
        )
        payload = SOAPPayload(soap_payload=soap_request.data.head().decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantor_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        result = get_submission_list_expanded_response(
            db_session=db_session,
            request=schema,
            soap_request=soap_request,
            proxy_response=SOAPResponse(data="", status_code=200, headers={}),
            soap_config=_make_operation_config(),
        )
        assert result.success is True
        assert result.available_application_number == 0

    def test_get_submission_list_expanded_agency_tracking_number_received_filter_supersedes_application_status(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        ApplicationSubmissionTrackingNumberFactory.create(application_submission=submission)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number, "Validated")
        payload = SOAPPayload(soap_payload=soap_request.data.head().decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantor_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        result = get_submission_list_expanded_response(
            db_session=db_session,
            request=schema,
            soap_request=soap_request,
            proxy_response=SOAPResponse(data="", status_code=200, headers={}),
            soap_config=_make_operation_config(),
        )
        assert result.success is True
        assert result.available_application_number == 0

    def test_successful_get_submission_list_expanded_received_by_agency_filter_supersedes_application_status(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        ApplicationSubmissionRetrievedFactory.create(application_submission=submission)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number, "Validated")
        payload = SOAPPayload(soap_payload=soap_request.data.head().decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantor_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        result = get_submission_list_expanded_response(
            db_session=db_session,
            request=schema,
            soap_request=soap_request,
            proxy_response=SOAPResponse(data="", status_code=200, headers={}),
            soap_config=_make_operation_config(),
        )
        assert result.success is True
        assert result.available_application_number == 0
