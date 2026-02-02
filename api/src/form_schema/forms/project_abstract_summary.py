import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "funding_opportunity_number",
        "applicant_name",
        "project_title",
        "project_abstract",
    ],
    "properties": {
        "funding_opportunity_number": {
            "type": "string",
            "title": "Funding Opportunity Number",
            "minLength": 1,
            "maxLength": 40,
        },
        "assistance_listing_number": {
            "type": "string",
            "title": "Assistance Listing Number",
            "minLength": 1,
            "maxLength": 15,
        },
        "applicant_name": {
            # NOTE: This is named OrganizationName in the XSD, but
            # the UI calls it an applicant name.
            # FUTURE WORK: This gets copied from the SF-424's OrganizationName field (called Legal Name in the UI)
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
            "title": "Applicant Name",
            "description": "This should match the 'Legal Name' field from the SF-424 form",
        },
        "project_title": {
            # FUTURE WORK: This gets copied from the SF-424's ProjectTitle field
            "type": "string",
            "title": "Descriptive Title of Applicant's Project",
            "description": "This should match the 'Project Title' field from the SF-424 form",
            "minLength": 1,
            "maxLength": 250,
        },
        "project_abstract": {
            "type": "string",
            "title": "Project Abstract",
            "minLength": 1,
            "maxLength": 4000,
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "1. Project Abstract Summary",
        "name": "projectAbstractSummary",
        "description": "This Project Abstract Summary form must be submitted or the application will be considered incomplete. Ensure the Project Abstract field succinctly describes the project in plain language that the public can understand and use without the full proposal. Use 4,000 characters or less. Do not include personally identifiable, sensitive or proprietary information. Refer to Agency instructions for any additional Project Abstract field requirements. If the application is funded, your project abstract information (as submitted) will be made available to public websites and/or databases including USAspending.gov.",
        "children": [
            {"type": "field", "definition": "/properties/funding_opportunity_number"},
            {"type": "field", "definition": "/properties/assistance_listing_number"},
            {"type": "field", "definition": "/properties/applicant_name"},
            {"type": "field", "definition": "/properties/project_title"},
            {"type": "field", "definition": "/properties/project_abstract"},
        ],
    }
]

FORM_RULE_SCHEMA = {
    ##### PRE-POPULATION RULES
    # Note - we don't have pre-population enabled yet, so these
    # won't run yet.
    "funding_opportunity_number": {"gg_pre_population": {"rule": "opportunity_number"}},
    "assistance_listing_number": {"gg_pre_population": {"rule": "assistance_listing_number"}},
}

# XML Transformation Rules for Project Abstract Summary v2.0
FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for Project Abstract Summary form",
        "version": "1.0",
        "form_name": "Project_AbstractSummary_2_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/Project_AbstractSummary_2_0-V2.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "codes": "http://apply.grants.gov/system/UniversalCodes-V2.0",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd",
        "xml_structure": {
            "root_element": "Project_AbstractSummary_2_0",
            "root_attributes": {
                "FormVersion": "2.0",
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
        },
    },
    # Field mappings - order matches XSD sequence
    # FundingOpportunityNumber (required) - OpportunityIDDataType
    "funding_opportunity_number": {
        "xml_transform": {
            "target": "FundingOpportunityNumber",
        }
    },
    # CFDANumber (optional) - CFDANumberDataType (now called Assistance Listing Number)
    "assistance_listing_number": {
        "xml_transform": {
            "target": "CFDANumber",
        }
    },
    # OrganizationName (required) - OrganizationNameDataType
    "applicant_name": {
        "xml_transform": {
            "target": "OrganizationName",
        }
    },
    # ProjectTitle (required) - string 1-250
    "project_title": {
        "xml_transform": {
            "target": "ProjectTitle",
        }
    },
    # ProjectAbstract (required) - string 1-4000
    "project_abstract": {
        "xml_transform": {
            "target": "ProjectAbstract",
        }
    },
}

ProjectAbstractSummary_v2_0 = Form(
    # https://grants.gov/forms/form-items-description/fid/591
    form_id=uuid.UUID("bf683068-23a4-43fa-ac7a-0f046b83cb14"),
    legacy_form_id=591,
    form_name="Project Abstract Summary",
    short_form_name="Project_AbstractSummary_2_0",
    form_version="2.0",
    agency_code="SGG",
    omb_number="4040-0019",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    # This form does not have instructions.
    form_type=FormType.PROJECT_ABSTRACT_SUMMARY,
    sgg_version="1.0",
    is_deprecated=False,
)
