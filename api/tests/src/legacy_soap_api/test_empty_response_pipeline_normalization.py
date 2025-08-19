"""
Test cases for empty response pipeline normalization for issue #5858.

This module tests the assertion that both S2S and Simpler responses
are properly normalized through the existing pipeline (Pydantic validation) and
do not require additional comparison-level normalization.

Key insight: Both get_proxy_soap_response_dict and get_soap_response_dict use
the same Pydantic schema (GetOpportunityListResponse), so they should produce
identical results for equivalent empty responses.
"""

from src.legacy_soap_api.applicants.schemas.get_opportunity_list_schemas import (
    GetOpportunityListResponse,
)
from src.legacy_soap_api.legacy_soap_api_utils import diff_soap_dicts
from src.legacy_soap_api.soap_payload_handler import SOAPPayload, get_envelope_dict


class TestPipelineNormalization:
    """Test that pipeline normalization handles empty responses correctly"""

    def test_grants_gov_empty_xml_through_pipeline(self):
        """Test that Grants.gov empty XML produces correct result through pipeline"""
        # This simulates the get_proxy_soap_response_dict pipeline
        grants_gov_xml = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <app:GetOpportunityListResponse xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0"/>
    </soap:Body>
</soap:Envelope>"""

        # Step 1: XML -> dict
        payload = SOAPPayload(
            grants_gov_xml,
            operation_name="GetOpportunityListResponse",
            force_list_attributes=["OpportunityDetails"],
        )
        xml_dict = payload.to_dict()

        # Step 2: Extract body
        body_dict = get_envelope_dict(xml_dict, "GetOpportunityListResponse")

        # Step 3: Pydantic validation (this is the key normalization step)
        validated_response = GetOpportunityListResponse(**body_dict)

        # Step 4: Convert back to envelope
        final_envelope = validated_response.to_soap_envelope_dict("GetOpportunityListResponse")

        # Should produce clean empty list response
        expected = {
            "Envelope": {"Body": {"GetOpportunityListResponse": {"OpportunityDetails": []}}}
        }
        assert final_envelope == expected

    def test_simpler_empty_response_through_pipeline(self):
        """Test that Simpler empty response produces correct result"""
        # This simulates the get_soap_response_dict pipeline
        simpler_response = GetOpportunityListResponse()  # Empty by default
        envelope = simpler_response.to_soap_envelope_dict("GetOpportunityListResponse")

        # Should produce the same structure
        expected = {
            "Envelope": {"Body": {"GetOpportunityListResponse": {"OpportunityDetails": []}}}
        }
        assert envelope == expected

    def test_both_pipelines_produce_identical_results(self):
        """Test that both pipelines produce identical results for empty responses"""
        # Grants.gov pipeline
        grants_gov_xml = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <app:GetOpportunityListResponse xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0"/>
    </soap:Body>
</soap:Envelope>"""

        payload = SOAPPayload(
            grants_gov_xml,
            operation_name="GetOpportunityListResponse",
            force_list_attributes=["OpportunityDetails"],
        )
        body_dict = get_envelope_dict(payload.to_dict(), "GetOpportunityListResponse")
        proxy_response = GetOpportunityListResponse(**body_dict)
        proxy_envelope = proxy_response.to_soap_envelope_dict("GetOpportunityListResponse")

        # Simpler pipeline
        simpler_response = GetOpportunityListResponse()
        simpler_envelope = simpler_response.to_soap_envelope_dict("GetOpportunityListResponse")

        # Both pipelines should produce identical results
        assert proxy_envelope == simpler_envelope

    def test_different_xml_formats_same_pipeline_result(self):
        """Test that different XML formats for empty responses produce same result"""
        # Self-closing tag format
        xml1 = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <app:GetOpportunityListResponse xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0"/>
    </soap:Body>
</soap:Envelope>"""

        # Container tag format
        xml2 = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <app:GetOpportunityListResponse xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0">
        </app:GetOpportunityListResponse>
    </soap:Body>
</soap:Envelope>"""

        # Both should produce identical results after pipeline
        results = []
        for xml in [xml1, xml2]:
            payload = SOAPPayload(
                xml,
                operation_name="GetOpportunityListResponse",
                force_list_attributes=["OpportunityDetails"],
            )
            body_dict = get_envelope_dict(payload.to_dict(), "GetOpportunityListResponse")
            response = GetOpportunityListResponse(**body_dict)
            envelope = response.to_soap_envelope_dict("GetOpportunityListResponse")
            results.append(envelope)

        # Both should be identical
        assert results[0] == results[1]

        # And both should match expected structure
        expected = {
            "Envelope": {"Body": {"GetOpportunityListResponse": {"OpportunityDetails": []}}}
        }
        assert results[0] == expected


class TestIssue5858AcceptanceCriteria:
    """Test the exact acceptance criteria for Issue #5858"""

    def test_s2s_empty_response_and_simpler_empty_array_seen_as_matching(self):
        """
        Test the exact acceptance criteria from Issue #5858:
        "S2S empty response and Simpler empty array are seen as 'matching'"

        This validates that the main comparison in legacy_soap_api_client.py
        correctly identifies them as matching.
        """
        # S2S (Grants.gov) empty response through full pipeline
        s2s_xml = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <app:GetOpportunityListResponse xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0"/>
    </soap:Body>
</soap:Envelope>"""

        # Simulate get_proxy_soap_response_dict
        payload = SOAPPayload(
            s2s_xml,
            operation_name="GetOpportunityListResponse",
            force_list_attributes=["OpportunityDetails"],
        )
        body_dict = get_envelope_dict(payload.to_dict(), "GetOpportunityListResponse")
        s2s_response = GetOpportunityListResponse(**body_dict)
        s2s_envelope = s2s_response.to_soap_envelope_dict("GetOpportunityListResponse")

        # Simpler empty array through pipeline
        # Simulate get_soap_response_dict
        simpler_response = GetOpportunityListResponse()  # Empty array by default
        simpler_envelope = simpler_response.to_soap_envelope_dict("GetOpportunityListResponse")

        # This is the exact comparison that happens in legacy_soap_api_client.py line 152
        responses_are_matching = s2s_envelope == simpler_envelope

        # Acceptance criteria validation
        assert responses_are_matching, (
            f"ACCEPTANCE CRITERIA FAILED: S2S empty response and Simpler empty array "
            f"should be seen as 'matching', but they are different.\n"
            f"S2S: {s2s_envelope}\n"
            f"Simpler: {simpler_envelope}"
        )

    def test_populated_responses_still_show_differences(self):
        """Ensure that real differences are still properly detected"""
        # Response with actual data
        populated_response = GetOpportunityListResponse(
            opportunity_details=[
                {
                    "funding_opportunity_number": "TEST-001",
                    "funding_opportunity_title": "Test Opportunity",
                }
            ]
        )
        populated_envelope = populated_response.to_soap_envelope_dict("GetOpportunityListResponse")

        # Empty response
        empty_response = GetOpportunityListResponse()
        empty_envelope = empty_response.to_soap_envelope_dict("GetOpportunityListResponse")

        # Should NOT be matching
        assert populated_envelope != empty_envelope

        # Verify diff detection still works at body level
        populated_body = get_envelope_dict(populated_envelope, "GetOpportunityListResponse")
        empty_body = get_envelope_dict(empty_envelope, "GetOpportunityListResponse")
        diff_result = diff_soap_dicts(populated_body, empty_body)
        assert diff_result != {}, "Real differences should still be detected"
