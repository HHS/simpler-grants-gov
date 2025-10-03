from typing import Iterator

import pytest
from pydantic import ValidationError

from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage, SOAPResponse


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
