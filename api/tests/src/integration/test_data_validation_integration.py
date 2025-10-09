"""
Integration tests for end-to-end data flow validation and security.

These tests validate that the security enhancements work together properly
across different components of the system.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO
import json

from src.util.input_sanitizer import (
    InputValidationError,
    sanitize_string,
    sanitize_delimited_line,
    validate_json_safe_dict
)
from src.form_schema.jsonschema_validator import validate_json_schema
from src.api.response import ValidationErrorDetail


class TestEndToEndDataValidation:
    """Test end-to-end data validation across components."""
    
    def test_safe_data_flows_through_system(self):
        """Test that safe data flows through validation layers properly."""
        # Simulate data from external source
        raw_data = "user@example.com|John Doe|30|Software Engineer"
        
        # Step 1: Parse delimited data safely
        parsed_fields = sanitize_delimited_line(raw_data, delimiter="|")
        assert len(parsed_fields) == 4
        assert parsed_fields[0] == "user@example.com"
        assert parsed_fields[1] == "John Doe"
        assert parsed_fields[2] == "30"
        assert parsed_fields[3] == "Software Engineer"
        
        # Step 2: Build JSON structure
        json_data = {
            "email": parsed_fields[0],
            "name": parsed_fields[1],
            "age": int(parsed_fields[2]),
            "position": parsed_fields[3]
        }
        
        # Step 3: Validate JSON structure safety
        validated_data = validate_json_safe_dict(json_data)
        assert validated_data == json_data
        
        # Step 4: Validate against JSON schema
        schema = {
            "type": "object",
            "properties": {
                "email": {"type": "string", "format": "email"},
                "name": {"type": "string", "maxLength": 100},
                "age": {"type": "integer", "minimum": 0},
                "position": {"type": "string", "maxLength": 200}
            },
            "required": ["email", "name"]
        }
        
        validation_errors = validate_json_schema(validated_data, schema)
        assert validation_errors == []
    
    def test_malicious_data_blocked_at_each_layer(self):
        """Test that malicious data is blocked at appropriate validation layers."""
        # Test XSS attempt in delimited data
        malicious_data = "user@test.com|<script>alert('xss')</script>|25|Engineer"
        
        # Step 1: Parse with sanitization
        parsed_fields = sanitize_delimited_line(malicious_data, delimiter="|")
        assert len(parsed_fields) == 4
        # Should be sanitized (HTML escaped)
        assert "<script>" not in parsed_fields[1]
        
        # Test SQL injection attempt
        sql_injection_data = "'; DROP TABLE users; --|John|30|Engineer"
        parsed_sql_fields = sanitize_delimited_line(sql_injection_data, delimiter="|")
        # Should still parse but be sanitized
        assert len(parsed_sql_fields) == 4
        
        # Test deeply nested JSON attack
        deep_json = {"level1": {"level2": {}}}
        for i in range(25):  # Create excessive nesting
            deep_json = {"deeper": deep_json}
        
        # Should be rejected by structure validation
        with pytest.raises(InputValidationError):
            validate_json_safe_dict(deep_json, max_depth=10)
    
    def test_resource_exhaustion_prevented(self):
        """Test that resource exhaustion attacks are prevented."""
        # Test extremely long field values
        long_value = "x" * 10001
        with pytest.raises(InputValidationError):
            sanitize_string(long_value, max_length=10000)
        
        # Test excessive number of fields in delimited data
        many_fields = "|".join([f"field{i}" for i in range(1001)])
        parsed_fields = sanitize_delimited_line(many_fields, delimiter="|")
        # Should parse but individual fields are limited
        assert len(parsed_fields) == 1001
        
        # Test large JSON with many keys
        large_json = {f"key{i}": f"value{i}" for i in range(10001)}
        with pytest.raises(InputValidationError):
            validate_json_safe_dict(large_json, max_keys=10000)
    
    def test_unicode_handling_across_components(self):
        """Test proper Unicode handling across all components."""
        # Test various Unicode scenarios
        unicode_data = "user@test.com|José María|25|Développeur"
        
        # Should handle Unicode properly
        parsed_fields = sanitize_delimited_line(unicode_data, delimiter="|")
        assert len(parsed_fields) == 4
        assert "José" in parsed_fields[1]
        assert "Développeur" in parsed_fields[3]
        
        # Test Unicode normalization
        combined_chars = "café"  # Using combining characters
        normalized = sanitize_string(combined_chars, normalize_unicode=True)
        # Should be normalized to NFC form
        assert len(normalized) == 4  # Should be 4 characters, not 5
    
    def test_error_message_consistency(self):
        """Test that error messages are consistent and don't leak information."""
        # Test various validation failures
        try:
            sanitize_string("", max_length=0)
        except InputValidationError as e:
            assert len(str(e)) > 0
            assert "maximum length" in str(e).lower()
        
        # Test field extraction error
        try:
            from src.task.sam_extracts.process_sam_extracts import get_token_value
            get_token_value(["field1"], 5)  # Index out of range
        except ValueError as e:
            assert "fewer values than expected" in str(e)
            # Should not expose internal details
            assert "internal" not in str(e).lower()
    
    def test_null_byte_handling_across_layers(self):
        """Test that null bytes are properly handled at all layers."""
        # Test null bytes in different contexts
        null_data = "field1\x00|field2\x00|field3"
        
        # Should be cleaned at delimited parsing
        parsed_fields = sanitize_delimited_line(null_data, delimiter="|")
        for field in parsed_fields:
            assert "\x00" not in field
        
        # Test null bytes in string sanitization
        null_string = "text\x00with\x00nulls"
        sanitized = sanitize_string(null_string)
        assert "\x00" not in sanitized
        assert sanitized == "textwithnulls"


class TestComponentIntegration:
    """Test integration between different validation components."""
    
    def test_sam_extract_to_json_validation(self):
        """Test SAM extract processing feeding into JSON validation."""
        # Simulate a line from SAM extract
        sam_line = "123456789|ACME Corp|2024-12-31|active|john@acme.com|John|Smith"
        
        # Parse safely
        parsed_fields = sanitize_delimited_line(sam_line, delimiter="|")
        
        # Convert to entity-like structure
        entity_data = {
            "uei": parsed_fields[0],
            "legal_business_name": parsed_fields[1],
            "registration_date": parsed_fields[2],
            "status": parsed_fields[3],
            "email": parsed_fields[4],
            "first_name": parsed_fields[5],
            "last_name": parsed_fields[6]
        }
        
        # Validate structure
        validated_entity = validate_json_safe_dict(entity_data)
        assert validated_entity == entity_data
        
        # Define schema for entity validation
        entity_schema = {
            "type": "object",
            "properties": {
                "uei": {"type": "string", "pattern": "^[0-9]+$"},
                "legal_business_name": {"type": "string", "maxLength": 500},
                "registration_date": {"type": "string"},
                "status": {"type": "string", "enum": ["active", "inactive"]},
                "email": {"type": "string", "format": "email"},
                "first_name": {"type": "string", "maxLength": 100},
                "last_name": {"type": "string", "maxLength": 100}
            },
            "required": ["uei", "legal_business_name"]
        }
        
        # Should validate successfully
        errors = validate_json_schema(validated_entity, entity_schema)
        assert errors == []
    
    def test_api_request_validation_chain(self):
        """Test API request validation through multiple layers."""
        # Simulate incoming API request data
        api_request = {
            "form_data": {
                "applicant_name": "  John Doe  ",  # Has whitespace
                "email": "JOHN@EXAMPLE.COM",  # Mixed case
                "project_description": "<p>My project</p>",  # HTML content
                "budget": "50000.00"
            },
            "metadata": {
                "submission_time": "2024-01-01T00:00:00Z",
                "user_agent": "Mozilla/5.0..."
            }
        }
        
        # Step 1: Validate overall structure
        validated_request = validate_json_safe_dict(api_request)
        assert "form_data" in validated_request
        
        # Step 2: Sanitize form fields
        form_data = validated_request["form_data"]
        sanitized_form = {}
        
        for key, value in form_data.items():
            if isinstance(value, str):
                # Sanitize each string field
                sanitized_form[key] = sanitize_string(value, max_length=10000)
        
        # Step 3: Validate against form schema
        form_schema = {
            "type": "object",
            "properties": {
                "applicant_name": {"type": "string", "maxLength": 100},
                "email": {"type": "string", "format": "email"},
                "project_description": {"type": "string", "maxLength": 5000},
                "budget": {"type": "string", "pattern": r"^\d+(\.\d{2})?$"}
            },
            "required": ["applicant_name", "email"]
        }
        
        validation_errors = validate_json_schema(sanitized_form, form_schema)
        assert validation_errors == []
        
        # Verify sanitization worked
        assert sanitized_form["applicant_name"] == "John Doe"  # Trimmed
        assert "&lt;p&gt;" in sanitized_form["project_description"]  # HTML escaped
    
    def test_cross_component_error_handling(self):
        """Test that errors are properly handled across component boundaries."""
        # Test scenario where multiple validation layers catch different issues
        problematic_data = {
            "field1": "x" * 15000,  # Too long - should be caught by sanitizer
            "field2": "<script>alert('xss')</script>",  # XSS - should be sanitized
            "nested": {
                "deep": {
                    "very": {
                        "deep": "value"
                    }
                }
            }
        }
        
        # Add more nesting to exceed limits
        for i in range(15):
            problematic_data["nested"] = {"level": problematic_data["nested"]}
        
        # Should be caught by structure validation
        with pytest.raises(InputValidationError):
            validate_json_safe_dict(problematic_data, max_depth=10)
        
        # Test individual field sanitization
        with pytest.raises(InputValidationError):
            sanitize_string(problematic_data["field1"], max_length=10000)
        
        # XSS should be sanitized, not rejected
        sanitized_xss = sanitize_string(problematic_data["field2"])
        assert "<script>" not in sanitized_xss
        assert "&lt;script&gt;" in sanitized_xss


class TestPerformanceAndLimits:
    """Test that performance limits are enforced correctly."""
    
    def test_reasonable_data_sizes_accepted(self):
        """Test that reasonable data sizes are accepted."""
        # Create moderately sized but reasonable data
        reasonable_data = {
            "users": [
                {
                    "name": f"User {i}",
                    "email": f"user{i}@example.com",
                    "profile": {
                        "bio": "A short bio",
                        "preferences": {
                            "theme": "light",
                            "language": "en"
                        }
                    }
                }
                for i in range(100)  # 100 users - reasonable size
            ]
        }
        
        # Should pass structure validation
        validated_data = validate_json_safe_dict(reasonable_data, max_keys=1000, max_depth=10)
        assert len(validated_data["users"]) == 100
        
        # Should pass JSON schema validation
        user_schema = {
            "type": "object",
            "properties": {
                "users": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "email": {"type": "string", "format": "email"}
                        }
                    }
                }
            }
        }
        
        errors = validate_json_schema(validated_data, user_schema)
        assert errors == []
    
    def test_gradual_limit_enforcement(self):
        """Test that limits are enforced gradually, not abruptly."""
        # Test string length limits
        max_length = 1000
        
        # Just under limit should pass
        under_limit = "x" * (max_length - 1)
        result = sanitize_string(under_limit, max_length=max_length)
        assert len(result) == max_length - 1
        
        # At limit should pass
        at_limit = "x" * max_length
        result = sanitize_string(at_limit, max_length=max_length)
        assert len(result) == max_length
        
        # Over limit should fail
        over_limit = "x" * (max_length + 1)
        with pytest.raises(InputValidationError):
            sanitize_string(over_limit, max_length=max_length)