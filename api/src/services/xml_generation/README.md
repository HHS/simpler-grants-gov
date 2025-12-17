# XML Generation Service - Core Foundation

## Overview

This is the implementation of the JSON to XML conversion service. This service provides field mapping capabilities for various Grants.gov forms including SF-424, SF-424A, SF-424B, SF-424D, SF-LLL, CD-511, GG_LobbyingForm, Project Abstract Summary, EPA Key Contacts, Project Narrative Attachments, Budget Narrative Attachments, Other Narrative Attachments, and Project Abstract.

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
├── sf424b.py                  # SF-424B Assurances (Non-Construction) + XML transformation rules
├── sf424d.py                  # SF-424D Assurances (Construction) + XML transformation rules
├── sflll.py                   # SF-LLL Lobbying Disclosure + XML transformation rules
├── cd511.py                   # CD511 Certification Regarding Lobbying + XML transformation rules
├── gg_lobbying_form.py        # GG_LobbyingForm Grants.gov Lobbying Form + XML transformation rules
├── project_abstract_summary.py # Project Abstract Summary + XML transformation rules
├── epa_key_contacts.py        # EPA Key Contacts + XML transformation rules
├── project_narrative_attachment.py  # Project Narrative Attachments + XML transformation rules
├── budget_narrative_attachment.py   # Budget Narrative Attachments + XML transformation rules
├── other_narrative_attachment.py    # Other Narrative Attachments + XML transformation rules
└── project_abstract.py        # Project Abstract + XML transformation rules
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

### Example: Project Abstract Summary

The Project Abstract Summary form contains text fields for project information:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Project Abstract Summary form",
        "form_name": "Project_AbstractSummary_2_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/Project_AbstractSummary_2_0-V2.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd",
        "xml_structure": {
            "root_element": "Project_AbstractSummary_2_0",
            "root_attributes": {"FormVersion": "2.0"},
        },
    },
    # Field mappings (order matches XSD sequence)
    "funding_opportunity_number": {"xml_transform": {"target": "FundingOpportunityNumber"}},
    "assistance_listing_number": {"xml_transform": {"target": "CFDANumber"}},
    "applicant_name": {"xml_transform": {"target": "OrganizationName"}},
    "project_title": {"xml_transform": {"target": "ProjectTitle"}},
    "project_abstract": {"xml_transform": {"target": "ProjectAbstract"}},
}
```

**Project Abstract Summary Field Mapping Notes:**
- `funding_opportunity_number` → `FundingOpportunityNumber` (required)
- `assistance_listing_number` → `CFDANumber` (optional, legacy name for Assistance Listing Number)
- `applicant_name` → `OrganizationName` (required, called "Applicant Name" in UI)
- `project_title` → `ProjectTitle` (required, max 250 chars)
- `project_abstract` → `ProjectAbstract` (required, max 4000 chars)

### Example: EPA Key Contacts

The EPA Key Contacts form contains four optional contact person sections, each using `ContactPersonDataTypeV3` from GlobalLibrary:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for EPA Key Contacts form",
        "form_name": "EPA_KeyContacts_2_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/EPA_KeyContacts_2_0-V2.0",
            "EPA_KeyContacts_2_0": "http://apply.grants.gov/forms/EPA_KeyContacts_2_0-V2.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/EPA_KeyContacts_2_0-V2.0.xsd",
        "xml_structure": {
            "root_element": "KeyContactPersons_2_0",
            "root_namespace_prefix": "EPA_KeyContacts_2_0",
            "root_attributes": {"FormVersion": "2.0"},
        },
    },
    # Each contact uses ContactPersonDataTypeV3 structure
    "authorized_representative": _create_contact_person_transform("AuthorizedRepresentative"),
    "payee": _create_contact_person_transform("Payee"),
    "administrative_contact": _create_contact_person_transform("AdminstrativeContact"),
    "project_manager": _create_contact_person_transform("ProjectManager"),
}
```

**EPA Key Contacts Field Mapping Notes:**
- Uses a helper function `_create_contact_person_transform()` to generate the nested structure for each contact
- All four contacts are optional per XSD
- Note: XSD has a typo "AdminstrativeContact" (not "Administrative")
- Each `ContactPersonDataTypeV3` contains:
  - `ContactName` → nested name with prefix, first, middle, last, suffix (globLib namespace)
  - `Title` → contact's title
  - `Address` → nested address with street1, street2, city, state, zip, country
  - `Phone`, `Fax`, `Email` → contact information

### Example: SF-424B and SF-424D (Assurance Forms)

The SF-424B (Non-Construction) and SF-424D (Construction) assurance forms have a similar structure with fields nested inside an `AuthorizedRepresentative` element:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for SF-424D Assurances for Construction Programs",
        "form_name": "SF424D",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SF424D-V1.1",
            "SF424D": "http://apply.grants.gov/forms/SF424D-V1.1",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424D-V1.1.xsd",
        "xml_structure": {
            "root_element": "Assurances",
            "root_namespace_prefix": "SF424D",
            "root_attributes": {
                "programType": "Construction",  # "Non-Construction" for SF-424B
                "{http://apply.grants.gov/system/Global-V1.0}coreSchemaVersion": "1.1",
            },
        },
    },
    # Field mappings - nested path for AuthorizedRepresentative complex type
    "signature": {"xml_transform": {"target": "AuthorizedRepresentative/RepresentativeName"}},
    "title": {"xml_transform": {"target": "AuthorizedRepresentative/RepresentativeTitle"}},
    "applicant_organization": {"xml_transform": {"target": "ApplicantOrganizationName"}},
    "date_signed": {"xml_transform": {"target": "SubmittedDate"}},
}
```

**Assurance Forms Field Mapping Notes:**
- Uses `compose_object` conditional transform to wrap flat fields into nested `AuthorizedRepresentative` element
- `signature` → `AuthorizedRepresentative/RepresentativeName`
- `title` → `AuthorizedRepresentative/RepresentativeTitle`
- `applicant_organization` → `ApplicantOrganizationName`
- `date_signed` → `SubmittedDate`
- `signature` and `date_signed` are auto-populated during submission via post-population rules
- SF-424B uses `programType="Non-Construction"`, SF-424D uses `programType="Construction"`

The `compose_object` transform type creates a nested object from flat root-level fields:

```python
"authorized_representative_wrapper": {
    "xml_transform": {
        "target": "AuthorizedRepresentative",
        "type": "conditional",
        "conditional_transform": {
            "type": "compose_object",
            "field_mapping": {
                "RepresentativeName": "signature",
                "RepresentativeTitle": "title",
            },
        },
    }
},
```

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

### Example: Project Abstract (Single Attachment)

The Project Abstract form uses a single attachment nested within a `ProjectAbstractAddAttachment` wrapper element:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Project Abstract form",
        "form_name": "Project_Abstract_1_2",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/Project_Abstract_1_2-V1.2",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Project_Abstract_1_2-V1.2.xsd",
        "xml_structure": {
            "root_element": "Project_Abstract_1_2",
            "root_attributes": {"FormVersion": "1.2"},
        },
        "attachment_fields": {
            "attachment": {
                "xml_element": "ProjectAbstractAddAttachment",
                "type": "single",
            },
        },
    },
}
```

**Attachment Forms Notes:**
- **Multiple attachments** (`type: "multiple"`): Used by Project Narrative, Budget Narrative, and Other Narrative Attachments
- **Single attachment** (`type: "single"`): Used by Project Abstract with wrapper element `ProjectAbstractAddAttachment`

## Supported Forms

The following forms currently have XML generation support:

- **SF-424 (v4.0)**: Application for Federal Assistance
- **SF-424A (v1.0)**: Budget Information - Non-Construction Programs
- **SF-424B (v1.1)**: Assurances for Non-Construction Programs
- **SF-424D (v1.1)**: Assurances for Construction Programs
- **SF-LLL (v2.0)**: Disclosure of Lobbying Activities
- **CD-511 (v1.1)**: Certification Regarding Lobbying
- **GG_LobbyingForm (v1.1)**: Grants.gov Lobbying Form
- **Project Abstract Summary (v2.0)**: Project abstract summary with text fields
- **EPA Key Contacts (v2.0)**: EPA key contact persons form
- **Project Narrative Attachments (v1.2)**: Project narrative file attachments
- **Budget Narrative Attachments (v1.2)**: Budget narrative file attachments
- **Other Narrative Attachments (v1.2)**: Other narrative file attachments
- **Project Abstract (v1.2)**: Project abstract file attachment

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
