import uuid
from typing import Any

import requests

from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage, SOAPResponse

BASE_SOAP_API_RESPONSE_HEADERS = {
    "Content-Type": 'multipart/related; type="application/xop+xml"',
}
HIDDEN_VALUE = "hidden"


def format_local_soap_response(response_data: bytes) -> bytes:
    # This is a format string for formatting local responses from the mock
    # soap server since it does not support manipulating the response.
    # The grants.gov SOAP API currently includes this data.
    response_id = str(uuid.uuid4())
    return (
        f"""
--uuid:{response_id}
Content-Type: application/xop+xml; charset=UTF-8; type=\"text/xml\"
Content-Transfer-Encoding: binary
Content-ID: <root.message@cxf.apache.org>{response_data.decode()}
--uuid:{response_id}--
        """.replace(
            '<?xml version="1.0" encoding="UTF-8"?>', ""
        )
        .strip()
        .encode("utf-8")
    )


def get_soap_response(
    data: bytes, status_code: int = 200, headers: dict | None = None
) -> SOAPResponse:
    """Get SOAP response

    Get a soap response object that will be returned from the Simpler SOAP
    API endpoint.

    Note: The base headers can be overriden by caller if needed.
    """
    extra_headers = headers if headers else {}
    all_headers = {
        **BASE_SOAP_API_RESPONSE_HEADERS,
        **extra_headers,
    }
    return SOAPResponse(data=data, status_code=status_code, headers=all_headers)


class SOAPFaultException(Exception):
    def __init__(self, message: str, fault: FaultMessage, *args: Any) -> None:
        self.message = message
        self.fault = fault
        super().__init__(message, fault, *args)


def wrap_envelope_dict(soap_xml_dict: dict, operation_name: str | None = None) -> dict:
    body = {operation_name: {**soap_xml_dict}} if operation_name else soap_xml_dict
    return {"Envelope": {"Body": {**body}}}


def get_soap_error_response(
    faultcode: str = "soap:Server",
    faultstring: str = "Server error has occurred",
    headers: dict | None = None,
) -> SOAPResponse:
    err = f"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>{faultcode}</faultcode>
            <faultstring>{faultstring}</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>
""".encode()
    return get_soap_response(data=err, status_code=500, headers=headers)


def get_auth_error_response() -> SOAPResponse:
    return get_soap_error_response(faultstring="Authorization error")


def get_streamed_soap_response(response: requests.Response) -> SOAPResponse:
    """Get streamed SOAP response

    The SOAP requests to GG will be returned in chunks if response is large.
    This method handles building the response for chunked responses from the existing
    GG S2S SOAP API.
    """
    chunk_size = 8192
    data = b""
    for chunk in response.iter_content(chunk_size=chunk_size):
        data += chunk

    # We omit these headers to prevent issues from flask and wsgi from erroring chunked responses.
    response_headers = filter_headers(
        dict(response.headers), ["transfer-encoding", "keep-alive", "connection"]
    )

    return get_soap_response(data, status_code=response.status_code, headers=response_headers)


def filter_headers(headers: dict, headers_to_omit: list | None = None) -> dict:
    headers_to_omit = [i.lower() for i in headers_to_omit] if headers_to_omit else []
    if not headers_to_omit:
        return headers
    return {key: value for key, value in headers.items() if key.lower() not in headers_to_omit}


def ensure_dot_prefix(data: str) -> str:
    return data if data.startswith(".") else f".{data}"


def bool_to_string(value: bool | None) -> str | None:
    if value is None:
        return None
    return "true" if value else "false"


def get_invalid_path_response() -> SOAPResponse:
    return get_soap_response(
        data=b"<html><body>No service was found.</body></html>", status_code=404
    )


def is_list_of_dicts(data: list) -> bool:
    return isinstance(data, list) and all(isinstance(item, dict) for item in data)


def diff_soap_dicts(
    sgg_dict: dict, gg_dict: dict, key_indexes: dict | None = None, keys_only: bool = False
) -> dict:
    # if a dict key, value pair are not equal and are instances of a list of dicts, use list_of_dict_key_indexes
    # to determine how to match up entries based on the key name and which key name to use to find and compare
    # the dicts with the specified matching key name.
    key_indexes = key_indexes if key_indexes else {}
    sgg_keys = set(sgg_dict.keys())
    gg_keys = set(gg_dict.keys())

    key_diffs = {}
    if keys_only_in_sgg := sgg_keys - gg_keys:
        key_diffs["keys_only_in_sgg"] = {
            k: _hide_value(sgg_dict[k], keys_only) for k in keys_only_in_sgg
        }
    if keys_only_in_gg := gg_keys - sgg_keys:
        key_diffs["keys_only_in_gg"] = {
            k: _hide_value(gg_dict[k], keys_only) for k in keys_only_in_gg
        }

    differing = {}
    for k in sgg_keys & gg_keys:
        sgg_value, gg_value = sgg_dict[k], gg_dict[k]
        if isinstance(sgg_value, dict) and isinstance(gg_value, dict):
            nested_diff = diff_soap_dicts(sgg_value, gg_value, key_indexes, keys_only)
            if nested_diff:
                differing[k] = nested_diff
        elif sgg_value != gg_value:
            # Only support diffing list of dicts if key_indexes is specified
            if key_indexes and is_list_of_dicts(sgg_value) and is_list_of_dicts(gg_value):
                key_index = key_indexes.get(k)
                if key_index:
                    differing[k] = diff_list_of_dicts(sgg_value, gg_value, key_index, keys_only)
            else:
                differing[k] = {
                    "sgg_dict": _hide_value(sgg_value, keys_only),
                    "gg_dict": _hide_value(gg_value, keys_only),
                }
    return {**key_diffs, **differing}


def diff_list_of_dicts(
    sgg_list: list[dict], gg_list: list[dict], index_key: str, keys_only: bool = False
) -> dict:
    """
    Get the differences from dicts within a list of dicts.

    The index_key param indicates how to find the corresponding dict in the list.
    """
    sgg_dict = {item[index_key]: item for item in sgg_list if index_key in item}
    sgg_dict_keys = sgg_dict.keys()
    gg_dict = {item[index_key]: item for item in gg_list if index_key in item}
    gg_dict_keys = gg_dict.keys()
    only_in_sgg = {k: sgg_dict[k] for k in sgg_dict_keys - gg_dict_keys}
    only_in_gg = {k: gg_dict[k] for k in gg_dict_keys - sgg_dict_keys}
    if keys_only:
        return {
            "index_key": index_key,
            "count_found_only_in_sgg": len(only_in_sgg.keys()),
            "count_found_only_in_gg": len(only_in_gg.keys()),
            "count_different_values": len(
                [k for k in sgg_dict_keys & gg_dict_keys if sgg_dict[k] != gg_dict[k]]
            ),
        }
    return {
        "index_key": index_key,
        "found_only_in_sgg": list(only_in_sgg.values()),
        "found_only_in_gg": list(only_in_gg.values()),
        "different_values": {
            k: {"sgg_dict": sgg_dict[k], "gg_dict": gg_dict[k]}
            for k in sgg_dict_keys & gg_dict_keys
            if sgg_dict[k] != gg_dict[k]
        },
    }


def _hide_value(value: Any, hide: bool) -> Any:
    return HIDDEN_VALUE if hide else value
