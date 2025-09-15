# XSD as Parameter: Usage Guide

The XML validation system now treats XSD schemas as parameters, making it flexible and testable. This addresses your requirement to treat the XSD as a parameter rather than hardcoding URLs.

## ✅ Key Improvements

### **1. XSD URL/Path as Parameter**
- XSD can be provided as URL or local file path
- No more hardcoded URLs in the code
- Supports both remote (HTTPS) and local XSD files

### **2. Multiple Ways to Specify XSD**

#### **Option A: In Test Cases**
```python
# In test_cases.py
{
    "name": "minimal_valid_sf424",
    "json_input": {...},
    "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
    "form_name": "SF424_4_0",
    "pretty_print": True,
}
```

#### **Option B: Command Line Override**
```bash
# Override XSD URL for all tests
make xml-validation args="--xsd-url https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"

# Use local XSD file
make xml-validation args="--xsd-url /path/to/local/SF424_schema.xsd"
```

#### **Option C: Programmatic Usage**
```python
from src.services.xml_generation.validation import XSDValidator

validator = XSDValidator()

# Validate with URL
result = validator.validate_xml(xml_content, "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd")

# Validate with local file
result = validator.validate_xml(xml_content, "/path/to/schema.xsd")
```

## 📋 Complete Usage Examples

### **Example 1: Using the Correct Grants.gov XSD URL**
```bash
# Run SF-424 validation with official XSD
make xml-validation-sf424 args="--xsd-url https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"
```

### **Example 2: Testing with Local XSD File**
```bash
# Download XSD locally first
curl -o SF424_schema.xsd https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd

# Run validation with local file
make xml-validation args="--xsd-url ./SF424_schema.xsd"
```

### **Example 3: Different XSD for Each Test**
```python
# In test_cases.py - each test can have its own XSD
SF424_TEST_CASES = [
    {
        "name": "test_with_v4_0_schema",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "json_input": {...}
    },
    {
        "name": "test_with_local_schema", 
        "xsd_url": "/path/to/modified_schema.xsd",
        "json_input": {...}
    }
]
```

## 🔧 Technical Implementation

### **Flexible XSD Loading**
```python
def get_schema_from_url_or_path(self, xsd_url_or_path: str) -> xmlschema.XMLSchema:
    """Get XMLSchema object from URL or local path."""
    if xsd_url_or_path.startswith(('http://', 'https://')):
        # Download and cache from URL
        return self._download_and_cache_xsd(xsd_url_or_path)
    else:
        # Load from local file path
        return xmlschema.XMLSchema(xsd_url_or_path)
```

### **Caching System**
- URLs are downloaded once and cached locally
- Local files are loaded directly
- Cache key is the full URL/path for uniqueness

## 🎯 Benefits of Parameterized Approach

### **1. Flexibility**
- ✅ Test against official Grants.gov XSD
- ✅ Test against modified/local XSD files
- ✅ Test against different XSD versions
- ✅ No hardcoded dependencies

### **2. Testing Scenarios**
```bash
# Test against official schema
make xml-validation args="--xsd-url https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"

# Test against modified schema (for development)
make xml-validation args="--xsd-url ./modified_schema.xsd"

# Test against older version
make xml-validation args="--xsd-url https://apply07.grants.gov/apply/forms/schemas/SF424_3_0-V3.0.xsd"
```

### **3. CI/CD Integration**
```bash
# In CI pipeline - use specific XSD version
./run_xml_validation_docker.sh --xsd-url $GRANTS_GOV_XSD_URL --output ci_results.json

# Fail build if validation issues found
if [ $? -ne 0 ]; then
    echo "XML validation failed - check ci_results.json"
    exit 1
fi
```

## 📊 Real Example Output

```bash
$ make xml-validation args="--xsd-url https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd --verbose"

2025-09-12 19:30:15 - INFO - Found 5 test cases
2025-09-12 19:30:15 - INFO - Overriding XSD URL with: https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd
2025-09-12 19:30:15 - INFO - Running validation test suite with 5 test cases
2025-09-12 19:30:15 - INFO - Running validation test: minimal_valid_sf424
2025-09-12 19:30:16 - INFO - Downloading XSD from: https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd
2025-09-12 19:30:17 - INFO - Downloaded and cached XSD: /tmp/xsd_cache/SF424_4_0-V4.0.xsd

XML VALIDATION TEST SUMMARY
============================================================
Total Tests: 5
Successful: 3
Failed: 2
Success Rate: 60.0%
============================================================
```

## ✅ Summary

The XSD is now fully parameterized, providing maximum flexibility:

1. **✅ Parameter-Driven**: XSD URL/path is passed as parameter, not hardcoded
2. **✅ Multiple Input Methods**: Command line, test cases, or programmatic
3. **✅ URL and Local File Support**: Works with both remote and local XSD files  
4. **✅ Caching System**: Downloads are cached to avoid repeated network calls
5. **✅ Real Grants.gov URL**: Uses the correct URL you provided: `https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd`

This approach makes the validation system much more flexible and testable, exactly as you requested!
