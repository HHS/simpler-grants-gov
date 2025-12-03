# XML Generation Service - Core Foundation

## Overview

This is the JSON to XML conversion service for generating Grants.gov compatible XML from application form data. The service supports multiple form types including SF-424, SF-424A, SF-LLL, and CD511.

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
├── sf424.py                   # SF-424 schema + XML transformation rules
├── sf424a.py                  # SF-424A Budget schema + XML transformation rules
├── sflll.py                   # SF-LLL Lobbying Disclosure + XML transformation rules
└── cd511.py                   # CD511 Certification Regarding Lobbying + XML transformation rules
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

Transformation rules are defined in each form's Python file. Here are examples:

### SF-424 (sf424.py)

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for SF-424",
        "form_name": "SF424_4_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SF424_4_0-V4.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
        },
        "xml_structure": {
            "root_element": "SF424_4_0",
            "version": "4.0"
        },
    },
    "submission_type": {"xml_transform": {"target": "SubmissionType"}},
    "organization_name": {"xml_transform": {"target": "OrganizationName"}},
    # ... additional field mappings
}
```

### CD511 - Certification Regarding Lobbying (cd511.py)

The CD511 form is used for lobbying certification. Key transformation details:

- **XSD**: https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd
- **Namespace**: `http://apply.grants.gov/forms/CD511-V1.1`
- **FormVersion**: 1.1

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for CD511",
        "form_name": "CD511",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/CD511-V1.1",
            "CD511": "http://apply.grants.gov/forms/CD511-V1.1",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
        },
        "xml_structure": {
            "root_element": "CD511",
            "root_namespace_prefix": "CD511",
            "root_attributes": {
                "FormVersion": "1.1",
            },
        },
    },
    # Field mappings (order matches XSD sequence)
    "applicant_name": {"xml_transform": {"target": "OrganizationName"}},
    "award_number": {"xml_transform": {"target": "AwardNumber"}},
    "project_name": {"xml_transform": {"target": "ProjectName"}},
    "contact_person": {
        "xml_transform": {"target": "ContactName", "type": "nested_object"},
        # Nested fields use GlobalLibrary namespace
        "prefix": {"xml_transform": {"target": "PrefixName", "namespace": "globLib"}},
        "first_name": {"xml_transform": {"target": "FirstName", "namespace": "globLib"}},
        "middle_name": {"xml_transform": {"target": "MiddleName", "namespace": "globLib"}},
        "last_name": {"xml_transform": {"target": "LastName", "namespace": "globLib"}},
        "suffix": {"xml_transform": {"target": "SuffixName", "namespace": "globLib"}},
    },
    "contact_person_title": {"xml_transform": {"target": "Title"}},
    "signature": {"xml_transform": {"target": "Signature"}},
    "submitted_date": {"xml_transform": {"target": "SubmittedDate"}},
}
```

**CD511 Field Mapping Notes:**
- `applicant_name` → `OrganizationName` (XSD uses OrganizationName, form displays "Name of Applicant")
- `contact_person` → `ContactName` with nested `HumanNameDataType` structure using GlobalLibrary namespace
- Either `award_number` or `project_name` (or both) should be provided per form validation
- `signature` and `submitted_date` are auto-populated during submission

## Supported Forms

| Form | Short Name | Version | XSD |
|------|------------|---------|-----|
| Application for Federal Assistance | SF424_4_0 | 4.0 | SF424_4_0-V4.0.xsd |
| Budget Information - Non-Construction | SF424A | 1.0 | SF424A-V1.0.xsd |
| Disclosure of Lobbying Activities | SFLLL_2_0 | 2.0 | SFLLL_2_0-V2.0.xsd |
| Certification Regarding Lobbying | CD511 | 1.1 | CD511-V1.1.xsd |
