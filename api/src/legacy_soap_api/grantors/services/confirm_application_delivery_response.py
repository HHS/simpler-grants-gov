import logging
from typing import cast

from apiflask.exceptions import HTTPError
from sqlalchemy import select

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import ApplicationSubmissionRetrieved
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.grantors.fault_messages import (
    ConfirmDeliveryAlreadyRetrieved,
    ConfirmDeliverySubmissionNotFound,
)
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPClientUserDoesNotHavePermission,
    validate_certificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import (
    SOAPFaultException,
    get_application_submission_by_legacy_tracking_number,
)

logger = logging.getLogger(__name__)

VALID_STATUSES_FOR_DELIVERY = {ApplicationStatus.ACCEPTED}
GRANTS_APPLICATION_STATUSES = {
    ApplicationStatus.IN_PROGRESS: "Received",
    ApplicationStatus.SUBMITTED: "Received",
    ApplicationStatus.ACCEPTED: "Validated",
}


def confirm_application_delivery(
    db_session: db.Session,
    soap_request: SOAPRequest,
    confirm_application_delivery_request: grantor_schemas.ConfirmApplicationDeliveryRequest,
    soap_config: SOAPOperationConfig,
) -> str:
    """Validate and process the confirm application delivery request.

    Performs all data gathering, validation, authorization, and creates an
    ApplicationSubmissionRetrieved record as a side effect.

    Returns the grants_gov_tracking_number on success.
    Raises SOAPFaultException or SOAPClientUserDoesNotHavePermission on failure.
    """
    certificate = validate_certificate(
        db_session, soap_auth=soap_request.auth, api_name=soap_request.api_name
    )

    legacy_tracking_number = cast(
        str, confirm_application_delivery_request.grants_gov_tracking_number
    )

    application_submission = get_application_submission_by_legacy_tracking_number(
        db_session, legacy_tracking_number
    )

    if not application_submission:
        logger.info(
            f"Unable to find submission legacy_tracking_number {legacy_tracking_number}.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "response_operation_name": "ConfirmApplicationDeliveryResponse",
            },
        )
        raise SOAPFaultException(
            "Submission not found for confirm application delivery",
            fault=ConfirmDeliverySubmissionNotFound,
        )

    application = application_submission.application
    try:
        if soap_config.privileges:
            verify_access(
                certificate.user,
                soap_config.privileges,
                application.competition.opportunity.agency_record,
            )
        else:
            raise ValueError("Privileges must be configured for ConfirmApplicationDelivery")
    except HTTPError as e:
        logger.info(
            "User did not have permission to confirm application delivery",
            extra={
                "user_id": certificate.user.user_id,
                "application_submission_id": application_submission.application_submission_id,
                "privileges": soap_config.privileges,
            },
        )
        raise SOAPClientUserDoesNotHavePermission(
            "User did not have permission to confirm application delivery"
        ) from e

    if application.application_status not in VALID_STATUSES_FOR_DELIVERY:
        msg = (
            "Failed to confirm application delivery.(Expected an Application status of:'Validated' ,"
            f" but found a status of '{GRANTS_APPLICATION_STATUSES.get(
                application.application_status or ApplicationStatus.IN_PROGRESS
            )}' for {legacy_tracking_number})"
        )
        logger.info(
            msg,
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "application_status": application.application_status,
                "legacy_tracking_number": legacy_tracking_number,
                "response_operation_name": "ConfirmApplicationDeliveryResponse",
            },
        )
        raise SOAPFaultException(msg, fault=FaultMessage(faultcode="soap:Server", faultstring=msg))

    # Check if this user has already retrieved this submission.
    existing_retrieval = (
        db_session.execute(
            select(ApplicationSubmissionRetrieved).where(
                ApplicationSubmissionRetrieved.application_submission_id
                == application_submission.application_submission_id,
                ApplicationSubmissionRetrieved.created_by_user_id == certificate.user.user_id,
            )
        )
        .scalars()
        .first()
    )

    if existing_retrieval:
        logger.info(
            "Application submission has already been retrieved by this user.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "user_id": certificate.user.user_id,
                "legacy_tracking_number": legacy_tracking_number,
                "response_operation_name": "ConfirmApplicationDeliveryResponse",
            },
        )
        raise SOAPFaultException(
            "Application submission has already been retrieved by this user",
            fault=ConfirmDeliveryAlreadyRetrieved,
        )

    retrieval = ApplicationSubmissionRetrieved(
        application_submission_id=application_submission.application_submission_id,
        created_by_user_id=certificate.user.user_id,
        modified_by_user_id=certificate.user.user_id,
    )
    db_session.add(retrieval)

    return legacy_tracking_number


def get_confirm_application_delivery_response(
    grants_gov_tracking_number: str,
) -> grantor_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope:
    """Build the SOAP response envelope from the gathered data."""
    return grantor_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope(
        grants_gov_tracking_number=grants_gov_tracking_number,
        response_message="Success",
    )
