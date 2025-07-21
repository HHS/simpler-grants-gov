import uuid
from unittest.mock import Mock, patch

from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    HIDDEN_VALUE,
    _hide_value,
    bool_to_string,
    diff_list_of_dicts,
    diff_soap_dicts,
    ensure_dot_prefix,
    filter_headers,
    format_local_soap_response,
    get_auth_error_response,
    get_streamed_soap_response,
    is_list_of_dicts,
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


def test_is_list_of_dicts_true():
    assert is_list_of_dicts([{"a": 1}, {"b": 2}]) is True


def test_is_list_of_dicts_false_not_list():
    assert is_list_of_dicts({"a": 1}) is False


def test_is_list_of_dicts_false_list_not_all_dicts():
    assert is_list_of_dicts([{"a": 1}, 2, "x"]) is False


def test_diff_soap_dicts_simple_difference_keys_only():
    sgg = {"a": 1, "b": 2}
    gg = {"a": 1, "b": 3}
    result = diff_soap_dicts(sgg, gg, keys_only=True)
    expected = {"b": {"sgg_dict": HIDDEN_VALUE, "gg_dict": HIDDEN_VALUE}}
    assert result == expected


def test_diff_soap_dicts_missing_keys_keys_only():
    sgg = {"a": 1, "b": 2}
    gg = {"a": 1, "c": 3}
    result = diff_soap_dicts(sgg, gg, keys_only=True)
    expected = {"keys_only_in_sgg": {"b": HIDDEN_VALUE}, "keys_only_in_gg": {"c": HIDDEN_VALUE}}
    assert result == expected


def test_diff_soap_dicts_nested_dict_keys_only():
    sgg = {"a": {"x": 1, "y": 2}}
    gg = {"a": {"x": 1, "y": 3}}
    result = diff_soap_dicts(sgg, gg, keys_only=True)
    expected = {"a": {"y": {"sgg_dict": HIDDEN_VALUE, "gg_dict": HIDDEN_VALUE}}}
    assert result == expected


def test_diff_soap_dicts_list_of_dicts_keys_only():
    sgg = {"a": [{"id": 1, "val": 10}, {"id": 2, "val": 20}]}
    gg = {"a": [{"id": 2, "val": 20}, {"id": 3, "val": 30}]}
    result = diff_soap_dicts(sgg, gg, key_indexes={"a": "id"}, keys_only=True)
    expected = {
        "a": {
            "index_key": "id",
            "count_found_only_in_sgg": 1,
            "count_found_only_in_gg": 1,
            "count_different_values": 0,
        }
    }
    assert result == expected


def test_diff_soap_dicts_list_of_dicts_with_value_diff_keys_only():
    sgg = {"a": [{"id": 1, "val": 10}, {"id": 2, "val": 32}]}
    gg = {"a": [{"id": 1, "val": 99}, {"id": 2, "val": 322}]}
    result = diff_soap_dicts(sgg, gg, key_indexes={"a": "id"}, keys_only=True)
    expected = {
        "a": {
            "index_key": "id",
            "count_found_only_in_sgg": 0,
            "count_found_only_in_gg": 0,
            "count_different_values": 2,
        }
    }
    assert result == expected


def test_diff_list_of_dicts_basic_keys_only():
    sgg_list = [{"id": 1, "val": 100}, {"id": 2, "val": 200}]
    gg_list = [{"id": 2, "val": 200}, {"id": 3, "val": 300}]
    result = diff_list_of_dicts(sgg_list, gg_list, index_key="id", keys_only=True)
    expected = {
        "index_key": "id",
        "count_found_only_in_sgg": 1,
        "count_found_only_in_gg": 1,
        "count_different_values": 0,
    }
    assert result == expected


def test_diff_list_of_dicts_value_mismatch_keys_only():
    sgg_list = [{"id": 1, "val": 100}]
    gg_list = [{"id": 1, "val": 101}]
    result = diff_list_of_dicts(sgg_list, gg_list, index_key="id", keys_only=True)
    expected = {
        "index_key": "id",
        "count_found_only_in_sgg": 0,
        "count_found_only_in_gg": 0,
        "count_different_values": 1,
    }
    assert result == expected


def test_diff_soap_dicts_simple_difference():
    sgg = {"a": 1, "b": 2}
    gg = {"a": 1, "b": 3}
    result = diff_soap_dicts(sgg, gg)
    expected = {"b": {"sgg_dict": 2, "gg_dict": 3}}
    assert result == expected


def test_diff_soap_dicts_missing_keys():
    sgg = {"a": 1, "b": 2}
    gg = {"a": 1, "c": 3}
    result = diff_soap_dicts(sgg, gg)
    expected = {"keys_only_in_sgg": {"b": 2}, "keys_only_in_gg": {"c": 3}}
    assert result == expected


def test_diff_soap_dicts_nested_dict():
    sgg = {"a": {"x": 1, "y": 2}}
    gg = {"a": {"x": 1, "y": 3}}
    result = diff_soap_dicts(sgg, gg)
    expected = {"a": {"y": {"sgg_dict": 2, "gg_dict": 3}}}
    assert result == expected


def test_diff_soap_dicts_list_of_dicts():
    sgg = {"a": [{"id": 1, "val": 10}, {"id": 2, "val": 20}]}
    gg = {"a": [{"id": 2, "val": 20}, {"id": 3, "val": 30}]}
    result = diff_soap_dicts(sgg, gg, key_indexes={"a": "id"})
    expected = {
        "a": {
            "index_key": "id",
            "found_only_in_sgg": [{"id": 1, "val": 10}],
            "found_only_in_gg": [{"id": 3, "val": 30}],
            "different_values": {},
        }
    }
    assert result == expected


def test_diff_soap_dicts_list_of_dicts_with_value_diff():
    sgg = {"a": [{"id": 1, "val": 10}, {"id": 2, "val": 32}]}
    gg = {"a": [{"id": 1, "val": 99}, {"id": 2, "val": 322}]}
    result = diff_soap_dicts(sgg, gg, key_indexes={"a": "id"})
    expected = {
        "a": {
            "index_key": "id",
            "found_only_in_sgg": [],
            "found_only_in_gg": [],
            "different_values": {
                1: {"sgg_dict": {"id": 1, "val": 10}, "gg_dict": {"id": 1, "val": 99}},
                2: {"sgg_dict": {"id": 2, "val": 32}, "gg_dict": {"id": 2, "val": 322}},
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


def test_hidden_value():
    assert _hide_value("a", False) == "a"
    assert _hide_value("a", True) == HIDDEN_VALUE
