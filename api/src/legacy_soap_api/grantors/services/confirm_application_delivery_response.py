import logging

from apiflask.exceptions import HTTPError
from sqlalchemy import select

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import ApplicationSubmission, ApplicationSubmissionRetrieved
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPClientUserDoesNotHavePermission,
    validate_certificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest

logger = logging.getLogger(__name__)

CONFIRM_DELIVERY_FAULT_STRING = "Failed to confirm application delivery.(Authorization Failure)"

VALID_STATUSES_FOR_DELIVERY = {ApplicationStatus.ACCEPTED}


def confirm_application_delivery_response(
    db_session: db.Session,
    soap_request: SOAPRequest,
    confirm_application_delivery_request: grantor_schemas.ConfirmApplicationDeliveryRequest,
    soap_config: SOAPOperationConfig,
) -> grantor_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope:
    legacy_tracking_number = confirm_application_delivery_request.grants_gov_tracking_number

    if not legacy_tracking_number:
        return grantor_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope(
            grants_gov_tracking_number=legacy_tracking_number,
        )

    if legacy_tracking_number.startswith("GRANT"):
        legacy_tracking_number = legacy_tracking_number.split("GRANT")[1]

    application_submission = db_session.execute(
        select(ApplicationSubmission).where(
            ApplicationSubmission.legacy_tracking_number == int(legacy_tracking_number),
        )
    ).scalar()

    if not application_submission:
        logger.info(
            f"Unable to find submission legacy_tracking_number {legacy_tracking_number}.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "response_operation_name": "ConfirmApplicationDeliveryResponse",
            },
        )
        return grantor_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope(
            grants_gov_tracking_number=confirm_application_delivery_request.grants_gov_tracking_number,
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
        return grantor_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope(
            grants_gov_tracking_number=confirm_application_delivery_request.grants_gov_tracking_number,
            response_message=CONFIRM_DELIVERY_FAULT_STRING,
        )

    certificate = validate_certificate(
        db_session, soap_auth=soap_request.auth, api_name=soap_request.api_name
    )

    if soap_config.privileges is not None:
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
    existing_retrieval = db_session.execute(
        select(ApplicationSubmissionRetrieved).where(
            ApplicationSubmissionRetrieved.application_submission_id
            == application_submission.application_submission_id,
            ApplicationSubmissionRetrieved.created_by_user_id == certificate.user.user_id,
        )
    ).scalar()

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
        return grantor_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope(
            grants_gov_tracking_number=confirm_application_delivery_request.grants_gov_tracking_number,
            response_message=CONFIRM_DELIVERY_FAULT_STRING,
        )

    retrieval = ApplicationSubmissionRetrieved(
        application_submission_id=application_submission.application_submission_id,
        created_by_user_id=certificate.user.user_id,
        modified_by_user_id=certificate.user.user_id,
    )
    db_session.add(retrieval)

    return grantor_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope(
        grants_gov_tracking_number=confirm_application_delivery_request.grants_gov_tracking_number,
        response_message="Success",
    )
