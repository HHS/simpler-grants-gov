import io
from collections.abc import Iterator
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas import (
    FaultMessage,
    SOAPInvalidRequestOperationName,
    SOAPOperationNotSupported,
    SOAPRequest,
    SoapRequestStreamer,
    SOAPResponse,
)


def get_base_body(append_to_end: bytes | None = None) -> bytes:
    base_body = (
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
    if append_to_end:
        base_body += append_to_end
    return base_body


def add_filler(base_body: bytes, size: int = 10000) -> bytes:
    return base_body + b"a" * size


def xml_bytes() -> bytes:
    return (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )


def xml_streamer() -> Iterator:
    yield b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
    yield (b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>")
    yield b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"


def test_legacy_soap_api_request_raises_error_if_soap_config_privileges_are_none() -> None:
    with patch(
        "src.legacy_soap_api.legacy_soap_api_schemas.base.get_soap_operation_config"
    ) as mock_config:
        mock_config.return_value = SOAPOperationConfig(
            request_operation_name="GetApplicationZipRequest",
            response_operation_name="GetApplicationZipResponse",
            compare_endpoints=False,
            namespace_keymap={
                "GetApplicationZipResponse": "ns2",
            },
            privileges=None,
            is_mtom=True,
        )
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            "<gran:GrantsGovTrackingNumber>GRANT9000000</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        with pytest.raises(
            SOAPOperationNotSupported,
            match="Simpler grantors SOAP API has no privileges set for GetApplicationZipRequest",
        ):
            SOAPRequest(
                data=SoapRequestStreamer(stream=io.BytesIO(request_xml_bytes)),
                full_path="x",
                headers={},
                method="POST",
                api_name=SimplerSoapAPI.GRANTORS,
                operation_name="GetApplicationZipRequest",
            ).get_soap_request_operation_config()


def test_get_soap_operation_config_gets_operation_name_correctly_from_request_data() -> None:
    request_xml_bytes = (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:GetApplicationZipRequest>"
        "<gran:GrantsGovTrackingNumber>GRANT9000000</gran:GrantsGovTrackingNumber>"
        "</agen:GetApplicationZipRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode("utf-8")
    operation_config = SOAPRequest(
        data=SoapRequestStreamer(stream=io.BytesIO(request_xml_bytes)),
        full_path="x",
        headers={},
        method="POST",
        api_name=SimplerSoapAPI.GRANTORS,
        operation_name="",
    ).get_soap_request_operation_config()
    assert operation_config.request_operation_name == "GetApplicationZipRequest"


def test_get_soap_operation_config_gets_operation_name_fails_correctly_if_invalid_request_data() -> (
    None
):
    request_xml_bytes = (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
    ).encode("utf-8")
    with pytest.raises(SOAPInvalidRequestOperationName):
        SOAPRequest(
            data=SoapRequestStreamer(stream=io.BytesIO(request_xml_bytes)),
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="",
        ).get_soap_request_operation_config()


def test_legacy_soap_api_response_schema_missing_required_fields() -> None:
    with pytest.raises(ValidationError):
        SOAPResponse()


def test_format_flask_response() -> None:
    res = SOAPResponse(data=b"", status_code=200, headers={})
    given = res.to_flask_response()
    expected = (res.data, res.status_code, res.headers)
    assert given == expected


def test_fault_message() -> None:
    fault = FaultMessage(faultcode="a", faultstring="b")
    expected_xml_message = f"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>{fault.faultcode}</faultcode>
            <faultstring>{fault.faultstring}</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>
""".encode()
    assert fault.to_xml() == expected_xml_message.strip()


def test_soap_response_to_bytes_converts_iterator_to_bytes() -> None:
    soap_response = SOAPResponse(data=xml_streamer(), status_code=200, headers={})
    data = soap_response.to_bytes()
    assert data == (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )


def test_soap_response_to_bytes_returns_bytes_if_data_is_already_bytes() -> None:
    soap_response = SOAPResponse(data=xml_bytes(), status_code=200, headers={})
    data = soap_response.to_bytes()
    assert data == (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )


def test_soap_response_to_bytes_caches_bytes_data() -> None:
    soap_response = SOAPResponse(data=xml_streamer(), status_code=200, headers={})
    expected = (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )
    data_1 = soap_response.to_bytes()
    assert data_1 == expected
    # Since soap_response.data was a generator it is now exhausted
    assert list(soap_response.data) == []
    data_2 = soap_response.to_bytes()
    assert data_2 == expected


def test_soap_response_to_flask_response_returns_stream_obj_when_passed_iterator_as_data() -> None:
    soap_response = SOAPResponse(data=xml_streamer(), status_code=200, headers={})
    flask_response = soap_response.to_flask_response()[0]
    assert isinstance(flask_response, Iterator) is True
    expected = (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )
    assert b"".join(flask_response) == expected


def test_soap_response_to_flask_response_returns_bytes_when_passed_bytes_as_data() -> None:
    soap_response = SOAPResponse(data=xml_bytes(), status_code=200, headers={})
    flask_response = soap_response.to_flask_response()[0]
    assert isinstance(flask_response, bytes) is True
    expected = (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )
    assert flask_response == expected


def test_soap_response_stream_returns_iterator_when_data_is_an_iterator() -> None:
    soap_response = SOAPResponse(data=xml_streamer(), status_code=200, headers={})
    stream_response = soap_response.stream()
    assert isinstance(stream_response, Iterator) is True
    expected = (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )
    assert b"".join(stream_response) == expected


def test_soap_response_stream_returns_iterator_when_data_is_bytes() -> None:
    soap_response = SOAPResponse(data=xml_bytes(), status_code=200, headers={})
    stream_response = soap_response.stream()
    assert isinstance(stream_response, Iterator) is True
    expected = (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )
    assert b"".join(stream_response) == expected


def test_soap_response_stream_returns_iterator_when_data_is_a_data_stream_from_cache() -> None:
    soap_response = SOAPResponse(data=xml_streamer(), status_code=200, headers={})
    soap_response.to_bytes()
    assert list(soap_response.data) == []
    stream_response = soap_response.stream()
    assert isinstance(stream_response, Iterator) is True
    expected = (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )
    assert b"".join(stream_response) == expected


def test_soap_request_streamer_head_defaults_to_10000_chars():
    base_body = get_base_body()
    data = add_filler(base_body, size=10000)
    fake_stream = io.BytesIO(data)
    soap_request_streamer = SoapRequestStreamer(stream=fake_stream)
    expected = base_body + b"a" * 8534
    assert len(soap_request_streamer.head()) == 10000
    assert soap_request_streamer.head() == expected


def test_soap_request_streamer_head_terminates_if_it_finds_the_soapenv_envelope_closed_tag():
    base_body = get_base_body(append_to_end=b"</soapenv:Envelope>")
    data = add_filler(base_body, size=9000)
    fake_stream = io.BytesIO(data)
    soap_request_streamer = SoapRequestStreamer(stream=fake_stream)
    expected = base_body + b"a" * 515
    assert len(soap_request_streamer.head()) == 2000
    assert soap_request_streamer.head() == expected


def test_soap_request_streamer_head_terminates_if_it_finds_the_env_envelope_closed_tag():
    base_body = get_base_body(append_to_end=b"</env:Envelope>")
    data = add_filler(base_body, size=9000)
    fake_stream = io.BytesIO(data)
    soap_request_streamer = SoapRequestStreamer(stream=fake_stream)
    expected = base_body + b"a" * 519
    assert len(soap_request_streamer.head()) == 2000
    assert soap_request_streamer.head() == expected


def test_soap_request_streamer_reconstructs_head_with_the_rest_of_the_stream():
    base_body = get_base_body()
    data = add_filler(base_body, size=12000)
    fake_stream = io.BytesIO(data)
    soap_request_streamer = SoapRequestStreamer(stream=fake_stream)
    assert len(soap_request_streamer.head()) == 10000
    assert b"".join(soap_request_streamer) == data
