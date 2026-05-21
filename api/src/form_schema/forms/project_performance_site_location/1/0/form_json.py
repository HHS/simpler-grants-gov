import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

# Congressional district format: 2 chars + hyphen + 3 chars (e.g., CA-005, MD-all, US-all, 00-000)
_CONGRESSIONAL_DISTRICT_PATTERN = r"^.{2}-.{3}$"

# Shared site location fields, used in both primary_site and site_location $defs
_SITE_LOCATION_PROPERTIES = {
    "submitting_as_individual": {
        "type": "boolean",
        "title": "I am submitting an application as an individual, and not on behalf of a company, state, local or tribal government, academia, or other type of organization.",
        "description": "Select if submitting application as an individual and not on behalf of or representing any organization.",
    },
    "organization_name": {
        "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
        "title": "Organization Name",
        "description": "Indicate the organization name of the site where the work will be performed.",
    },
    "uei": {
        "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("sam_uei")}],
        "title": "UEI",
        "description": "Enter the UEI associated with the organization where the project will be performed.",
    },
    "street1": {
        "type": "string",
        "title": "Street 1",
        "description": "Enter first line of the street address.",
        "minLength": 1,
        "maxLength": 55,
    },
    "street2": {
        "type": "string",
        "title": "Street 2",
        "description": "Enter second line of the street address.",
        "minLength": 1,
        "maxLength": 55,
    },
    "city": {
        "type": "string",
        "title": "City",
        "description": "Enter the city of the performance site location.",
        "minLength": 1,
        "maxLength": 35,
    },
    "county": {
        "type": "string",
        "title": "County",
        "description": "Enter the county of the performance site location.",
        "minLength": 1,
        "maxLength": 30,
    },
    "state": {
        "type": "string",
        "title": "State",
        "description": "Enter the state where the performance site is located. Required if the site is in the United States.",
        # State uses the same enum as address_shared but we define it inline here
        # since we are not nesting inside an address sub-object.
        # Values match globLib:State / ADDRESS_SHARED_V1 state_code
        "minLength": 1,
        "maxLength": 55,
    },
    "province": {
        "type": "string",
        "title": "Province",
        "description": "Enter the province where the performance site is located.",
        "minLength": 1,
        "maxLength": 30,
    },
    "country": {
        "type": "string",
        "title": "Country",
        "description": "Select the country for the performance site location.",
        "minLength": 1,
        "maxLength": 49,
    },
    "zip_code": {
        "type": "string",
        "title": "ZIP / Postal Code",
        "description": "Enter the nine-digit Postal Code (e.g., ZIP code). Required if the site is in the United States.",
        "minLength": 1,
        "maxLength": 30,
    },
    "congressional_district": {
        "type": "string",
        "title": "Project/Performance Site Congressional District",
        "description": (
            "Enter the Congressional District in the format: 2 character State Abbreviation - "
            "3 character District Number. Examples: CA-005, MD-all, US-all, 00-000. "
            "Required if the site is in the United States."
        ),
        "minLength": 6,
        "maxLength": 6,
        "pattern": _CONGRESSIONAL_DISTRICT_PATTERN,
    },
}

# Conditional rules shared between primary_site and site_location:
# If country is US, state, zip_code, and congressional_district are required.
_US_COUNTRY_CONDITIONAL = {
    "if": {
        "properties": {"country": {"const": "USA: UNITED STATES"}},
        "required": ["country"],
    },
    "then": {"required": ["state", "zip_code", "congressional_district"]},
}

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": ["primary_site"],
    "properties": {
        "primary_site": {"$ref": "#/$defs/primary_site"},
        "additional_sites": {
            "type": "array",
            "title": "Additional Project/Performance Site Locations",
            "description": "Add up to 299 additional project/performance site locations.",
            "maxItems": 299,
            "items": {"$ref": "#/$defs/site_location"},
        },
        "additional_locations_attachment": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Additional Location(s)",
            "description": (
                "Attach a file listing additional locations if more than 299 additional sites "
                "are needed."
            ),
        },
    },
    "$defs": {
        # Primary site: street1, city, country required; organization_name required unless
        # submitting_as_individual is true.
        "primary_site": {
            "type": "object",
            "required": ["street1", "city", "country"],
            "allOf": [
                _US_COUNTRY_CONDITIONAL,
                # If submitting_as_individual is true, organization_name is not required;
                # otherwise it is required.
                {
                    "if": {
                        "properties": {"submitting_as_individual": {"const": True}},
                        "required": ["submitting_as_individual"],
                    },
                    "else": {"required": ["organization_name"]},
                },
            ],
            "properties": _SITE_LOCATION_PROPERTIES,
        },
        # Additional site: street1, city, country required when the site object is present.
        "site_location": {
            "type": "object",
            "required": ["street1", "city", "country"],
            "allOf": [_US_COUNTRY_CONDITIONAL],
            "properties": _SITE_LOCATION_PROPERTIES,
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "Project/Performance Site Primary Location",
        "name": "primary_site",
        "children": [
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/submitting_as_individual",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/organization_name",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/uei",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/street1",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/street2",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/city",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/county",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/state",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/province",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/country",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/zip_code",
            },
            {
                "type": "field",
                "definition": "/properties/primary_site/properties/congressional_district",
            },
        ],
    },
    {
        "type": "section",
        "label": "Additional Project/Performance Site Location(s)",
        "name": "additional_sites",
        "children": [
            {
                "type": "field",
                "definition": "/properties/additional_sites",
            },
        ],
    },
    {
        "type": "section",
        "label": "Additional Location(s) Attachment",
        "name": "additional_locations_attachment",
        "description": "Attach a file if more than 299 additional sites are needed.",
        "children": [
            {
                "type": "field",
                "definition": "/properties/additional_locations_attachment",
                "widget": "Attachment",
            },
        ],
    },
]

FORM_RULE_SCHEMA = {
    "primary_site": {
        # Pre-populate UEI from the applicant organization
        "uei": {"gg_pre_population": {"rule": "uei"}},
    },
    # Validate the attachment ID exists on the application
    "additional_locations_attachment": {"gg_validation": {"rule": "attachment"}},
}


# Helper to build site location field mappings for XML (shared between primary and additional sites)
def _site_location_xml_fields() -> dict:
    return {
        "submitting_as_individual": {
            "xml_transform": {
                "target": "Individual",
                "namespace": "globLib",
                "value_transform": "boolean_to_yes_no",
            }
        },
        "organization_name": {
            "xml_transform": {
                "target": "OrganizationName",
                "namespace": "globLib",
            }
        },
        "uei": {
            "xml_transform": {
                "target": "SAMUEI",
                "namespace": "globLib",
            }
        },
        "street1": {
            "xml_transform": {
                "target": "Street1",
                "namespace": "globLib",
            }
        },
        "street2": {
            "xml_transform": {
                "target": "Street2",
                "namespace": "globLib",
            }
        },
        "city": {
            "xml_transform": {
                "target": "City",
                "namespace": "globLib",
            }
        },
        "county": {
            "xml_transform": {
                "target": "County",
                "namespace": "globLib",
            }
        },
        "state": {
            "xml_transform": {
                "target": "State",
                "namespace": "globLib",
            }
        },
        "province": {
            "xml_transform": {
                "target": "Province",
                "namespace": "globLib",
            }
        },
        "country": {
            "xml_transform": {
                "target": "Country",
                "namespace": "globLib",
            }
        },
        "zip_code": {
            "xml_transform": {
                "target": "ZipPostalCode",
                "namespace": "globLib",
            }
        },
        "congressional_district": {
            "xml_transform": {
                "target": "CongressionalDistrictProgramProject",
                "namespace": "globLib",
            }
        },
    }


FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Project/Performance Site Location(s) v4.0",
        "version": "1.0",
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
            "root_attributes": {
                "FormVersion": "4.0",
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
        },
        "attachment_fields": {
            "additional_locations_attachment": {
                "xml_element": "AttachedFile",
                "type": "single_with_wrapper",
            },
        },
    },
    "primary_site": {
        "xml_transform": {
            "target": "PrimarySite",
            "type": "nested_object",
        },
        **_site_location_xml_fields(),
    },
    "additional_sites": {
        "xml_transform": {
            "target": "OtherSite",
            "type": "array",
        },
        "items": _site_location_xml_fields(),
    },
}

ProjectPerformanceSiteLocation_v4_0 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/723
    form_id=uuid.UUID("6ebd786f-cccf-4ee1-a100-61436975025b"),
    legacy_form_id=723,
    form_name="PROJECT/PERFORMANCE SITE LOCATION(S)",
    short_form_name="PerformanceSite",
    form_version="4.0",
    agency_code="SGG",
    omb_number="4040-0010",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=None,
    form_type=FormType.PROJECT_PERFORMANCE_SITE_LOCATION,
    sgg_version="1.0",
    is_deprecated=False,
)
