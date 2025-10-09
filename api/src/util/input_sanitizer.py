"""
Input sanitization utilities for secure data handling.

This module provides functions to validate and sanitize user input
to prevent data injection vulnerabilities and ensure data integrity.
"""

import html
import logging
import re
import unicodedata
from typing import Any, Optional, Union

logger = logging.getLogger(__name__)


class InputValidationError(Exception):
    """Exception raised when input validation fails."""
    
    def __init__(self, message: str, field_name: str = "", value: Any = None):
        self.field_name = field_name
        self.value = value
        super().__init__(message)


def sanitize_string(
    value: str, 
    max_length: Optional[int] = None,
    allow_html: bool = False,
    strip_whitespace: bool = True,
    normalize_unicode: bool = True
) -> str:
    """
    Sanitize a string input to prevent injection attacks.
    
    Args:
        value: The input string to sanitize
        max_length: Maximum allowed length (None for no limit)
        allow_html: Whether to allow HTML content (default: False)
        strip_whitespace: Whether to strip leading/trailing whitespace
        normalize_unicode: Whether to normalize Unicode characters
    
    Returns:
        Sanitized string
        
    Raises:
        InputValidationError: If validation fails
    """
    if not isinstance(value, str):
        raise InputValidationError("Input must be a string", value=value)
    
    # Strip whitespace if requested
    if strip_whitespace:
        value = value.strip()
    
    # Normalize Unicode if requested
    if normalize_unicode:
        value = unicodedata.normalize('NFC', value)
    
    # Check length limits
    if max_length is not None and len(value) > max_length:
        raise InputValidationError(
            f"Input exceeds maximum length of {max_length} characters",
            value=len(value)
        )
    
    # Escape HTML if not allowed
    if not allow_html:
        value = html.escape(value)
    
    # Remove null bytes and other dangerous control characters
    value = value.replace('\x00', '')
    value = re.sub(r'[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]', '', value)
    
    return value


def validate_alphanumeric(value: str, allow_spaces: bool = False) -> str:
    """
    Validate that a string contains only alphanumeric characters.
    
    Args:
        value: String to validate
        allow_spaces: Whether to allow spaces in the string
        
    Returns:
        Validated string
        
    Raises:
        InputValidationError: If validation fails
    """
    if not value:
        raise InputValidationError("Value cannot be empty")
    
    pattern = r'^[a-zA-Z0-9\s]*$' if allow_spaces else r'^[a-zA-Z0-9]*$'
    
    if not re.match(pattern, value):
        raise InputValidationError(
            f"Value contains invalid characters. Only alphanumeric characters"
            f"{' and spaces' if allow_spaces else ''} are allowed",
            value=value
        )
    
    return value


def validate_email(value: str) -> str:
    """
    Validate and sanitize email address.
    
    Args:
        value: Email address to validate
        
    Returns:
        Validated and normalized email address
        
    Raises:
        InputValidationError: If email format is invalid
    """
    if not value:
        raise InputValidationError("Email cannot be empty")
    
    # Basic email pattern - more permissive than RFC 5322 but secure
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    # Normalize to lowercase
    value = value.lower().strip()
    
    if not re.match(email_pattern, value):
        raise InputValidationError("Invalid email format", value=value)
    
    # Additional length checks
    if len(value) > 254:  # RFC 5321 limit
        raise InputValidationError("Email address is too long", value=len(value))
    
    local_part, domain = value.split('@', 1)
    if len(local_part) > 64:  # RFC 5321 limit
        raise InputValidationError("Email local part is too long", value=len(local_part))
    
    return value


def validate_numeric_string(
    value: str, 
    min_value: Optional[Union[int, float]] = None,
    max_value: Optional[Union[int, float]] = None,
    allow_decimal: bool = True
) -> str:
    """
    Validate that a string represents a valid number.
    
    Args:
        value: String to validate
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        allow_decimal: Whether to allow decimal points
        
    Returns:
        Validated numeric string
        
    Raises:
        InputValidationError: If validation fails
    """
    if not value:
        raise InputValidationError("Numeric value cannot be empty")
    
    # Check for valid numeric format
    pattern = r'^-?\d+(\.\d+)?$' if allow_decimal else r'^-?\d+$'
    
    if not re.match(pattern, value):
        raise InputValidationError(
            f"Invalid numeric format. Expected {'decimal' if allow_decimal else 'integer'} number",
            value=value
        )
    
    # Convert to number for range validation
    try:
        num_value = float(value) if allow_decimal else int(value)
    except ValueError:
        raise InputValidationError("Invalid numeric value", value=value)
    
    if min_value is not None and num_value < min_value:
        raise InputValidationError(
            f"Value {num_value} is below minimum {min_value}",
            value=num_value
        )
    
    if max_value is not None and num_value > max_value:
        raise InputValidationError(
            f"Value {num_value} exceeds maximum {max_value}",
            value=num_value
        )
    
    return value


def sanitize_delimited_line(
    line: str,
    delimiter: str = "|",
    expected_fields: Optional[int] = None,
    max_field_length: int = 1000
) -> list[str]:
    """
    Safely parse a delimited line into fields with validation.
    
    Args:
        line: Delimited line to parse
        delimiter: Field delimiter character
        expected_fields: Expected number of fields (None for no validation)
        max_field_length: Maximum length per field
        
    Returns:
        List of sanitized field values
        
    Raises:
        InputValidationError: If validation fails
    """
    if not line:
        raise InputValidationError("Line cannot be empty")
    
    # Check for dangerous patterns
    if '\x00' in line:
        raise InputValidationError("Line contains null bytes")
    
    # Split line into fields
    fields = line.split(delimiter)
    
    # Validate field count
    if expected_fields is not None and len(fields) != expected_fields:
        raise InputValidationError(
            f"Expected {expected_fields} fields but found {len(fields)}",
            value=len(fields)
        )
    
    # Sanitize each field
    sanitized_fields = []
    for i, field in enumerate(fields):
        try:
            # Check field length
            if len(field) > max_field_length:
                raise InputValidationError(
                    f"Field {i} exceeds maximum length of {max_field_length}",
                    field_name=f"field_{i}",
                    value=len(field)
                )
            
            # Sanitize field content
            sanitized_field = sanitize_string(
                field, 
                max_length=max_field_length,
                allow_html=False,
                strip_whitespace=True
            )
            sanitized_fields.append(sanitized_field)
            
        except InputValidationError as e:
            # Add context about which field failed
            raise InputValidationError(
                f"Field {i} validation failed: {e}",
                field_name=f"field_{i}",
                value=field
            ) from e
    
    return sanitized_fields


def validate_json_safe_dict(data: dict, max_depth: int = 10, max_keys: int = 1000) -> dict:
    """
    Validate a dictionary to ensure it's safe for JSON processing.
    
    Args:
        data: Dictionary to validate
        max_depth: Maximum nested depth allowed
        max_keys: Maximum number of keys allowed (total)
        
    Returns:
        Validated dictionary
        
    Raises:
        InputValidationError: If validation fails
    """
    if not isinstance(data, dict):
        raise InputValidationError("Input must be a dictionary", value=type(data))
    
    def count_keys_and_depth(obj: Any, current_depth: int = 0) -> tuple[int, int]:
        """Recursively count keys and measure depth."""
        if current_depth > max_depth:
            raise InputValidationError(f"Data structure exceeds maximum depth of {max_depth}")
        
        key_count = 0
        max_inner_depth = current_depth
        
        if isinstance(obj, dict):
            key_count += len(obj)
            for value in obj.values():
                inner_keys, inner_depth = count_keys_and_depth(value, current_depth + 1)
                key_count += inner_keys
                max_inner_depth = max(max_inner_depth, inner_depth)
        elif isinstance(obj, list):
            for item in obj:
                inner_keys, inner_depth = count_keys_and_depth(item, current_depth + 1)
                key_count += inner_keys
                max_inner_depth = max(max_inner_depth, inner_depth)
        
        return key_count, max_inner_depth
    
    total_keys, actual_depth = count_keys_and_depth(data)
    
    if total_keys > max_keys:
        raise InputValidationError(
            f"Data structure contains {total_keys} keys, exceeding maximum of {max_keys}",
            value=total_keys
        )
    
    return data