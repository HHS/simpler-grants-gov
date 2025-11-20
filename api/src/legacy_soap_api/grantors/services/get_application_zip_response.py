import logging
from src.auth.endpoint_access_util import verify_access
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest
import uuid

from botocore.exceptions import ClientError
from sqlalchemy import select

import src.adapters.db as db
from src.db.models.competition_models import ApplicationSubmission
from src.legacy_soap_api.grantors import schemas as grantor_schemas
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_auth import validate_certificate, ENDPOINT_PRIVILEGES
from src.util import file_util

logger = logging.getLogger(__name__)


def get_application_zip_response(
    db_session: db.Session, soap_request: SOAPRequest, get_application_zip_request: grantor_schemas.GetApplicationZipRequest
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
    if legacy_tracking_number.startswith("GRANT"):
        legacy_tracking_number = legacy_tracking_number.split("GRANT")[1]
    application = db_session.execute(
        select(ApplicationSubmission).where(
            ApplicationSubmission.legacy_tracking_number == int(legacy_tracking_number),
        )
    ).scalar()

    if application:
        certificate = validate_certificate(db_session, soap_auth=soap_request.auth, api_name=soap_request.api_name)
        if soap_request.operation_name in ENDPOINT_PRIVILEGES:
            verify_access(
                certificate.user,
                {ENDPOINT_PRIVILEGES[soap_request.operation_name]},
                application.application,
            )

        try:
            filestream = file_util.open_stream(application.download_path, mode="rb")
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
