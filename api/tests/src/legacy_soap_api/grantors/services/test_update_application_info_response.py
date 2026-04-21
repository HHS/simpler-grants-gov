import io

import pytest

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.db.models.competition_models import (
    ApplicationSubmissionNote,
    ApplicationSubmissionTrackingNumber,
)
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.grantors.services.update_application_info_response import (
    get_update_application_info_response,
    update_application_info,
)
from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth, SOAPClientUserDoesNotHavePermission
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest, SoapRequestStreamer
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


def _make_soap_request(soap_client_certificate, tracking_number):
    request_xml = (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" '
        'xmlns:agen1="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:UpdateApplicationInfoRequest>"
        f"<gran:GrantsGovTrackingNumber>{tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:UpdateApplicationInfoRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    )
    return SOAPRequest(
        data=SoapRequestStreamer(stream=io.BytesIO(request_xml.encode("utf-8"))),
        full_path="x",
        headers={},
        method="POST",
        api_name=SimplerSoapAPI.GRANTORS,
        operation_name="UpdateApplicationInfoRequest",
        auth=SOAPAuth(certificate=soap_client_certificate),
    )


def _make_operation_config():
    return SOAPOperationConfig(
        request_operation_name="UpdateApplicationInfoRequest",
        response_operation_name="UpdateApplicationInfoResponse",
        privileges={Privilege.LEGACY_AGENCY_ASSIGNER},
    )


def _setup_submission(agency, application_status=ApplicationStatus.ACCEPTED, retrieved=False):
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory.create(opportunity=opportunity)
    application = ApplicationFactory.create(
        competition=competition,
        application_status=application_status,
    )
    submission = ApplicationSubmissionFactory.create(application=application)
    if retrieved:
        ApplicationSubmissionRetrievedFactory.create(application_submission=submission)
    return submission


class TestUpdateApplicationInfo:
    def test_successful_assign_tracking_number(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED, retrieved=True)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            assign_agency_tracking_number="AGENCY-123",
        )

        tracking_num, assign_result, notes_result = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert tracking_num == tracking_number
        assert assign_result is not None
        assert assign_result.success == "true"
        assert notes_result is None

        # Verify tracking number record was inserted
        tracking_numbers = (
            db_session.query(ApplicationSubmissionTrackingNumber)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(tracking_numbers) == 1
        assert tracking_numbers[0].tracking_number == "AGENCY-123"

    def test_successful_save_agency_notes(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            save_agency_notes="Test agency notes",
        )

        tracking_num, assign_result, notes_result = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert tracking_num == tracking_number
        assert assign_result is None
        assert notes_result is not None
        assert notes_result.success == "true"

        # Verify note record was inserted
        notes = (
            db_session.query(ApplicationSubmissionNote)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(notes) == 1
        assert notes[0].note == "Test agency notes"

    def test_successful_assign_tracking_number_and_save_notes(
        self, db_session, enable_factory_create
    ):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED, retrieved=True)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            assign_agency_tracking_number="AGENCY-456",
            save_agency_notes="Notes with tracking number",
        )

        _, assign_result, notes_result = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert assign_result is not None
        assert assign_result.success == "true"
        assert assign_result.error_message is None
        assert notes_result is not None
        assert notes_result.success == "true"
        assert notes_result.error_message is None

        # Verify both records were inserted
        tracking_numbers = (
            db_session.query(ApplicationSubmissionTrackingNumber)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(tracking_numbers) == 1

        notes = (
            db_session.query(ApplicationSubmissionNote)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(notes) == 1

    def test_submission_not_found_returns_failed_response(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        tracking_number = "GRANT99999999"
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            assign_agency_tracking_number="AGENCY-123",
        )

        _, assign_result, notes_result = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert assign_result is not None
        assert assign_result.success == "false"
        assert (
            assign_result.error_message
            == "Exception caught assigning agency tracking number.(Authorization Failure)"
        )
        assert notes_result is not None
        assert notes_result.success == "false"
        assert (
            notes_result.error_message
            == "Exception caught saving agency notes.(Authorization Failure)"
        )

    def test_in_progress_status_returns_failed_response(self, db_session, enable_factory_create):
        """IN_PROGRESS applications (so implicitly not retrieved) should not be able to have their agency tracking number assigned."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.IN_PROGRESS)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            assign_agency_tracking_number="AGENCY-123",
            save_agency_notes="Test agency notes",
        )

        _, assign_result, notes_result = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert assign_result is not None
        assert assign_result.success == "false"
        assert (
            assign_result.error_message
            == f"Exception caught assigning agency tracking number.(Expected an Application status of:'Received by Agency' , but found a status of 'Received' for {tracking_number})"
        )
        assert notes_result is not None
        assert notes_result.success == "true"
        assert notes_result.error_message is None

    def test_tracking_number_already_assigned_returns_failure(
        self, db_session, enable_factory_create
    ):
        """Agency tracking number can only be assigned once."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        user, _, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_ASSIGNER}
        )

        # Pre-insert a tracking number to simulate a prior assignment
        ApplicationSubmissionTrackingNumberFactory.create(
            application_submission=submission,
            tracking_number="EXISTING-123",
            created_by_user=user,
            modified_by_user=user,
        )

        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            assign_agency_tracking_number="NEW-AGENCY-456",
        )

        _, assign_result, _ = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert assign_result is not None
        assert assign_result.success == "false"
        assert (
            assign_result.error_message
            == f"Exception caught assigning agency tracking number.(Expected an Application status of:'Received by Agency' , but found a status of 'Agency Tracking Number Assigned' for {tracking_number})"
        )

        # Verify no additional tracking number record was inserted
        tracking_numbers = (
            db_session.query(ApplicationSubmissionTrackingNumber)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(tracking_numbers) == 1
        assert tracking_numbers[0].tracking_number == "EXISTING-123"

    def test_notes_can_be_saved_multiple_times(self, db_session, enable_factory_create):
        """Agency notes can be updated multiple times."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        # Save notes first time
        request_schema_1 = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            save_agency_notes="First note",
        )
        _, _, notes_result_1 = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema_1,
            soap_config=_make_operation_config(),
        )
        assert notes_result_1 is not None
        assert notes_result_1.success == "true"

        # Save notes second time
        request_schema_2 = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            save_agency_notes="Second note",
        )
        _, _, notes_result_2 = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema_2,
            soap_config=_make_operation_config(),
        )
        assert notes_result_2 is not None
        assert notes_result_2.success == "true"

        # Verify both notes were saved
        notes = (
            db_session.query(ApplicationSubmissionNote)
            .filter_by(application_submission_id=submission.application_submission_id)
            .all()
        )
        assert len(notes) == 2

    def test_user_without_permission_returns_fault(self, db_session, enable_factory_create):
        """User without LEGACY_AGENCY_ASSIGNER privilege should be rejected."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        # Give user VIEWER privilege instead of ASSIGNER
        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            assign_agency_tracking_number="AGENCY-123",
        )

        with pytest.raises(SOAPClientUserDoesNotHavePermission):
            update_application_info(
                db_session=db_session,
                soap_request=soap_request,
                update_application_info_request=request_schema,
                soap_config=_make_operation_config(),
            )

    def test_application_status_does_not_impact_agency_note_creation(
        self, db_session, enable_factory_create
    ):
        """An application, regardless of application_status, should be updatable for agency notes."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            grants_gov_tracking_number=tracking_number,
            save_agency_notes="Notes for accepted app",
            assign_agency_tracking_number="AGENCY-123",
        )

        tracking_num, assign_result, notes_result = update_application_info(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert assign_result is not None
        assert assign_result.success == "false"
        assert (
            assign_result.error_message
            == f"Exception caught assigning agency tracking number.(Expected an Application status of:'Received by Agency' , but found a status of 'Validated' for {tracking_number})"
        )
        assert tracking_num == tracking_number
        assert notes_result is not None
        assert notes_result.success == "true"


class TestGetUpdateApplicationInfoResponse:
    def test_response_envelope_structure(self):
        response = get_update_application_info_response(
            grants_gov_tracking_number="GRANT12345678",
            assign_agency_tracking_number_result=grantor_schemas.AssignAgencyTrackingNumberResult(
                success="true"
            ),
            save_agency_notes_result=grantor_schemas.SaveAgencyNotesResult(success="true"),
        )

        assert response.success == "true"
        assert response.grants_gov_tracking_number == "GRANT12345678"
        assert response.assign_agency_tracking_number_result is not None
        assert response.assign_agency_tracking_number_result.success == "true"
        assert response.save_agency_notes_result is not None
        assert response.save_agency_notes_result.success == "true"

    def test_response_envelope_with_no_optional_results(self):
        response = get_update_application_info_response(
            grants_gov_tracking_number="GRANT12345678",
            assign_agency_tracking_number_result=None,
            save_agency_notes_result=None,
        )

        assert response.success == "true"
        assert response.grants_gov_tracking_number == "GRANT12345678"
        assert response.assign_agency_tracking_number_result is None
        assert response.save_agency_notes_result is None

    def test_response_envelope_has_ns2_prefix(self):
        """Verify the SOAP envelope dict uses ns2: prefix for the operation name."""
        response = get_update_application_info_response(
            grants_gov_tracking_number="GRANT12345678",
            assign_agency_tracking_number_result=None,
            save_agency_notes_result=grantor_schemas.SaveAgencyNotesResult(success="true"),
        )

        envelope_dict = response.to_soap_envelope_dict("UpdateApplicationInfoResponse")
        assert "ns2:UpdateApplicationInfoResponse" in envelope_dict["Envelope"]["Body"]
