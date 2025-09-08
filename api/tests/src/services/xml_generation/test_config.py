"""Tests for XML generation configuration."""

import pytest

from src.services.xml_generation.config import XMLTransformationConfig


class TestXMLTransformationConfig:
    """Test cases for XMLTransformationConfig."""

    def test_load_sf424_config(self):
        """Test loading SF-424 transformation configuration."""
        config = XMLTransformationConfig("SF424_4_0")
        
        # Verify field mappings are loaded
        field_mappings = config.get_field_mappings()
        assert isinstance(field_mappings, dict)
        assert len(field_mappings) > 0
        
        # Verify some specific mappings
        assert field_mappings.get("submission_type") == "SubmissionType"
        assert field_mappings.get("organization_name") == "OrganizationName"
        assert field_mappings.get("project_title") == "ProjectTitle"

    def test_get_xml_structure(self):
        """Test getting XML structure configuration."""
        config = XMLTransformationConfig("SF424_4_0")
        
        xml_structure = config.get_xml_structure()
        assert isinstance(xml_structure, dict)
        assert xml_structure.get("root_element") == "SF424_4_0"
        assert xml_structure.get("version") == "4.0"

    def test_get_namespace_config(self):
        """Test getting namespace configuration."""
        config = XMLTransformationConfig("SF424_4_0")
        
        namespace_config = config.get_namespace_config()
        assert isinstance(namespace_config, dict)
        assert "default" in namespace_config
        assert namespace_config["default"] == "http://apply.grants.gov/forms/SF424_4_0-V4.0"

    def test_unknown_form_name(self):
        """Test handling of unknown form name."""
        config = XMLTransformationConfig("UNKNOWN_FORM")
        
        # Should return empty configurations
        assert config.get_field_mappings() == {}
        assert config.get_xml_structure() == {}
        assert config.get_namespace_config() == {}

    def test_case_insensitive_form_name(self):
        """Test that form name matching is case insensitive."""
        config_upper = XMLTransformationConfig("SF424_4_0")
        config_lower = XMLTransformationConfig("sf424_4_0")
        
        # Both should load the same configuration
        assert config_upper.get_field_mappings() == config_lower.get_field_mappings()
        assert config_upper.get_xml_structure() == config_lower.get_xml_structure()
