"""Tests for XML generation configuration."""

from src.services.xml_generation.config import is_form_xml_supported, load_xml_transform_config


class TestXMLTransformConfig:
    """Test cases for XML transform config loading."""

    def test_load_sf424_config(self):
        """Test loading SF-424 transformation configuration."""
        config = load_xml_transform_config("SF424_4_0")

        # Verify config is loaded as dict
        assert isinstance(config, dict)
        assert len(config) > 0

        # Verify XML config metadata
        xml_config = config.get("_xml_config", {})
        assert xml_config.get("form_name") == "SF424_4_0"
        assert xml_config.get("version") == "1.0"

        # Verify some specific field transformations using new structure
        assert "submission_type" in config
        submission_type_rule = config["submission_type"]
        assert isinstance(submission_type_rule, dict)
        assert submission_type_rule.get("xml_transform", {}).get("target") == "SubmissionType"

        # Test direct field mappings
        assert (
            config.get("organization_name", {}).get("xml_transform", {}).get("target")
            == "OrganizationName"
        )
        assert (
            config.get("project_title", {}).get("xml_transform", {}).get("target") == "ProjectTitle"
        )

    def test_get_xml_structure(self):
        """Test getting XML structure configuration."""
        config = load_xml_transform_config("SF424_4_0")

        xml_config = config.get("_xml_config", {})
        xml_structure = xml_config.get("xml_structure", {})
        assert isinstance(xml_structure, dict)
        assert xml_structure.get("root_element") == "SF424_4_0"
        assert xml_structure.get("version") == "4.0"

    def test_get_namespace_config(self):
        """Test getting namespace configuration."""
        config = load_xml_transform_config("SF424_4_0")

        xml_config = config.get("_xml_config", {})
        namespace_config = xml_config.get("namespaces", {})
        assert isinstance(namespace_config, dict)
        assert "default" in namespace_config
        assert namespace_config["default"] == "http://apply.grants.gov/forms/SF424_4_0-V4.0"

    def test_unknown_form_name(self):
        """Test handling of unknown form name."""
        config = load_xml_transform_config("UNKNOWN_FORM")

        # Should return empty configuration
        assert config == {}

    def test_case_insensitive_form_name(self):
        """Test that form name matching is case insensitive."""
        config_upper = load_xml_transform_config("SF424_4_0")
        config_lower = load_xml_transform_config("sf424_4_0")

        # Both should load the same configuration
        assert config_upper == config_lower

    def test_load_project_narrative_attachment_config(self):
        """Test loading Project Narrative Attachment transformation configuration."""
        config = load_xml_transform_config("ProjectNarrativeAttachments_1_2")

        # Verify config is loaded as dict
        assert isinstance(config, dict)
        assert len(config) > 0

        # Verify XML config metadata
        xml_config = config.get("_xml_config", {})
        assert xml_config.get("form_name") == "ProjectNarrativeAttachments_1_2"
        assert xml_config.get("version") == "1.0"

        # Verify XML structure
        xml_structure = xml_config.get("xml_structure", {})
        assert xml_structure.get("root_element") == "ProjectNarrativeAttachments_1_2"
        assert xml_structure.get("root_attributes", {}).get("FormVersion") == "1.2"

        # Verify namespace config
        namespace_config = xml_config.get("namespaces", {})
        assert (
            namespace_config.get("default")
            == "http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2"
        )

        # Verify attachment field configuration
        attachment_fields = xml_config.get("attachment_fields", {})
        assert "attachments" in attachment_fields
        assert attachment_fields["attachments"]["xml_element"] == "Attachments"
        assert attachment_fields["attachments"]["type"] == "multiple"

    def test_load_budget_narrative_attachment_config(self):
        """Test loading Budget Narrative Attachment transformation configuration."""
        config = load_xml_transform_config("BudgetNarrativeAttachments_1_2")

        # Verify config is loaded as dict
        assert isinstance(config, dict)
        assert len(config) > 0

        # Verify XML config metadata
        xml_config = config.get("_xml_config", {})
        assert xml_config.get("form_name") == "BudgetNarrativeAttachments_1_2"
        assert xml_config.get("version") == "1.0"

        # Verify XML structure
        xml_structure = xml_config.get("xml_structure", {})
        assert xml_structure.get("root_element") == "BudgetNarrativeAttachments_1_2"
        assert xml_structure.get("root_attributes", {}).get("FormVersion") == "1.2"

        # Verify namespace config
        namespace_config = xml_config.get("namespaces", {})
        assert (
            namespace_config.get("default")
            == "http://apply.grants.gov/forms/BudgetNarrativeAttachments_1_2-V1.2"
        )

        # Verify attachment field configuration
        attachment_fields = xml_config.get("attachment_fields", {})
        assert "attachments" in attachment_fields
        assert attachment_fields["attachments"]["xml_element"] == "Attachments"
        assert attachment_fields["attachments"]["type"] == "multiple"

    def test_is_form_xml_supported(self):
        """Test checking if forms are supported for XML generation."""
        # Supported forms
        assert is_form_xml_supported("SF424_4_0") is True
        assert is_form_xml_supported("ProjectNarrativeAttachments_1_2") is True
        assert is_form_xml_supported("BudgetNarrativeAttachments_1_2") is True

        # Unsupported form
        assert is_form_xml_supported("UNKNOWN_FORM") is False
