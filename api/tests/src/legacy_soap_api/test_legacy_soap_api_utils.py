import io
import uuid
from unittest.mock import Mock, patch

from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    HIDDEN_VALUE,
    SoapRequestStreamer,
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
    expected = b'--uuid:mockuuid4\r\nContent-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\nContent-Transfer-Encoding: binary\r\nContent-ID: <root.message@cxf.apache.org>mockresponse\r\n--uuid:mockuuid4--'

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
    assert b"".join(result.data) == expected_data
    assert result.status_code == 200
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


def test_diff_soap_dicts_match():
    match = {"a": 1}
    assert diff_soap_dicts(match, match, keys_only=False) == {}
    assert diff_soap_dicts(match, match, keys_only=True) == {}


def test_diff_soap_dicts_lists_sorted_when_compared_when_possible():
    sgg = {"a": [1, 2]}
    gg = {"a": [2, 1]}
    assert diff_soap_dicts(sgg, gg, keys_only=False) == {}
    assert diff_soap_dicts(sgg, gg, keys_only=True) == {}


def test_diff_soap_dicts_lists_sorted_when_compared_when_not_possible():
    sgg = {"a": [None, 1]}
    gg = {"a": [set(), {}]}
    assert diff_soap_dicts(sgg, gg, keys_only=False) == {
        "a": {"sgg_dict": [None, 1], "gg_dict": [set(), {}]}
    }
    assert diff_soap_dicts(sgg, gg, keys_only=True) == {
        "a": {"sgg_dict": "hidden", "gg_dict": "hidden"}
    }


def test_diff_soap_dicts_simple_difference():
    sgg = {"a": 1, "b": 2}
    gg = {"a": 1, "b": 3}
    keys_only_result = diff_soap_dicts(sgg, gg, keys_only=True)
    keys_only_expected = {"b": {"sgg_dict": HIDDEN_VALUE, "gg_dict": HIDDEN_VALUE}}
    assert keys_only_result == keys_only_expected

    # full diff
    full_diff_result = diff_soap_dicts(sgg, gg, keys_only=False)
    full_diff_expected = {"b": {"sgg_dict": 2, "gg_dict": 3}}
    assert full_diff_result == full_diff_expected


def test_diff_soap_dicts_missing_keys():
    sgg = {"a": 1, "b": 2}
    gg = {"a": 1, "c": 3}
    keys_only_result = diff_soap_dicts(sgg, gg, keys_only=True)
    keys_only_expected = {
        "keys_only_in_sgg": {"b": HIDDEN_VALUE},
        "keys_only_in_gg": {"c": HIDDEN_VALUE},
    }
    assert keys_only_result == keys_only_expected

    # full dict
    full_diff_result = diff_soap_dicts(sgg, gg, keys_only=False)
    full_diff_expected = {"keys_only_in_sgg": {"b": 2}, "keys_only_in_gg": {"c": 3}}
    assert full_diff_result == full_diff_expected


def test_diff_soap_dicts_nested_dict():
    sgg = {"a": {"x": 1, "y": 2}}
    gg = {"a": {"x": 1, "y": 3}}
    keys_only_result = diff_soap_dicts(sgg, gg, keys_only=True)
    keys_only_expected = {"a": {"y": {"sgg_dict": HIDDEN_VALUE, "gg_dict": HIDDEN_VALUE}}}
    assert keys_only_result == keys_only_expected

    # full diff
    full_diff_result = diff_soap_dicts(sgg, gg, keys_only=False)
    full_diff_expected = {"a": {"y": {"sgg_dict": 2, "gg_dict": 3}}}
    assert full_diff_result == full_diff_expected


def test_diff_soap_dicts_list_of_dicts():
    key_indexes = {"a": "id"}
    sgg = {"a": [{"id": 1, "val": 10}, {"id": 2, "val": 20}]}
    gg = {"a": [{"id": 2, "val": 20}, {"id": 3, "val": 30}]}
    keys_only_result = diff_soap_dicts(sgg, gg, key_indexes={"a": "id"}, keys_only=True)
    keys_only_expected = {
        "a": {
            "index_key": "id",
            "count_found_only_in_sgg": 1,
            "count_found_only_in_gg": 1,
            "count_different_values": 0,
        }
    }
    assert keys_only_result == keys_only_expected

    # full diff
    full_diff_result = diff_soap_dicts(sgg, gg, key_indexes=key_indexes, keys_only=False)
    full_diff_expected = {
        "a": {
            "index_key": "id",
            "found_only_in_sgg": [{"id": 1, "val": 10}],
            "found_only_in_gg": [{"id": 3, "val": 30}],
            "different_values": {},
        }
    }
    assert full_diff_result == full_diff_expected


def test_diff_list_of_dicts_basic():
    index_key = "id"
    sgg_list = [{"id": 1, "val": 100}, {"id": 2, "val": 200}]
    gg_list = [{"id": 2, "val": 200}, {"id": 3, "val": 300}]
    keys_only_result = diff_list_of_dicts(sgg_list, gg_list, index_key=index_key, keys_only=True)
    keys_only_expected = {
        "index_key": "id",
        "count_found_only_in_sgg": 1,
        "count_found_only_in_gg": 1,
        "count_different_values": 0,
    }
    assert keys_only_result == keys_only_expected

    # full diff
    full_diff_result = diff_list_of_dicts(sgg_list, gg_list, index_key=index_key, keys_only=False)
    full_diff_expected = {
        "index_key": "id",
        "found_only_in_sgg": [{"id": 1, "val": 100}],
        "found_only_in_gg": [{"id": 3, "val": 300}],
        "different_values": {},
    }
    assert full_diff_result == full_diff_expected


def test_diff_list_of_dicts_value_mismatch():
    index_key = "id"
    sgg_list = [{"id": 1, "val": 100}]
    gg_list = [{"id": 1, "val": 101}]
    keys_only_result = diff_list_of_dicts(sgg_list, gg_list, index_key=index_key, keys_only=True)
    keys_only_expected = {
        "index_key": "id",
        "count_found_only_in_sgg": 0,
        "count_found_only_in_gg": 0,
        "count_different_values": 1,
    }
    assert keys_only_result == keys_only_expected

    # full diff
    full_diff_result = diff_list_of_dicts(sgg_list, gg_list, index_key=index_key, keys_only=False)
    full_diff_expected = {
        "index_key": "id",
        "found_only_in_sgg": [],
        "found_only_in_gg": [],
        "different_values": {
            1: {"sgg_dict": {"id": 1, "val": 100}, "gg_dict": {"id": 1, "val": 101}}
        },
    }
    assert full_diff_result == full_diff_expected


def test_diff_soap_dicts_list_of_dicts_with_value_diff():
    key_indexes = {"a": "id"}
    sgg = {"a": [{"id": 1, "val": 10}, {"id": 2, "val": 32}]}
    gg = {"a": [{"id": 1, "val": 99}, {"id": 2, "val": 322}]}
    keys_only_result = diff_soap_dicts(sgg, gg, key_indexes=key_indexes, keys_only=True)
    expected_keys_only_result = {
        "a": {
            "index_key": "id",
            "count_found_only_in_sgg": 0,
            "count_found_only_in_gg": 0,
            "count_different_values": 2,
        }
    }
    assert keys_only_result == expected_keys_only_result

    # full diff
    full_diff_result = diff_soap_dicts(sgg, gg, key_indexes=key_indexes, keys_only=False)
    expected_full_diff = {
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
    assert full_diff_result == expected_full_diff


def test_hidden_value():
    assert _hide_value("a", False) == "a"
    assert _hide_value("a", True) == HIDDEN_VALUE


def test_soap_request_streamer_head_defaults_to_10000_chars():
    data_1 = (
        b"--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        b"Content-Transfer-Encoding: 8bit\r\n"
        b"Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        b'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        b'xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:glob="http://apply.grants.gov/system/Global-V1.0" '
        b'xmlns:head="http://apply.grants.gov/system/Header-V1.0" '
        b'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" '
        b'xmlns:ns2="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:ns3="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        b"<soapenv:Header>"
        b"<head:GrantSubmissionHeader>"
        b"<head:OpportunityID>SIMP-COPYING</head:OpportunityID>"
        b'<glob:HashValue glob:hashAlgorithm="SHA-1">nZXaeALvYJz6QQFdf1bUvr7S6ts=</glob:HashValue>'
        b"<head:SubmissionTitle>go get it</head:SubmissionTitle>"
        b"</head:GrantSubmissionHeader>"
        b"</soapenv:Header>"
        b"<soapenv:Body>"
        b"<app:SubmitApplicationRequest>"
        b"<app:GrantApplicationXML>"
        b"&lt;test"
        b"</app:GrantApplicationXML>"
        b"<gran:Attachment>"
        b"<gran:FileContentId>budget</gran:FileContentId>"
        b"<gran:FileDataHandler>"
        b'<xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include" href="cid:1157990985709"/>'
        b"</gran:FileDataHandler>"
        b"</gran:Attachment>"
        b"</app:SubmitApplicationRequest>"
        b"</soapenv:Body>"
        b"\r\n--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b"Content-Type: application/octet-stream\r\n"
        b"Content-Transfer-Encoding: binary\r\n"
        b"Content-ID: <1157990985709>\r\n\r\n"
        b"text"
    )
    data_2 = b"a" * 9000
    fake_stream = io.BytesIO(data_1 + data_2)
    soap_request_streamer = SoapRequestStreamer(fake_stream)
    expected = data_1 + b"a" * 8534
    assert len(soap_request_streamer.head()) == 10000
    assert soap_request_streamer.head() == expected


def test_soap_request_streamer_head_can_set_max_size_by_chunks():
    data_1 = (
        b"--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        b"Content-Transfer-Encoding: 8bit\r\n"
        b"Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        b'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        b'xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:glob="http://apply.grants.gov/system/Global-V1.0" '
        b'xmlns:head="http://apply.grants.gov/system/Header-V1.0" '
        b'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" '
        b'xmlns:ns2="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:ns3="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        b"<soapenv:Header>"
        b"<head:GrantSubmissionHeader>"
        b"<head:OpportunityID>SIMP-COPYING</head:OpportunityID>"
        b'<glob:HashValue glob:hashAlgorithm="SHA-1">nZXaeALvYJz6QQFdf1bUvr7S6ts=</glob:HashValue>'
        b"<head:SubmissionTitle>go get it</head:SubmissionTitle>"
        b"</head:GrantSubmissionHeader>"
        b"</soapenv:Header>"
        b"<soapenv:Body>"
        b"<app:SubmitApplicationRequest>"
        b"<app:GrantApplicationXML>"
        b"&lt;test"
        b"</app:GrantApplicationXML>"
        b"<gran:Attachment>"
        b"<gran:FileContentId>budget</gran:FileContentId>"
        b"<gran:FileDataHandler>"
        b'<xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include" href="cid:1157990985709"/>'
        b"</gran:FileDataHandler>"
        b"</gran:Attachment>"
        b"</app:SubmitApplicationRequest>"
        b"</soapenv:Body>"
        b"\r\n--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b"Content-Type: application/octet-stream\r\n"
        b"Content-Transfer-Encoding: binary\r\n"
        b"Content-ID: <1157990985709>\r\n\r\n"
        b"text"
    )
    data_2 = b"a" * 9000
    fake_stream = io.BytesIO(data_1 + data_2)
    soap_request_streamer = SoapRequestStreamer(fake_stream, chunk_count=1)
    expected = data_1 + b"a" * 2534
    assert len(soap_request_streamer.head()) == 4000
    assert soap_request_streamer.head() == expected


def test_soap_request_streamer_head_terminates_if_it_finds_the_soapenv_envelope_closed_tag():
    data_1 = (
        b"--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        b"Content-Transfer-Encoding: 8bit\r\n"
        b"Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        b'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        b'xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:glob="http://apply.grants.gov/system/Global-V1.0" '
        b'xmlns:head="http://apply.grants.gov/system/Header-V1.0" '
        b'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" '
        b'xmlns:ns2="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:ns3="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        b"<soapenv:Header>"
        b"<head:GrantSubmissionHeader>"
        b"<head:OpportunityID>SIMP-COPYING</head:OpportunityID>"
        b'<glob:HashValue glob:hashAlgorithm="SHA-1">nZXaeALvYJz6QQFdf1bUvr7S6ts=</glob:HashValue>'
        b"<head:SubmissionTitle>go get it</head:SubmissionTitle>"
        b"</head:GrantSubmissionHeader>"
        b"</soapenv:Header>"
        b"<soapenv:Body>"
        b"<app:SubmitApplicationRequest>"
        b"<app:GrantApplicationXML>"
        b"&lt;test"
        b"</app:GrantApplicationXML>"
        b"<gran:Attachment>"
        b"<gran:FileContentId>budget</gran:FileContentId>"
        b"<gran:FileDataHandler>"
        b'<xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include" href="cid:1157990985709"/>'
        b"</gran:FileDataHandler>"
        b"</gran:Attachment>"
        b"</app:SubmitApplicationRequest>"
        b"</soapenv:Body>"
        # terminator tag
        b"</soapenv:Envelope>"
        b"\r\n--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b"Content-Type: application/octet-stream\r\n"
        b"Content-Transfer-Encoding: binary\r\n"
        b"Content-ID: <1157990985709>\r\n\r\n"
        b"text"
    )
    data_2 = b"a" * 9000
    fake_stream = io.BytesIO(data_1 + data_2)
    soap_request_streamer = SoapRequestStreamer(fake_stream)
    expected = data_1 + b"a" * 515
    assert len(soap_request_streamer.head()) == 2000
    assert soap_request_streamer.head() == expected


def test_soap_request_streamer_head_terminates_if_it_finds_the_env_envelope_closed_tag():
    data_1 = (
        b"--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        b"Content-Transfer-Encoding: 8bit\r\n"
        b"Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        b'<env:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        b'xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:glob="http://apply.grants.gov/system/Global-V1.0" '
        b'xmlns:head="http://apply.grants.gov/system/Header-V1.0" '
        b'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" '
        b'xmlns:ns2="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:ns3="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        b"<soapenv:Header>"
        b"<head:GrantSubmissionHeader>"
        b"<head:OpportunityID>SIMP-COPYING</head:OpportunityID>"
        b'<glob:HashValue glob:hashAlgorithm="SHA-1">nZXaeALvYJz6QQFdf1bUvr7S6ts=</glob:HashValue>'
        b"<head:SubmissionTitle>go get it</head:SubmissionTitle>"
        b"</head:GrantSubmissionHeader>"
        b"</soapenv:Header>"
        b"<soapenv:Body>"
        b"<app:SubmitApplicationRequest>"
        b"<app:GrantApplicationXML>"
        b"&lt;test"
        b"</app:GrantApplicationXML>"
        b"<gran:Attachment>"
        b"<gran:FileContentId>budget</gran:FileContentId>"
        b"<gran:FileDataHandler>"
        b'<xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include" href="cid:1157990985709"/>'
        b"</gran:FileDataHandler>"
        b"</gran:Attachment>"
        b"</app:SubmitApplicationRequest>"
        b"</soapenv:Body>"
        # terminator tag
        b"</env:Envelope>"
        b"\r\n--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b"Content-Type: application/octet-stream\r\n"
        b"Content-Transfer-Encoding: binary\r\n"
        b"Content-ID: <1157990985709>\r\n\r\n"
        b"text"
    )
    data_2 = b"a" * 9000
    fake_stream = io.BytesIO(data_1 + data_2)
    soap_request_streamer = SoapRequestStreamer(fake_stream)
    expected = data_1 + b"a" * 523
    assert len(soap_request_streamer.head()) == 2000
    assert soap_request_streamer.head() == expected


def test_soap_request_streamer_reconstructs_head_with_the_rest_of_the_stream():
    data_1 = (
        b"--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        b"Content-Transfer-Encoding: 8bit\r\n"
        b"Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        b'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        b'xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:glob="http://apply.grants.gov/system/Global-V1.0" '
        b'xmlns:head="http://apply.grants.gov/system/Header-V1.0" '
        b'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" '
        b'xmlns:ns2="http://apply.grants.gov/services/ApplicantWebServices-V2.0" '
        b'xmlns:ns3="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        b"<soapenv:Header>"
        b"<head:GrantSubmissionHeader>"
        b"<head:OpportunityID>SIMP-COPYING</head:OpportunityID>"
        b'<glob:HashValue glob:hashAlgorithm="SHA-1">nZXaeALvYJz6QQFdf1bUvr7S6ts=</glob:HashValue>'
        b"<head:SubmissionTitle>go get it</head:SubmissionTitle>"
        b"</head:GrantSubmissionHeader>"
        b"</soapenv:Header>"
        b"<soapenv:Body>"
        b"<app:SubmitApplicationRequest>"
        b"<app:GrantApplicationXML>"
        b"&lt;test"
        b"</app:GrantApplicationXML>"
        b"<gran:Attachment>"
        b"<gran:FileContentId>budget</gran:FileContentId>"
        b"<gran:FileDataHandler>"
        b'<xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include" href="cid:1157990985709"/>'
        b"</gran:FileDataHandler>"
        b"</gran:Attachment>"
        b"</app:SubmitApplicationRequest>"
        b"</soapenv:Body>"
        b"\r\n--uuid:a1368612-206e-4fa7-b8c5-4aec08409929\r\n"
        b"Content-Type: application/octet-stream\r\n"
        b"Content-Transfer-Encoding: binary\r\n"
        b"Content-ID: <1157990985709>\r\n\r\n"
        b"text"
    )
    data_2 = b"a" * 9000
    fake_stream = io.BytesIO(data_1 + data_2)
    soap_request_streamer = SoapRequestStreamer(fake_stream)
    assert len(soap_request_streamer.head()) == 10000
    assert b"".join(soap_request_streamer) == data_1 + data_2
