import uuid
from unittest.mock import Mock, patch

from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    bool_to_string,
    ensure_dot_prefix,
    filter_headers,
    format_local_soap_response,
    get_auth_error_response,
    get_streamed_soap_response,
)


def test_format_local_soap_response() -> None:
    mock_uuid = "mockuuid4"
    mock_response = b"mockresponse"
    expected = b'--uuid:mockuuid4\nContent-Type: application/xop+xml; charset=UTF-8; type="text/xml"\nContent-Transfer-Encoding: binary\nContent-ID: <root.message@cxf.apache.org>mockresponse\n--uuid:mockuuid4--'

    with patch.object(uuid, "uuid4", return_value=mock_uuid):
        given = format_local_soap_response(mock_response)
        assert expected == given


def test_get_auth_error_response() -> None:
    err_response = get_auth_error_response()
    err = b"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>soap:Server</faultcode>
            <faultstring>Authorization error</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>
"""
    assert err in err_response.data
    assert err_response.status_code == 500


def test_filter_headers() -> None:
    assert filter_headers({"foo": "bar"}, ["foo"]) == {}
    assert filter_headers({"Foo": "bar"}, ["foo"]) == {}


def test_get_streamed_soap_response_success():
    # Simulate streamed response
    chunks = [b"<soap>", b"<body>Hello</body>", b"</soap>"]
    mock_response = Mock()
    mock_response.iter_content = Mock(return_value=chunks)
    mock_response.status_code = 200
    mock_response.headers = {
        "Content-Type": "application/xml",
        "Transfer-Encoding": "chunked",
        "Keep-Alive": "timeout=60",
        "Connection": "keep-alive",
    }

    result = get_streamed_soap_response(mock_response)

    expected_data = b"".join(chunks)
    expected_headers = {"Content-Type": "application/xml"}

    assert isinstance(result, SOAPResponse)
    assert result.data == expected_data
    assert result.status_code, 200
    assert result.headers == expected_headers


def test_ensure_dot_prefix() -> None:
    assert ensure_dot_prefix("foo") == ".foo"
    assert ensure_dot_prefix(".foo") == ".foo"


def test_bool_to_string() -> None:
    assert bool_to_string(True) == "true"
    assert bool_to_string(False) == "false"
    assert bool_to_string(None) is None


def is_list_of_dicts(lst: list) -> bool:
    return isinstance(lst, list) and all(isinstance(item, dict) for item in lst)


def dict_diff(
    sgg_dict: dict, gg_dict: dict, key_indexes: dict | None = None, keys_only: bool = False
):
    # if a dict key, value pair are not equal and are instances of a list of dicts, use list_of_dict_key_indexes
    # to determine how to match up entries based on the key name and which key name to use to find and compare
    # the dicts with the specified matching key name.
    key_indexes = key_indexes if key_indexes else {}
    sgg_keys = set(sgg_dict.keys())
    gg_keys = set(gg_dict.keys())

    key_diffs = {}
    if keys_only_in_sgg := sgg_keys - gg_keys:
        key_diffs["keys_only_in_sgg"] = {k: sgg_dict[k] for k in keys_only_in_sgg}
    if keys_only_in_gg := gg_keys - sgg_keys:
        key_diffs["keys_only_in_gg"] = {k: gg_dict[k] for k in keys_only_in_gg}

    differing = {}
    for k in sgg_keys & gg_keys:
        sgg_value, gg_value = sgg_dict[k], gg_dict[k]
        if isinstance(sgg_value, dict) and isinstance(gg_value, dict):
            nested_diff = dict_diff(sgg_value, gg_value, key_indexes, keys_only)
            if nested_diff:
                differing[k] = nested_diff
        elif sgg_value != gg_value:
            # Only support diffing list of dicts if key_indexes is specified
            if key_indexes and is_list_of_dicts(sgg_value) and is_list_of_dicts(gg_value):
                key_index = key_indexes.get(k)
                if key_index:
                    differing[k] = diff_list_of_dicts(sgg_value, gg_value, key_index)
            else:
                differing[k] = {"sgg_dict": sgg_value, "gg_dict": gg_value}

    return {**key_diffs, **differing}


def diff_list_of_dicts(sgg_list: list[dict], gg_list: list[dict], index_key: str):
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


def test_is_list_of_dicts_true():
    assert is_list_of_dicts([{"a": 1}, {"b": 2}]) is True


def test_is_list_of_dicts_false_not_list():
    assert is_list_of_dicts({"a": 1}) is False


def test_is_list_of_dicts_false_list_not_all_dicts():
    assert is_list_of_dicts([{"a": 1}, 2, "x"]) is False


def test_dict_diff_simple_difference():
    sgg = {"a": 1, "b": 2}
    gg = {"a": 1, "b": 3}
    result = dict_diff(sgg, gg)
    expected = {"b": {"sgg_dict": 2, "gg_dict": 3}}
    assert result == expected


def test_dict_diff_missing_keys():
    sgg = {"a": 1, "b": 2}
    gg = {"a": 1, "c": 3}
    result = dict_diff(sgg, gg)
    expected = {"keys_only_in_sgg": {"b": 2}, "keys_only_in_gg": {"c": 3}}
    assert result == expected


def test_dict_diff_nested_dict():
    sgg = {"a": {"x": 1, "y": 2}}
    gg = {"a": {"x": 1, "y": 3}}
    result = dict_diff(sgg, gg)
    expected = {"a": {"y": {"sgg_dict": 2, "gg_dict": 3}}}
    assert result == expected


def test_dict_diff_list_of_dicts():
    sgg = {"a": [{"id": 1, "val": 10}, {"id": 2, "val": 20}]}
    gg = {"a": [{"id": 2, "val": 20}, {"id": 3, "val": 30}]}
    result = dict_diff(sgg, gg, key_indexes={"a": "id"})
    expected = {
        "a": {
            "index_key": "id",
            "found_only_in_sgg": [{"id": 1, "val": 10}],
            "found_only_in_gg": [{"id": 3, "val": 30}],
            "different_values": {},
        }
    }
    assert result == expected


def test_dict_diff_list_of_dicts_with_value_diff():
    sgg = {"a": [{"id": 1, "val": 10}]}
    gg = {"a": [{"id": 1, "val": 99}]}
    result = dict_diff(sgg, gg, key_indexes={"a": "id"})
    expected = {
        "a": {
            "index_key": "id",
            "found_only_in_sgg": [],
            "found_only_in_gg": [],
            "different_values": {
                1: {"sgg_dict": {"id": 1, "val": 10}, "gg_dict": {"id": 1, "val": 99}}
            },
        }
    }
    assert result == expected


def test_diff_list_of_dicts_basic():
    sgg_list = [{"id": 1, "val": 100}, {"id": 2, "val": 200}]
    gg_list = [{"id": 2, "val": 200}, {"id": 3, "val": 300}]
    result = diff_list_of_dicts(sgg_list, gg_list, index_key="id")
    expected = {
        "index_key": "id",
        "found_only_in_sgg": [{"id": 1, "val": 100}],
        "found_only_in_gg": [{"id": 3, "val": 300}],
        "different_values": {},
    }
    assert result == expected


def test_diff_list_of_dicts_value_mismatch():
    sgg_list = [{"id": 1, "val": 100}]
    gg_list = [{"id": 1, "val": 101}]
    result = diff_list_of_dicts(sgg_list, gg_list, index_key="id")
    expected = {
        "index_key": "id",
        "found_only_in_sgg": [],
        "found_only_in_gg": [],
        "different_values": {
            1: {"sgg_dict": {"id": 1, "val": 100}, "gg_dict": {"id": 1, "val": 101}}
        },
    }
    assert result == expected
