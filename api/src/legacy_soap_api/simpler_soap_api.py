import logging

import grants_shared.adapters.db as db
from flask import request
from grants_shared.logs.flask_logger import add_extra_data_to_current_request_logs

from src.legacy_soap_api.legacy_soap_api_auth import (
    ENABLE_SIMPLER_ROUTE_KEY,
    MTLS_CERT_HEADER_KEY,
    REQUEST_SOAP_ACTION_KEY,
    USE_SIMPLER_OVERRIDE_KEY,
    SOAPClientCertificateIsExpired,
    SOAPClientMissingCertificate,
    SOAPClientTcertificateNotFound,
    SOAPClientUserDoesNotHavePermission,
    get_soap_auth,
)
from src.legacy_soap_api.legacy_soap_api_client import (
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, get_soap_config
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent, SimplerRequests
from src.legacy_soap_api.legacy_soap_api_proxy import get_proxy_response as get_legacy_response
from src.legacy_soap_api.legacy_soap_api_schemas import (
    SOAPInvalidEnvelope,
    SOAPOperationNotSupported,
    SOAPResponse,
)
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest, SoapRequestStreamer
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException, SOAPInvalidFilter
from src.legacy_soap_api.legacy_soap_api_utils import (
    get_alternate_proxy_response as get_alternate_legacy_response,
)
from src.legacy_soap_api.legacy_soap_api_utils import (
    get_invalid_path_response,
    get_soap_error_response,
    get_soap_fault_error_response,
    write_debug_data_to_s3,
)
from src.legacy_soap_api.soap_payload_handler import get_soap_operation_name

logger = logging.getLogger(__name__)

GET_OPPORTUNITY_LIST_REQUEST = "GetOpportunityListRequest"


def get_simpler_soap_response(
    soap_request: SOAPRequest, soap_legacy_response: SOAPResponse, db_session: db.Session
) -> SOAPResponse:
    simpler_soap_client_type = (
        SimplerApplicantsS2SClient
        if soap_request.api_name == SimplerSoapAPI.APPLICANTS
        else SimplerGrantorsS2SClient
    )

    use_simpler = get_soap_config().use_simpler
    if soap_request.headers.get(USE_SIMPLER_OVERRIDE_KEY, None) == "1":
        use_simpler = True
        logger.info(
            "soap_client_certificate: Use-Simpler-Override flag is enabled",
            extra={"soap_api_event": LegacySoapApiEvent.USE_SIMPLER_OVERRIDE},
        )

    try:
        simpler_soap_client = simpler_soap_client_type(
            soap_request=soap_request, db_session=db_session
        )
        add_extra_data_to_current_request_logs(
            {
                "soap_response_operation": simpler_soap_client.operation_config.response_operation_name,
            }
        )
    except (SOAPInvalidEnvelope, SOAPOperationNotSupported):
        logger.info(
            "simpler_soap_api: Initialization failed due to invalid request",
            exc_info=True,
            extra={
                "soap_api_event": LegacySoapApiEvent.INVALID_REQUEST,
                "used_simpler_response": use_simpler,
            },
        )
        return soap_legacy_response
    except Exception:
        err = "Unable to initialize Simpler SOAP client: Unknown error"
        logger.info(
            f"simpler_soap_api: {err}",
            exc_info=True,
            extra={
                "soap_api_event": LegacySoapApiEvent.UNKNOWN_ERROR,
                "used_simpler_response": use_simpler,
            },
        )
        return soap_legacy_response

    if use_simpler or simpler_soap_client.operation_config.always_call_simpler:
        logger.info(
            "simpler_soap_api: getting simpler soap response",
        )
        simpler_soap_response = simpler_soap_client.get_simpler_soap_response(soap_legacy_response)

    if use_simpler and simpler_soap_response is not None:
        logger.info(
            "simpler_soap_api: Successfully processed request and returning Simpler SOAP response",
            extra={
                "soap_api_event": LegacySoapApiEvent.RETURNING_SIMPLER_RESPONSE,
                "used_simpler_response": use_simpler,
            },
        )
        return simpler_soap_response

    logger.info(
        "simpler_soap_api: Successfully processed request and returning SOAP legacy response",
        extra={
            "soap_api_event": LegacySoapApiEvent.RETURNING_LEGACY_SOAP_RESPONSE,
            "used_simpler_response": use_simpler,
        },
    )
    return soap_legacy_response


def process_simpler_request(
    db_session: db.Session, service_name: str, service_port_name: str
) -> tuple:
    api_name = SimplerSoapAPI.get_soap_api(service_name, service_port_name)
    if not api_name:
        logger.info(
            "Could not determine Simpler SOAP API from service_name and service_port_name",
            extra={"soap_api_event": LegacySoapApiEvent.UNKNOWN_SOAP_API},
        )
        return get_invalid_path_response().to_flask_response()

    soap_request_stream = SoapRequestStreamer(
        stream=request.stream, total_length=int(request.headers.get("Content-Length", 0))
    )
    operation_name = get_soap_operation_name(soap_request_stream.head())
    add_extra_data_to_current_request_logs(
        {
            "soap_api": api_name,
            "soap_request_operation_name": operation_name if operation_name else "Unknown",
        }
    )
    logger.info("SOAP request received")

    is_get_opportunity_list = (
        operation_name == GET_OPPORTUNITY_LIST_REQUEST and api_name == SimplerSoapAPI.APPLICANTS
    )
    auth = None
    # GetOpportunityListRequest does not have any auth
    if not is_get_opportunity_list:
        try:
            auth = get_soap_auth(request.headers.get(MTLS_CERT_HEADER_KEY), db_session=db_session)
        except SOAPClientMissingCertificate:
            return get_soap_error_response(
                faultstring="Missing certificate. (Authorization Failure)"
            ).to_flask_response()
        except SOAPClientTcertificateNotFound:
            return get_soap_error_response(
                faultstring="No tcertificate found. (Authorization Failure)"
            ).to_flask_response()
        except SOAPClientCertificateIsExpired:
            return get_soap_error_response(
                faultstring="Certificate is expired. (Authorization Failure)"
            ).to_flask_response()

    soap_request: SOAPRequest | None = None
    try:
        soap_request = SOAPRequest(
            api_name=api_name,
            method="POST",
            full_path=request.full_path,
            headers=dict(request.headers),
            data=soap_request_stream,
            auth=auth,
            operation_name=operation_name,
        )
        logger.info(
            "soap_client_certificate: header check",
            extra={
                "soap_request_headers": soap_request.headers.keys(),
                "soap_action": soap_request.headers.get(REQUEST_SOAP_ACTION_KEY, ""),
            },
        )
        is_legacy_only_certificate = (
            auth and auth.certificate and not auth.certificate.legacy_certificate
        )

        if (
            not get_soap_config().enable_simpler_route
            and request.headers.get(ENABLE_SIMPLER_ROUTE_KEY, None) != "1"
        ):
            logger.info(
                "soap_client_certificate: simpler route is disabled, returning legacy response",
                extra={"soap_api_event": LegacySoapApiEvent.SIMPLER_ROUTE_DISABLED},
            )
            soap_legacy_response = get_legacy_response(soap_request)
            write_debug_data_to_s3(soap_request, soap_legacy_response)
            return soap_legacy_response.to_flask_response()

        # If it is GetOpportunityList or is valid legacy certificate but not configured in Simpler
        # call legacy and don't call simpler
        is_alternate_response: bool = False
        if is_get_opportunity_list or is_legacy_only_certificate:
            soap_legacy_response = get_legacy_response(soap_request)
            write_debug_data_to_s3(soap_request, soap_legacy_response)
            return soap_legacy_response.to_flask_response()
        # If it has a Simpler GrantsGovTrackingNumber then don't call legacy
        elif alternate_legacy_response := get_alternate_legacy_response(soap_request):
            is_alternate_response = True
            logger.info(
                "simpler_soap_api: skipping legacy call",
            )
            soap_legacy_response = alternate_legacy_response
        # GetSubmissionListExpanded will call both if use_simpler is true
        # handled in the get_simpler_response
        elif (
            operation_name
            in [
                SimplerRequests.GET_SUBMISSION_LIST_EXPANDED_REQUEST,
                SimplerRequests.GET_SUBMISSION_LIST_REQUEST,
            ]
            and api_name == SimplerSoapAPI.GRANTORS
        ):
            soap_legacy_response = get_legacy_response(soap_request)
        # Fallback: return legacy response and don't call simpler
        else:
            soap_legacy_response = get_legacy_response(soap_request)
            write_debug_data_to_s3(soap_request, soap_legacy_response)
            return soap_legacy_response.to_flask_response()

    except Exception:
        logger.exception(
            msg="Error getting soap legacy response",
            extra={
                "used_simpler_response": False,
                "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_LEGACY_SOAP,
            },
        )
        error_response = get_soap_error_response()
        write_debug_data_to_s3(soap_request, error_response)
        return error_response.to_flask_response()
    if auth and auth.certificate.legacy_certificate:
        try:
            simpler_soap_response = get_simpler_soap_response(
                soap_request, soap_legacy_response, db_session
            )
            # In the event where there's a successful simpler response
            # but the legacy response failed (and not just skipped
            # with the alternate response) then surface the legacy response
            if (
                simpler_soap_response.status_code == 200
                and soap_legacy_response.status_code != 200
                and not is_alternate_response
            ):
                logger.info(
                    msg="simpler_soap_api: override simpler response with legacy response",
                    extra={
                        "simpler_status_code": simpler_soap_response.status_code,
                        "legacy_status_code": soap_legacy_response.status_code,
                    },
                )
                write_debug_data_to_s3(soap_request, soap_legacy_response)
                return soap_legacy_response.to_flask_response()
            else:
                write_debug_data_to_s3(soap_request, simpler_soap_response)
                return simpler_soap_response.to_flask_response()
        except SOAPClientUserDoesNotHavePermission:
            msg = "soap_client_certificate: User did not have permission to access this application"
            logger.info(
                msg=msg,
                extra={
                    "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                },
            )
        except SOAPInvalidFilter as e:
            logger.info(
                msg="Invalid filter type",
                exc_info=True,
                extra={
                    "soap_api_event": LegacySoapApiEvent.INVALID_FILTER,
                    "faultstring": e.fault.faultstring,
                },
            )
            error_response = get_soap_fault_error_response(
                faultcode=e.fault.faultcode, faultstring=e.fault.faultstring
            )
            write_debug_data_to_s3(soap_request, error_response)
            return error_response.to_flask_response()
        except SOAPFaultException as e:
            logger.info(
                msg="Soap Fault Exception raised",
                exc_info=True,
                extra={
                    "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                    "faultstring": e.fault.faultstring,
                },
            )
            if soap_legacy_response.status_code == 500:
                error_response = get_soap_fault_error_response(
                    faultcode=e.fault.faultcode, faultstring=e.fault.faultstring
                )
                write_debug_data_to_s3(soap_request, error_response)
                return error_response.to_flask_response()
        except Exception:
            msg = "Unable to process Simpler SOAP legacy response"
            logger.exception(
                msg=msg,
                extra={
                    "used_simpler_response": False,
                    "soap_api_event": LegacySoapApiEvent.ERROR_CALLING_SIMPLER,
                },
            )
    write_debug_data_to_s3(soap_request, soap_legacy_response)
    return soap_legacy_response.to_flask_response()
