# Data Input Validation & Security Enhancements

This document describes the comprehensive security enhancements made to the simpler-grants-gov repository to prevent data injection vulnerabilities and ensure robust data handling.

## Overview

The security improvements focus on validating and sanitizing all data inputs across the application stack, from raw data processing to API endpoints and frontend validation. The enhancements are designed to be minimal and surgical while providing maximum security benefit.

## Components Enhanced

### 1. Input Sanitization Utilities (`api/src/util/input_sanitizer.py`)

A comprehensive utility module providing secure input validation and sanitization functions:

- **`sanitize_string()`** - HTML escaping, control character removal, Unicode normalization
- **`validate_email()`** - RFC-compliant email validation with security checks
- **`validate_numeric_string()`** - Numeric validation with range checking
- **`sanitize_delimited_line()`** - Safe parsing of delimited data with field validation
- **`validate_json_safe_dict()`** - JSON structure safety validation with depth/size limits

### 2. SAM Extract Processing (`api/src/task/sam_extracts/process_sam_extracts.py`)

Enhanced security for processing government SAM.gov data extracts:

- **Safe UTF-8 decoding** with error handling for malformed bytes
- **Input validation** for all extracted fields with type checking
- **Protection against** oversized inputs and null byte injection
- **Comprehensive error handling** with detailed logging
- **Resource limits** to prevent memory exhaustion attacks

### 3. JSON Schema Validation (`api/src/form_schema/jsonschema_validator.py`)

Strengthened validation for JSON data structures:

- **Structure safety validation** before processing to prevent attacks
- **Protection against** deeply nested data structures
- **Limits on data complexity** and size to prevent DoS attacks
- **Enhanced error handling** with sanitized error messages

### 4. GraphQL Client Security (`analytics/src/analytics/integrations/github/client.py`)

Secured GitHub GraphQL API client:

- **Query validation** with dangerous pattern detection
- **Variable sanitization** and type checking
- **Protection against** injection attacks and resource exhaustion
- **Input size limits** for queries and variables

### 5. Frontend Validation (`frontend/src/components/applyForm/validate.ts`)

Enhanced client-side security with XSS prevention:

- **DOMPurify integration** for HTML sanitization
- **Structure validation** for complex objects
- **Enhanced AJV configuration** with security limits
- **Error message sanitization** to prevent information disclosure

## Security Features

### Injection Prevention

- **SQL Injection**: Input sanitization removes dangerous SQL patterns
- **XSS Attacks**: HTML escaping and DOMPurify integration
- **Code Injection**: Pattern detection and input validation
- **Path Traversal**: Input sanitization removes directory traversal patterns

### Resource Exhaustion Protection

- **Input Size Limits**: Maximum length constraints on all string inputs
- **Nesting Depth Limits**: Prevention of deeply nested structure attacks
- **Key Count Limits**: Protection against objects with excessive properties
- **Memory Limits**: Bounds checking to prevent memory exhaustion

### Data Integrity

- **Unicode Normalization**: Consistent character encoding handling
- **Null Byte Removal**: Elimination of null bytes and control characters
- **Type Validation**: Strict type checking for all inputs
- **Format Validation**: Pattern matching for structured data (emails, dates, etc.)

## Testing

Comprehensive test suites ensure the security enhancements work correctly:

### Unit Tests
- `api/tests/src/util/test_input_sanitizer.py` - Input sanitization utilities
- `api/tests/src/task/sam_extracts/test_process_sam_extracts_security.py` - SAM processing security
- `api/tests/src/form_schema/test_jsonschema_validator_security.py` - JSON validation security
- `analytics/tests/integrations/github/test_client_security.py` - GraphQL client security
- `frontend/tests/components/applyForm/validate.security.test.ts` - Frontend validation security

### Integration Tests
- `api/tests/src/integration/test_data_validation_integration.py` - End-to-end validation flow

## Usage Guidelines

### For Developers

1. **Always use the sanitization utilities** when processing external input
2. **Validate data structure safety** before processing complex nested data
3. **Set appropriate limits** for data size and complexity based on use case
4. **Handle validation errors gracefully** without exposing internal details
5. **Test security edge cases** in all new input handling code

### Example Usage

```python
from src.util.input_sanitizer import sanitize_string, validate_email

# Sanitize user input
user_input = sanitize_string(raw_input, max_length=1000)

# Validate email addresses
try:
    email = validate_email(user_email)
except InputValidationError as e:
    logger.warning(f"Invalid email format: {e}")
    return validation_error_response()
```

### Configuration Limits

The following default limits are enforced across the system:

- **String Length**: 10,000 characters maximum
- **Nesting Depth**: 20 levels maximum for JSON structures
- **Object Keys**: 10,000 keys maximum per structure
- **Array Length**: 1,000 items maximum
- **Field Count**: No hard limit but individual field length limited

## Security Considerations

### What's Protected

- ✅ SQL injection attacks
- ✅ Cross-site scripting (XSS)
- ✅ Code injection attempts
- ✅ Resource exhaustion attacks
- ✅ Null byte injection
- ✅ Unicode-based attacks
- ✅ Deeply nested structure attacks
- ✅ Memory exhaustion attacks

### What's NOT Protected

- ❌ Network-level attacks (handled by infrastructure)
- ❌ Authentication/authorization (handled by auth system)
- ❌ Rate limiting (handled by API gateway)
- ❌ CSRF attacks (handled by framework middleware)

### Performance Impact

The security enhancements are designed to have minimal performance impact:

- **String sanitization**: O(n) time complexity
- **Structure validation**: O(n) time, O(d) space for depth d
- **JSON validation**: Same as original jsonschema validation
- **Memory overhead**: Minimal additional memory usage

## Deployment Notes

### Dependencies Added

- No new external dependencies required for API
- Frontend uses existing `isomorphic-dompurify` dependency
- All enhancements use standard library functions where possible

### Backward Compatibility

- All existing functionality preserved
- Enhanced validation is additive, not restrictive for valid data
- Error messages improved but maintain same structure
- API responses unchanged for valid inputs

### Monitoring

Consider monitoring the following metrics after deployment:

- **Validation Error Rate**: Track rejected inputs to identify attack patterns
- **Processing Time**: Monitor performance impact of validation
- **Memory Usage**: Ensure resource limits are effective
- **Error Logs**: Review sanitization and validation warnings

## Future Enhancements

Potential areas for future security improvements:

1. **Content Security Policy** enforcement in frontend validation
2. **Rate limiting** for validation-heavy endpoints
3. **Machine learning** based anomaly detection for input patterns
4. **Audit logging** for security validation events
5. **Configuration-based limits** instead of hardcoded values

## Contact

For questions about these security enhancements, please contact the development team or refer to the comprehensive test suites for implementation examples.