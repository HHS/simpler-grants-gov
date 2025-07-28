from enum import StrEnum


class LegacySoapApiEvent(StrEnum):

    NO_HEADER_CERT = "no_header_cert"
    UNPARSEABLE_CERT = "unparseable_cert"
    UNKNOWN_INVALID_CLIENT_CERT = "unknown_invalid_client_cert"
    NOT_CONFIGURED_CERT = "not_configured_cert"

    NO_SIMPLER_SCHEMA_DEFINED = "no_simpler_schema_defined"

    PROXY_RESPONSE_VALIDATION_PROBLEM = "proxy_response_validation_problem"
    UNPARSEABLE_SOAP_PROXY_RESPONSE = "unparseable_soap_proxy_response"

    INVALID_REQUEST_RESPONSE_DATA = "invalid_request_response_data"

    INVALID_SOAP_AUTH_CONTENT_CONFIG = "invalid_soap_auth_content_config"

    INVALID_REQUEST = "invalid_request"
    UNKNOWN_ERROR = "unknown_error"
