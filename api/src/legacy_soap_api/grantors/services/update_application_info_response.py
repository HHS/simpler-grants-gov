import logging
from typing import cast

from sqlalchemy import select

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
from src.legacy_soap_api.grantors.fault_messages import (
    UpdateApplicationInfoInvalidStatus,
    UpdateApplicationInfoSubmissionNotFound,
)
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPClientUserDoesNotHavePermission,
    validate_certificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import (
    SOAPFaultException,
    get_application_submission_by_legacy_tracking_number,
)

logger = logging.getLogger(__name__)

VALID_STATUSES_FOR_UPDATE = {ApplicationStatus.ACCEPTED}


def _validate_application_submission(
    db_session: db.Session, legacy_tracking_number: str
) -> ApplicationSubmission:
    application_submission = get_application_submission_by_legacy_tracking_number(
        db_session, legacy_tracking_number
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

    if application_submission.application.application_status not in VALID_STATUSES_FOR_UPDATE:
        logger.info(
            "Application status is not valid for update application info.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "application_status": application_submission.application.application_status,
                "legacy_tracking_number": legacy_tracking_number,
                "response_operation_name": "UpdateApplicationInfoResponse",
            },
        )
        raise SOAPFaultException(
            "Application status is not valid for update application info",
            fault=UpdateApplicationInfoInvalidStatus,
        )

    return application_submission


def _assign_agency_tracking_number(
    db_session: db.Session,
    application_submission: ApplicationSubmission,
    tracking_number: str,
    legacy_tracking_number: str,
    user: User,
) -> grantor_schemas.AssignAgencyTrackingNumberResult:
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
        return grantor_schemas.AssignAgencyTrackingNumberResult(success="false")

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


def update_application_info_response(
    db_session: db.Session,
    soap_request: SOAPRequest,
    update_application_info_request: grantor_schemas.UpdateApplicationInfoRequest,
    soap_config: SOAPOperationConfig,
) -> grantor_schemas.UpdateApplicationInfoResponseSOAPEnvelope:
    legacy_tracking_number = cast(str, update_application_info_request.grants_gov_tracking_number)

    application_submission = _validate_application_submission(db_session, legacy_tracking_number)

    certificate = validate_certificate(
        db_session, soap_auth=soap_request.auth, api_name=soap_request.api_name
    )

    if soap_config.privileges is None:
        raise ValueError("Privileges must be configured for UpdateApplicationInfo")

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

    return grantor_schemas.UpdateApplicationInfoResponseSOAPEnvelope(
        grants_gov_tracking_number=update_application_info_request.grants_gov_tracking_number,
        success="true",
        assign_agency_tracking_number_result=assign_result,
        save_agency_notes_result=notes_result,
    )
