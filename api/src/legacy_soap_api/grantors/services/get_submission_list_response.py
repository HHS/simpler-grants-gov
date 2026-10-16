import logging
from datetime import datetime, timezone

import src.adapters.db as db
from src.legacy_soap_api.grantors import schemas
from src.legacy_soap_api.grantors.services.submission_list_helpers import (
    get_submissions,
    parse_submissions_from_proxy,
    transform_submission,
)
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest

logger = logging.getLogger(__name__)


def get_submission_list(
    db_session: db.Session,
    request: schemas.GetSubmissionListRequest,
    soap_request: SOAPRequest,
    soap_config: SOAPOperationConfig,
    is_expanded: bool = False,
) -> list[schemas.SubmissionInfo] | list[schemas.SubmissionInfoExpanded]:
    """Gather submission data from the database.

    Performs authentication, authorization, filtering, and transforms
    database submissions into SubmissionInfo or SubmissionInfoExpanded objects.

    Returns a list of SubmissionInfo or SubmissionInfoExpanded from Simpler.
    """
    schema: type[schemas.SubmissionInfoExpanded | schemas.SubmissionInfo]

    if is_expanded:
        schema = schemas.SubmissionInfoExpanded
    else:
        schema = schemas.SubmissionInfo
    submissions = get_submissions(
        db_session=db_session,
        consolidated_filter=request.expanded_application_filter,
        soap_request=soap_request,
        soap_config=soap_config,
        operation_name="GetSubmissionListExpanded",
    )
    return [schema(**transform_submission(submission)) for submission in submissions]


def get_submission_list_response(
    simpler_submissions: list[schemas.SubmissionInfo] | list[schemas.SubmissionInfoExpanded],
    proxy_response: SOAPResponse,
) -> schemas.GetSubmissionListResponse:
    """Build the SOAP response envelope from Simpler and proxy data.

    Parses proxy submissions, merges with Simpler submissions,
    sorts by date, and constructs the response.
    """
    info: list[schemas.SubmissionInfo | schemas.SubmissionInfoExpanded] = []
    try:
        info.extend(
            parse_submissions_from_proxy(
                proxy_response=proxy_response,
                element_tag="SubmissionInfo",
                schema_class=schemas.SubmissionInfoExpanded,
            )
        )
    except Exception:
        logger.exception("Failed to parse submission list XML response")
    info.extend(simpler_submissions)
    info.sort(
        key=lambda x: x.received_date_time or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return schemas.GetSubmissionListResponse(
        success=True, available_application_number=len(info), submission_info=info
    )
