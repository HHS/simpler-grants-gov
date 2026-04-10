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
    ConfirmDeliveryInvalidStatus,
    ConfirmDeliverySubmissionNotFound,
)
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPClientUserDoesNotHavePermission,
    validate_certificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import (
    SOAPFaultException,
    get_application_submission_by_legacy_tracking_number,
)

logger = logging.getLogger(__name__)

VALID_STATUSES_FOR_DELIVERY = {ApplicationStatus.ACCEPTED}


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

    if application.application_status not in VALID_STATUSES_FOR_DELIVERY:
        logger.info(
            "Application status is not valid for confirm application delivery.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "application_status": application.application_status,
                "legacy_tracking_number": legacy_tracking_number,
                "response_operation_name": "ConfirmApplicationDeliveryResponse",
            },
        )
        raise SOAPFaultException(
            "Application status is not valid for confirm application delivery",
            fault=ConfirmDeliveryInvalidStatus,
        )

    certificate = validate_certificate(
        db_session, soap_auth=soap_request.auth, api_name=soap_request.api_name
    )

    if soap_config.privileges is None:
        raise ValueError("Privileges must be configured for ConfirmApplicationDelivery")

    try:
        verify_access(
            certificate.user,
            soap_config.privileges,
            application.competition.opportunity.agency_record,
        )
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
