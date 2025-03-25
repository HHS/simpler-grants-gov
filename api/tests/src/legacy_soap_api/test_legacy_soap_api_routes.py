from unittest import TestCase

from tests.conftest import client


def test_successful_request(client) -> None:
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    mock_data = "<gran:FundingOpportunityNumber>O-OVC-2025-172385</gran:FundingOpportunityNumber>"
    response = client.post(full_path, data=mock_data)
    assert response.status_code == 200
