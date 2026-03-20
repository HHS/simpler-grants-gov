import logging
import uuid

from botocore.exceptions import ClientError

import src.adapters.db as db
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.legacy_soap_api_auth import validate_certificate, verify_certificate_access
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import (
    get_application_submission_by_legacy_tracking_number,
)
from src.util import file_util

logger = logging.getLogger(__name__)


def get_application_zip_response(
    db_session: db.Session,
    soap_request: SOAPRequest,
    get_application_zip_request: grantor_schemas.GetApplicationZipRequest,
    soap_config: SOAPOperationConfig,
) -> grantor_schemas.GetApplicationZipResponseSOAPEnvelope:
    xop_data_instance = grantor_schemas.XOPIncludeData(
        **{"@href": f"cid:{uuid.uuid4()}-0001@apply.grants.gov"}
    )
    file_handler_instance = grantor_schemas.FileDataHandler(**{"xop:Include": xop_data_instance})
    get_response_instance = grantor_schemas.GetApplicationZipResponse(
        **{"ns2:FileDataHandler": file_handler_instance}
    )
    schema = grantor_schemas.GetApplicationZipResponseSOAPEnvelope(
        Body=grantor_schemas.GetApplicationZipResponseSOAPBody(
            **{"ns2:GetApplicationZipResponse": get_response_instance}
        )
    )
    legacy_tracking_number = get_application_zip_request.grants_gov_tracking_number
    if not legacy_tracking_number:
        return schema
    application_submission = get_application_submission_by_legacy_tracking_number(
        db_session, legacy_tracking_number
    )
    if application_submission:
        certificate = validate_certificate(
            db_session, soap_auth=soap_request.auth, api_name=soap_request.api_name
        )
        verify_certificate_access(
            certificate,
            soap_config,
            application_submission.application.competition.opportunity.agency_record,
        )
        try:
            filestream = file_util.open_stream(application_submission.download_path, mode="rb")
            schema._mtom_file_stream = filestream
        except ClientError:
            logger.info(
                f"Unable to retrieve file legacy_tracking_number {legacy_tracking_number} from s3 file location.",
                extra={
                    "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                    "response_operation_name": "GetApplicationZipResponse",
                },
            )
    else:
        logger.info(
            f"Unable to find submission legacy_tracking_number {legacy_tracking_number}.",
            extra={
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                "response_operation_name": "GetApplicationZipResponse",
            },
        )
    return schema
