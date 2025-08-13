"""
Test cases for empty response comparison fix for issue #5858.

This module contains legacy tests that are kept for backwards compatibility.
The main tests are now in test_empty_response_pipeline_normalization.py which
implements the pipeline normalization approach.
"""

from src.legacy_soap_api.legacy_soap_api_utils import diff_soap_dicts


class TestBasicDiffFunctionality:
    """Test basic diff functionality still works correctly"""

    def test_identical_dicts_show_no_diff(self):
        """Test that identical dictionaries show no differences"""
        dict1 = {"OpportunityDetails": []}
        dict2 = {"OpportunityDetails": []}

        diff_result = diff_soap_dicts(dict1, dict2)
        assert diff_result == {}

    def test_different_dicts_show_differences(self):
        """Test that different dictionaries show differences"""
        dict1 = {"OpportunityDetails": [{"id": "1"}]}
        dict2 = {"OpportunityDetails": [{"id": "2"}]}

        diff_result = diff_soap_dicts(dict1, dict2)
        assert diff_result != {}
        assert "OpportunityDetails" in diff_result

    def test_missing_keys_detected(self):
        """Test that missing keys are properly detected"""
        dict1 = {"OpportunityDetails": [], "ExtraField": "value"}
        dict2 = {"OpportunityDetails": []}

        diff_result = diff_soap_dicts(dict1, dict2)
        assert diff_result != {}
        assert "keys_only_in_sgg" in diff_result
        assert "ExtraField" in diff_result["keys_only_in_sgg"]
