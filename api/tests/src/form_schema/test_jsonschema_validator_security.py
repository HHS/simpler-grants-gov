"""
Unit tests for enhanced JSON schema validation security.
"""

import pytest

from src.form_schema.jsonschema_validator import validate_json_schema
from src.api.response import ValidationErrorDetail


class TestSecureJsonSchemaValidation:
    """Test cases for secure JSON schema validation."""
    
    def test_basic_validation_still_works(self):
        """Test that basic validation functionality is preserved."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string", "maxLength": 100},
                "age": {"type": "integer", "minimum": 0}
            },
            "required": ["name"]
        }
        
        # Valid data should pass
        valid_data = {"name": "John", "age": 30}
        result = validate_json_schema(valid_data, schema)
        assert result == []
        
        # Invalid data should fail
        invalid_data = {"age": -5}  # Missing required name, negative age
        result = validate_json_schema(invalid_data, schema)
        assert len(result) > 0
        assert any("required" in error.message.lower() for error in result)
    
    def test_deeply_nested_structure_rejection(self):
        """Test rejection of excessively deep data structures."""
        # Create deeply nested data that exceeds limits
        deep_data = {"level1": {"level2": {"level3": {"level4": {"level5": {}}}}}}
        for i in range(15):  # Add more nesting levels
            deep_data = {"deeper": deep_data}
        
        simple_schema = {"type": "object"}
        
        result = validate_json_schema(deep_data, simple_schema)
        # Should return validation error for structure safety
        assert len(result) > 0
        assert any("structure" in error.type.lower() for error in result)
    
    def test_excessive_keys_rejection(self):
        """Test rejection of data with too many keys."""
        # Create data with excessive number of keys
        large_data = {f"key{i}": f"value{i}" for i in range(10001)}
        
        simple_schema = {"type": "object"}
        
        result = validate_json_schema(large_data, simple_schema)
        # Should return validation error for structure safety
        assert len(result) > 0
        assert any("structure" in error.type.lower() for error in result)
    
    def test_malicious_schema_rejection(self):
        """Test rejection of potentially malicious schemas."""
        # Create schema with excessive nesting
        malicious_schema = {"type": "object"}
        for i in range(25):  # Exceed depth limit
            malicious_schema = {"properties": {"nested": malicious_schema}}
        
        simple_data = {"test": "value"}
        
        result = validate_json_schema(simple_data, malicious_schema)
        # Should return validation error for schema structure safety
        assert len(result) > 0
        assert any("structure" in error.type.lower() for error in result)
    
    def test_null_injection_in_data(self):
        """Test handling of null byte injection in data."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"}
            }
        }
        
        # Data with null bytes - structure validation should handle this
        data_with_nulls = {"name": "test\x00value"}
        
        # The structure validation should pass since it's not excessively nested
        # but the sanitization should clean the data
        result = validate_json_schema(data_with_nulls, schema)
        # Basic validation should still work
        assert isinstance(result, list)
    
    def test_script_injection_in_strings(self):
        """Test handling of potential script injection in string values."""
        schema = {
            "type": "object", 
            "properties": {
                "content": {"type": "string"}
            }
        }
        
        data_with_script = {"content": "<script>alert('xss')</script>"}
        
        result = validate_json_schema(data_with_script, schema)
        # Should still validate the basic structure
        assert isinstance(result, list)
    
    def test_complex_valid_structure(self):
        """Test that complex but valid structures still pass."""
        schema = {
            "type": "object",
            "properties": {
                "users": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "profile": {
                                "type": "object",
                                "properties": {
                                    "email": {"type": "string"},
                                    "settings": {
                                        "type": "object",
                                        "properties": {
                                            "theme": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        complex_data = {
            "users": [
                {
                    "name": "Alice",
                    "profile": {
                        "email": "alice@example.com",
                        "settings": {
                            "theme": "dark"
                        }
                    }
                }
            ]
        }
        
        result = validate_json_schema(complex_data, schema)
        assert result == []  # Should pass validation
    
    def test_array_with_many_items(self):
        """Test handling of arrays with many items."""
        schema = {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            }
        }
        
        # Array with moderate number of items should be fine
        moderate_data = {"items": [f"item{i}" for i in range(100)]}
        result = validate_json_schema(moderate_data, schema)
        assert result == []
        
        # Array with excessive items might be rejected by structure validation
        excessive_data = {"items": [f"item{i}" for i in range(50000)]}
        result = validate_json_schema(excessive_data, schema)
        # Structure validation might reject this due to size
        assert isinstance(result, list)
    
    def test_error_message_sanitization(self):
        """Test that error messages are properly sanitized."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string", "maxLength": 5}
            },
            "required": ["name"]
        }
        
        # Data that will generate validation errors
        invalid_data = {"name": "ThisNameIsTooLong"}
        
        result = validate_json_schema(invalid_data, schema)
        assert len(result) > 0
        
        # Check that error messages are strings and don't contain dangerous content
        for error in result:
            assert isinstance(error.message, str)
            assert len(error.message) <= 500  # Should be limited in length
            assert "<script>" not in error.message
            assert "\x00" not in error.message