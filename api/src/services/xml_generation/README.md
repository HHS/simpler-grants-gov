# XML Generation Service - Core Foundation

## Overview

This is the initial implementation of the JSON to XML conversion service. This PR establishes the core foundation with basic field mapping capabilities for SF-424 forms.

## Architecture

```
api/src/services/xml_generation/
├── __init__.py
├── service.py                 # XMLGenerationService - main service
├── config.py                  # XMLTransformationConfig - configuration management
├── models.py                  # Request/Response models
└── transformers/
    ├── __init__.py
    └── base_transformer.py    # BaseTransformer - field mapping logic

api/src/form_schema/forms/
└── sf424.py                   # SF-424 schema + basic XML transformation rules
```

## Usage

```python
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.models import XMLGenerationRequest

# Application data
application_data = {
    "submission_type": "Application",
    "organization_name": "Test University", 
    "project_title": "Research Project",
    # ... other fields
}

# Create service
service = XMLGenerationService()

# Create request
request = XMLGenerationRequest(
    application_data=application_data,
    form_name="SF424_4_0",
    pretty_print=True  # True for pretty-print (default), False for condensed
)

# Generate XML
response = service.generate_xml(request)

if response.success:
    print("XML generated successfully:")
    print(response.xml_data)
else:
    print(f"Error: {response.error_message}")
```

## XML Formatting Options

The service supports two XML formatting modes:

### Pretty-Print Format (Default)
### Condensed Format

## Sample Output

```xml
<?xml version='1.0' encoding='UTF-8'?>
<SF424_4_0 xmlns="http://apply.grants.gov/forms/SF424_4_0-V4.0">
  <SubmissionType>Application</SubmissionType>
  <OrganizationName>Test University</OrganizationName>
  <ProjectTitle>Research Project</ProjectTitle>
  <FederalEstimatedFunding>50000</FederalEstimatedFunding>
  <!-- ... additional fields ... -->
</SF424_4_0>
```

## Testing

Comprehensive unit tests cover:
- Basic XML generation functionality
- Configuration loading from sf424.py
- Field mapping transformations
- Error handling for missing data
- XML namespace handling

Run tests:
```bash
python -m pytest tests/src/services/xml_generation/
```
## Configuration

Basic transformation rules are defined in `sf424.py`:

```python
FORM_XML_TRANSFORM_RULES = {
    "description": "Basic transformation rules for SF-424",
    "version": "1.0",
    "form_name": "SF424_4_0",
    
    "namespaces": {
        "default": "http://apply.grants.gov/forms/SF424_4_0-V4.0",
        "prefix": ""
    },
    
    "xml_structure": {
        "root_element": "SF424_4_0",
        "version": "4.0"
    },
    
    "field_mappings": {
        "submission_type": "SubmissionType",
        "organization_name": "OrganizationName",
        # ... 35+ additional mappings
    }
}
```
