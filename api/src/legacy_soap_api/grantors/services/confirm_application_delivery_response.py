import logging
from typing import cast

from apiflask.exceptions import HTTPError

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import ApplicationSubmissionRetrieved
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.grantors.fault_messages import ConfirmDeliverySubmissionNotFound
from src.legacy_soap_api.grantors.statuses import (
    AGENCY_TRACKING_NUMBER_ASSIGNED_STATUS,
    RECEIVED_BY_AGENCY_STATUS,
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
    get_application_submission_by_legacy_tracking_number_extended,
)

logger = logging.getLogger(__name__)

VALID_STATUSES_FOR_DELIVERY = {ApplicationStatus.ACCEPTED}


def get_soap_fault_exception(
    application_status: str, status: str, legacy_tracking_number: str
) -> SOAPFaultException:
    log_msg = "Application status is not valid for confirm application delivery."
    logger.info(
        log_msg,
        extra={
            "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
            "application_status": application_status,
            "legacy_tracking_number": legacy_tracking_number,
            "response_operation_name": "ConfirmApplicationDeliveryResponse",
        },
    )
    faultstring = (
        "Failed to confirm application delivery.(Expected an Application status of:'Validated' ,"
        f" but found a status of '{status}' for {legacy_tracking_number})"
    )
    return SOAPFaultException(
        log_msg, fault=FaultMessage(faultcode="soap:Server", faultstring=faultstring)
    )


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

    submission_extended_dict = get_application_submission_by_legacy_tracking_number_extended(
        db_session, legacy_tracking_number, str(certificate.user_id)
    )
    if submission_extended_dict:
        application_submission = submission_extended_dict["submission"]
    else:
        logger.info(
            "Submission not found for confirm application delivery",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "response_operation_name": "ConfirmApplicationDeliveryResponse",
                "legacy_tracking_number": legacy_tracking_number,
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

    if not application.application_status:
        msg = "Application has no application_status"
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

    if submission_extended_dict["has_tracking"]:
        raise get_soap_fault_exception(
            application.application_status,
            AGENCY_TRACKING_NUMBER_ASSIGNED_STATUS,
            legacy_tracking_number,
        )
    elif submission_extended_dict["has_retrieval"]:
        raise get_soap_fault_exception(
            application.application_status, RECEIVED_BY_AGENCY_STATUS, legacy_tracking_number
        )
    elif application.application_status not in VALID_STATUSES_FOR_DELIVERY:
        raise get_soap_fault_exception(
            application.application_status, "Received", legacy_tracking_number
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
