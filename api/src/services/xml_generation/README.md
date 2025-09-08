# XML Generation Service - Core Foundation (PR #1)

## Overview

This is the initial implementation of the JSON to XML conversion service for [GitHub issue #6155](https://github.com/HHS/simpler-grants-gov/issues/6155). This PR establishes the core foundation with basic field mapping capabilities for SF-424 forms.

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

## Key Features

### 1. Configuration-Driven Transformations
- Transformation rules defined in `sf424.py` as `FORM_XML_TRANSFORM_RULES`
- Simple field mappings (e.g., `submission_type` → `SubmissionType`)
- XML namespace and structure configuration

### 2. Core Service Architecture
- `XMLGenerationService`: Main service for orchestrating XML generation
- `XMLTransformationConfig`: Loads and manages transformation rules
- `BaseTransformer`: Applies field mappings to JSON data

### 3. Basic Field Mappings
Currently supports **37 field mappings** including:
- Core application information (submission_type, application_type)
- Applicant information (organization_name, sam_uei, addresses)
- Contact information (phone, email, fax)
- Opportunity information (agency_name, funding_opportunity_number)
- Project information (project_title, dates, congressional_districts)
- Funding information (federal, applicant, state, local estimates)
- Review and certification fields

## Usage

```python
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.models import XMLGenerationRequest

# Create service
service = XMLGenerationService()

# Create request
request = XMLGenerationRequest(
    application_id=application_id,
    application_form_id=application_form_id,
    form_name="SF424_4_0"
)

# Generate XML
response = service.generate_xml(db_session, request)

if response.success:
    print("XML generated successfully:")
    print(response.xml_data)
else:
    print(f"Error: {response.error_message}")
```

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

## Current Limitations (Addressed in Future PRs)

1. **No Value Transformations**: Boolean to string, date formatting (PR #2)
2. **No Complex Transformations**: Nested objects, arrays (PR #3)
3. **No XSD Validation**: Schema compliance validation (PR #4)
4. **Limited Field Coverage**: ~37 fields vs. full SF-424 spec (PR #2)

## Next Steps

This PR establishes the foundation. Future PRs will add:
- **PR #2**: Value transformations and complete field mappings (achieve 60%+ coverage)
- **PR #3**: Complex transformations for nested objects and attachments
- **PR #4**: XSD validation against official Grants.gov schemas
- **PR #5**: Complete documentation and production readiness

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

## Success Criteria ✅

- ✅ Basic XML generation service functional
- ✅ 37 field mappings working correctly
- ✅ Configuration loads from sf424.py
- ✅ Well-formed XML output with proper namespaces
- ✅ Comprehensive unit test coverage
- ✅ Clean architecture for future enhancements
