"""
Unit tests for input sanitization utilities.
"""

import pytest
from src.util.input_sanitizer import (
    InputValidationError,
    sanitize_string,
    validate_alphanumeric,
    validate_email,
    validate_numeric_string,
    sanitize_delimited_line,
    validate_json_safe_dict,
)


class TestSanitizeString:
    """Test cases for sanitize_string function."""
    
    def test_basic_sanitization(self):
        """Test basic string sanitization."""
        result = sanitize_string("Hello World")
        assert result == "Hello World"
    
    def test_html_escaping(self):
        """Test HTML escaping when not allowed."""
        result = sanitize_string("<script>alert('xss')</script>")
        assert result == "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
    
    def test_allow_html(self):
        """Test allowing HTML when specified."""
        html_content = "<p>Safe paragraph</p>"
        result = sanitize_string(html_content, allow_html=True)
        assert result == html_content
    
    def test_max_length_validation(self):
        """Test maximum length validation."""
        with pytest.raises(InputValidationError, match="exceeds maximum length"):
            sanitize_string("This is too long", max_length=10)
    
    def test_whitespace_stripping(self):
        """Test whitespace stripping."""
        result = sanitize_string("  trim me  ")
        assert result == "trim me"
    
    def test_whitespace_preservation(self):
        """Test whitespace preservation when disabled."""
        result = sanitize_string("  keep spaces  ", strip_whitespace=False)
        assert result == "  keep spaces  "
    
    def test_null_byte_removal(self):
        """Test removal of null bytes."""
        result = sanitize_string("test\x00null")
        assert result == "testnull"
    
    def test_control_character_removal(self):
        """Test removal of control characters."""
        result = sanitize_string("test\x01\x08\x1fcontrol")
        assert result == "testcontrol"
    
    def test_unicode_normalization(self):
        """Test Unicode normalization."""
        # Using a combining character sequence
        result = sanitize_string("café", normalize_unicode=True)
        # Should normalize to NFC form
        assert len(result) == 4  # 'c', 'a', 'f', 'é' as single character
    
    def test_non_string_input(self):
        """Test error handling for non-string input."""
        with pytest.raises(InputValidationError, match="Input must be a string"):
            sanitize_string(123)


class TestValidateAlphanumeric:
    """Test cases for validate_alphanumeric function."""
    
    def test_valid_alphanumeric(self):
        """Test valid alphanumeric string."""
        result = validate_alphanumeric("abc123")
        assert result == "abc123"
    
    def test_alphanumeric_with_spaces(self):
        """Test alphanumeric with spaces when allowed."""
        result = validate_alphanumeric("abc 123", allow_spaces=True)
        assert result == "abc 123"
    
    def test_invalid_characters(self):
        """Test rejection of invalid characters."""
        with pytest.raises(InputValidationError, match="invalid characters"):
            validate_alphanumeric("abc-123")
    
    def test_spaces_not_allowed(self):
        """Test rejection of spaces when not allowed."""
        with pytest.raises(InputValidationError, match="invalid characters"):
            validate_alphanumeric("abc 123", allow_spaces=False)
    
    def test_empty_string(self):
        """Test rejection of empty string."""
        with pytest.raises(InputValidationError, match="cannot be empty"):
            validate_alphanumeric("")


class TestValidateEmail:
    """Test cases for validate_email function."""
    
    def test_valid_email(self):
        """Test valid email address."""
        result = validate_email("test@example.com")
        assert result == "test@example.com"
    
    def test_email_normalization(self):
        """Test email normalization to lowercase."""
        result = validate_email("TEST@EXAMPLE.COM")
        assert result == "test@example.com"
    
    def test_email_with_plus(self):
        """Test email with plus sign (valid)."""
        result = validate_email("test+tag@example.com")
        assert result == "test+tag@example.com"
    
    def test_email_with_dots(self):
        """Test email with dots in local part."""
        result = validate_email("test.email@example.com")
        assert result == "test.email@example.com"
    
    def test_invalid_email_no_at(self):
        """Test invalid email without @ symbol."""
        with pytest.raises(InputValidationError, match="Invalid email format"):
            validate_email("testexample.com")
    
    def test_invalid_email_no_domain(self):
        """Test invalid email without domain."""
        with pytest.raises(InputValidationError, match="Invalid email format"):
            validate_email("test@")
    
    def test_invalid_email_no_tld(self):
        """Test invalid email without TLD."""
        with pytest.raises(InputValidationError, match="Invalid email format"):
            validate_email("test@example")
    
    def test_email_too_long(self):
        """Test email exceeding maximum length."""
        long_email = "a" * 250 + "@example.com"
        with pytest.raises(InputValidationError, match="too long"):
            validate_email(long_email)
    
    def test_local_part_too_long(self):
        """Test local part exceeding maximum length."""
        long_local = "a" * 65 + "@example.com"
        with pytest.raises(InputValidationError, match="local part is too long"):
            validate_email(long_local)
    
    def test_empty_email(self):
        """Test empty email address."""
        with pytest.raises(InputValidationError, match="cannot be empty"):
            validate_email("")


class TestValidateNumericString:
    """Test cases for validate_numeric_string function."""
    
    def test_valid_integer(self):
        """Test valid integer string."""
        result = validate_numeric_string("123", allow_decimal=False)
        assert result == "123"
    
    def test_valid_decimal(self):
        """Test valid decimal string."""
        result = validate_numeric_string("123.45")
        assert result == "123.45"
    
    def test_negative_number(self):
        """Test negative number."""
        result = validate_numeric_string("-123")
        assert result == "-123"
    
    def test_decimal_not_allowed(self):
        """Test decimal rejection when not allowed."""
        with pytest.raises(InputValidationError, match="Expected integer number"):
            validate_numeric_string("123.45", allow_decimal=False)
    
    def test_invalid_format(self):
        """Test invalid numeric format."""
        with pytest.raises(InputValidationError, match="Invalid numeric format"):
            validate_numeric_string("12.34.56")
    
    def test_min_value_validation(self):
        """Test minimum value validation."""
        with pytest.raises(InputValidationError, match="below minimum"):
            validate_numeric_string("5", min_value=10)
    
    def test_max_value_validation(self):
        """Test maximum value validation."""
        with pytest.raises(InputValidationError, match="exceeds maximum"):
            validate_numeric_string("15", max_value=10)
    
    def test_empty_string(self):
        """Test empty numeric string."""
        with pytest.raises(InputValidationError, match="cannot be empty"):
            validate_numeric_string("")


class TestSanitizeDelimitedLine:
    """Test cases for sanitize_delimited_line function."""
    
    def test_basic_parsing(self):
        """Test basic delimited line parsing."""
        result = sanitize_delimited_line("field1|field2|field3")
        assert result == ["field1", "field2", "field3"]
    
    def test_custom_delimiter(self):
        """Test custom delimiter."""
        result = sanitize_delimited_line("field1,field2,field3", delimiter=",")
        assert result == ["field1", "field2", "field3"]
    
    def test_field_count_validation(self):
        """Test field count validation."""
        with pytest.raises(InputValidationError, match="Expected 2 fields but found 3"):
            sanitize_delimited_line("field1|field2|field3", expected_fields=2)
    
    def test_field_length_validation(self):
        """Test field length validation."""
        long_field = "a" * 1001
        with pytest.raises(InputValidationError, match="exceeds maximum length"):
            sanitize_delimited_line(f"field1|{long_field}", max_field_length=1000)
    
    def test_null_byte_rejection(self):
        """Test rejection of null bytes."""
        with pytest.raises(InputValidationError, match="null bytes"):
            sanitize_delimited_line("field1\x00|field2")
    
    def test_empty_fields(self):
        """Test handling of empty fields."""
        result = sanitize_delimited_line("field1||field3")
        assert result == ["field1", "", "field3"]
    
    def test_whitespace_trimming(self):
        """Test whitespace trimming in fields."""
        result = sanitize_delimited_line("  field1  |  field2  ")
        assert result == ["field1", "field2"]
    
    def test_empty_line(self):
        """Test empty line rejection."""
        with pytest.raises(InputValidationError, match="cannot be empty"):
            sanitize_delimited_line("")


class TestValidateJsonSafeDict:
    """Test cases for validate_json_safe_dict function."""
    
    def test_valid_dict(self):
        """Test valid dictionary."""
        data = {"key1": "value1", "key2": {"nested": "value2"}}
        result = validate_json_safe_dict(data)
        assert result == data
    
    def test_max_depth_validation(self):
        """Test maximum depth validation."""
        nested_dict = {"level1": {"level2": {"level3": {"level4": "deep"}}}}
        with pytest.raises(InputValidationError, match="exceeds maximum depth"):
            validate_json_safe_dict(nested_dict, max_depth=2)
    
    def test_max_keys_validation(self):
        """Test maximum keys validation."""
        large_dict = {f"key{i}": f"value{i}" for i in range(1001)}
        with pytest.raises(InputValidationError, match="exceeding maximum"):
            validate_json_safe_dict(large_dict, max_keys=1000)
    
    def test_nested_keys_counting(self):
        """Test that nested keys are counted."""
        data = {
            "level1": {
                "key1": "value1",
                "key2": "value2"
            },
            "level2": {
                "key3": "value3"
            }
        }
        # Should count all keys: level1, level2, key1, key2, key3 = 5 keys
        result = validate_json_safe_dict(data, max_keys=10)
        assert result == data
        
        # Should fail with max_keys=4 (5 > 4)
        with pytest.raises(InputValidationError):
            validate_json_safe_dict(data, max_keys=4)
    
    def test_list_handling(self):
        """Test handling of lists in dictionary."""
        data = {
            "list_field": [
                {"item1": "value1"},
                {"item2": "value2"}
            ]
        }
        result = validate_json_safe_dict(data)
        assert result == data
    
    def test_non_dict_input(self):
        """Test error handling for non-dict input."""
        with pytest.raises(InputValidationError, match="must be a dictionary"):
            validate_json_safe_dict("not a dict")
    
    def test_complex_nested_structure(self):
        """Test complex nested structure validation."""
        data = {
            "users": [
                {
                    "name": "John",
                    "preferences": {
                        "theme": "dark",
                        "notifications": {
                            "email": True,
                            "sms": False
                        }
                    }
                }
            ]
        }
        result = validate_json_safe_dict(data, max_depth=5, max_keys=20)
        assert result == data


class TestInputValidationError:
    """Test cases for InputValidationError exception."""
    
    def test_basic_error(self):
        """Test basic error creation."""
        error = InputValidationError("Test error")
        assert str(error) == "Test error"
        assert error.field_name == ""
        assert error.value is None
    
    def test_error_with_field_and_value(self):
        """Test error with field name and value."""
        error = InputValidationError("Test error", field_name="test_field", value="test_value")
        assert str(error) == "Test error"
        assert error.field_name == "test_field"
        assert error.value == "test_value"