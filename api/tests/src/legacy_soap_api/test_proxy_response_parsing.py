"""
Integration test to verify that proxy responses with grants.gov date format
are parsed correctly, addressing issue #5744.
"""

from datetime import date

from src.legacy_soap_api.applicants.schemas.get_opportunity_list_schemas import (
    GetOpportunityListResponse,
    OpportunityDetails,
)
from src.legacy_soap_api.soap_payload_handler import SOAPPayload, get_envelope_dict


class TestProxyResponseParsing:
    """
    Test that proxy responses with grants.gov date formats parse correctly.

    This addresses issue #5744 where dates like "2025-09-16-04:00" were causing
    validation errors with the error type "date_from_datetime_parsing".
    """

    def test_proxy_response_with_grants_gov_date_format(self):
        """
        Test that a proxy response with grants.gov formatted dates can be parsed
        without validation errors.
        """
        # This simulates the actual XML response from grants.gov training environment
        proxy_response_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <app:GetOpportunityListResponse
                    xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0"
                    xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0"
                    xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
                    <app1:OpportunityDetails>
                        <gran:FundingOpportunityNumber>O-BJA-2025-202930-STG</gran:FundingOpportunityNumber>
                        <gran:FundingOpportunityTitle>Test Opportunity</gran:FundingOpportunityTitle>
                        <gran:CompetitionID>12345</gran:CompetitionID>
                        <gran:CompetitionTitle>Test Competition</gran:CompetitionTitle>
                        <app1:OpeningDate>2025-08-15-04:00</app1:OpeningDate>
                        <app1:ClosingDate>2025-09-16-04:00</app1:ClosingDate>
                        <gran:OfferingAgency>Bureau of Justice Assistance</gran:OfferingAgency>
                        <app1:IsMultiProject>false</app1:IsMultiProject>
                    </app1:OpportunityDetails>
                </app:GetOpportunityListResponse>
            </soap:Body>
        </soap:Envelope>"""

        # Parse the XML into a dictionary (simulating what happens in the proxy handler)
        soap_payload = SOAPPayload(
            proxy_response_xml,
            operation_name="GetOpportunityListResponse",
            force_list_attributes=["OpportunityDetails"],
        )
        payload_dict = soap_payload.to_dict()
        envelope_dict = get_envelope_dict(payload_dict, "GetOpportunityListResponse")

        # This should not raise a ValidationError anymore with our fix
        response = GetOpportunityListResponse(**envelope_dict)

        # Verify the response was parsed correctly
        assert response.opportunity_details is not None
        assert len(response.opportunity_details) == 1

        opportunity = response.opportunity_details[0]
        assert opportunity.funding_opportunity_number == "O-BJA-2025-202930-STG"
        assert opportunity.funding_opportunity_title == "Test Opportunity"
        assert opportunity.competition_id == "12345"
        assert opportunity.offering_agency == "Bureau of Justice Assistance"

        # Most importantly, verify the dates were parsed correctly despite timezone suffix
        assert opportunity.opening_date == date(2025, 8, 15)
        assert opportunity.closing_date == date(2025, 9, 16)

    def test_proxy_response_with_positive_timezone_offset(self):
        """
        Test parsing with positive timezone offset format.
        """
        proxy_response_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <app:GetOpportunityListResponse
                    xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0"
                    xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0"
                    xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
                    <app1:OpportunityDetails>
                        <gran:FundingOpportunityNumber>TEST-2025-001</gran:FundingOpportunityNumber>
                        <app1:OpeningDate>2025-08-15+05:30</app1:OpeningDate>
                        <app1:ClosingDate>2025-09-16+05:30</app1:ClosingDate>
                    </app1:OpportunityDetails>
                </app:GetOpportunityListResponse>
            </soap:Body>
        </soap:Envelope>"""

        soap_payload = SOAPPayload(
            proxy_response_xml,
            operation_name="GetOpportunityListResponse",
            force_list_attributes=["OpportunityDetails"],
        )
        payload_dict = soap_payload.to_dict()
        envelope_dict = get_envelope_dict(payload_dict, "GetOpportunityListResponse")

        response = GetOpportunityListResponse(**envelope_dict)

        opportunity = response.opportunity_details[0]
        assert opportunity.opening_date == date(2025, 8, 15)
        assert opportunity.closing_date == date(2025, 9, 16)

    def test_proxy_response_mixed_date_formats(self):
        """
        Test that we can handle mixed date formats in the same response.
        """
        proxy_response_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <app:GetOpportunityListResponse
                    xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0"
                    xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0"
                    xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
                    <app1:OpportunityDetails>
                        <gran:FundingOpportunityNumber>TEST-2025-001</gran:FundingOpportunityNumber>
                        <app1:OpeningDate>2025-08-15-04:00</app1:OpeningDate>
                        <app1:ClosingDate>2025-09-16</app1:ClosingDate>
                    </app1:OpportunityDetails>
                    <app1:OpportunityDetails>
                        <gran:FundingOpportunityNumber>TEST-2025-002</gran:FundingOpportunityNumber>
                        <app1:OpeningDate>2025-07-01</app1:OpeningDate>
                        <app1:ClosingDate>2025-08-31+02:00</app1:ClosingDate>
                    </app1:OpportunityDetails>
                </app:GetOpportunityListResponse>
            </soap:Body>
        </soap:Envelope>"""

        soap_payload = SOAPPayload(
            proxy_response_xml,
            operation_name="GetOpportunityListResponse",
            force_list_attributes=["OpportunityDetails"],
        )
        payload_dict = soap_payload.to_dict()
        envelope_dict = get_envelope_dict(payload_dict, "GetOpportunityListResponse")

        response = GetOpportunityListResponse(**envelope_dict)

        assert len(response.opportunity_details) == 2

        # First opportunity: timezone suffix on opening, standard on closing
        opp1 = response.opportunity_details[0]
        assert opp1.opening_date == date(2025, 8, 15)
        assert opp1.closing_date == date(2025, 9, 16)

        # Second opportunity: standard on opening, timezone suffix on closing
        opp2 = response.opportunity_details[1]
        assert opp2.opening_date == date(2025, 7, 1)
        assert opp2.closing_date == date(2025, 8, 31)

    def test_before_fix_would_have_failed(self):
        """
        Test that simulates the exact scenario from issue #5744.

        Before our fix, this would have raised a ValidationError with
        error type "date_from_datetime_parsing" for the fields with timezone suffixes.
        """
        # Create the exact data structure that would come from the proxy response
        opportunity_data = {
            "FundingOpportunityNumber": "O-BJA-2025-202930-STG",
            "OpeningDate": "2025-08-15-04:00",  # This format caused the original issue
            "ClosingDate": "2025-09-16-04:00",  # This format caused the original issue
        }

        # Before the fix, this would have raised:
        # ValidationError with error: ('date_from_datetime_parsing', ('OpportunityDetails', 0, 'ClosingDate'))
        # ValidationError with error: ('date_from_datetime_parsing', ('OpportunityDetails', 0, 'OpeningDate'))

        # With our fix, this should work without errors
        opportunity = OpportunityDetails(**opportunity_data)

        assert opportunity.opening_date == date(2025, 8, 15)
        assert opportunity.closing_date == date(2025, 9, 16)
        assert opportunity.funding_opportunity_number == "O-BJA-2025-202930-STG"
