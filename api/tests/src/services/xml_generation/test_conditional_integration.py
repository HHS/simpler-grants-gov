"""Integration tests for conditional transformations (simplified for one-to-many only)."""

from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestConditionalIntegration:
    """Test end-to-end conditional transformation integration."""

    def test_one_to_many_applicant_type_codes_integration(self):
        """Test complete one-to-many transformation for applicant type codes."""
        service = XMLGenerationService()

        # Test data with multiple applicant type codes
        application_data = {
            "applicant_type_code": ["A", "B", "C"],
            "applicant_name": "Test Organization",
        }

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify the XML contains the mapped applicant type codes
        assert "ApplicantTypeCode1" in response.xml_data
        assert "ApplicantTypeCode2" in response.xml_data
        assert "ApplicantTypeCode3" in response.xml_data
        assert "<SF424_4_0:ApplicantTypeCode1>A</SF424_4_0:ApplicantTypeCode1>" in response.xml_data
        assert "<SF424_4_0:ApplicantTypeCode2>B</SF424_4_0:ApplicantTypeCode2>" in response.xml_data
        assert "<SF424_4_0:ApplicantTypeCode3>C</SF424_4_0:ApplicantTypeCode3>" in response.xml_data

    def test_one_to_many_single_applicant_type_code_integration(self):
        """Test one-to-many transformation with single applicant type code."""
        service = XMLGenerationService()

        # Test data with single applicant type code
        application_data = {
            "applicant_type_code": ["A"],
            "applicant_name": "Test Organization",
        }

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify only the first type code is mapped
        assert "ApplicantTypeCode1" in response.xml_data
        assert "<SF424_4_0:ApplicantTypeCode1>A</SF424_4_0:ApplicantTypeCode1>" in response.xml_data
        assert "ApplicantTypeCode2" not in response.xml_data

    def test_one_to_many_no_applicant_type_codes_integration(self):
        """Test one-to-many transformation with no applicant type codes."""
        service = XMLGenerationService()

        # Test data without applicant type codes
        application_data = {
            "applicant_name": "Test Organization",
        }

        request = XMLGenerationRequest(
            transform_config=FORM_XML_TRANSFORM_RULES,
            application_data=application_data,
            pretty_print=True,
        )

        response = service.generate_xml(request)

        # Verify no type codes are in the XML
        assert "ApplicantTypeCode1" not in response.xml_data
        assert "ApplicantTypeCode2" not in response.xml_data
        assert "ApplicantTypeCode3" not in response.xml_data


class TestConditionalStructureIntegration:
    """Test end-to-end conditional structure integration (prime vs subawardee use case)."""

    def test_conditional_structure_prime_entity_integration(self):
        """Test complete conditional structure transformation for prime entity."""
        service = XMLGenerationService()

        # Define transform config for SFLLL-like structure with conditional entity
        transform_config = {
            "_xml_config": {
                "xml_structure": {"root_element": "SF_LLL", "version": "1.0"},
                "namespaces": {"default": "http://apply.grants.gov/forms/SF_LLL-V1.0"},
            },
            "report_entity": {
                "xml_transform": {
                    "type": "conditional",
                    "target": "ReportEntity",
                    "conditional_transform": {
                        "type": "conditional_structure",
                        "condition": {
                            "type": "field_equals",
                            "field": "entity_type",
                            "value": "prime",
                        },
                        "if_true": {
                            "target": "ReportEntity",
                            "nested_fields": {
                                "organization_name": {
                                    "xml_transform": {
                                        "target": "PrimeOrganizationName",
                                        "type": "simple",
                                    }
                                },
                                "uei_number": {
                                    "xml_transform": {"target": "PrimeUEI", "type": "simple"}
                                },
                                "tier": {"xml_transform": {"target": "Tier", "type": "simple"}},
                            },
                        },
                        "if_false": {
                            "target": "ReportEntity",
                            "nested_fields": {
                                "organization_name": {
                                    "xml_transform": {
                                        "target": "SubawardeeOrganizationName",
                                        "type": "simple",
                                    }
                                },
                                "individual_name": {
                                    "xml_transform": {"target": "IndividualName", "type": "simple"}
                                },
                            },
                        },
                    },
                }
            },
        }

        # Test data with prime entity
        application_data = {
            "entity_type": "prime",
            "report_entity": {
                "organization_name": "Prime Corp",
                "uei_number": "ABC123DEF456",
                "tier": "1",
            },
        }

        request = XMLGenerationRequest(
            transform_config=transform_config, application_data=application_data, pretty_print=True
        )

        response = service.generate_xml(request)

        # Verify the XML contains prime structure fields
        assert response.success is True
        assert "ReportEntity" in response.xml_data
        assert "PrimeOrganizationName" in response.xml_data
        assert "Prime Corp" in response.xml_data
        assert "PrimeUEI" in response.xml_data
        assert "ABC123DEF456" in response.xml_data
        assert "Tier" in response.xml_data
        assert ">1<" in response.xml_data

        # Verify subawardee fields are not present
        assert "SubawardeeOrganizationName" not in response.xml_data
        assert "IndividualName" not in response.xml_data

    def test_conditional_structure_subawardee_entity_integration(self):
        """Test complete conditional structure transformation for subawardee entity."""
        service = XMLGenerationService()

        # Define transform config for SFLLL-like structure with conditional entity
        transform_config = {
            "_xml_config": {
                "xml_structure": {"root_element": "SF_LLL", "version": "1.0"},
                "namespaces": {"default": "http://apply.grants.gov/forms/SF_LLL-V1.0"},
            },
            "report_entity": {
                "xml_transform": {
                    "type": "conditional",
                    "target": "ReportEntity",
                    "conditional_transform": {
                        "type": "conditional_structure",
                        "condition": {
                            "type": "field_equals",
                            "field": "entity_type",
                            "value": "prime",
                        },
                        "if_true": {
                            "target": "ReportEntity",
                            "nested_fields": {
                                "organization_name": {
                                    "xml_transform": {
                                        "target": "PrimeOrganizationName",
                                        "type": "simple",
                                    }
                                },
                                "uei_number": {
                                    "xml_transform": {"target": "PrimeUEI", "type": "simple"}
                                },
                                "tier": {"xml_transform": {"target": "Tier", "type": "simple"}},
                            },
                        },
                        "if_false": {
                            "target": "ReportEntity",
                            "nested_fields": {
                                "organization_name": {
                                    "xml_transform": {
                                        "target": "SubawardeeOrganizationName",
                                        "type": "simple",
                                    }
                                },
                                "individual_name": {
                                    "xml_transform": {"target": "IndividualName", "type": "simple"}
                                },
                            },
                        },
                    },
                }
            },
        }

        # Test data with subawardee entity
        application_data = {
            "entity_type": "subawardee",
            "report_entity": {
                "organization_name": "Subawardee LLC",
                "individual_name": "John Doe",
            },
        }

        request = XMLGenerationRequest(
            transform_config=transform_config, application_data=application_data, pretty_print=True
        )

        response = service.generate_xml(request)

        # Verify the XML contains subawardee structure fields
        assert response.success is True
        assert "ReportEntity" in response.xml_data
        assert "SubawardeeOrganizationName" in response.xml_data
        assert "Subawardee LLC" in response.xml_data
        assert "IndividualName" in response.xml_data
        assert "John Doe" in response.xml_data

        # Verify prime fields are not present
        assert "PrimeOrganizationName" not in response.xml_data
        assert "PrimeUEI" not in response.xml_data
        assert "Tier" not in response.xml_data

    def test_conditional_structure_with_missing_optional_fields(self):
        """Test conditional structure handles missing optional fields gracefully."""
        service = XMLGenerationService()

        transform_config = {
            "_xml_config": {
                "xml_structure": {"root_element": "SF_LLL", "version": "1.0"},
                "namespaces": {"default": "http://apply.grants.gov/forms/SF_LLL-V1.0"},
            },
            "report_entity": {
                "xml_transform": {
                    "type": "conditional",
                    "target": "ReportEntity",
                    "conditional_transform": {
                        "type": "conditional_structure",
                        "condition": {
                            "type": "field_equals",
                            "field": "entity_type",
                            "value": "prime",
                        },
                        "if_true": {
                            "target": "ReportEntity",
                            "nested_fields": {
                                "organization_name": {
                                    "xml_transform": {
                                        "target": "PrimeOrganizationName",
                                        "type": "simple",
                                    }
                                },
                                "uei_number": {
                                    "xml_transform": {"target": "PrimeUEI", "type": "simple"}
                                },
                            },
                        },
                        "if_false": {
                            "target": "ReportEntity",
                            "nested_fields": {
                                "organization_name": {
                                    "xml_transform": {
                                        "target": "SubawardeeOrganizationName",
                                        "type": "simple",
                                    }
                                }
                            },
                        },
                    },
                }
            },
        }

        # Test data with prime entity but missing optional field (uei_number)
        application_data = {
            "entity_type": "prime",
            "report_entity": {
                "organization_name": "Prime Corp",
                # uei_number is missing
            },
        }

        request = XMLGenerationRequest(
            transform_config=transform_config, application_data=application_data, pretty_print=True
        )

        response = service.generate_xml(request)

        # Verify the XML contains prime structure with only available fields
        assert response.success is True
        assert "ReportEntity" in response.xml_data
        assert "PrimeOrganizationName" in response.xml_data
        assert "Prime Corp" in response.xml_data
        # PrimeUEI should not be present since it was missing
        assert "PrimeUEI" not in response.xml_data

    def test_conditional_structure_with_complex_condition(self):
        """Test conditional structure with complex AND condition."""
        service = XMLGenerationService()

        transform_config = {
            "_xml_config": {
                "xml_structure": {"root_element": "SF_LLL", "version": "1.0"},
                "namespaces": {"default": "http://apply.grants.gov/forms/SF_LLL-V1.0"},
            },
            "report_entity": {
                "xml_transform": {
                    "type": "conditional",
                    "target": "ReportEntity",
                    "conditional_transform": {
                        "type": "conditional_structure",
                        "condition": {
                            "type": "and",
                            "conditions": [
                                {"type": "field_equals", "field": "entity_type", "value": "prime"},
                                {"type": "field_equals", "field": "is_federal", "value": True},
                            ],
                        },
                        "if_true": {
                            "target": "ReportEntity",
                            "nested_fields": {
                                "organization_name": {
                                    "xml_transform": {
                                        "target": "FederalPrimeOrganization",
                                        "type": "simple",
                                    }
                                }
                            },
                        },
                        "if_false": {
                            "target": "ReportEntity",
                            "nested_fields": {
                                "organization_name": {
                                    "xml_transform": {
                                        "target": "OtherOrganization",
                                        "type": "simple",
                                    }
                                }
                            },
                        },
                    },
                }
            },
        }

        # Test data with both conditions true
        application_data = {
            "entity_type": "prime",
            "is_federal": True,
            "report_entity": {"organization_name": "Federal Prime Agency"},
        }

        request = XMLGenerationRequest(
            transform_config=transform_config, application_data=application_data, pretty_print=True
        )

        response = service.generate_xml(request)

        # Verify correct branch was selected
        assert response.success is True
        assert "FederalPrimeOrganization" in response.xml_data
        assert "Federal Prime Agency" in response.xml_data
        assert "OtherOrganization" not in response.xml_data
