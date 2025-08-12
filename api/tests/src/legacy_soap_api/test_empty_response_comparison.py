"""
Test cases for empty response comparison fix for issue #5858.

This module tests that empty responses from S2S and Simpler are properly
normalized and compared to avoid false differences when both represent
the same "no results" state.
"""


from src.legacy_soap_api.legacy_soap_api_utils import (
    _normalize_soap_dict_for_comparison,
    diff_soap_dicts,
)


class TestNormalizeSoapDictForComparison:
    """Test the normalization function for SOAP dict comparison"""

    def test_filters_out_namespace_attributes(self):
        """Test that XML namespace attributes are filtered out"""
        soap_dict = {
            "@xmlns:app": "http://apply.grants.gov/services/ApplicantWebServices-V2.0",
            "@xmlns:app1": "http://apply.grants.gov/system/ApplicantCommonElements-V1.0",
            "@xmlns:gran": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
            "OpportunityDetails": [],
            "SomeOtherField": "value"
        }

        normalized = _normalize_soap_dict_for_comparison(soap_dict)

        # Namespace attributes should be filtered out
        assert "@xmlns:app" not in normalized
        assert "@xmlns:app1" not in normalized
        assert "@xmlns:gran" not in normalized

        # Regular fields should remain
        assert normalized["OpportunityDetails"] == []
        assert normalized["SomeOtherField"] == "value"

    def test_normalizes_missing_opportunity_details(self):
        """Test that missing OpportunityDetails becomes empty list"""
        soap_dict = {"SomeOtherField": "value"}

        normalized = _normalize_soap_dict_for_comparison(soap_dict)

        assert normalized["OpportunityDetails"] == []
        assert normalized["SomeOtherField"] == "value"

    def test_normalizes_none_opportunity_details(self):
        """Test that None OpportunityDetails becomes empty list"""
        soap_dict = {
            "OpportunityDetails": None,
            "SomeOtherField": "value"
        }

        normalized = _normalize_soap_dict_for_comparison(soap_dict)

        assert normalized["OpportunityDetails"] == []
        assert normalized["SomeOtherField"] == "value"

    def test_preserves_empty_list_opportunity_details(self):
        """Test that empty list OpportunityDetails remains empty list"""
        soap_dict = {
            "OpportunityDetails": [],
            "SomeOtherField": "value"
        }

        normalized = _normalize_soap_dict_for_comparison(soap_dict)

        assert normalized["OpportunityDetails"] == []
        assert normalized["SomeOtherField"] == "value"

    def test_preserves_populated_opportunity_details(self):
        """Test that populated OpportunityDetails remains unchanged"""
        opportunity_data = {"FundingOpportunityNumber": "TEST-001"}
        soap_dict = {
            "OpportunityDetails": [opportunity_data],
            "SomeOtherField": "value"
        }

        normalized = _normalize_soap_dict_for_comparison(soap_dict)

        assert normalized["OpportunityDetails"] == [opportunity_data]
        assert normalized["SomeOtherField"] == "value"

    def test_normalizes_nested_dictionaries(self):
        """Test that nested dictionaries are also normalized"""
        soap_dict = {
            "OpportunityDetails": [
                {
                    "@xmlns:nested": "http://example.com",
                    "FundingOpportunityNumber": "TEST-001",
                    "NestedDict": {
                        "@xmlns:deep": "http://deep.example.com",
                        "SomeField": "value"
                    }
                }
            ]
        }

        normalized = _normalize_soap_dict_for_comparison(soap_dict)

        # Check that nested namespace attributes are filtered
        opportunity = normalized["OpportunityDetails"][0]
        assert "@xmlns:nested" not in opportunity
        assert opportunity["FundingOpportunityNumber"] == "TEST-001"

        nested_dict = opportunity["NestedDict"]
        assert "@xmlns:deep" not in nested_dict
        assert nested_dict["SomeField"] == "value"


class TestEmptyResponseComparison:
    """Test that empty response comparison works correctly with the fix"""

    def test_simpler_empty_list_vs_grants_gov_empty(self):
        """Test comparison between Simpler empty list and Grants.gov empty response"""
        # Simpler response: empty list
        simpler_response = {"OpportunityDetails": []}

        # Grants.gov response: namespace attributes but no OpportunityDetails
        grants_gov_response = {
            "@xmlns:app": "http://apply.grants.gov/services/ApplicantWebServices-V2.0",
            "@xmlns:app1": "http://apply.grants.gov/system/ApplicantCommonElements-V1.0",
            "@xmlns:gran": "http://apply.grants.gov/system/GrantsCommonElements-V1.0"
        }

        # Should have no differences after normalization
        diff_result = diff_soap_dicts(simpler_response, grants_gov_response)
        assert diff_result == {}

    def test_simpler_none_vs_grants_gov_empty(self):
        """Test comparison between Simpler None response and Grants.gov empty response"""
        # Simpler response: OpportunityDetails is None (gets excluded from dict)
        simpler_response = {}

        # Grants.gov response: namespace attributes but no OpportunityDetails
        grants_gov_response = {
            "@xmlns:app": "http://apply.grants.gov/services/ApplicantWebServices-V2.0",
            "@xmlns:app1": "http://apply.grants.gov/system/ApplicantCommonElements-V1.0",
            "@xmlns:gran": "http://apply.grants.gov/system/GrantsCommonElements-V1.0"
        }

        # Should have no differences after normalization
        diff_result = diff_soap_dicts(simpler_response, grants_gov_response)
        assert diff_result == {}

    def test_simpler_empty_list_vs_simpler_none(self):
        """Test comparison between different Simpler empty response formats"""
        simpler_empty_list = {"OpportunityDetails": []}
        simpler_none = {}  # OpportunityDetails excluded when None

        # Should have no differences after normalization
        diff_result = diff_soap_dicts(simpler_empty_list, simpler_none)
        assert diff_result == {}

    def test_populated_responses_still_diff_correctly(self):
        """Test that responses with actual differences still show diffs"""
        response_with_data = {
            "OpportunityDetails": [
                {"FundingOpportunityNumber": "TEST-001"}
            ]
        }

        empty_response = {"OpportunityDetails": []}

        # Should show differences since one has data and other is empty
        diff_result = diff_soap_dicts(response_with_data, empty_response)
        assert diff_result != {}
        assert "OpportunityDetails" in diff_result

    def test_namespace_differences_ignored_but_data_differences_detected(self):
        """Test that namespace differences are ignored but actual data differences are caught"""
        response1 = {
            "@xmlns:app": "http://apply.grants.gov/services/ApplicantWebServices-V2.0",
            "OpportunityDetails": [
                {"FundingOpportunityNumber": "TEST-001"}
            ]
        }

        response2 = {
            "@xmlns:different": "http://different.example.com",
            "OpportunityDetails": [
                {"FundingOpportunityNumber": "TEST-002"}  # Different data
            ]
        }

        # Should show differences in the opportunity number but ignore namespace differences
        diff_result = diff_soap_dicts(response1, response2)
        assert diff_result != {}
        assert "OpportunityDetails" in diff_result
        # Namespace differences should not appear in the diff
        assert "keys_only_in_sgg" not in diff_result or "@xmlns:app" not in diff_result.get("keys_only_in_sgg", {})
        assert "keys_only_in_gg" not in diff_result or "@xmlns:different" not in diff_result.get("keys_only_in_gg", {})

    def test_complex_nested_empty_responses(self):
        """Test normalization works with complex nested structures"""
        complex_response1 = {
            "@xmlns:app": "http://apply.grants.gov/services/ApplicantWebServices-V2.0",
            "OpportunityDetails": [],
            "NestedData": {
                "@xmlns:nested": "http://nested.example.com",
                "SomeField": "value"
            }
        }

        complex_response2 = {
            "NestedData": {
                "SomeField": "value"
            }
            # OpportunityDetails missing entirely
        }

        # Should have no differences after normalization
        diff_result = diff_soap_dicts(complex_response1, complex_response2)
        assert diff_result == {}
