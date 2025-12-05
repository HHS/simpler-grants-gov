# XML Generation Service - Core Foundation

## Overview

This is the implementation of the JSON to XML conversion service. This service provides field mapping capabilities for various Grants.gov forms including SF-424, SF-424A, SF-LLL, CD-511, GG_LobbyingForm, Project Narrative Attachments, and Budget Narrative Attachments.

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
├── cd511.py                   # CD511 Certification Regarding Lobbying + XML transformation rules
└── gg_lobbying_form.py        # GG_LobbyingForm Grants.gov Lobbying Form + XML transformation rules
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

Transformation rules are defined in each form module (e.g., `sf424.py`, `project_narrative_attachment.py`).

### Example: SF-424

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for SF-424",
        "version": "1.0",
        "form_name": "SF424_4_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SF424_4_0-V4.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0"
        },
        "xml_structure": {
            "root_element": "SF424_4_0",
            "version": "4.0"
        }
    },
    "submission_type": {"xml_transform": {"target": "SubmissionType"}},
    "organization_name": {"xml_transform": {"target": "OrganizationName"}},
    # ... 35+ additional field mappings
}
```

### Example: CD-511 (Certification Regarding Lobbying)

The CD-511 form uses nested `HumanNameDataType` structure with GlobalLibrary namespace for contact names:

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
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd",
        "xml_structure": {
            "root_element": "CD511",
            "root_namespace_prefix": "CD511",
            "root_attributes": {"FormVersion": "1.1"},
        },
    },
    # Field mappings (order matches XSD sequence)
    "applicant_name": {"xml_transform": {"target": "OrganizationName"}},
    "award_number": {"xml_transform": {"target": "AwardNumber"}},
    "project_name": {"xml_transform": {"target": "ProjectName"}},
    "contact_person": {
        "xml_transform": {"target": "ContactName", "type": "nested_object"},
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

**CD-511 Field Mapping Notes:**
- `applicant_name` → `OrganizationName` (XSD uses OrganizationName, form displays "Name of Applicant")
- `contact_person` → `ContactName` with nested `HumanNameDataType` structure using GlobalLibrary namespace
- Either `award_number` or `project_name` (or both) should be provided per form validation
- `signature` and `submitted_date` are auto-populated during submission

### Example: GG_LobbyingForm (Grants.gov Lobbying Form)

The GG_LobbyingForm is similar to CD-511 but with different field names. It uses nested `HumanNameDataType` structure with GlobalLibrary namespace for authorized representative names:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for GG_LobbyingForm",
        "form_name": "GG_LobbyingForm",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/GG_LobbyingForm-V1.1",
            "GG_LobbyingForm": "http://apply.grants.gov/forms/GG_LobbyingForm-V1.1",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd",
        "xml_structure": {
            "root_element": "LobbyingForm",
            "root_namespace_prefix": "GG_LobbyingForm",
            "root_attributes": {"FormVersion": "1.1"},
        },
    },
    # Field mappings (order matches XSD sequence)
    "organization_name": {"xml_transform": {"target": "ApplicantName"}},
    "authorized_representative_name": {
        "xml_transform": {"target": "AuthorizedRepresentativeName", "type": "nested_object"},
        "prefix": {"xml_transform": {"target": "PrefixName", "namespace": "globLib"}},
        "first_name": {"xml_transform": {"target": "FirstName", "namespace": "globLib"}},
        "middle_name": {"xml_transform": {"target": "MiddleName", "namespace": "globLib"}},
        "last_name": {"xml_transform": {"target": "LastName", "namespace": "globLib"}},
        "suffix": {"xml_transform": {"target": "SuffixName", "namespace": "globLib"}},
    },
    "authorized_representative_title": {"xml_transform": {"target": "AuthorizedRepresentativeTitle"}},
    "authorized_representative_signature": {"xml_transform": {"target": "AuthorizedRepresentativeSignature"}},
    "submitted_date": {"xml_transform": {"target": "SubmittedDate"}},
}
```

**GG_LobbyingForm Field Mapping Notes:**
- `organization_name` → `ApplicantName`
- `authorized_representative_name` → `AuthorizedRepresentativeName` with nested `HumanNameDataType` structure
- `authorized_representative_signature` and `submitted_date` are auto-populated during submission

### Example: Attachment Forms

For attachment-only forms (Project Narrative, Budget Narrative), the configuration is simpler:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Project Narrative Attachments form",
        "version": "1.0",
        "form_name": "ProjectNarrativeAttachments_1_2",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/ProjectNarrativeAttachments_1_2-V1.2.xsd",
        "xml_structure": {
            "root_element": "ProjectNarrativeAttachments_1_2",
            "root_attributes": {
                "FormVersion": "1.2",
            },
        },
        "attachment_fields": {
            "attachments": {
                "xml_element": "Attachments",
                "type": "multiple",
            },
        },
    },
}
```

## Supported Forms

The following forms currently have XML generation support:

- **SF-424 (v4.0)**: Application for Federal Assistance
- **SF-424A (v1.0)**: Budget Information - Non-Construction Programs
- **SF-LLL (v2.0)**: Disclosure of Lobbying Activities
- **CD-511 (v1.1)**: Certification Regarding Lobbying
- **GG_LobbyingForm (v1.1)**: Grants.gov Lobbying Form
- **Project Narrative Attachments (v1.2)**: Project narrative file attachments
- **Budget Narrative Attachments (v1.2)**: Budget narrative file attachments

## Adding New Forms

To add XML generation support for a new form:

1. **Define XSD Schema**: Reference the Grants.gov XSD schema URL
   - Example: `https://apply07.grants.gov/apply/forms/schemas/FormName-V1.0.xsd`

2. **Create Transform Rules**: Add `FORM_XML_TRANSFORM_RULES` in the form's Python module
   - Define `_xml_config` with namespaces, structure, and XSD URL
   - Map JSON field names to XML element names
   - Configure attachment fields if applicable

3. **Set json_to_xml_schema on the Form**: In the form's Python module, set `json_to_xml_schema=FORM_XML_TRANSFORM_RULES` on the Form object. The config is automatically loaded for any form that has this field set.

4. **Add Tests**: Create test cases in `tests/src/services/xml_generation/`
   - Test configuration loading
   - Test XML generation with sample data
   - Verify XML structure matches XSD requirements

5. **Update Documentation**: Document any special transformation logic or noteworthy details in this README
