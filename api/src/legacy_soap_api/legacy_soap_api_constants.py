from enum import StrEnum


class LegacySoapApiEvent(StrEnum):

    NO_HEADER_CERT = "no_header_cert"
    PARSED_CERT = "parsed_cert"
    UNPARSEABLE_CERT = "unparseable_cert"
    UNKNOWN_INVALID_CLIENT_CERT = "unknown_invalid_client_cert"
    NOT_CONFIGURED_CERT = "not_configured_cert"
    CALLING_WITHOUT_CERT = "calling_without_cert"
    CALLING_WITH_CERT = "calling_with_cert"
    CALLING_WITH_JWT = "calling_with_jwt"

    NO_SIMPLER_SCHEMA_DEFINED = "no_simpler_schema_defined"

    PROXY_RESPONSE_VALIDATION_PROBLEM = "proxy_response_validation_problem"
    UNPARSEABLE_SOAP_PROXY_RESPONSE = "unparseable_soap_proxy_response"
    INVALID_REQUEST_RESPONSE_DATA = "invalid_request_response_data"

    INVALID_SOAP_AUTH_CONTENT_CONFIG = "invalid_soap_auth_content_config"
    INVALID_SOAP_OPERATION_CONFIG = "invalid_soap_operation_config"

    SOAP_DIFF_FAILED = "soap_diff_failed"

    UNKNOWN_SOAP_API = "unknown_soap_api"

    INVALID_REQUEST = "invalid_request"
    UNKNOWN_ERROR = "unknown_error"

    ERROR_CALLING_LEGACY_SOAP = "error_call_legacy_soap"
    ERROR_CALLING_SIMPLER = "error_calling_simpler"

    RETURNING_SIMPLER_RESPONSE = "returning_simpler_response"
    RETURNING_LEGACY_SOAP_RESPONSE = "returning_legacy_soap_response"
