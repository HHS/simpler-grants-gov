"""Tests for recursive XML transformer."""

from src.services.xml_generation.transformers.base_transformer import RecursiveXMLTransformer


class TestRecursiveXMLTransformer:
    """Test cases for RecursiveXMLTransformer."""

    def test_transform_basic_field_mapping(self):
        """Test basic field mapping transformation."""
        # Create transform config using new recursive pattern
        transform_config = {
            "submission_type": {"xml_transform": {"target": "SubmissionType"}},
            "organization_name": {"xml_transform": {"target": "OrganizationName"}},
            "project_title": {"xml_transform": {"target": "ProjectTitle"}},
        }

        transformer = RecursiveXMLTransformer(transform_config)

        # Test data
        source_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            "project_title": "Research Project",
            "unmapped_field": "Should be ignored",
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
        transform_config = {
            "submission_type": {"xml_transform": {"target": "SubmissionType"}},
        }

        transformer = RecursiveXMLTransformer(transform_config)

        # Test with empty data
        result = transformer.transform({})
        assert result == {}

    def test_transform_missing_source_fields(self):
        """Test transformation when source fields are missing."""
        transform_config = {
            "submission_type": {"xml_transform": {"target": "SubmissionType"}},
            "organization_name": {"xml_transform": {"target": "OrganizationName"}},
            "missing_field": {"xml_transform": {"target": "MissingField"}},
        }

        transformer = RecursiveXMLTransformer(transform_config)

        source_data = {
            "submission_type": "Application",
            "organization_name": "Test University",
            # missing_field is not present
        }

        result = transformer.transform(source_data)

        # Should only include fields that exist in source data
        assert result["SubmissionType"] == "Application"
        assert result["OrganizationName"] == "Test University"
        assert "MissingField" not in result

    def test_transform_with_none_values(self):
        """Test transformation handles None values correctly."""
        transform_config = {
            "submission_type": {"xml_transform": {"target": "SubmissionType"}},
            "organization_name": {"xml_transform": {"target": "OrganizationName"}},
            "optional_field": {"xml_transform": {"target": "OptionalField"}},
        }

        transformer = RecursiveXMLTransformer(transform_config)

        source_data = {
            "submission_type": "Application",
            "organization_name": None,
            "optional_field": "Present",
        }

        result = transformer.transform(source_data)

        # Should only include non-None values
        assert result["SubmissionType"] == "Application"
        assert result["OptionalField"] == "Present"
        # None values are excluded by the recursive transformer
        assert "OrganizationName" not in result

    def test_transform_various_data_types(self):
        """Test transformation with various data types."""
        transform_config = {
            "string_field": {"xml_transform": {"target": "StringField"}},
            "int_field": {"xml_transform": {"target": "IntField"}},
            "float_field": {"xml_transform": {"target": "FloatField"}},
            "bool_field": {"xml_transform": {"target": "BoolField"}},
            "list_field": {"xml_transform": {"target": "ListField"}},
        }

        transformer = RecursiveXMLTransformer(transform_config)

        source_data = {
            "string_field": "test string",
            "int_field": 42,
            "float_field": 3.14,
            "bool_field": True,
            "list_field": ["item1", "item2"],
        }

        result = transformer.transform(source_data)

        # Should preserve data types
        assert result["StringField"] == "test string"
        assert result["IntField"] == 42
        assert result["FloatField"] == 3.14
        assert result["BoolField"] is True
        assert result["ListField"] == ["item1", "item2"]

    def test_transform_nested_object(self):
        """Test transformation with nested objects."""
        transform_config = {
            "submission_type": {"xml_transform": {"target": "SubmissionType"}},
            "applicant_address": {
                "xml_transform": {"target": "Applicant", "type": "nested_object"},
                "address_line_1": {"xml_transform": {"target": "Street1"}},
                "city": {"xml_transform": {"target": "City"}},
                "state_code": {"xml_transform": {"target": "State"}},
            },
        }

        transformer = RecursiveXMLTransformer(transform_config)

        source_data = {
            "submission_type": "Application",
            "applicant_address": {
                "address_line_1": "123 Main St",
                "city": "Washington",
                "state_code": "DC",
            },
        }

        result = transformer.transform(source_data)

        # Should include simple field
        assert result["SubmissionType"] == "Application"

        # Should include nested object
        assert "Applicant" in result
        nested_result = result["Applicant"]
        assert nested_result["Street1"] == "123 Main St"
        assert nested_result["City"] == "Washington"
        assert nested_result["State"] == "DC"
