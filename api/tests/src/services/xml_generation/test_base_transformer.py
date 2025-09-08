"""Tests for base transformer."""

import pytest
from unittest.mock import Mock

from src.services.xml_generation.config import XMLTransformationConfig
from src.services.xml_generation.transformers.base_transformer import BaseTransformer


class TestBaseTransformer:
    """Test cases for BaseTransformer."""

    def test_transform_basic_field_mapping(self):
        """Test basic field mapping transformation."""
        # Create mock config
        mock_config = Mock(spec=XMLTransformationConfig)
        mock_config.get_field_mappings.return_value = {
            "submission_type": "SubmissionType",
            "organization_name": "OrganizationName",
            "project_title": "ProjectTitle"
        }
        
        transformer = BaseTransformer(mock_config)
        
        # Test data
        source_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "project_title": "Research Project",
            "unmapped_field": "Should be ignored"
        }
        
        result = transformer.transform(source_data)
        
        # Verify transformations
        assert result["SubmissionType"] == "Application"
        assert result["OrganizationName"] == "Test University"
        assert result["ProjectTitle"] == "Research Project"
        
        # Verify unmapped field is not included
        assert "unmapped_field" not in result
        assert "Should be ignored" not in result.values()

    def test_transform_empty_data(self):
        """Test transformation with empty input data."""
        mock_config = Mock(spec=XMLTransformationConfig)
        mock_config.get_field_mappings.return_value = {
            "submission_type": "SubmissionType"
        }
        
        transformer = BaseTransformer(mock_config)
        
        # Test with empty data
        result = transformer.transform({})
        assert result == {}
        
        # Test with None data
        result = transformer.transform(None)
        assert result == {}

    def test_transform_missing_source_fields(self):
        """Test transformation when source fields are missing."""
        mock_config = Mock(spec=XMLTransformationConfig)
        mock_config.get_field_mappings.return_value = {
            "submission_type": "SubmissionType",
            "organization_name": "OrganizationName",
            "missing_field": "MissingField"
        }
        
        transformer = BaseTransformer(mock_config)
        
        source_data = {
            "submission_type": "Application",
            "organization_name": "Test University"
            # missing_field is not present
        }
        
        result = transformer.transform(source_data)
        
        # Should only include fields that exist in source data
        assert result["SubmissionType"] == "Application"
        assert result["OrganizationName"] == "Test University"
        assert "MissingField" not in result

    def test_transform_with_none_values(self):
        """Test transformation handles None values correctly."""
        mock_config = Mock(spec=XMLTransformationConfig)
        mock_config.get_field_mappings.return_value = {
            "submission_type": "SubmissionType",
            "organization_name": "OrganizationName",
            "optional_field": "OptionalField"
        }
        
        transformer = BaseTransformer(mock_config)
        
        source_data = {
            "submission_type": "Application",
            "organization_name": None,
            "optional_field": "Present"
        }
        
        result = transformer.transform(source_data)
        
        # Should include all mapped fields, even None values
        assert result["SubmissionType"] == "Application"
        assert result["OrganizationName"] is None
        assert result["OptionalField"] == "Present"

    def test_transform_various_data_types(self):
        """Test transformation with various data types."""
        mock_config = Mock(spec=XMLTransformationConfig)
        mock_config.get_field_mappings.return_value = {
            "string_field": "StringField",
            "int_field": "IntField",
            "float_field": "FloatField",
            "bool_field": "BoolField",
            "list_field": "ListField"
        }
        
        transformer = BaseTransformer(mock_config)
        
        source_data = {
            "string_field": "test string",
            "int_field": 42,
            "float_field": 3.14,
            "bool_field": True,
            "list_field": ["item1", "item2"]
        }
        
        result = transformer.transform(source_data)
        
        # Should preserve data types
        assert result["StringField"] == "test string"
        assert result["IntField"] == 42
        assert result["FloatField"] == 3.14
        assert result["BoolField"] is True
        assert result["ListField"] == ["item1", "item2"]
