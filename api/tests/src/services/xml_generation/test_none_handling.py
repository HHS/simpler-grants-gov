"""Tests for None value handling in XML generation."""

import pytest

from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.constants import NO_VALUE
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.transformers.base_transformer import RecursiveXMLTransformer


class TestNoneHandling:
    """Test cases for configurable None value handling."""

    def test_none_handling_exclude_default(self):
        """Test default behavior - exclude None values from XML."""
        application_data = {
            "submission_type": "Application",
            "organization_name": None,  # Should be excluded (default behavior)
            "project_title": "Test Project",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify None field is excluded
        assert "OrganizationName" not in xml_data
        # Verify non-None fields are included
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert "<SF424_4_0:ProjectTitle>Test Project</SF424_4_0:ProjectTitle>" in xml_data

    def test_none_handling_include_null(self):
        """Test include_null behavior - include empty XML elements."""
        application_data = {
            "submission_type": "Application",
            "date_received": None,  # Configured with include_null
            "project_title": "Test Project",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify None field is included as empty element (various formats)
        assert (
            "<SF424_4_0:DateReceived></SF424_4_0:DateReceived>" in xml_data
            or "<SF424_4_0:DateReceived/>" in xml_data
            or "<SF424_4_0:DateReceived />" in xml_data
        )
        # Verify non-None fields are included normally
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert "<SF424_4_0:ProjectTitle>Test Project</SF424_4_0:ProjectTitle>" in xml_data

    def test_none_handling_default_value(self):
        """Test default_value behavior - use configured default when None."""
        application_data = {
            "submission_type": "Application",
            "state_review": None,  # Configured with default_value = "N: No"
            "project_title": "Test Project",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify None field gets default value
        assert f"<SF424_4_0:StateReview>{NO_VALUE}</SF424_4_0:StateReview>" in xml_data
        # Verify non-None fields are included normally
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert "<SF424_4_0:ProjectTitle>Test Project</SF424_4_0:ProjectTitle>" in xml_data

    def test_none_handling_mixed_behaviors(self):
        """Test multiple None handling behaviors in same request."""
        application_data = {
            "submission_type": "Application",
            "organization_name": None,  # exclude (default)
            "date_received": None,  # include_null
            "state_review": None,  # default_value = "N: No"
            "project_title": "Test Project",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify each None handling behavior
        assert "OrganizationName" not in xml_data  # excluded
        assert (
            "<SF424_4_0:DateReceived></SF424_4_0:DateReceived>" in xml_data
            or "<SF424_4_0:DateReceived/>" in xml_data
            or "<SF424_4_0:DateReceived />" in xml_data
        )  # empty element
        assert (
            f"<SF424_4_0:StateReview>{NO_VALUE}</SF424_4_0:StateReview>" in xml_data
        )  # default value
        # Verify non-None fields are included normally
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert "<SF424_4_0:ProjectTitle>Test Project</SF424_4_0:ProjectTitle>" in xml_data

    def test_none_handling_with_value_transforms(self):
        """Test None handling works with value transformations."""
        application_data = {
            "submission_type": "Application",
            "federal_estimated_funding": None,  # Has currency transform, should be excluded
            "delinquent_federal_debt": None,  # Has boolean transform, should be excluded
            "project_title": "Test Project",
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify None fields with transforms are excluded
        assert "FederalEstimatedFunding" not in xml_data
        assert "DelinquentFederalDebt" not in xml_data
        # Verify non-None fields are included
        assert "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>" in xml_data
        assert "<SF424_4_0:ProjectTitle>Test Project</SF424_4_0:ProjectTitle>" in xml_data

    def test_none_handling_invalid_configuration(self):
        """Test that invalid null_handling values fall back to exclude."""
        # This would require creating a test-specific configuration
        # For now, we'll test the warning path indirectly through logging
        # The actual test would need to mock the configuration
        pass

    def test_none_handling_nested_objects(self):
        """Test None handling with nested object structures."""
        application_data = {
            "submission_type": "Application",
            "applicant": {
                "street1": "123 Main St",
                "street2": None,  # Should be excluded from nested structure
                "city": "Washington",
                "state": None,  # Should be excluded
            },
        }

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data, transform_config=FORM_XML_TRANSFORM_RULES
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Verify nested structure is created
        assert "<SF424_4_0:Applicant>" in xml_data
        assert "globLib:Street1" in xml_data and "123 Main St" in xml_data
        assert "globLib:City" in xml_data and "Washington" in xml_data
        # Verify None nested fields are excluded
        assert "Street2" not in xml_data
        assert (
            "<State>" not in xml_data
        )  # More specific - looking for the State element, not substring
        assert "</SF424_4_0:Applicant>" in xml_data

    def test_unknown_null_handling_raises_error(self):
        """Test that unknown null_handling configuration raises ValueError."""
        transform_config = {
            "test_field": {
                "xml_transform": {
                    "target": "TestField",
                    "null_handling": "unknown_option",  # Invalid option
                }
            }
        }

        transformer = RecursiveXMLTransformer(transform_config)

        # Source data with None value to trigger null_handling
        source_data = {"test_field": None}

        with pytest.raises(ValueError, match="Unknown null_handling 'unknown_option'"):
            transformer.transform(source_data)

    def test_default_value_without_default_raises_error(self):
        """Test that null_handling 'default_value' without default_value raises ValueError."""
        transform_config = {
            "test_field": {
                "xml_transform": {
                    "target": "TestField",
                    "null_handling": "default_value",  # Missing default_value
                }
            }
        }

        transformer = RecursiveXMLTransformer(transform_config)

        # Source data with None value to trigger null_handling
        source_data = {"test_field": None}

        with pytest.raises(
            ValueError,
            match="null_handling 'default_value' specified but no default_value provided",
        ):
            transformer.transform(source_data)
