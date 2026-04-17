import io

import pytest

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.db.models.competition_models import ApplicationSubmissionRetrieved
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.grantors.services.confirm_application_delivery_response import (
    confirm_application_delivery,
    get_confirm_application_delivery_response,
)
from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth, SOAPClientUserDoesNotHavePermission
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest, SoapRequestStreamer
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException
from tests.lib.data_factories import setup_cert_user
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    ApplicationSubmissionRetrievedFactory,
    CompetitionFactory,
    OpportunityFactory,
)


def _make_soap_request(soap_client_certificate, tracking_number):
    request_xml = (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:ConfirmApplicationDeliveryRequest>"
        f"<gran:GrantsGovTrackingNumber>{tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:ConfirmApplicationDeliveryRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    )
    return SOAPRequest(
        data=SoapRequestStreamer(stream=io.BytesIO(request_xml.encode("utf-8"))),
        full_path="x",
        headers={},
        method="POST",
        api_name=SimplerSoapAPI.GRANTORS,
        operation_name="ConfirmApplicationDeliveryRequest",
        auth=SOAPAuth(certificate=soap_client_certificate),
    )


def _make_operation_config():
    return SOAPOperationConfig(
        request_operation_name="ConfirmApplicationDeliveryRequest",
        response_operation_name="ConfirmApplicationDeliveryResponse",
        privileges={Privilege.LEGACY_AGENCY_GRANT_RETRIEVER},
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


class TestConfirmApplicationDeliveryResponse:
    def test_successful_confirm_delivery(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.ConfirmApplicationDeliveryRequest(
            GrantsGovTrackingNumber=tracking_number,
        )

        returned_tracking_number = confirm_application_delivery(
            db_session=db_session,
            soap_request=soap_request,
            confirm_application_delivery_request=request_schema,
            soap_config=_make_operation_config(),
        )

        result = get_confirm_application_delivery_response(
            grants_gov_tracking_number=tracking_number,
        )

        assert returned_tracking_number == tracking_number
        assert result.response_message == "Success"
        assert result.grants_gov_tracking_number == tracking_number

        # Verify a retrieval record was inserted
        retrievals = (
            db_session.query(ApplicationSubmissionRetrieved)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(retrievals) == 1

    def test_submitted_status_returns_fault(self, db_session, enable_factory_create):
        """SUBMITTED maps to 'Received' in grants.gov, not 'Validated'.
        Only 'Validated' (ACCEPTED) is valid for ConfirmApplicationDelivery."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.SUBMITTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.ConfirmApplicationDeliveryRequest(
            GrantsGovTrackingNumber=tracking_number,
        )

        with pytest.raises(SOAPFaultException) as exc:
            confirm_application_delivery(
                db_session=db_session,
                soap_request=soap_request,
                confirm_application_delivery_request=request_schema,
                soap_config=_make_operation_config(),
            )
        assert (
            exc.value.fault.faultstring
            == f"Failed to confirm application delivery.(Expected an Application status of:'Validated' , but found a status of 'Received' for GRANT{submission.legacy_tracking_number})"
        )

    def test_already_retrieved_by_same_user_returns_fault(self, db_session, enable_factory_create):
        """The same user calling ConfirmApplicationDelivery twice should fail."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        # Pre-insert a retrieval record to simulate a prior call by this user
        user, _, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        ApplicationSubmissionRetrievedFactory.create(
            application_submission=submission,
            created_by_user=user,
            modified_by_user=user,
        )
        db_session.commit()

        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.ConfirmApplicationDeliveryRequest(
            GrantsGovTrackingNumber=tracking_number,
        )

        with pytest.raises(SOAPFaultException) as exc:
            confirm_application_delivery(
                db_session=db_session,
                soap_request=soap_request,
                confirm_application_delivery_request=request_schema,
                soap_config=_make_operation_config(),
            )
        assert (
            exc.value.fault.faultstring
            == f"Failed to confirm application delivery.(Expected an Application status of:'Validated' , but found a status of 'Received by Agency' for GRANT{submission.legacy_tracking_number})"
        )

        # Verify no additional retrieval record was inserted
        retrievals = (
            db_session.query(ApplicationSubmissionRetrieved)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(retrievals) == 1

    def test_different_user_can_retrieve_already_retrieved_submission(
        self, db_session, enable_factory_create
    ):
        """A different user should be able to retrieve a submission
        even if another user has already retrieved it."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        # First user retrieves the submission
        first_user, _, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER})
        ApplicationSubmissionRetrievedFactory.create(
            application_submission=submission,
            created_by_user=first_user,
            modified_by_user=first_user,
        )
        db_session.commit()

        # Second user attempts to retrieve the same submission
        _, _, second_soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        soap_request = _make_soap_request(second_soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.ConfirmApplicationDeliveryRequest(
            GrantsGovTrackingNumber=tracking_number,
        )

        tracking_number_result = confirm_application_delivery(
            db_session=db_session,
            soap_request=soap_request,
            confirm_application_delivery_request=request_schema,
            soap_config=_make_operation_config(),
        )

        result = get_confirm_application_delivery_response(
            grants_gov_tracking_number=tracking_number,
        )

        assert tracking_number_result == tracking_number
        assert result.response_message == "Success"

        # Verify there are now 2 retrieval records
        retrievals = (
            db_session.query(ApplicationSubmissionRetrieved)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(retrievals) == 2

    def test_invalid_status_returns_fault(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.IN_PROGRESS)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.ConfirmApplicationDeliveryRequest(
            GrantsGovTrackingNumber=tracking_number,
        )

        with pytest.raises(SOAPFaultException) as exc:
            confirm_application_delivery(
                db_session=db_session,
                soap_request=soap_request,
                confirm_application_delivery_request=request_schema,
                soap_config=_make_operation_config(),
            )
        assert (
            exc.value.fault.faultstring
            == f"Failed to confirm application delivery.(Expected an Application status of:'Validated' , but found a status of 'Received' for GRANT{submission.legacy_tracking_number})"
        )

        # Verify NO retrieval record was inserted
        retrievals = (
            db_session.query(ApplicationSubmissionRetrieved)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(retrievals) == 0

    def test_submission_not_found_raises_fault(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        tracking_number = "GRANT99999999"

        _, _, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.ConfirmApplicationDeliveryRequest(
            GrantsGovTrackingNumber=tracking_number,
        )

        with pytest.raises(SOAPFaultException) as exc:
            confirm_application_delivery(
                db_session=db_session,
                soap_request=soap_request,
                confirm_application_delivery_request=request_schema,
                soap_config=_make_operation_config(),
            )
        assert (
            exc.value.fault.faultstring
            == "Unable to find application from tracking number. Failed to confirm application delivery."
        )

    def test_user_without_privileges_raises_permission_error(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        other_agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        # User has correct privilege but for a DIFFERENT agency
        _, _, soap_client_certificate = setup_cert_user(
            other_agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.ConfirmApplicationDeliveryRequest(
            GrantsGovTrackingNumber=tracking_number,
        )

        with pytest.raises(SOAPClientUserDoesNotHavePermission) as exc:
            confirm_application_delivery(
                db_session=db_session,
                soap_request=soap_request,
                confirm_application_delivery_request=request_schema,
                soap_config=_make_operation_config(),
            )
        assert str(exc.value) == "User did not have permission to confirm application delivery"

    def test_response_envelope_dict_structure(self):
        tracking_number = "GRANT12345678"

        result = get_confirm_application_delivery_response(
            grants_gov_tracking_number=tracking_number,
        )

        envelope_dict = result.to_soap_envelope_dict("ConfirmApplicationDeliveryResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "ns2:ConfirmApplicationDeliveryResponse": {
                        "GrantsGovTrackingNumber": tracking_number,
                        "ResponseMessage": "Success",
                    }
                }
            }
        }
        assert envelope_dict == expected
