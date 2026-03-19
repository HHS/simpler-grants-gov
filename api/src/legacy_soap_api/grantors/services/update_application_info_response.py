import logging

from apiflask.exceptions import HTTPError
from sqlalchemy import select

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import (
    ApplicationSubmission,
    ApplicationSubmissionNote,
    ApplicationSubmissionTrackingNumber,
)
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.grantors.fault_messages import (
    UpdateApplicationInfoInvalidStatus,
    UpdateApplicationInfoSubmissionNotFound,
    UpdateApplicationInfoTrackingNumberAlreadyAssigned,
)
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPClientUserDoesNotHavePermission,
    validate_certificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

logger = logging.getLogger(__name__)

VALID_STATUSES_FOR_UPDATE = {ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED}


def get_application_submission_by_legacy_tracking_number(
    db_session: db.Session, legacy_tracking_number: int
) -> ApplicationSubmission | None:
    return db_session.execute(
        select(ApplicationSubmission).where(
            ApplicationSubmission.legacy_tracking_number == legacy_tracking_number,
        )
    ).scalar_one_or_none()


def update_application_info_response(
    db_session: db.Session,
    soap_request: SOAPRequest,
    update_application_info_request: grantor_schemas.UpdateApplicationInfoRequest,
    soap_config: SOAPOperationConfig,
) -> grantor_schemas.UpdateApplicationInfoResponseSOAPEnvelope:
    legacy_tracking_number = update_application_info_request.grants_gov_tracking_number

    # grants_gov_tracking_number is validated as non-None by the pydantic schema
    assert legacy_tracking_number is not None

    if legacy_tracking_number.startswith("GRANT"):
        legacy_tracking_number = legacy_tracking_number.split("GRANT")[1]

    application_submission = get_application_submission_by_legacy_tracking_number(
        db_session, int(legacy_tracking_number)
    )

    if not application_submission:
        logger.info(
            f"Unable to find submission legacy_tracking_number {legacy_tracking_number}.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "response_operation_name": "UpdateApplicationInfoResponse",
            },
        )
        raise SOAPFaultException(
            "Submission not found for update application info",
            fault=UpdateApplicationInfoSubmissionNotFound,
        )

    application = application_submission.application

    if application.application_status not in VALID_STATUSES_FOR_UPDATE:
        logger.info(
            "Application status is not valid for update application info.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "application_status": application.application_status,
                "legacy_tracking_number": legacy_tracking_number,
                "response_operation_name": "UpdateApplicationInfoResponse",
            },
        )
        raise SOAPFaultException(
            "Application status is not valid for update application info",
            fault=UpdateApplicationInfoInvalidStatus,
        )

    certificate = validate_certificate(
        db_session, soap_auth=soap_request.auth, api_name=soap_request.api_name
    )

    if soap_config.privileges is None:
        raise ValueError("Privileges must be configured for UpdateApplicationInfo")

    try:
        verify_access(
            certificate.user,
            soap_config.privileges,
            application.competition.opportunity.agency_record,
        )
    except HTTPError as e:
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
        ) from e

    assign_result = None
    notes_result = None

    # Assign agency tracking number if provided
    if update_application_info_request.assign_agency_tracking_number is not None:
        existing_tracking_number = (
            db_session.execute(
                select(ApplicationSubmissionTrackingNumber).where(
                    ApplicationSubmissionTrackingNumber.application_submission_id
                    == application_submission.application_submission_id,
                )
            )
            .scalars()
            .first()
        )

        if existing_tracking_number:
            logger.info(
                "Agency tracking number has already been assigned.",
                extra={
                    "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                    "legacy_tracking_number": legacy_tracking_number,
                    "response_operation_name": "UpdateApplicationInfoResponse",
                },
            )
            raise SOAPFaultException(
                "Agency tracking number has already been assigned",
                fault=UpdateApplicationInfoTrackingNumberAlreadyAssigned,
            )

        tracking_number_record = ApplicationSubmissionTrackingNumber(
            application_submission_id=application_submission.application_submission_id,
            tracking_number=update_application_info_request.assign_agency_tracking_number,
            created_by_user_id=certificate.user.user_id,
            modified_by_user_id=certificate.user.user_id,
        )
        db_session.add(tracking_number_record)

        assign_result = grantor_schemas.AssignAgencyTrackingNumberResult(
            success="true",
        )

    # Save agency notes if provided
    if update_application_info_request.save_agency_notes is not None:
        note_record = ApplicationSubmissionNote(
            application_submission_id=application_submission.application_submission_id,
            note=update_application_info_request.save_agency_notes,
            created_by_user_id=certificate.user.user_id,
            modified_by_user_id=certificate.user.user_id,
        )
        db_session.add(note_record)

        notes_result = grantor_schemas.SaveAgencyNotesResult(
            success="true",
        )

    return grantor_schemas.UpdateApplicationInfoResponseSOAPEnvelope(
        grants_gov_tracking_number=update_application_info_request.grants_gov_tracking_number,
        success="true",
        assign_agency_tracking_number_result=assign_result,
        save_agency_notes_result=notes_result,
    )
