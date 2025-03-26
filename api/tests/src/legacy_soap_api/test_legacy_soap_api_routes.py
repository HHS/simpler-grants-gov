from unittest import TestCase

from tests.conftest import client


def test_successful_request(client) -> None:
    print(type(client))
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    mock_data = "<gran:FundingOpportunityNumber>O-OVC-2025-172385</gran:FundingOpportunityNumber>"
    response = client.post(full_path, data=mock_data)
    assert response.status_code == 200


def test_invalid_service_name_not_found(client) -> None:
    print(type(client))
    full_path = "/invalid/services/v2/ApplicantWebServicesSoapPort"
    mock_data = "<gran:FundingOpportunityNumber>O-OVC-2025-172385</gran:FundingOpportunityNumber>"
    response = client.post(full_path, data=mock_data)
    assert response.status_code == 404
