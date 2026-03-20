import io

import pytest

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.db.models.competition_models import (
    ApplicationSubmissionNote,
    ApplicationSubmissionTrackingNumber,
)
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.grantors.services.update_application_info_response import (
    update_application_info_response,
)
from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth, SOAPClientUserDoesNotHavePermission
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SoapRequestStreamer
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException
from tests.lib.data_factories import setup_cert_user
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
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


def _setup_submission(agency, application_status=ApplicationStatus.ACCEPTED):
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory.create(opportunity=opportunity)
    application = ApplicationFactory.create(
        competition=competition,
        application_status=application_status,
    )
    return ApplicationSubmissionFactory.create(application=application)


class TestUpdateApplicationInfoResponse:
    def test_successful_assign_tracking_number(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            AssignAgencyTrackingNumber="AGENCY-123",
        )

        result = update_application_info_response(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert result.success == "true"
        assert result.grants_gov_tracking_number == tracking_number
        assert result.assign_agency_tracking_number_result is not None
        assert result.assign_agency_tracking_number_result.success == "true"
        assert result.save_agency_notes_result is None

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
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            SaveAgencyNotes="Test agency notes",
        )

        result = update_application_info_response(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert result.success == "true"
        assert result.grants_gov_tracking_number == tracking_number
        assert result.assign_agency_tracking_number_result is None
        assert result.save_agency_notes_result is not None
        assert result.save_agency_notes_result.success == "true"

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
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            AssignAgencyTrackingNumber="AGENCY-456",
            SaveAgencyNotes="Notes with tracking number",
        )

        result = update_application_info_response(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert result.success == "true"
        assert result.assign_agency_tracking_number_result is not None
        assert result.assign_agency_tracking_number_result.success == "true"
        assert result.save_agency_notes_result is not None
        assert result.save_agency_notes_result.success == "true"

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

    def test_submission_not_found_returns_fault(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        tracking_number = "GRANT99999999"
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            AssignAgencyTrackingNumber="AGENCY-123",
        )

        with pytest.raises(SOAPFaultException):
            update_application_info_response(
                db_session=db_session,
                soap_request=soap_request,
                update_application_info_request=request_schema,
                soap_config=_make_operation_config(),
            )

    def test_in_progress_status_returns_fault(self, db_session, enable_factory_create):
        """IN_PROGRESS applications should not be updatable."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.IN_PROGRESS)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            AssignAgencyTrackingNumber="AGENCY-123",
        )

        with pytest.raises(SOAPFaultException):
            update_application_info_response(
                db_session=db_session,
                soap_request=soap_request,
                update_application_info_request=request_schema,
                soap_config=_make_operation_config(),
            )

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
        db_session.commit()

        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            AssignAgencyTrackingNumber="NEW-AGENCY-456",
        )

        result = update_application_info_response(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert result.assign_agency_tracking_number_result is not None
        assert result.assign_agency_tracking_number_result.success == "false"

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
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        # Save notes first time
        request_schema_1 = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            SaveAgencyNotes="First note",
        )
        result_1 = update_application_info_response(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema_1,
            soap_config=_make_operation_config(),
        )
        assert result_1.save_agency_notes_result is not None
        assert result_1.save_agency_notes_result.success == "true"

        # Save notes second time
        request_schema_2 = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            SaveAgencyNotes="Second note",
        )
        result_2 = update_application_info_response(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema_2,
            soap_config=_make_operation_config(),
        )
        assert result_2.save_agency_notes_result is not None
        assert result_2.save_agency_notes_result.success == "true"

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
        db_session.commit()

        # Give user VIEWER privilege instead of ASSIGNER
        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            AssignAgencyTrackingNumber="AGENCY-123",
        )

        with pytest.raises(SOAPClientUserDoesNotHavePermission):
            update_application_info_response(
                db_session=db_session,
                soap_request=soap_request,
                update_application_info_request=request_schema,
                soap_config=_make_operation_config(),
            )

    def test_accepted_status_is_valid(self, db_session, enable_factory_create):
        """ACCEPTED status applications should also be updatable."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            SaveAgencyNotes="Notes for accepted app",
        )

        result = update_application_info_response(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        assert result.success == "true"
        assert result.save_agency_notes_result is not None
        assert result.save_agency_notes_result.success == "true"

    def test_response_envelope_has_ns2_prefix(self, db_session, enable_factory_create):
        """Verify the SOAP envelope dict uses ns2: prefix for the operation name."""
        agency = AgencyFactory.create()
        submission = _setup_submission(agency, ApplicationStatus.ACCEPTED)
        tracking_number = f"GRANT{submission.legacy_tracking_number}"
        db_session.commit()

        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_ASSIGNER})
        soap_request = _make_soap_request(soap_client_certificate, tracking_number)

        request_schema = grantor_schemas.UpdateApplicationInfoRequest(
            GrantsGovTrackingNumber=tracking_number,
            SaveAgencyNotes="Test notes",
        )

        result = update_application_info_response(
            db_session=db_session,
            soap_request=soap_request,
            update_application_info_request=request_schema,
            soap_config=_make_operation_config(),
        )

        envelope_dict = result.to_soap_envelope_dict("UpdateApplicationInfoResponse")
        assert "ns2:UpdateApplicationInfoResponse" in envelope_dict["Envelope"]["Body"]
