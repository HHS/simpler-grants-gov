from src.legacy_soap_api.legacy_soap_api_utils import get_invalid_path_response


def test_successful_request(client, fixture_from_file, caplog) -> None:
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    fixture_path = (
        "/legacy_soap_api/applicants/get_opportunity_list_by_funding_opportunity_number_request.xml"
    )
    mock_data = fixture_from_file(fixture_path)
    response = client.post(full_path, data=mock_data)
    assert response.status_code == 200

    # Verify that certain logs are present with expected extra values
    post_message = next(
        record
        for record in caplog.records
        if record.message == "POST /<service_name>/services/v2/<service_port_name>"
    )
    assert post_message.service_name == "grantsws-applicant"
    assert post_message.service_port_name == "ApplicantWebServicesSoapPort"

    req_message = next(
        record for record in caplog.records if record.message == "SOAP request received"
    )
    assert req_message.soap_api == "applicants"
    assert req_message.soap_request_operation_name == "GetOpportunityListRequest"


def test_invalid_service_name_not_found(client) -> None:
    full_path = "/invalid/services/v2/ApplicantWebServicesSoapPort"
    response = client.post(full_path, data="mock")
    expected_response = get_invalid_path_response()
    assert response.status_code == 404
    assert response.data == expected_response.data


def test_invalid_xml_server_error_500(client) -> None:
    """Test 500 use case

    This tests that invalid xml results in 500 status code since that
    is what the grants.gov soap api responds with in such cases.
    """
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    response = client.post(full_path, data="<invalid><soap>")
    assert response.status_code == 500
