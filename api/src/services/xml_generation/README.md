# XML Generation Service - Core Foundation

## Overview

This is the implementation of the JSON to XML conversion service. This service provides field mapping capabilities for various Grants.gov forms including SF-424, SF-424A, SF-424B, SF-424D, SF-LLL, CD-511, GG_LobbyingForm, Project Abstract Summary, EPA Key Contacts, Project Narrative Attachments, Budget Narrative Attachments, Other Narrative Attachments, Project Abstract, and Project/Performance Site Location(s).

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
- Configuration loading from form modules
- Field mapping transformations
- Error handling for missing data
- XML namespace handling
- Snapshot regression testing against known-good XML fixtures
- XSD schema validation against the committed Grants.gov schemas

### Testing Standard for New Forms

Every new form must include all three of the following before it is considered
complete. These are not optional extras — a form's XML generation support is
not "done" until all three exist and pass:

1. **Known-good XML fixture**: Create representative input data that exercises
   the required fields and important optional or nested fields. Keep the data
   deterministic (fixed dates, fixed IDs, no randomness) so the generated XML
   is reproducible across runs and machines.
2. **Snapshot equality test**: Generate XML from the fixture and assert the
   complete output exactly matches a checked-in snapshot under
   `tests/src/services/xml_generation/snapshots/`. This protects element
   order, namespaces, attributes, omission of empty fields, and transformed
   values in one assertion. See [Snapshot fixtures](#snapshot-fixtures) below.
3. **XSD validation test**: Validate the generated XML against the form's
   committed XSD using `XSDValidator`. This confirms the output remains
   compatible with the Grants.gov contract. See
   [XSD validation](#xsd-validation) below.

See [`test_sf424_short_xml_generation.py`](../../../tests/src/services/xml_generation/test_sf424_short_xml_generation.py)
for a complete, working example of all three: fixture data, a snapshot
equality test, and form-level XSD validation tests. Shared sample cases are
also covered by
[`test_xml_validation_cases.py`](../../../tests/src/services/xml_generation/test_xml_validation_cases.py).

### Snapshot fixtures

Snapshot tests pin the complete generated XML for a form against a checked-in
file, so any unintended change to element order, namespaces, attributes, or
field values fails the test rather than slipping through review unnoticed.

**Location**

- Snapshot files live in `tests/src/services/xml_generation/snapshots/`, with
  one checked-in file for each form covered by snapshot testing (e.g.
  `sf424_short_3_0.xml`, `key_contacts_2_0.xml`, `sf424c_2_0.xml`).
- Each form's test module points at its own snapshot with a module-level
  path constant, e.g.:

```python
_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "sf424_short_3_0.xml"
```

- The fixture data that produces the snapshot (e.g. `_SNAPSHOT_DATA`) should
  live next to the test, in the same module, so the input and its expected
  output are reviewed together.

**Regeneration**

- If the snapshot file does not exist yet, the test creates it on first run
  and skips (rather than failing), so a brand-new form's baseline can be
  captured with a single test run:

```python
def test_full_xml_matches_snapshot(self):
   xml_data = _generate(_SNAPSHOT_DATA)


   if not _SNAPSHOT_PATH.exists():
       _SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
       _SNAPSHOT_PATH.write_text(xml_data)
       pytest.skip("Snapshot created — re-run to validate")


   assert xml_data == _SNAPSHOT_PATH.read_text()
```

- To regenerate an existing snapshot from scratch, delete the file under
  `snapshots/` and re-run the test — it will recreate it the same way.

**Update workflow**

- The snapshot is a reviewed artifact, not an automatically accepted output.
  Never regenerate a snapshot to make a failing test pass without first
  understanding _why_ the XML changed.
- Workflow for an intentional XML change (e.g. adding a field mapping,
  changing a transform):

1.  Make the code change.
2.  Run the affected form's tests and let the snapshot test fail.
3.  Review the diff between the old snapshot (in git history) and the new
    generated XML — confirm every difference is expected.
4.  Delete the stale snapshot file (or let the test recreate it) and commit
    the updated snapshot in the **same** change as the code change, so the
    PR diff shows both together.

- Do not regenerate snapshots to hide an unexpected or unexplained change —
  if the diff doesn't match what you intended to change, treat it as a bug.

### XSD validation

Form-level XSD validation confirms that generated XML for a single form
actually conforms to the Grants.gov schema contract for that form.

**Pattern**

1. Generate the XML (either directly via `XMLGenerationService`, or the full
   submission via `SubmissionXMLAssembler` when testing the assembled
   submission).
2. Extract just the target form's element from the output (e.g. the single
   `<SF424_Short_3_0>` element) if validating from a full submission XML.
3. Load the form's XSD with `XSDValidator` and call `validate_xml(...)`.
4. Assert `result["valid"]` is `True`, including the validator's error
   message in the assertion so failures are diagnosable without re-running.

```python
from src.services.xml_generation.validation.xsd_validator import XSDValidator


@pytest.fixture
def xsd_validator():
    xsd_cache_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
    return XSDValidator(xsd_cache_dir)


def test_minimal_valid_validates_against_xsd(self, xsd_validator):
   xml_string = _generate(_MINIMAL_DATA)
   result = xsd_validator.validate_xml(xml_string, xsd_validator.xsd_dir / "SF424_Short_3_0-V3.0.xsd")
   assert result["valid"], f"XSD validation failed:\n{result['error_message']}"
```

At minimum, cover a **minimal valid** case (only required fields) and a
**full/complete** case (using the same fixture as the snapshot test) so both
the required-fields floor and the fully-populated ceiling are validated
against the schema.

**Committed schemas and validator**

- Committed XSDs live in `src/services/xml_generation/xsds/`. Form-level unit
  tests validate against these committed files — never against a live
  network fetch — so CI is repeatable and doesn't depend on Grants.gov being
  reachable.
- `XSDValidator` (in
  [`src/services/xml_generation/validation/xsd_validator.py`](validation/xsd_validator.py))
  wraps schema loading and validation and returns a `{"valid": bool,
"error_message": str | None}` result.
- If the XSD cache is missing locally, download it with:

```bash
make fetch-xsds
```

- Refresh committed XSDs deliberately when Grants.gov publishes a schema
  change — don't let them drift silently. Review the resulting XML and
  snapshot changes together in the same change as the XSD refresh.

### Running Validation

XML generation validation is now covered by the pytest suite and committed XSDs.

```bash
python -m pytest tests/src/services/xml_generation/
```

These tests cover:

1. XML generation behavior
2. Snapshot regression checks for exact XML output
3. XSD validation against the committed Grants.gov schemas

NOTE: The committed XSDs live in src/services/xml_generation/xsds/. Refresh them deliberately when Grants.gov publishes schema updates.

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

### Example: SF-424 Short (v3.0)

The SF-424 Short form uses `ContactPersonDataTypeV3` from GlobalLibrary for both the Project Director (Section 7) and the Primary Contact (Section 8):

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for SF-424 Short",
        "form_name": "SF424_Short_3_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SF424_Short_3_0-V3.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_Short_3_0-V3.0.xsd",
        "xml_structure": {"root_element": "SF424_Short_3_0", "version": "3.0"},
    },
    "agency_name": {"xml_transform": {"target": "AgencyName"}},
    "applicant_type_code_mapping": {
        "xml_transform": {
            "type": "conditional",
            "conditional_transform": {
                "type": "one_to_many",
                "source_field": "applicant_type_code",
                "target_pattern": "ApplicantTypeCode{index}",
                "max_count": 3,
            },
        }
    },
    "project_director": _contact_person_group_xml("ProjectDirectorGroup"),
    "same_as_project_director": {
        "xml_transform": {
            "target": "SameAsProjectDirector",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "contact_person": _contact_person_group_xml("ContactPersonGroup"),
    # ... additional fields
}
```

**SF-424 Short Field Mapping Notes:**

- **ContactPersonDataTypeV3**: Both `project_director` (Section 7) and `contact_person` (Section 8) use the same nested structure (`ContactPersonGroup`/`ProjectDirectorGroup`) with Name, Title, Address, Phone, Fax, and Email sub-elements typed in the `globLib` namespace.
- **Helper function**: `_contact_person_group_xml(target)` generates the nested `ContactPersonDataTypeV3` structure, accepting the XML target element name as a parameter. The base dict uses a `PLACEHOLDER` sentinel that the helper overwrites with the real target.
- **Applicant type code — one-to-many**: `applicant_type_code` (a list of up to 3 values) maps to separate indexed elements `ApplicantTypeCode1`, `ApplicantTypeCode2`, `ApplicantTypeCode3` via the `one_to_many` conditional transform.
- **Boolean fields**: `same_as_project_director` and `application_certification` use `boolean_to_yes_no` (True → `Y: Yes`, False → `N: No`).
- **Section 8 always required — intentional difference from legacy**: `contact_person` (Section 8) is always required regardless of the `same_as_project_director` checkbox.
  - _Legacy_: `ContactPersonGroup` is optional in the XSD (`minOccurs="0"`), and the .dat makes Section 8 conditionally optional when the applicant checks "Same as Project Director".
  - _Simpler_: `contact_person` is listed unconditionally in `FORM_JSON_SCHEMA["required"]`. Checking the box does not auto-populate, hide, disable, or clear Section 8, and does not change validation. The checkbox is informational only — its sole effect is the `SameAsProjectDirector` element in the XML.
  - _Why_: per epic [#10796](https://github.com/HHS/simpler-grants-gov/issues/10796), "Section 8 will not auto-populate with Section 7 information upon checking the box of 'Same as Project Director'. Instead, we will inform the user to fill out the information with the same information that was in Section 7 if the box is checked." Because the applicant always fills in Section 8, it is always required. This is a Product-approved divergence, not an oversight; the conditional validation that originally shipped in #10817 was intentionally removed in #10820 to match the epic. Locked in by `test_sf424_short_v3_0_contact_person_always_required`.
- **`date_received`** uses `null_handling: include_null` so an empty element is always emitted in the XML output.
- Post-population rules auto-fill `date_received`, `aor_signature`, and `authorized_representative_date_signed` on submission.
- XSD reference: https://apply07.grants.gov/apply/forms/schemas/SF424_Short_3_0-V3.0.xsd

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
- **Single attachment** (`type: "single"`): Used by Project Abstract with wrapper element `ProjectAbstractAddAttachment`. Generates a simple structure where attachment metadata (FileName, MimeType, etc.) is placed directly within the specified XML element.
- **Single attachment with nested wrapper** (`type: "single_with_wrapper"`): Generates a nested structure where each attachment slot (e.g., ATT1-ATT15) contains an additional File wrapper element (e.g., `<ATT1><ATT1File>...</ATT1File></ATT1>`) before the attachment metadata.

### Example: Supplementary Cover Sheet for NEH Grant Programs

The Supplementary Cover Sheet for NEH Grant Programs form uses enum code mappings to transform human-readable display values to XSD-required numeric codes:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Supplementary Cover Sheet for NEH Grant Programs",
        "form_name": "SupplementaryCoverSheetforNEHGrantPrograms_3_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0",
            "SupplementaryCoverSheetforNEHGrantPrograms_3_0": (
                "http://apply.grants.gov/forms/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0"
            ),
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0.xsd",
        "xml_structure": {
            "root_element": "SupplementaryCoverSheetforNEHGrantPrograms_3_0",
            "root_namespace_prefix": "SupplementaryCoverSheetforNEHGrantPrograms_3_0",
            "root_attributes": {"FormVersion": "3.0"},
        },
    },
    # Project Director's Major Field of Study - maps display value to numeric code
    "major_field": {
        "xml_transform": {
            "target": "PDMajorField",
            "value_transform": {
                "type": "map_values",
                "params": {"mappings": FIELD_OF_STUDY_CODE_MAP},
            },
        }
    },
    # Institution/Organization Type - passed through as-is (full "CODE: Description" format)
    "organization_type": {
        "xml_transform": {
            "target": "InstType",
        }
    },
    # Nested structure for project funding amounts
    "funding_group": {
        "xml_transform": {"target": "ProjectFunding", "type": "nested_object"},
        "outright_funds": {"xml_transform": {"target": "OutrightFunds", "value_transform": {"type": "currency_format"}}},
        "federal_match": {"xml_transform": {"target": "FederalMatch", "value_transform": {"type": "currency_format"}}},
        # ... additional funding fields
    },
    # Nested structure for application information
    "application_info": {
        "xml_transform": {"target": "ApplicationInfo", "type": "nested_object"},
        "additional_funding": {"xml_transform": {"target": "AdditionalFunding", "value_transform": {"type": "boolean_to_yes_no"}}},
        # ... additional fields
    },
    # Project discipline fields - map display values like "History: U.S. History" to code "4"
    "primary_project_discipline": {
        "xml_transform": {
            "target": "PrimaryPDNEH",
            "value_transform": {"type": "map_values", "params": {"mappings": PROJECT_DISCIPLINE_CODE_MAP}},
        }
    },
    # ... secondary and tertiary project disciplines
}
```

**Supplementary Cover Sheet for NEH Grant Programs Field Mapping Notes:**

- Uses `map_values` transformation to convert human-readable enum values to XSD-required numeric codes for discipline fields
- `major_field` (Project Director's Major Field): Maps ~150 discipline display values (e.g., "History: U.S. History") to numeric codes (e.g., "4")
- `organization_type`: Passed through as-is (full "CODE: Description" format, e.g., "1330: University")
- `primary_project_discipline`, `secondary_project_discipline`, `tertiary_project_discipline`: Same mapping as `major_field` but uses a subset of values (project disciplines only, not the additional "Other" field of study values)
- `funding_group` → `ProjectFunding`: Nested structure with currency-formatted amounts
- `application_info` → `ApplicationInfo`: Nested structure with boolean-to-yes/no conversion for `additional_funding`
- XSD reference: https://apply07.grants.gov/apply/forms/schemas/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0.xsd

## Supported Forms

The following forms currently have XML generation support:

- **SF-424 (v4.0)**: Application for Federal Assistance
- **SF-424 Short (v3.0)**: Application for Federal Domestic Assistance - Short Organizational
- **SF-424A (v1.0)**: Budget Information - Non-Construction Programs
- **SF-424B (v1.1)**: Assurances for Non-Construction Programs
- **SF-424C (v2.0)**: Budget Information for Construction Programs (16-row budget table with required subtotals)
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
- **Supplementary Cover Sheet for NEH Grant Programs (v3.0)**: NEH-specific supplementary cover sheet
- **Project/Performance Site Location(s) (v4.0)**: Primary and additional project performance site locations with optional attachment
- **Key Contacts (v2.0)**: Key contact persons form

### Example: Key Contacts (v2.0)

The Key Contacts form maps a list of 1–4 project contacts (`RoleOnProject[]`), each containing name, address, and contact details split across two namespaces:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Key Contacts form",
        "form_name": "Key_Contacts_2_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
            "Key_Contacts_2_0": "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "codes": "http://apply.grants.gov/system/UniversalCodes-V2.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd",
        "xml_structure": {
            "root_element": "Key_Contacts_2_0",
            "root_namespace_prefix": "Key_Contacts_2_0",
            "root_attributes": {"FormVersion": "2.0"},
        },
    },
    "applicant_organization_name": {"xml_transform": {"target": "ApplicantOrganizationName"}},
    "key_contacts": {
        "xml_transform": {"target": "RoleOnProject", "type": "array"},
        "items": _key_contact_xml_fields(),
    },
}
```

**Key Contacts Field Mapping Notes:**

- **Array transform**: `key_contacts` emits one `<RoleOnProject>` element per contact. The XSD requires at least 1 and allows at most 4 (`minOccurs=1, maxOccurs=4`).
- **Dual namespace**: Outer contact elements (`ContactProjectRole`, `ContactName`, `ContactAddress`, `ContactPhone`, etc.) use the default form namespace. Name sub-fields (`PrefixName`, `FirstName`, `MiddleName`, `LastName`, `SuffixName`) and address sub-fields (`Street1`, `Street2`, `City`, `County`, `State`, `Province`, `ZipPostalCode`, `Country`) are typed via `globLib` (`HumanNameDataType` and `AddressDataTypeV3`) and use the `globLib` namespace.
- **Province field**: Always included in the address mapping (shown unconditionally on this form, unlike other forms where it is conditional on non-US country selection).
- **`codes` namespace**: Declared in the config because the XSD references `UniversalCodes-V2.0` for enum validation (e.g., state/country codes), even though no field mapping explicitly sets `"namespace": "codes"`.
- **Helper function**: `_key_contact_xml_fields()` returns the per-contact field mapping dict, shared between all array items.
- XSD reference: https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd

### Example: SF-424C (v2.0)

The SF-424C form maps a 16-row construction budget table (`budget_information`) into a `ProjectCosts` wrapper, with federal funding fields placed at the root level:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "form_name": "SF424C_2_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SF424C_2_0-V2.0",
            "SF424C_2_0": "http://apply.grants.gov/forms/SF424C_2_0-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424C_2_0-V2.0.xsd",
        "xml_structure": {
            "root_element": "SF424C_2_0",
            "root_namespace_prefix": "SF424C_2_0",
            "root_attributes": {"programType": "Construction", "FormVersion": "2.0"},
        },
    },
    "budget_information": {
        "xml_transform": {"target": "ProjectCosts", "type": "nested_object"},
        "construction": {"xml_transform": {"target": "ConstructionCost"}},
        "subtotal_1": {"xml_transform": {"target": "CostSubtotalBeforeContingencies"}},
        # ... other rows
    },
    "federal_funding": {
        # fields flatten to root — no wrapper element emitted
        "federal_percentage_share": {"xml_transform": {"target": "FederalFundingPercentageShareValue"}},
        "federal_funding_share": {"xml_transform": {"target": "FederalFundingShareValue"}},
    },
}
```

**SF-424C Field Mapping Notes:**

- **Budget wrapper**: All budget rows nest inside a single `<ProjectCosts>` element via `type: "nested_object"`. If no budget rows are present, `ProjectCosts` is omitted entirely.
- **Required subtotals**: `CostSubtotalBeforeContingencies` (row 12, mapped from `subtotal_1`) and `CostSubtotalAfterContingencies` (row 14, mapped from `subtotal_2`) have no `minOccurs="0"` in the XSD — they are **required** whenever `ProjectCosts` is present. Any input with budget rows must include both subtotals.
- **Two cost types**: Regular rows use `CostAmountGroup` (decimal up to 9,999,999,999.99); subtotal/total rows use `CostTotalGroup` (decimal up to 999,999,999,999.99). The XSD enforces different precision limits for each.
- **Federal funding at root**: `federal_funding.*` fields map directly to root-level elements (`FederalFundingPercentageShareValue`, `FederalFundingShareValue`) — there is no `<FederalFunding>` wrapper in the XSD.
- **`programType` attribute**: Fixed to `"Construction"` and declared `use="required"` in the XSD. Set via `root_attributes`.
- XSD reference: https://apply07.grants.gov/apply/forms/schemas/SF424C_2_0-V2.0.xsd

### Example: Project/Performance Site Location(s) (v4.0)

The Performance Site form maps site location data for both the primary site and up to 299 additional sites, plus an optional attachment for overflow locations:

```python
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Project/Performance Site Location(s) v4.0",
        "form_name": "PerformanceSite_4_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/PerformanceSite_4_0-V4.0",
            "PerformanceSite_4_0": "http://apply.grants.gov/forms/PerformanceSite_4_0-V4.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/PerformanceSite_4_0-V4.0.xsd",
        "xml_structure": {
            "root_element": "PerformanceSite_4_0",
            "root_namespace_prefix": "PerformanceSite_4_0",
            "root_attributes": {"FormVersion": "4.0"},
        },
        "attachment_fields": {
            "additional_locations_attachment": {
                "xml_element": "AttachedFile",
                "type": "single_with_wrapper",
                "file_element": "",  # content directly in <AttachedFile>, no inner wrapper
            },
        },
    },
    "primary_site": {
        "xml_transform": {"target": "PrimarySite", "type": "nested_object"},
        **_site_location_xml_fields(),
    },
    "additional_sites": {
        "xml_transform": {"target": "OtherSite", "type": "array"},
        "items": _site_location_xml_fields(),
    },
}
```

**Performance Site Location Field Mapping Notes:**

- **Namespace split**: `Individual`, `OrganizationName`, `SAMUEI`, `Address`, and `CongressionalDistrictProgramProject` are declared in the form's own `SiteLocationDataType` — they use the default `PerformanceSite_4_0` namespace. The address _sub_-elements (`Street1`, `City`, etc.) are typed via `globLib:AddressDataTypeV3` and use the `globLib` namespace.
- **Address element order**: The XSD sequence requires `ZipPostalCode` before `Country`. The transform rules must declare `zip_code` before `country` to match this ordering.
- **Attachment**: The optional `additional_locations_attachment` field maps to a single `<AttachedFile>` element (type `att:AttachedFileDataType`) as a direct child of the root. Using `single_with_wrapper` with `file_element: ""` creates the outer `<AttachedFile>` wrapper and places `att:FileName`, `att:MimeType`, `att:FileLocation`, and `glob:HashValue` directly inside it — no spurious inner wrapper element.
- `submitting_as_individual` uses the `boolean_to_yes_no` value transform (outputs `Y: Yes` / `N: No`).
- `additional_sites` uses `type: "array"` to emit one `<OtherSite>` element per entry (max 299).
- XSD reference: https://apply07.grants.gov/apply/forms/schemas/PerformanceSite_4_0-V4.0.xsd

## Adding New Forms

To add XML generation support for a new form:

1. **Define XSD Schema**: Reference the Grants.gov XSD schema URL
   - Example: `https://apply07.grants.gov/apply/forms/schemas/FormName-V1.0.xsd`

2. **Create Transform Rules**: Add `FORM_XML_TRANSFORM_RULES` in the form's Python module
   - Define `_xml_config` with namespaces, structure, and XSD URL
   - Map JSON field names to XML element names
   - Configure attachment fields if applicable

3. **Set json_to_xml_schema on the Form**: In the form's Python module, set `json_to_xml_schema=FORM_XML_TRANSFORM_RULES` on the Form object. The config is automatically loaded for any form that has this field set.

4. **Add Tests**: Create test cases in `tests/src/services/xml_generation/`.
   Per the [Testing Standard for New Forms](#testing-standard-for-new-forms),
   a new form is not complete until all three of the following exist and pass:
   - **A known-good XML fixture** — deterministic, representative input data covering required fields plus important optional/nested fields.
   - **A snapshot equality test** — generated XML compared exactly against a checked-in file in `tests/src/services/xml_generation/snapshots/` (see [Snapshot fixtures](#snapshot-fixtures)).
   - **An XSD validation test** — generated XML validated against the form's committed schema using `XSDValidator` (see [XSD validation](#xsd-validation)).

   Also test configuration loading and any noteworthy transformation behavior specific to the new form.

5. **Update Documentation**: Document any special transformation logic or noteworthy details in this README
