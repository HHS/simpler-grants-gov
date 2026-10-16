import logging
from datetime import datetime, timezone

import src.adapters.db as db
from src.legacy_soap_api.grantors.schemas.get_application_list_schemas import (
    ExpandedApplicationInfo,
    GetApplicationListExpandedRequest,
    GetApplicationListExpandedResponse,
)
from src.legacy_soap_api.grantors.services.submission_list_helpers import (
    get_submissions,
    parse_submissions_from_proxy,
    transform_submission,
)
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest

logger = logging.getLogger(__name__)


def get_application_list_expanded(
    db_session: db.Session,
    request: GetApplicationListExpandedRequest,
    soap_request: SOAPRequest,
    soap_config: SOAPOperationConfig,
) -> list[ExpandedApplicationInfo]:
    """Gather application data from the database for GetApplicationListExpanded.

    Performs authentication, authorization, filtering, and transforms
    database submissions into ExpandedApplicationInfo objects.

    Returns a list of ExpandedApplicationInfo from Simpler.
    """
    submissions = get_submissions(
        db_session=db_session,
        consolidated_filter=request.expanded_application_filter,
        soap_request=soap_request,
        soap_config=soap_config,
        operation_name="GetApplicationListExpanded",
    )
    return [
        ExpandedApplicationInfo(**transform_submission(submission)) for submission in submissions
    ]


def get_application_list_expanded_response(
    simpler_applications: list[ExpandedApplicationInfo],
    proxy_response: SOAPResponse,
) -> GetApplicationListExpandedResponse:
    """Build the SOAP response envelope from Simpler and proxy data.

    Parses proxy applications, merges with Simpler applications,
    sorts by date, and constructs the response.
    """
    info: list[ExpandedApplicationInfo] = []
    try:
        info.extend(
            parse_submissions_from_proxy(
                proxy_response=proxy_response,
                element_tag="ExpandedApplicationInfo",
                schema_class=ExpandedApplicationInfo,
            )
        )
    except Exception:
        logger.exception("Failed to parse application list XML response")
    info.extend(simpler_applications)
    info.sort(
        key=lambda x: x.received_date_time or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return GetApplicationListExpandedResponse(
        success=True,
        available_application_number=len(info),
        expanded_application_info=info,
    )
