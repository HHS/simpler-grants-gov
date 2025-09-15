# XML Validation Module

This module provides XSD validation testing for XML generation, running outside the main test suite to avoid XSD file dependencies in regular unit tests.

## Overview

The validation module ensures that our generated XML conforms to Grants.gov XSD schemas by:

1. **Downloading XSD files** from Grants.gov on-demand
2. **Caching XSD files** locally to avoid repeated downloads
3. **Validating generated XML** against the appropriate XSD schema
4. **Providing detailed error reporting** for validation failures

This addresses the requirement to validate XML output against XSD schemas to identify outstanding issues without requiring XSD files in the repository or network calls during regular testing.

## Components

### `XSDValidator`
- Downloads and caches XSD files from Grants.gov URLs
- Validates XML content against XSD schemas using `xmlschema` library
- Handles both XML syntax errors and XSD validation errors
- Provides detailed error messages for debugging

### `ValidationTestRunner`
- Runs validation test suites with multiple test cases
- Generates XML from JSON input using our XML generation service
- Validates the generated XML against XSD schemas
- Provides comprehensive reporting and error categorization
- Groups failures by error type for easy analysis

### `test_cases.py`
- Contains sample test cases for various forms and scenarios
- Includes edge cases like revision applications, debt explanations
- Tests one-to-many mappings (multiple applicant type codes)
- Easy to extend with new test scenarios

## Usage

### Running Validation Tests

#### **Using Makefile Commands (Recommended)**

```bash
# Run all XML validation tests (uses XSD URLs from test cases)
make xml-validation

# Run only SF-424 tests
make xml-validation-sf424

# Override XSD URL for all tests
make xml-validation args="--xsd-url https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"

# Use local XSD file
make xml-validation args="--xsd-url /path/to/local/schema.xsd"

# Pass additional arguments (save results, verbose logging, etc.)
make xml-validation args="--output validation_results.json --verbose"
make xml-validation-sf424 args="--cache-dir /tmp/xsd_cache --verbose"

# Show help
make xml-validation args="--help"
```

#### **Using Docker Scripts Directly**

```bash
# Run all validation tests using Docker
./run_xml_validation_docker.sh

# Run only SF-424 tests
./run_xml_validation_docker.sh --form SF424_4_0

# Save results to file
./run_xml_validation_docker.sh --output validation_results.json

# Use custom cache directory and enable verbose logging
./run_xml_validation_docker.sh --cache-dir /tmp/xsd_cache --verbose

# Show help
./run_xml_validation_docker.sh --help
```

### Direct Script Usage (requires dependencies)

```bash
# If you have all dependencies installed locally
python run_xml_validation.py --form SF424_4_0 --verbose
```

### Programmatic Usage

```python
from src.services.xml_generation.validation import ValidationTestRunner, XSDValidator

# Initialize validator with custom cache directory
validator = XSDValidator(cache_dir="/tmp/xsd_cache")

# Validate XML content directly
result = validator.validate_xml(xml_content, "SF424_4_0")
print(f"Valid: {result['valid']}")
if not result['valid']:
    print(f"Error: {result['error_message']}")

# Run test suite
runner = ValidationTestRunner()
test_cases = [
    {
        "name": "test_case_1",
        "json_input": {"applicant_name": "Test Org", ...},
        "form_name": "SF424_4_0",
        "pretty_print": True,
    }
]
summary = runner.run_test_suite(test_cases)
runner.print_summary(summary)
```

## Supported Forms

Currently supports validation for:
- **SF424_4_0**: Application for Federal Assistance (SF-424) v4.0
- **SF424A_1_0**: Budget Information for Non-Construction Programs (SF-424A) v1.0
- **SF424B_1_0**: Budget Information for Construction Programs (SF-424B) v1.0
- **SF424C_1_0**: Budget Information for Non-Construction Programs (SF-424C) v1.0
- **SF424D_1_0**: Budget Information for Construction Programs (SF-424D) v1.0

## Test Cases Included

### SF-424 Test Cases
1. **minimal_valid_sf424**: Basic required fields for a new application
2. **revision_application_sf424**: Revision with revision type and federal award ID
3. **continuation_application_sf424**: Continuation with federal award ID
4. **with_debt_explanation_sf424**: Application with delinquent federal debt explanation
5. **multiple_applicant_types_sf424**: Tests one-to-many mapping with multiple applicant type codes

## XSD File Management

- **Automatic Download**: XSD files are downloaded from Grants.gov on first use (requires URL configuration)
- **Local Caching**: Files are cached locally to avoid repeated downloads
- **Cache Location**: Defaults to system temp directory, customizable via `--cache-dir`
- **No Repository Files**: XSD files are not stored in the repository

### XSD URL Configuration

**Important**: The XSD URLs need to be configured before the validation tests can run.

#### Option 1: Update URLs in Code
Edit `src/services/xml_generation/validation/xsd_validator.py` and replace the placeholder URLs with actual Grants.gov XSD download locations.

#### Option 2: Use Environment Variables
Set environment variables for specific forms:
```bash
export XSD_URL_SF424_4_0="https://actual-grants-gov-url/SF424_4_0.xsd"
make xml-validation-sf424
```

#### Finding Correct XSD URLs
To find the official Grants.gov XSD URLs:
1. Visit https://www.grants.gov/
2. Navigate to the forms section
3. Find the specific form (e.g., SF-424 v4.0) 
4. Look for XSD schema download links
5. Update the URLs in the validator

Alternative approaches:
- Check Grants.gov developer documentation
- Look for XSD files in form submission packages  
- Contact Grants.gov support for official XSD locations

## Validation Results

The validation runner provides:
- **Success/failure counts** for each test case
- **Error categorization** (XML syntax vs XSD validation vs test execution errors)
- **Detailed error messages** with specific validation failures
- **JSON output** for programmatic analysis and CI integration

## Error Types

- **`xml_syntax`**: XML is not well-formed (parsing errors)
- **`xsd_validation`**: XML is well-formed but doesn't conform to XSD schema
- **`test_execution_error`**: Error during test execution (code issues)
- **`xml_generation_failed`**: Our XML generation service failed

## Dependencies

The validation module requires additional dependencies not used by the main application:
- **`xmlschema`**: For XSD validation
- **`lxml`**: For XML parsing and validation

These are included in `pyproject.toml` but only needed when running validation tests.

## Integration with CI/CD

This validation module is designed to run outside the main test suite to avoid:
- Adding large XSD files to the repository
- Network dependencies in unit tests
- Slow test execution due to XSD downloads

**Recommended CI Integration:**
- Run as a separate CI job after main tests pass
- Run before releases to catch XSD compliance issues
- Run periodically to detect changes in Grants.gov XSD schemas
- Use `--output` to save results for analysis

## Adding New Test Cases

To add new test cases, edit `test_cases.py`:

```python
# Add to SF424_TEST_CASES list
{
    "name": "my_new_test_case",
    "json_input": {
        "applicant_name": "My Test Organization",
        # ... other required fields
    },
    "form_name": "SF424_4_0",
    "pretty_print": True,
}
```

Or create test cases for new forms:

```python
# Create new test case list
NEW_FORM_TEST_CASES = [
    {
        "name": "test_new_form",
        "json_input": {...},
        "form_name": "NEW_FORM_1_0",
        "pretty_print": True,
    },
]

# Update get_all_test_cases() to include new cases
def get_all_test_cases() -> list[dict[str, Any]]:
    return SF424_TEST_CASES + NEW_FORM_TEST_CASES
```

## Troubleshooting

### Common Issues

1. **"No module named 'xmlschema'"**: Run validation using Docker wrapper script
2. **"Failed to download XSD"**: Check internet connection and Grants.gov availability
3. **"XSD validation failed"**: Review the detailed error message for specific schema violations

### Debug Mode

Enable verbose logging to see detailed information:
```bash
./run_xml_validation_docker.sh --verbose
```

This will show:
- XSD download progress
- Individual test execution details
- Detailed validation error messages
- Cache file locations

## Example Output

```
XML VALIDATION TEST SUMMARY
============================================================
Total Tests: 5
Successful: 3
Failed: 2
Success Rate: 60.0%

FAILURE BREAKDOWN:
  xsd_validation: 2 tests
    - revision_application_sf424
    - with_debt_explanation_sf424
============================================================
```

This output helps identify specific areas where our XML generation needs improvement to meet XSD requirements.
