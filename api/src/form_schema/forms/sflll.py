import uuid

from src.db.models.competition_models import Form
from src.form_schema.forms import shared_schema

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "federal_action_type",
        "federal_action_status",
        "report_type",
        "reporting_entity",
        "federal_agency_department",
        "lobbying_registrant",
        "individual_performing_service",
        "signature_block",
    ],
    # Conditionally required
    "allOf": [
        # If report_type is MaterialChange, the 3 material change fields become required
        {
            "if": {
                "properties": {"report_type": {"const": "MaterialChange"}},
                "required": ["report_type"],  # Only run rule if report_type is set
            },
            "then": {
                "required": ["material_change_year", "material_change_quarter", "last_report_date"]
            },
        },
    ],
    "properties": {
        "federal_action_type": {
            "type": "string",
            "title": "Type of Federal Action",
            "description": "Identify the type of covered Federal action for which lobbying activity is and/or has been secured to influence the outcome of a covered Federal action.",
            "enum": ["Contract", "Grant", "CoopAgree", "Loan", "LoanGuarantee", "LoanInsurance"],
        },
        "federal_action_status": {
            "type": "string",
            "title": "Status of Federal Action",
            "description": "Identify the status of the covered Federal action.",
            "enum": ["BidOffer", "InitialAward", "PostAward"],
        },
        "report_type": {
            "type": "string",
            "title": "Report Type",
            "description": "Identify the appropriate classification of this report.  If this is a follow up report caused by a material change to the information previously reported, enter the year and quarter in which the change occurred.  Enter the date of the previously submitted report by this reporting entity for this covered Federal action.",
            "enum": ["MaterialChange", "InitialFiling"],
        },
        "material_change_year": {
            "type": "string",
            "title": "Material Change Year",
            "description": "If this is a follow up report caused by a material change to the information previously reported, enter the year in which the change occurred.",
            # Allow all years 1000-9999
            "pattern": r"^[1-9][0-9]{3}$",
        },
        "material_change_quarter": {
            "type": "integer",
            "title": "Material Change Quarter",
            "description": "If this is a follow up report caused by a material change to the information previously reported, enter the quarter in which the change occurred.",
            "minimum": 1,
            "maximum": 4,
        },
        "last_report_date": {
            "type": "string",
            "title": "Material Change Date of Last Report",
            "description": "Enter the date of the previously submitted report by this reporting entity for this covered Federal action.",
            "format": "date",
        },
        "reporting_entity": {
            "type": "object",
            "required": ["entity_type", "applicant_reporting_entity"],
            # Conditionally required
            "allOf": [
                # If entity_type is SubAwardee, then tier and prime_reporting_entity become required
                {
                    "if": {
                        "properties": {"entity_type": {"const": "SubAwardee"}},
                        "required": ["entity_type"],
                    },
                    "then": {"required": ["tier", "prime_reporting_entity"]},
                }
            ],
            "properties": {
                "entity_type": {
                    "title": "Entity Type",
                    "description": "Check the appropriate classification of the reporting entity that designates if it is, or expects to be, a prime subaward recipient.",
                    "type": "string",
                    "enum": ["Prime", "SubAwardee"],
                },
                "tier": {
                    "type": "integer",
                    "title": "Reporting Entity Tier",
                    "description": "Identify the tier of the subawardee, e.g., the first subawardee of the prime is the 1st tier.",
                    "minimum": 1,
                    "maximum": 99,
                },
                "applicant_reporting_entity": {
                    "allOf": [{"$ref": "#/$defs/reporting_entity_awardee"}],
                },
                "prime_reporting_entity": {
                    "allOf": [{"$ref": "#/$defs/reporting_entity_awardee"}],
                },
            },
        },
        "federal_agency_department": {
            "type": "string",
            "title": "Federal Department/Agency",
            "description": "Enter the name of the Federal Department or Agency making the award or loan commitment.",
            "minLength": 1,
            "maxLength": 40,
        },
        "federal_program_name": {
            # Note - this is prepopulated
            "type": "string",
            "title": "Federal Program Name/Description",
            "description": "Federal Program Name/Description: Federal program name or description for the covered Federal action.",
            "minLength": 1,
            "maxLength": 120,
        },
        "assistance_listing_number": {
            # Note - this is prepopulated
            "type": "string",
            "title": "Assistance Listing Number",
            "description": "If known, the full Assistance Listing Number for grants, cooperative agreements, loans and loan commitments.",
            "minLength": 1,
            "maxLength": 120,
        },
        "federal_action_number": {
            "type": "string",
            "title": "Federal Action Number",
            "description": 'Enter the most appropriate Federal identifying number available for the Federal action, identified in item 1 (e.g., Request for Proposal (RFP) number, invitation for Bid (IFB) number, grant announcement number, the contract, grant, or loan award number, the application/proposal control number assigned by the Federal agency). Include prefixes, e.g., "RFP-DE-90-001".',
            "minLength": 1,
            "maxLength": 120,
        },
        "award_amount": {
            "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
            "title": "Award Amount",
            "description": "For a covered Federal action where there has been an award or loan commitment by the Federal agency, enter the Federal amount of the award/loan commitment of the prime entity identified in item 4 or 5.",
        },
        "lobbying_registrant": {
            "type": "object",
            # The address is not required in the existing forms
            "required": ["individual"],
            "properties": {
                "individual": {
                    "allOf": [{"$ref": "#/$defs/person_name"}],
                },
                "address": {
                    "allOf": [{"$ref": "#/$defs/simple_address"}],
                },
            },
        },
        "individual_performing_service": {
            "type": "object",
            # address is not required
            "required": ["individual"],
            "properties": {
                "individual": {
                    "allOf": [{"$ref": "#/$defs/person_name"}],
                },
                "address": {
                    "allOf": [{"$ref": "#/$defs/simple_address"}],
                },
            },
        },
        "signature_block": {
            "type": "object",
            "required": ["signature", "name", "signed_date"],
            "properties": {
                "signature": {
                    "type": "string",
                    "title": "Signature",
                    "description": "Completed by Grants.gov upon submission.",
                    "minLength": 1,
                    "maxLength": 144,
                },
                "name": {
                    "allOf": [{"$ref": "#/$defs/person_name"}],
                },
                "title": {
                    "type": "string",
                    "title": "Signature Title",
                    "description": "Enter the title of the Certifying Official.",
                    "minLength": 1,
                    "maxLength": 45,
                },
                "telephone": {
                    "type": "string",
                    "title": "Signature Telephone Number",
                    "description": "Enter the telephone number of the certifying official.",
                    "minLength": 1,
                    "maxLength": 25,
                },
                "signed_date": {
                    "type": "string",
                    "title": "Signature Date",
                    "description": "Completed by Grants.gov upon submission.",
                    "format": "date",
                },
            },
        },
    },
    "$defs": {
        "person_name": {
            # Note this is the same as the person_name from the SF424 but has no title
            "type": "object",
            "required": [
                "first_name",
                "last_name",
            ],
            "properties": {
                "prefix": {
                    "type": "string",
                    "title": "Prefix",
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
            },
        },
        "simple_address": {
            # This address differs from the SF424 as it doesn't contain country, county or province
            "type": "object",
            "title": "Address",
            "description": "Enter an address.",
            "required": [
                "street1",
                "city",
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
                "state": {
                    "allOf": [{"$ref": "#/$defs/state_code"}],
                    "title": "state",
                    "description": "Enter the state.",
                },
                "zip_code": {
                    "type": "string",
                    "title": "Zip / Postal Code",
                    "description": "Enter the nine-digit Postal Code (e.g., ZIP code).",
                    "minLength": 1,
                    "maxLength": 30,
                },
            },
        },
        "reporting_entity_awardee": {
            "type": "object",
            "required": ["organization_name", "address"],
            "properties": {
                "organization_name": {
                    "type": "string",
                    "title": "Organization Name",
                    "minLength": 1,
                    "maxLength": 60,
                },
                "address": {
                    "allOf": [{"$ref": "#/$defs/simple_address"}],
                },
                "congressional_district": {
                    "type": "string",
                    "title": "Congressional District",
                    "description": "Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.",
                    "minLength": 1,
                    "maxLength": 6,
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
            {"type": "field", "definition": "/properties/federal_action_type"},
            {"type": "field", "definition": "/properties/federal_action_status"},
            {"type": "field", "definition": "/properties/report_type"},
            # Material Change
            {"type": "field", "definition": "/properties/material_change_year"},
            {"type": "field", "definition": "/properties/material_change_quarter"},
            {"type": "field", "definition": "/properties/last_report_date"},
            # Reporting Entity
            {"type": "field", "definition": "/properties/reporting_entity/entity_type"},
            {"type": "field", "definition": "/properties/reporting_entity/tier"},
            {
                "type": "field",
                "definition": "/properties/reporting_entity/applicant_reporting_entity/organization_name",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/applicant_reporting_entity/address/street1",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/applicant_reporting_entity/address/street2",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/applicant_reporting_entity/address/city",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/applicant_reporting_entity/address/state",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/applicant_reporting_entity/address/zip_code",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/applicant_reporting_entity/congressional_district",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/prime_reporting_entity/organization_name",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/prime_reporting_entity/address/street1",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/prime_reporting_entity/address/street2",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/prime_reporting_entity/address/city",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/prime_reporting_entity/address/state",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/prime_reporting_entity/address/zip_code",
            },
            {
                "type": "field",
                "definition": "/properties/reporting_entity/prime_reporting_entity/congressional_district",
            },
            # Various fields in middle
            {"type": "field", "definition": "/properties/federal_agency_department"},
            {"type": "field", "definition": "/properties/federal_program_name"},
            {"type": "field", "definition": "/properties/assistance_listing_number"},
            {"type": "field", "definition": "/properties/federal_action_number"},
            {"type": "field", "definition": "/properties/award_amount"},
            # Lobbying Registrant
            {
                "type": "field",
                "definition": "/properties/lobbying_registrant/individual/first_name",
            },
            {
                "type": "field",
                "definition": "/properties/lobbying_registrant/individual/middle_name",
            },
            {"type": "field", "definition": "/properties/lobbying_registrant/individual/last_name"},
            {"type": "field", "definition": "/properties/lobbying_registrant/individual/prefix"},
            {"type": "field", "definition": "/properties/lobbying_registrant/individual/suffix"},
            {"type": "field", "definition": "/properties/lobbying_registrant/address/street1"},
            {"type": "field", "definition": "/properties/lobbying_registrant/address/street2"},
            {"type": "field", "definition": "/properties/lobbying_registrant/address/city"},
            {"type": "field", "definition": "/properties/lobbying_registrant/address/state"},
            {"type": "field", "definition": "/properties/lobbying_registrant/address/zip_code"},
            # Individual performing services
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/individual/first_name",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/individual/middle_name",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/individual/last_name",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/individual/prefix",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/individual/suffix",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/address/street1",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/address/street2",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/address/city",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/address/state",
            },
            {
                "type": "field",
                "definition": "/properties/individual_performing_service/address/zip_code",
            },
            # Signature block
            {"type": "field", "definition": "/properties/signature_block/signature"},
            {"type": "field", "definition": "/properties/signature_block/name/first_name"},
            {"type": "field", "definition": "/properties/signature_block/name/middle_name"},
            {"type": "field", "definition": "/properties/signature_block/name/last_name"},
            {"type": "field", "definition": "/properties/signature_block/name/prefix"},
            {"type": "field", "definition": "/properties/signature_block/name/suffix"},
            {"type": "field", "definition": "/properties/signature_block/signed_date"},
        ],
    }
]

FORM_RULE_SCHEMA = {
    # Pre-populate should have federal program name and assistance listing number
    # Post-populate should have signature, signature date
    ##### PRE-POPULATION RULES
    # Note - we don't have pre-population enabled yet, so these
    # won't run yet.
    # TODO - before we can enable prepopulation we need the following rules:
    #   * assistance listing number
    #   * assistance listing program title
    "federal_program_name": {"gg_pre_population": {"rule": "assistance_listing_program_title"}},
    "assistance_listing_number": {"gg_pre_population": {"rule": "assistance_listing_number"}},
    ##### POST-POPULATION RULES
    "signature_block": {
        "signed_date": {"gg_post_population": {"rule": "current_date"}},
        "signature": {"gg_post_population": {"rule": "signature"}},
    },
}

SFLLL_v2_0 = Form(
    # legacy form ID - 670
    # https://grants.gov/forms/form-items-description/fid/670
    form_id=uuid.UUID("778a1485-082a-463e-a61b-6615ccebe027"),
    form_name="Disclosure of Lobbying Activities (SF-LLL)",
    form_version="2.0",
    agency_code="SGG",
    omb_number="4040-0013",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    # No rule schema yet, we'll likely but automated sums in this
    form_rule_schema=FORM_RULE_SCHEMA,
    # No form instructions at the moment.
)
