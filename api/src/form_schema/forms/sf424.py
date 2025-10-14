import uuid

import src.form_schema.shared.shared_form_constants as shared_form_constants
from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.services.xml_generation.constants import NO_VALUE

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "submission_type",
        "application_type",
        "organization_name",
        "employer_taxpayer_identification_number",
        "sam_uei",
        "applicant",
        "contact_person",
        "phone_number",
        "email",
        "applicant_type_code",
        "agency_name",
        "funding_opportunity_number",
        "funding_opportunity_title",
        "project_title",
        "congressional_district_applicant",
        "congressional_district_program_project",
        "project_start_date",
        "project_end_date",
        "federal_estimated_funding",
        "applicant_estimated_funding",
        "state_estimated_funding",
        "local_estimated_funding",
        "other_estimated_funding",
        "program_income_estimated_funding",
        "total_estimated_funding",
        "state_review",
        "delinquent_federal_debt",
        "certification_agree",
        "authorized_representative",
        "authorized_representative_title",
        "authorized_representative_phone_number",
        "authorized_representative_email",
    ],
    # Conditional validation rules for SF424
    "allOf": [
        # If application_type is Revision, revision_type + federal_award_identifier are required
        {
            "if": {
                "properties": {"application_type": {"const": "Revision"}},
                "required": ["application_type"],  # Only run rule if application_type is set
            },
            "then": {"required": ["revision_type", "federal_award_identifier"]},
        },
        # If application_type is Continuation, federal_award_identifier is required
        {
            "if": {
                "properties": {"application_type": {"const": "Continuation"}},
                "required": ["application_type"],  # Only run rule if application_type is set
            },
            "then": {"required": ["federal_award_identifier"]},
        },
        # If revision_type is E, revision_other_specify becomes required
        {
            "if": {
                "properties": {"revision_type": {"const": "E: Other (specify)"}},
                "required": ["revision_type"],  # Only run rule if revision_type is set
            },
            "then": {"required": ["revision_other_specify"]},
        },
        # If delinquent_federal_debt is True, debt_explanation is required
        {
            "if": {
                "properties": {"delinquent_federal_debt": {"const": True}},
                "required": [
                    "delinquent_federal_debt"
                ],  # Only run rule if delinquent_federal_debt is set
            },
            "then": {"required": ["debt_explanation"]},
        },
        # If state_review is option A, state_review_available_date is required
        {
            "if": {
                "properties": {
                    "state_review": {
                        "const": "a. This application was made available to the state under the Executive Order 12372 Process for review on"
                    },
                },
                "required": ["state_review"],  # Only run rule if state_review is set
            },
            "then": {"required": ["state_review_available_date"]},
        },
        # If one of the applicant_type_code values is X: Other, then applicant_type_other_specify is required
        {
            "if": {
                "properties": {
                    "applicant_type_code": {"contains": {"const": "X: Other (specify)"}}
                },
                "required": ["applicant_type_code"],  # Only run rule if applicant_type_code is set
            },
            "then": {"required": ["applicant_type_other_specify"]},
        },
    ],
    "properties": {
        "submission_type": {
            "type": "string",
            "title": "Submission Type",
            "description": "Select one type of submission in accordance with agency instructions.",
            "enum": ["Preapplication", "Application", "Changed/Corrected Application"],
        },
        "application_type": {
            "type": "string",
            "title": "Application Type",
            "description": "Select one type of application in accordance with agency instructions.",
            "enum": ["New", "Continuation", "Revision"],
        },
        "revision_type": {
            "type": "string",
            "title": "Revision Type",
            "description": "Select a revision type from the list provided. A selection is required if Type of Application is Revision.",
            "enum": [
                "A: Increase Award",
                "B: Decrease Award",
                "C: Increase Duration",
                "D: Decrease Duration",
                "E: Other (specify)",
                "AC: Increase Award, Increase Duration",
                "AD: Increase Award, Decrease Duration",
                "BC: Decrease Award, Increase Duration",
                "BD: Decrease Award, Decrease Duration",
            ],
        },
        "revision_other_specify": {
            "type": "string",
            "title": "Other Explanation",
            "description": "Please specify the type of revision. This field is required if E. Other is checked.",
        },
        "date_received": {
            "type": "string",
            "title": "Date Received",
            "description": "Completed by Grants.gov upon submission.",
            "format": "date",
        },
        "applicant_id": {
            "type": "string",
            "title": "Applicant Identifier",
            "description": "Enter the applicant's control number, if applicable.",
            "minLength": 1,
            "maxLength": 30,
            # Based on applicant_idDataType
            # https://apply07.grants.gov/apply/system/schemas/GlobalLibrary-V2.0.xsd
            # From the instructions: "Enter the entity identifier assigned by the Federal agency, if any, or the applicant's control number if applicable."
        },
        "federal_entity_identifier": {
            "type": "string",
            "title": "Federal Entity Identifier",
            "minLength": 1,
            "maxLength": 30,
            "description": "Enter the number assigned to your organization by the Federal agency.",
            # Based on FederalIDDataType
            # https://apply07.grants.gov/apply/system/schemas/GlobalLibrary-V2.0.xsd
            # From the instructions: "Enter the number assigned to your organization by the federal agency"
        },
        "federal_award_identifier": {
            "type": "string",
            "title": "Federal Award Identifier",
            "description": "For new applications leave blank. For a continuation or revision to an existing award, enter the previously assigned Federal award identifier number. If a changed/corrected application, enter the Federal Identifier in accordance with agency instructions.",
            "minLength": 1,
            "maxLength": 25,
        },
        "state_receive_date": {
            # A user will never fill this in, it's just on the form for agencies to use
            "type": "string",
            "title": "Date Received By State",
            "description": "Leave blank, to be filled out by state.",
            "format": "date",
            "readOnly": True,
        },
        "state_application_id": {
            # A user will never fill this in, it's just on the form for agencies to use
            "type": "string",
            "title": "State Application Identifier",
            "description": "Leave blank, to be filled out by state.",
            "minLength": 0,
            "maxLength": 30,
            "readOnly": True,
        },
        "organization_name": {
            "type": "string",
            "title": "Legal Name",
            "description": "Enter the legal name of the applicant that will undertake the assistance activity.",
            "minLength": 1,
            "maxLength": 60,
        },
        "employer_taxpayer_identification_number": {
            "type": "string",
            "title": "EIN/TIN",
            "description": "Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444.",
            "minLength": 9,
            "maxLength": 30,
        },
        "sam_uei": {
            "type": "string",
            "title": "SAM UEI",
            "description": "UEI of the applicant organization. This field is pre-populated from the Application cover sheet.",
            "minLength": 12,
            "maxLength": 12,
        },
        "applicant": {
            "allOf": [{"$ref": "#/$defs/address"}],
            "title": "Applicant",
            "description": "Enter information about the applicant.",
        },
        "department_name": {
            "type": "string",
            "title": "Department Name",
            "description": "Enter the name of primary organizational department, service, laboratory, or equivalent level within the organization which will undertake the assistance activity.",
            "minLength": 1,
            "maxLength": 30,
        },
        "division_name": {
            "type": "string",
            "title": "Division Name",
            "description": "Enter the name of primary organizational division, office, or major subdivision which will undertake the assistance activity.",
            "minLength": 1,
            "maxLength": 100,
        },
        "contact_person": {
            "allOf": [{"$ref": "#/$defs/person_name"}],
            "title": "Contact Person",
            "description": "Enter information about the contact person.",
        },
        "contact_person_title": {
            "type": "string",
            "title": "Title",
            "description": "Enter the position title.",
            "minLength": 1,
            "maxLength": 45,
        },
        "organization_affiliation": {
            "type": "string",
            "title": "Organizational Affiliation",
            "description": "Enter the organization if different from the applicant organization.",
            "minLength": 1,
            "maxLength": 60,
        },
        "phone_number": {
            "allOf": [{"$ref": "#/$defs/phone_number_field"}],
            "title": "Telephone Number",
            "description": "Enter the daytime Telephone Number.",
        },
        "fax": {
            "allOf": [{"$ref": "#/$defs/phone_number_field"}],
            "title": "Fax Number",
            "description": "Enter the fax Number.",
        },
        "email": {
            "type": "string",
            "title": "Email",
            "description": "Enter a valid email Address.",
            "format": "email",
        },
        "applicant_type_code": {
            # NOTE: In the xml model, this is 3 separate fields, we joined them together
            # into a single value.
            "type": "array",
            "title": "Type of Applicant",
            "description": "Select the appropriate applicant types.",
            "minItems": 1,
            "maxItems": 3,
            "items": {
                "type": "string",
                "enum": [
                    "A: State Government",
                    "B: County Government",
                    "C: City or Township Government",
                    "D: Special District Government",
                    "E: Regional Organization",
                    "F: U.S. Territory or Possession",
                    "G: Independent School District",
                    "H: Public/state Controlled Institution of Higher Education",
                    "I: Indian/Native American Tribal Government (Federally Recognized)",
                    "J: Indian/Native American Tribal Government (Other than Federally Recognized)",
                    "K: Indian/Native American Tribally Designated Organization",
                    "L: Public/Indian Housing Authority",
                    "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)",
                    "N: Nonprofit without 501C3 IRS Status (Other than Institution of Higher Education)",
                    "O: Private Institution of Higher Education",
                    "P: Individual",
                    "Q: For-Profit Organization (Other than Small Business)",
                    "R: Small Business",
                    "S: Hispanic-serving Institution",
                    "T: Historically Black Colleges and Universities (HBCUs)",
                    "U: Tribally Controlled Colleges and Universities (TCCUs)",
                    "V: Alaska Native and Native Hawaiian Serving Institutions",
                    "W: Non-domestic (non-US) Entity",
                    "X: Other (specify)",
                ],
            },
        },
        "applicant_type_other_specify": {
            "type": "string",
            "title": "Type of Applicant Other Explanation",
            "description": 'Enter the applicant type here if you selected "Other (specify)" for Type of applicant.',
            "minLength": 0,
            "maxLength": 30,
        },
        "agency_name": {
            "type": "string",
            "title": "Agency Name",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 60,
        },
        "assistance_listing_number": {
            "type": "string",
            "title": "Assistance Listing Number",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 15,
        },
        "assistance_listing_program_title": {
            "type": "string",
            "title": "Assistance Listing Title",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 120,
        },
        "funding_opportunity_number": {
            "type": "string",
            "title": "Opportunity Number",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 40,
        },
        "funding_opportunity_title": {
            "type": "string",
            "title": "Opportunity title",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 255,
        },
        "competition_identification_number": {
            "type": "string",
            "title": "Competition Number",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 40,
        },
        "competition_identification_title": {
            "type": "string",
            "title": "Competition Title",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 255,
        },
        "areas_affected": {
            "allOf": [{"$ref": "#/$defs/attachment_field"}],
            "title": "Areas Affected",
            "description": "List the areas or entities using the categories (e.g., cities, counties, states, etc.) specified in agency instructions.",
        },
        "project_title": {
            "type": "string",
            "title": "Project Title",
            "description": "Enter a brief, descriptive title of the project.",
            "minLength": 1,
            "maxLength": 200,
        },
        "additional_project_title": {
            "type": "array",
            "title": "Additional Project Title",
            "description": "Attach file(s) using the appropriate buttons.",
            "maxItems": 100,
            "items": {"allOf": [{"$ref": "#/$defs/attachment_field"}]},
        },
        "congressional_district_applicant": {
            "type": "string",
            "title": "Applicant District",
            "description": "Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.If outside the US, enter 00-000.",
            "minLength": 1,
            "maxLength": 6,
        },
        "congressional_district_program_project": {
            "type": "string",
            "title": "Program District",
            "description": "Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.If all districts in a state are affected, enter \"all\" for the district number. Example: MD-all for all congressional districts in Maryland.If nationwide (all districts in all states), enter US-all.If the program/project is outside the US, enter 00-000.",
            "minLength": 1,
            "maxLength": 6,
        },
        "additional_congressional_districts": {
            "allOf": [{"$ref": "#/$defs/attachment_field"}],
            "title": "Additional Congressional Districts",
            "description": "Additional Congressional Districts.",
        },
        "project_start_date": {
            "type": "string",
            "title": "Project Start Date",
            "description": "Enter the date in the format MM/DD/YYYY. ",
            "format": "date",
        },
        "project_end_date": {
            "type": "string",
            "title": "Project End Date",
            "description": "Enter the date in the format MM/DD/YYYY. ",
            "format": "date",
        },
        "federal_estimated_funding": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "Federal Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "applicant_estimated_funding": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "Applicant Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "state_estimated_funding": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "State Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "local_estimated_funding": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "Local Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "other_estimated_funding": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "Other Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "program_income_estimated_funding": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "Program Income Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "total_estimated_funding": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "Total Estimated Funding",
            "description": "Total dollar amount.",
        },
        "state_review": {
            "type": "string",
            "title": "Is Application Subject to Review By State Under Executive Order 12372 Process?",
            "description": "One selection is required.",
            "enum": [
                "a. This application was made available to the state under the Executive Order 12372 Process for review on",
                "b. Program is subject to E.O. 12372 but has not been selected by the state for review.",
                "c. Program is not covered by E.O. 12372.",
            ],
        },
        "state_review_available_date": {
            "type": "string",
            "title": "State Review Date",
            "description": "If 'a' is selected, enter the date the application was submitted to the State.",
            "format": "date",
        },
        "delinquent_federal_debt": {
            "type": "boolean",
            "title": "Applicant Delinquent on Federal Debt",
            "description": "If 'Yes,' provide explanation in attachment.",
        },
        "debt_explanation": {
            "allOf": [{"$ref": "#/$defs/attachment_field"}],
            "title": "Debt Explanation",
            "description": "",
        },
        "certification_agree": {
            "type": "boolean",
            "title": "Certification Agree",
            "description": "By signing this application, I certify (1) to the statements contained in the list of certifications* and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances** and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)",
        },
        "authorized_representative": {
            "allOf": [{"$ref": "#/$defs/person_name"}],
            "title": "Authorized Representative",
            "description": "",
        },
        "authorized_representative_title": {
            "type": "string",
            "title": "Title",
            "description": "Enter the position title.",
            "minLength": 1,
            "maxLength": 45,
        },
        "authorized_representative_phone_number": {
            "allOf": [{"$ref": "#/$defs/phone_number_field"}],
            "title": "AOR Telephone Number",
            "description": "Enter the daytime Telephone Number.",
        },
        "authorized_representative_fax": {
            "allOf": [{"$ref": "#/$defs/phone_number_field"}],
            "title": "AOR fax Number",
            "description": "Enter the fax Number.",
        },
        "authorized_representative_email": {
            "type": "string",
            "format": "email",
            "title": "AOR email",
            "description": "Enter a valid email Address.",
        },
        "aor_signature": {
            "type": "string",
            "title": "AOR Signature",
            "description": "Completed by Grants.gov upon submission.",
            "minLength": 1,
            "maxLength": 144,
        },
        "date_signed": {
            "type": "string",
            "format": "date",
            "title": "Date Signed",
            "description": "Completed by Grants.gov upon submission.",
        },
    },
    "$defs": {
        "address": {
            "type": "object",
            "title": "Address",
            "description": "Enter an address.",
            "required": [
                "street1",
                "city",
                "country",
            ],
            # Conditional validation rules for an address field
            "allOf": [
                # If country is United states, state and zip_code are required
                {
                    "if": {
                        "properties": {"country": {"const": "USA: UNITED STATES"}},
                        "required": ["country"],  # Only run rule if country is set
                    },
                    "then": {"required": ["state", "zip_code"]},
                },
            ],
            "properties": {
                "street1": {
                    "type": "string",
                    "title": "Street 1",
                    "description": "Enter the first line of the Street Address.",
                    "minLength": 1,
                    "maxLength": 55,
                },
                "street2": {
                    "type": "string",
                    "title": "Street 2",
                    "description": "Enter the second line of the Street Address.",
                    "minLength": 1,
                    "maxLength": 55,
                },
                "city": {
                    "type": "string",
                    "title": "City",
                    "description": "Enter the city.",
                    "minLength": 1,
                    "maxLength": 35,
                },
                "county": {
                    "type": "string",
                    "title": "County/Parish",
                    "description": "Enter the County/Parish.",
                    "minLength": 1,
                    "maxLength": 30,
                },
                "state": {
                    "allOf": [{"$ref": "#/$defs/state_code"}],
                    "title": "State",
                    "description": "Enter the state.",
                },
                "province": {
                    "type": "string",
                    "title": "Province",
                    "description": "Enter the province.",
                    "minLength": 1,
                    "maxLength": 30,
                    # Note that grants.gov would hide this if the country isn't USA, but it isn't required even then
                },
                "country": {"$ref": "#/$defs/country_code"},
                "zip_code": {
                    "type": "string",
                    "title": "Zip / Postal Code",
                    "description": "Enter the nine-digit Postal Code (e.g., ZIP code). This field is required if the country is the United states.",
                    "minLength": 1,
                    "maxLength": 30,
                },
            },
        },
        "person_name": {
            "type": "object",
            "title": "Name and Contact Information",
            "description": "",
            "required": [
                "first_name",
                "last_name",
            ],
            "properties": {
                "prefix": {
                    "type": "string",
                    "title": "Prefix",
                    "description": "Select the prefix from the provided list or enter a new prefix not provided on the list.",
                    "minLength": 1,
                    "maxLength": 10,
                },
                "first_name": {
                    "type": "string",
                    "title": "First Name",
                    "description": "Enter the First Name.",
                    "minLength": 1,
                    "maxLength": 35,
                },
                "middle_name": {
                    "type": "string",
                    "title": "Middle Name",
                    "description": "Enter the Middle Name.",
                    "minLength": 1,
                    "maxLength": 25,
                },
                "last_name": {
                    "type": "string",
                    "title": "Last Name",
                    "description": "Enter the Last Name.",
                    "minLength": 1,
                    "maxLength": 60,
                },
                "suffix": {
                    "type": "string",
                    "title": "Suffix",
                    "description": "Select the suffix from the provided list or enter a new suffix not provided on the list.",
                    "minLength": 1,
                    "maxLength": 10,
                },
            },
        },
        "budget_monetary_amount": {
            # Represents a monetary amount. We use a string instead of number
            # to avoid any floating point rounding issues.
            "type": "string",
            # Pattern here effectively says:
            # * An optional negative sign
            # * Any number of digits
            # * An optional decimal point
            # * Then exactly 2 digits - if there was a decimal
            "pattern": r"^(-)?\d*([.]\d{2})?$",
            # Limit the max amount based on the length (11-digits, allows up to 99 billion)
            "maxLength": 14,
        },
        "phone_number_field": {
            "type": "string",
            "minLength": 1,
            "maxLength": 25,
        },
        "attachment_field": {"type": "string", "format": "uuid", "title": "Attachment"},
        "state_code": {
            "type": "string",
            "title": "State",
            "description": "US State or Territory Code",
            "enum": shared_form_constants.STATES,
        },
        "country_code": {
            "type": "string",
            "title": "Country",
            "description": "Country Code",
            "enum": shared_form_constants.COUNTRIES,
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "name": "submission_type",
        "label": "1. Type of Submission",
        "children": [{"type": "field", "definition": "/properties/submission_type"}],
    },
    {
        "type": "section",
        "name": "application_type_and_revision",
        "label": "2. Type of Application",
        "children": [
            {"type": "field", "definition": "/properties/application_type"},
            {"type": "field", "definition": "/properties/revision_type"},
            {"type": "field", "definition": "/properties/revision_other_specify"},
        ],
    },
    {
        "type": "section",
        "name": "date_received",
        "label": "3. Date Received",
        "children": [{"type": "null", "definition": "/properties/date_received"}],
    },
    {
        "type": "section",
        "name": "applicant_identifier",
        "label": "4. Applicant Identifier",
        "children": [{"type": "field", "definition": "/properties/applicant_id"}],
    },
    {
        "type": "section",
        "name": "federal_identifiers",
        "label": "5a. Federal Identifiers",
        "children": [{"type": "field", "definition": "/properties/federal_entity_identifier"}],
    },
    {
        "type": "section",
        "name": "federal_award",
        "label": "5b. Federal Award",
        "children": [{"type": "field", "definition": "/properties/federal_award_identifier"}],
    },
    {
        "type": "section",
        "name": "date_received_by_state",
        "label": "6. Date Received by State",
        "children": [{"type": "null", "definition": "/properties/state_receive_date"}],
    },
    {
        "type": "section",
        "name": "state_application_identifier",
        "label": "7. State Application Identifier",
        "children": [{"type": "null", "definition": "/properties/state_application_id"}],
    },
    {
        "type": "section",
        "name": "applicant_information",
        "label": "8. Applicant Information",
        "children": [
            {"type": "field", "definition": "/properties/organization_name"},
            {"type": "field", "definition": "/properties/employer_taxpayer_identification_number"},
            {"type": "field", "definition": "/properties/sam_uei"},
            {"type": "field", "definition": "/properties/applicant/properties/street1"},
            {"type": "field", "definition": "/properties/applicant/properties/street2"},
            {"type": "field", "definition": "/properties/applicant/properties/city"},
            {"type": "field", "definition": "/properties/applicant/properties/state"},
            {"type": "field", "definition": "/properties/applicant/properties/province"},
            {"type": "field", "definition": "/properties/applicant/properties/country"},
            {"type": "field", "definition": "/properties/applicant/properties/zip_code"},
            {"type": "field", "definition": "/properties/contact_person/properties/prefix"},
            {"type": "field", "definition": "/properties/contact_person/properties/first_name"},
            {"type": "field", "definition": "/properties/contact_person/properties/middle_name"},
            {"type": "field", "definition": "/properties/contact_person/properties/last_name"},
            {"type": "field", "definition": "/properties/contact_person/properties/suffix"},
            {"type": "field", "definition": "/properties/contact_person_title"},
            {"type": "field", "definition": "/properties/organization_affiliation"},
            {"type": "field", "definition": "/properties/phone_number"},
            {"type": "field", "definition": "/properties/fax"},
            {"type": "field", "definition": "/properties/email"},
        ],
    },
    {
        "type": "section",
        "name": "type_of_applicant",
        "label": "9. Type of Applicant",
        "children": [
            {"type": "field", "definition": "/properties/applicant_type_code"},
            {"type": "field", "definition": "/properties/applicant_type_other_specify"},
        ],
    },
    {
        "type": "section",
        "name": "federal_agency",
        "label": "10. Name of Federal Agency",
        "children": [{"type": "field", "definition": "/properties/agency_name"}],
    },
    {
        "type": "section",
        "name": "assistance_listing",
        "label": "11. Assistance Listing Number/Title",
        "children": [
            {"type": "field", "definition": "/properties/assistance_listing_number"},
            {"type": "field", "definition": "/properties/assistance_listing_program_title"},
        ],
    },
    {
        "type": "section",
        "name": "funding_opportunity",
        "label": "12. Funding Opportunity Number/Title",
        "children": [
            {"type": "field", "definition": "/properties/funding_opportunity_number"},
            {"type": "field", "definition": "/properties/funding_opportunity_title"},
        ],
    },
    {
        "type": "section",
        "name": "competition_identification",
        "label": "13. Competition Identification Number/Title",
        "children": [
            {"type": "field", "definition": "/properties/competition_identification_number"},
            {"type": "field", "definition": "/properties/competition_identification_title"},
        ],
    },
    {
        "type": "section",
        "name": "areas_affected",
        "label": "14. Areas Affected by Project",
        "children": [
            {"type": "field", "definition": "/properties/areas_affected", "widget": "Attachment"}
        ],
    },
    {
        "type": "section",
        "name": "project_title",
        "label": "15. Descriptive Title of Applicant's Project",
        "children": [
            {"type": "field", "definition": "/properties/project_title"},
            {
                "type": "field",
                "definition": "/properties/additional_project_title",
                "widget": "AttachmentArray",
            },
        ],
    },
    {
        "type": "section",
        "name": "congressional_districts",
        "label": "16. Congressional Districts",
        "children": [
            {"type": "field", "definition": "/properties/congressional_district_applicant"},
            {"type": "field", "definition": "/properties/congressional_district_program_project"},
            {
                "type": "field",
                "definition": "/properties/additional_congressional_districts",
                "widget": "Attachment",
            },
        ],
    },
    {
        "type": "section",
        "name": "project_dates",
        "label": "17. Proposed Project Start and End Dates",
        "children": [
            {"type": "field", "definition": "/properties/project_start_date"},
            {"type": "field", "definition": "/properties/project_end_date"},
        ],
    },
    {
        "type": "section",
        "name": "estimated_funding",
        "label": "18. Estimated Funding",
        "children": [
            {"type": "field", "definition": "/properties/federal_estimated_funding"},
            {"type": "field", "definition": "/properties/applicant_estimated_funding"},
            {"type": "field", "definition": "/properties/state_estimated_funding"},
            {"type": "field", "definition": "/properties/local_estimated_funding"},
            {"type": "field", "definition": "/properties/other_estimated_funding"},
            {"type": "field", "definition": "/properties/program_income_estimated_funding"},
            {"type": "field", "definition": "/properties/total_estimated_funding"},
        ],
    },
    {
        "type": "section",
        "name": "state_review",
        "label": "19. Is Application Subject to Review by State Under Executive Order?",
        "children": [
            {"type": "field", "definition": "/properties/state_review"},
            {"type": "field", "definition": "/properties/state_review_available_date"},
        ],
    },
    {
        "type": "section",
        "name": "federal_debt",
        "label": "20. Is the Applicant Delinquent on any Federal Debt?",
        "children": [
            {
                "type": "field",
                "definition": "/properties/delinquent_federal_debt",
                "widget": "Radio",
            },
            {"type": "field", "definition": "/properties/debt_explanation", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "name": "authorized_representative",
        "label": "21. Authorized Representative",
        "children": [
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/prefix",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/first_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/middle_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/last_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/suffix",
            },
            {"type": "field", "definition": "/properties/authorized_representative_title"},
            {"type": "field", "definition": "/properties/authorized_representative_phone_number"},
            {"type": "field", "definition": "/properties/authorized_representative_fax"},
            {"type": "field", "definition": "/properties/authorized_representative_email"},
            {"type": "null", "definition": "/properties/aor_signature"},
            {"type": "null", "definition": "/properties/date_signed"},
        ],
    },
]

FORM_RULE_SCHEMA = {
    ##### PRE-POPULATION RULES
    "sam_uei": {"gg_pre_population": {"rule": "uei"}},
    "agency_name": {"gg_pre_population": {"rule": "agency_name"}},
    "assistance_listing_number": {"gg_pre_population": {"rule": "assistance_listing_number"}},
    "assistance_listing_program_title": {
        "gg_pre_population": {"rule": "assistance_listing_program_title"}
    },
    "funding_opportunity_number": {"gg_pre_population": {"rule": "opportunity_number"}},
    "funding_opportunity_title": {"gg_pre_population": {"rule": "opportunity_title"}},
    "competition_identification_number": {"gg_pre_population": {"rule": "public_competition_id"}},
    "competition_identification_title": {"gg_pre_population": {"rule": "competition_title"}},
    ##### POST-POPULATION RULES
    "date_received": {"gg_post_population": {"rule": "current_date"}},
    "date_signed": {"gg_post_population": {"rule": "current_date"}},
    "aor_signature": {"gg_post_population": {"rule": "signature"}},
    ##### VALIDATION RULES
    "areas_affected": {"gg_validation": {"rule": "attachment"}},
    "additional_project_title": {"gg_validation": {"rule": "attachment"}},
    "additional_congressional_districts": {"gg_validation": {"rule": "attachment"}},
    "debt_explanation": {"gg_validation": {"rule": "attachment"}},
}


# XML Transformation Rules for SF-424 4.0
FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for converting Simpler SF-424 JSON to Grants.gov XML format",
        "version": "1.0",
        "form_name": "SF424_4_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SF424_4_0-V4.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "att": "https://apply07.grants.gov/apply/system/schemas/Attachments-V1.0.xsd",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "xml_structure": {"root_element": "SF424_4_0", "version": "4.0"},
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
            "include_null": "Include empty XML element: <Field></Field>",
            "default_value": "Use configured default value when field is None",
        },
    },
    # Core application information - direct field mappings
    "submission_type": {"xml_transform": {"target": "SubmissionType"}},
    "application_type": {"xml_transform": {"target": "ApplicationType"}},
    "date_received": {
        "xml_transform": {
            "target": "DateReceived",
            "null_handling": "include_null",
        }
    },
    # Applicant information - direct field mappings
    "organization_name": {"xml_transform": {"target": "OrganizationName"}},
    "employer_taxpayer_identification_number": {
        "xml_transform": {"target": "EmployerTaxpayerIdentificationNumber"}
    },
    "sam_uei": {"xml_transform": {"target": "SAMUEI"}},
    # Address information - nested structure with GlobalLibrary namespace
    "applicant_address": {
        "xml_transform": {"target": "Applicant", "type": "nested_object"},
        "street1": {"xml_transform": {"target": "Street1", "namespace": "globLib"}},
        "street2": {"xml_transform": {"target": "Street2", "namespace": "globLib"}},
        "city": {"xml_transform": {"target": "City", "namespace": "globLib"}},
        "county": {"xml_transform": {"target": "County", "namespace": "globLib"}},
        "state": {"xml_transform": {"target": "State", "namespace": "globLib"}},
        "province": {"xml_transform": {"target": "Province", "namespace": "globLib"}},
        "country": {"xml_transform": {"target": "Country", "namespace": "globLib"}},
        "zip_code": {"xml_transform": {"target": "ZipPostalCode", "namespace": "globLib"}},
    },
    # Contact information - direct field mappings
    "phone_number": {"xml_transform": {"target": "PhoneNumber"}},
    "fax_number": {"xml_transform": {"target": "Fax"}},
    "email": {"xml_transform": {"target": "Email"}},
    # Opportunity information - direct field mappings
    "agency_name": {"xml_transform": {"target": "AgencyName"}},
    "assistance_listing_number": {"xml_transform": {"target": "CFDANumber"}},
    "assistance_listing_program_title": {"xml_transform": {"target": "CFDAProgramTitle"}},
    "funding_opportunity_number": {"xml_transform": {"target": "FundingOpportunityNumber"}},
    "funding_opportunity_title": {"xml_transform": {"target": "FundingOpportunityTitle"}},
    # Project information - direct field mappings
    "project_title": {"xml_transform": {"target": "ProjectTitle"}},
    "congressional_district_applicant": {
        "xml_transform": {"target": "CongressionalDistrictApplicant"}
    },
    "congressional_district_program_project": {
        "xml_transform": {"target": "CongressionalDistrictProgramProject"}
    },
    "project_start_date": {"xml_transform": {"target": "ProjectStartDate"}},
    "project_end_date": {"xml_transform": {"target": "ProjectEndDate"}},
    # Funding information - with currency formatting
    "federal_estimated_funding": {
        "xml_transform": {
            "target": "FederalEstimatedFunding",
            "value_transform": {"type": "currency_format"},
        }
    },
    "applicant_estimated_funding": {
        "xml_transform": {
            "target": "ApplicantEstimatedFunding",
            "value_transform": {"type": "currency_format"},
        }
    },
    "state_estimated_funding": {
        "xml_transform": {
            "target": "StateEstimatedFunding",
            "value_transform": {"type": "currency_format"},
        }
    },
    "local_estimated_funding": {
        "xml_transform": {
            "target": "LocalEstimatedFunding",
            "value_transform": {"type": "currency_format"},
        }
    },
    "other_estimated_funding": {
        "xml_transform": {
            "target": "OtherEstimatedFunding",
            "value_transform": {"type": "currency_format"},
        }
    },
    "program_income_estimated_funding": {
        "xml_transform": {
            "target": "ProgramIncomeEstimatedFunding",
            "value_transform": {"type": "currency_format"},
        }
    },
    "total_estimated_funding": {
        "xml_transform": {
            "target": "TotalEstimatedFunding",
            "value_transform": {"type": "currency_format"},
        }
    },
    # Review and certification - with value transformations
    "state_review": {
        "xml_transform": {
            "target": "StateReview",
            "null_handling": "default_value",
            "default_value": NO_VALUE,  # Use constant from value_transformers
        }
    },
    "state_review_available_date": {"xml_transform": {"target": "StateReviewAvailableDate"}},
    "delinquent_federal_debt": {
        "xml_transform": {
            "target": "DelinquentFederalDebt",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "certification_agree": {
        "xml_transform": {
            "target": "CertificationAgree",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    # Authorized representative - nested structure with GlobalLibrary namespace for names
    "authorized_representative": {
        "xml_transform": {"target": "AuthorizedRepresentative", "type": "nested_object"},
        "first_name": {
            "xml_transform": {
                "target": "FirstName",
                "namespace": "globLib",
                "null_handling": "default_value",
                "default_value": "John",
            }
        },
        "last_name": {
            "xml_transform": {
                "target": "LastName",
                "namespace": "globLib",
                "null_handling": "default_value",
                "default_value": "Doe",
            }
        },
    },
    "authorized_representative_title": {
        "xml_transform": {"target": "AuthorizedRepresentativeTitle"}
    },
    "authorized_representative_phone_number": {
        "xml_transform": {"target": "AuthorizedRepresentativePhoneNumber"}
    },
    "authorized_representative_email": {
        "xml_transform": {"target": "AuthorizedRepresentativeEmail"}
    },
    "aor_signature": {"xml_transform": {"target": "AORSignature"}},
    "date_signed": {"xml_transform": {"target": "DateSigned"}},
    # One-to-many mapping example - applicant type codes
    "applicant_type_code_mapping": {
        "xml_transform": {
            "target": "ApplicantTypeCode",  # Not used for one-to-many
            "type": "conditional",
            "conditional_transform": {
                "type": "one_to_many",
                "source_field": "applicant_type_code",
                "target_pattern": "ApplicantTypeCode{index}",
                "max_count": 3,  # SF-424 supports up to 3 applicant type codes
            },
        }
    },
}


SF424_v4_0 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/713
    form_id=uuid.UUID("1623b310-85be-496a-b84b-34bdee22a68a"),
    legacy_form_id=713,
    form_name="Application for Federal Assistance (SF-424)",
    short_form_name="SF424_4_0",
    form_version="4.0",
    agency_code="SGG",
    omb_number="4040-0004",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("bf48a93f-d445-426f-a8fb-289bf93a2434"),
    form_type=FormType.SF424,
    sgg_version="1.0",
    is_deprecated=False,
)
