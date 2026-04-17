import logging
from typing import cast

import src.adapters.db as db
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import (
    ApplicationSubmission,
    ApplicationSubmissionNote,
    ApplicationSubmissionTrackingNumber,
)
from src.db.models.user_models import User
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPClientUserDoesNotHavePermission,
    validate_certificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import (
    get_application_submission_by_legacy_tracking_number,
)

logger = logging.getLogger(__name__)


def _assign_agency_tracking_number(
    db_session: db.Session,
    application_submission: ApplicationSubmission,
    tracking_number: str,
    legacy_tracking_number: str,
    user: User,
) -> grantor_schemas.AssignAgencyTrackingNumberResult:
    if application_submission.application_submission_tracking_numbers:
        logger.info(
            "Agency tracking number has already been assigned.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "legacy_tracking_number": legacy_tracking_number,
                "response_operation_name": "UpdateApplicationInfoResponse",
            },
        )
        error_message = (
            "Exception caught assigning agency tracking number.(Expected an Application status of:"
            f"'Received by Agency' , but found a status of 'Agency Tracking Number Assigned' for {legacy_tracking_number})"
        )
        return grantor_schemas.AssignAgencyTrackingNumberResult(
            success="false", error_message=error_message
        )
    elif not application_submission.application_submission_retrievals:
        logger.info(
            "Application is in invalid status.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "legacy_tracking_number": legacy_tracking_number,
                "response_operation_name": "UpdateApplicationInfoResponse",
            },
        )
        if application_submission.application.application_status == ApplicationStatus.ACCEPTED:
            error_message = (
                "Exception caught assigning agency tracking number.(Expected an Application status of:"
                f"'Received by Agency' , but found a status of 'Validated' for {legacy_tracking_number})"
            )
        else:
            error_message = (
                "Exception caught assigning agency tracking number.(Expected an Application status of:"
                f"'Received by Agency' , but found a status of 'Received' for {legacy_tracking_number})"
            )
        return grantor_schemas.AssignAgencyTrackingNumberResult(
            success="false", error_message=error_message
        )

    tracking_number_record = ApplicationSubmissionTrackingNumber(
        application_submission=application_submission,
        tracking_number=tracking_number,
        created_by_user=user,
        modified_by_user=user,
    )
    db_session.add(tracking_number_record)

    return grantor_schemas.AssignAgencyTrackingNumberResult(success="true")


def _save_agency_notes(
    db_session: db.Session,
    application_submission: ApplicationSubmission,
    notes: str,
    user: User,
) -> grantor_schemas.SaveAgencyNotesResult:
    note_record = ApplicationSubmissionNote(
        application_submission=application_submission,
        note=notes,
        created_by_user=user,
        modified_by_user=user,
    )
    db_session.add(note_record)

    return grantor_schemas.SaveAgencyNotesResult(success="true")


def update_application_info(
    db_session: db.Session,
    soap_request: SOAPRequest,
    update_application_info_request: grantor_schemas.UpdateApplicationInfoRequest,
    soap_config: SOAPOperationConfig,
) -> tuple[
    str | None,
    grantor_schemas.AssignAgencyTrackingNumberResult | None,
    grantor_schemas.SaveAgencyNotesResult | None,
]:
    """Validate and process the update application info request.

    Performs all data gathering, validation, authorization, and creates
    tracking number / note records as side effects.

    Returns a tuple of (grants_gov_tracking_number, assign_result, notes_result).
    Raises SOAPFaultException or SOAPClientUserDoesNotHavePermission on failure.
    """

    certificate = validate_certificate(
        db_session, soap_auth=soap_request.auth, api_name=soap_request.api_name
    )

    legacy_tracking_number = cast(str, update_application_info_request.grants_gov_tracking_number)

    application_submission = get_application_submission_by_legacy_tracking_number(
        db_session, legacy_tracking_number
    )

    if not application_submission:
        logger.info(
            "Submission not found",
            extra={
                "user_id": certificate.user.user_id,
                "legacy_tracking_number": legacy_tracking_number,
                "response_operation_name": "UpdateApplicationInfoResponse",
            },
        )
        return (
            update_application_info_request.grants_gov_tracking_number,
            grantor_schemas.AssignAgencyTrackingNumberResult(
                success="false",
                error_message="Exception caught assigning agency tracking number.(Authorization Failure)",
            ),
            grantor_schemas.SaveAgencyNotesResult(
                success="false",
                error_message="Exception caught saving agency notes.(Authorization Failure)",
            ),
        )

    if soap_config.privileges is not None:
        if not can_access(
            certificate.user,
            soap_config.privileges,
            application_submission.application.competition.opportunity.agency_record,
        ):
            logger.info(
                "User did not have permission to update application info",
                extra={
                    "user_id": certificate.user.user_id,
                    "application_submission_id": application_submission.application_submission_id,
                    "privileges": soap_config.privileges,
                },
            )
            raise SOAPClientUserDoesNotHavePermission(
                "User did not have permission to update application info"
            )
    else:
        raise ValueError("Privileges must be configured for UpdateApplicationInfo")

    assign_result = None
    notes_result = None

    if update_application_info_request.assign_agency_tracking_number is not None:
        assign_result = _assign_agency_tracking_number(
            db_session,
            application_submission,
            update_application_info_request.assign_agency_tracking_number,
            legacy_tracking_number,
            certificate.user,
        )

    if update_application_info_request.save_agency_notes is not None:
        notes_result = _save_agency_notes(
            db_session,
            application_submission,
            update_application_info_request.save_agency_notes,
            certificate.user,
        )

    return (
        update_application_info_request.grants_gov_tracking_number,
        assign_result,
        notes_result,
    )


def get_update_application_info_response(
    grants_gov_tracking_number: str | None,
    assign_agency_tracking_number_result: grantor_schemas.AssignAgencyTrackingNumberResult | None,
    save_agency_notes_result: grantor_schemas.SaveAgencyNotesResult | None,
) -> grantor_schemas.UpdateApplicationInfoResponseSOAPEnvelope:
    """Build the SOAP response envelope from the gathered data."""
    return grantor_schemas.UpdateApplicationInfoResponseSOAPEnvelope(
        grants_gov_tracking_number=grants_gov_tracking_number,
        success="true",
        assign_agency_tracking_number_result=assign_agency_tracking_number_result,
        save_agency_notes_result=save_agency_notes_result,
    )
