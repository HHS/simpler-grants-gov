import uuid

import src.form_schema.forms.shared_schema as shared_schema
from src.db.models.competition_models import Form

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "submission_type",
        "application_type",
        "date_received",
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
        "authorized_representative_phone_number",
        "authorized_representative_email",
        "aor_signature",
        "date_signed",
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
            "title": "Date Received Header",
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
            # From the instructions: "Enter the entity identifier assigned by the Federal agency, if any, or the applicant’s control number if applicable."
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
            "title": "Date Received by state",
            "description": "Enter the date received by the state, if applicable.",
            "format": "date",
            "readOnly": True,
        },
        "state_application_id": {
            # A user will never fill this in, it's just on the form for agencies to use
            "type": "string",
            "title": "state Application Identifier",
            "description": "Enter the identifier assigned by the state, if applicable.",
            "minLength": 0,
            "maxLength": 30,
            "readOnly": True,
        },
        "organization_name": {
            "type": "string",
            "title": "Organization Name",
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
            "title": "applicant",
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
            "title": "fax Number",
            "description": "Enter the fax Number.",
        },
        "email": {
            "type": "string",
            "title": "email",
            "description": "Enter a valid email Address.",
            "format": "email",
        },
        "applicant_type_code": {
            # NOTE: In the xml model, this is 3 separate fields, we joined them together
            # into a single value.
            "type": "array",
            "title": "Type of applicant",
            "description": "Select the appropriate applicant types.",
            "minItems": 1,
            "maxItems": 3,
            "items": {
                "type": "string",
                "enum": [
                    "A: state Government",
                    "B: county Government",
                    "C: city or Township Government",
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
            "title": "Type of applicant Other Explanation",
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
            "title": "Assistance Listing title",
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
            "title": "Competition title",
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
            "title": "Project title",
            "description": "Enter a brief, descriptive title of the project.",
            "minLength": 1,
            "maxLength": 200,
        },
        "additional_project_title": {
            "type": "array",
            "title": "Additional Project title",
            "description": "Attach file(s) using the appropriate buttons.",
            "maxItems": 100,
            "items": {"allOf": [{"$ref": "#/$defs/attachment_field"}]},
        },
        "congressional_district_applicant": {
            "type": "string",
            "title": "applicant District",
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
            "title": "applicant Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "state_estimated_funding": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "state Estimated Funding",
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
            "description": "Total dollar amount. This is a calculated field.",
        },
        "state_review": {
            "type": "string",
            "title": "Application Subject to Review",
            "description": "One selection is required.",
            "enum": [
                "a. This application was made available to the state under the Executive Order 12372 Process for review on",
                "b. Program is subject to E.O. 12372 but has not been selected by the state for review.",
                "c. Program is not covered by E.O. 12372.",
            ],
        },
        "state_review_available_date": {
            "type": "string",
            "title": "state Review Date",
            "description": "Enter the date in the format MM/DD/YYYY.",
            "format": "date",
        },
        "delinquent_federal_debt": {
            "type": "boolean",
            "title": "applicant Delinquent on Federal Debt",
            "description": "A selection is required.",
        },
        "debt_explanation": {
            "allOf": [{"$ref": "#/$defs/attachment_field"}],
            "title": "Debt Explanation",
            "description": "Debt Explanation is required.",
        },
        "certification_agree": {
            "type": "boolean",
            "title": "Certification Agree",
            "description": "Check to select.",
        },
        "authorized_representative": {
            "allOf": [{"$ref": "#/$defs/person_name"}],
            "title": "Authorized Representative Header",
            "description": "",
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
                    "title": "street1",
                    "description": "Enter the first line of the Street Address.",
                    "minLength": 1,
                    "maxLength": 55,
                },
                "street2": {
                    "type": "string",
                    "title": "street2",
                    "description": "Enter the second line of the Street Address.",
                    "minLength": 1,
                    "maxLength": 55,
                },
                "city": {
                    "type": "string",
                    "title": "city",
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
                    "title": "state",
                    "description": "Enter the state.",
                },
                "province": {
                    "type": "string",
                    "title": "province",
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
                },
            },
        },
        "person_name": {
            "type": "object",
            "title": "Name and Contact Information Header",
            "description": "",
            "required": [
                "first_name",
                "last_name",
            ],
            "properties": {
                "prefix": {
                    "type": "string",
                    "title": "prefix",
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
                    "title": "suffix",
                    "description": "Select the suffix from the provided list or enter a new suffix not provided on the list.",
                    "minLength": 1,
                    "maxLength": 10,
                },
                "title": {
                    # This isn't in this part of the model of the SF424, but is in the global lib
                    "type": "string",
                    "title": "title",
                    "description": "Enter the position title.",
                    "minLength": 1,
                    "maxLength": 45,
                },
            },
        },
        "budget_monetary_amount": {
            # Represents a monetary amount. We use a string instead of number
            # to avoid any floating point rounding issues.
            "type": "string",
            # Pattern here effectively says:
            # * Any number of digits
            # * An optional decimal point
            # * Then exactly 2 digits - if there was a decimal
            "pattern": r"^\d*([.]\d{2})?$",
            # Limit the max amount based on the length (11-digits, allows up to 99 billion)
            "maxLength": 14,
        },
        "phone_number_field": {
            "type": "string",
            "minLength": 1,
            "maxLength": 25,
        },
        "attachment_field": {"type": "string", "format": "uuid"},
        "state_code": {
            "type": "string",
            "title": "state",
            "description": "US state or Territory Code",
            "enum": shared_schema.STATES,
        },
        "country_code": {
            "type": "string",
            "title": "country",
            "description": "country Code",
            "enum": shared_schema.COUNTRIES,
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "1. Everything",
        "name": "Everything",
        "children": [
            {"type": "field", "definition": "/properties/submission_type"},
            {"type": "field", "definition": "/properties/application_type"},
            {"type": "field", "definition": "/properties/revision_type"},
            {"type": "field", "definition": "/properties/revision_other_specify"},
            {"type": "field", "definition": "/properties/date_received"},
            {"type": "field", "definition": "/properties/applicant_id"},
            {"type": "field", "definition": "/properties/federal_entity_identifier"},
            {"type": "field", "definition": "/properties/federal_award_identifier"},
            {"type": "field", "definition": "/properties/state_receive_date"},
            {"type": "field", "definition": "/properties/state_application_id"},
            {"type": "field", "definition": "/properties/organization_name"},
            {"type": "field", "definition": "/properties/employer_taxpayer_identification_number"},
            {"type": "field", "definition": "/properties/sam_uei"},
            # TODO - any nested field causes frontend errors, probably needs to be defined differently
            # {"type": "field", "definition": "/properties/applicant/street1"},
            # {"type": "field", "definition": "/properties/applicant/street2"},
            # {"type": "field", "definition": "/properties/applicant/city"},
            # {"type": "field", "definition": "/properties/applicant/county"},
            # {"type": "field", "definition": "/properties/applicant/state"},
            # {"type": "field", "definition": "/properties/applicant/province"},
            # {"type": "field", "definition": "/properties/applicant/country"},
            # {"type": "field", "definition": "/properties/applicant/zip_code"},
            {"type": "field", "definition": "/properties/department_name"},
            {"type": "field", "definition": "/properties/division_name"},
            # {"type": "field", "definition": "/properties/contact_person/prefix"},
            # {"type": "field", "definition": "/properties/contact_person/first_name"},
            # {"type": "field", "definition": "/properties/contact_person/middle_name"},
            # {"type": "field", "definition": "/properties/contact_person/last_name"},
            # {"type": "field", "definition": "/properties/contact_person/suffix"},
            # {"type": "field", "definition": "/properties/contact_person/title"},
            {"type": "field", "definition": "/properties/organization_affiliation"},
            {"type": "field", "definition": "/properties/phone_number"},
            {"type": "field", "definition": "/properties/fax"},
            {"type": "field", "definition": "/properties/email"},
            {"type": "field", "definition": "/properties/applicant_type_code"},
            {"type": "field", "definition": "/properties/applicant_type_other_specify"},
            {"type": "field", "definition": "/properties/agency_name"},
            {"type": "field", "definition": "/properties/assistance_listing_number"},
            {"type": "field", "definition": "/properties/assistance_listing_program_title"},
            {"type": "field", "definition": "/properties/funding_opportunity_number"},
            {"type": "field", "definition": "/properties/funding_opportunity_title"},
            {"type": "field", "definition": "/properties/competition_identification_number"},
            {"type": "field", "definition": "/properties/competition_identification_title"},
            {"type": "field", "definition": "/properties/areas_affected"},
            {"type": "field", "definition": "/properties/project_title"},
            {"type": "field", "definition": "/properties/additional_project_title"},
            {"type": "field", "definition": "/properties/congressional_district_applicant"},
            {"type": "field", "definition": "/properties/congressional_district_program_project"},
            {"type": "field", "definition": "/properties/additional_congressional_districts"},
            {"type": "field", "definition": "/properties/project_start_date"},
            {"type": "field", "definition": "/properties/project_end_date"},
            {"type": "field", "definition": "/properties/federal_estimated_funding"},
            {"type": "field", "definition": "/properties/applicant_estimated_funding"},
            {"type": "field", "definition": "/properties/state_estimated_funding"},
            {"type": "field", "definition": "/properties/local_estimated_funding"},
            {"type": "field", "definition": "/properties/other_estimated_funding"},
            {"type": "field", "definition": "/properties/program_income_estimated_funding"},
            {"type": "field", "definition": "/properties/total_estimated_funding"},
            {"type": "field", "definition": "/properties/state_review"},
            {"type": "field", "definition": "/properties/state_review_available_date"},
            {"type": "field", "definition": "/properties/delinquent_federal_debt"},
            {"type": "field", "definition": "/properties/debt_explanation"},
            {"type": "field", "definition": "/properties/certification_agree"},
            # {"type": "field", "definition": "/properties/authorized_representative/prefix"},
            # {"type": "field", "definition": "/properties/authorized_representative/first_name"},
            # {"type": "field", "definition": "/properties/authorized_representative/middle_name"},
            # {"type": "field", "definition": "/properties/authorized_representative/last_name"},
            # {"type": "field", "definition": "/properties/authorized_representative/suffix"},
            # {"type": "field", "definition": "/properties/authorized_representative/title"},
            {"type": "field", "definition": "/properties/authorized_representative_phone_number"},
            {"type": "field", "definition": "/properties/authorized_representative_fax"},
            {"type": "field", "definition": "/properties/authorized_representative_email"},
            {"type": "field", "definition": "/properties/aor_signature"},
            {"type": "field", "definition": "/properties/date_signed"},
        ],
    }
]

FORM_RULE_SCHEMA = {
    ##### PRE-POPULATION RULES
    # Note - we don't have pre-population enabled yet, so these
    # won't run yet.
    # TODO - before we can enable prepopulation we need the following rules:
    #   * uei
    #   * assistance listing number
    #   * assistance listing program title
    #   * public competition ID
    #   * competition title
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


SF424_v4_0 = Form(
    # legacy form ID - 713
    # https://www.grants.gov/forms/form-items-description/fid/713
    form_id=uuid.UUID("1623b310-85be-496a-b84b-34bdee22a68a"),
    form_name="Application for Federal Assistance (SF-424)",
    form_version="4.0",
    agency_code="SGG",  # TODO - Do we want to add Simpler Grants.gov as an "Agency"?
    omb_number="4040-0004",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    # No form instructions at the moment.
)
