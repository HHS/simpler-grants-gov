import uuid

import src.form_schema.forms.shared_schema as shared_schema
from src.db.models.competition_models import Form

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "SubmissionType",
        "ApplicationType",
        "DateReceived",
        "OrganizationName",
        "EmployerTaxpayerIdentificationNumber",
        "SAMUEI",
        "Applicant",
        "ContactPerson",
        "PhoneNumber",
        "Email",
        "ApplicantTypeCode",
        "AgencyName",
        "FundingOpportunityNumber",
        "FundingOpportunityTitle",
        "ProjectTitle",
        "CongressionalDistrictApplicant",
        "CongressionalDistrictProgramProject",
        "ProjectStartDate",
        "ProjectEndDate",
        "FederalEstimatedFunding",
        "ApplicantEstimatedFunding",
        "StateEstimatedFunding",
        "LocalEstimatedFunding",
        "OtherEstimatedFunding",
        "ProgramIncomeEstimatedFunding",
        "TotalEstimatedFunding",
        "StateReview",
        "DelinquentFederalDebt",
        "CertificationAgree",
        "AuthorizedRepresentative",
        "AuthorizedRepresentativePhoneNumber",
        "AuthorizedRepresentativeEmail",
        "AORSignature",
        "DateSigned",
    ],
    # Conditional validation rules for SF424
    "allOf": [
        # If ApplicationType is Revision, RevisionType + FederalAwardIdentifier are required
        {
            "if": {
                "properties": {"ApplicationType": {"const": "Revision"}},
                "required": ["ApplicationType"],  # Only run rule if ApplicationType is set
            },
            "then": {"required": ["RevisionType", "FederalAwardIdentifier"]},
        },
        # If ApplicationType is Continuation, FederalAwardIdentifier is required
        {
            "if": {
                "properties": {"ApplicationType": {"const": "Continuation"}},
                "required": ["ApplicationType"],  # Only run rule if ApplicationType is set
            },
            "then": {"required": ["FederalAwardIdentifier"]},
        },
        # If RevisionType is E, RevisionOtherSpecify becomes required
        {
            "if": {
                "properties": {"RevisionType": {"const": "E: Other (specify)"}},
                "required": ["RevisionType"],  # Only run rule if RevisionType is set
            },
            "then": {"required": ["RevisionOtherSpecify"]},
        },
        # If DelinquentFederalDebt is True, DebtExplanation is required
        {
            "if": {
                "properties": {"DelinquentFederalDebt": {"const": True}},
                "required": [
                    "DelinquentFederalDebt"
                ],  # Only run rule if DelinquentFederalDebt is set
            },
            "then": {"required": ["DebtExplanation"]},
        },
        # If StateReview is option A, StateReviewAvailableDate is required
        {
            "if": {
                "properties": {
                    "StateReview": {
                        "const": "a. This application was made available to the State under the Executive Order 12372 Process for review on"
                    },
                },
                "required": ["StateReview"],  # Only run rule if StateReview is set
            },
            "then": {"required": ["StateReviewAvailableDate"]},
        },
        # If one of the ApplicantTypeCode values is X: Other, then ApplicantTypeOtherSpecify is required
        {
            "if": {
                "properties": {"ApplicantTypeCode": {"contains": {"const": "X: Other (specify)"}}},
                "required": ["ApplicantTypeCode"],  # Only run rule if ApplicantTypeCode is set
            },
            "then": {"required": ["ApplicantTypeOtherSpecify"]},
        },
    ],
    "properties": {
        "SubmissionType": {
            "type": "string",
            "title": "Submission Type",
            "description": "Select one type of submission in accordance with agency instructions.",
            "enum": ["Preapplication", "Application", "Changed/Corrected Application"],
        },
        "ApplicationType": {
            "type": "string",
            "title": "Application Type",
            "description": "Select one type of application in accordance with agency instructions.",
            "enum": ["New", "Continuation", "Revision"],
        },
        "RevisionType": {
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
        "RevisionOtherSpecify": {
            "type": "string",
            "title": "Other Explanation",
            "description": "Please specify the type of revision.  This field is required if E. Other is checked.",
        },
        "DateReceived": {
            "type": "string",
            "title": "Date Received Header",
            "description": "Completed by Grants.gov upon submission.",
            "format": "date",
        },
        "ApplicantID": {
            "type": "string",
            "title": "Applicant Identifier",
            "description": "Enter the applicant's control number, if applicable.",
            "minLength": 1,
            "maxLength": 30,
            # Based on ApplicantIDDataType
            # https://apply07.grants.gov/apply/system/schemas/GlobalLibrary-V2.0.xsd
            # From the instructions: "Enter the entity identifier assigned by the Federal agency, if any, or the applicant’s control number if applicable."
        },
        "FederalEntityIdentifier": {
            "type": "string",
            "title": "Federal Entity Identifier",
            "minLength": 1,
            "maxLength": 30,
            "description": "Enter the number assigned to your organization by the Federal agency.",
            # Based on FederalIDDataType
            # https://apply07.grants.gov/apply/system/schemas/GlobalLibrary-V2.0.xsd
            # From the instructions: "Enter the number assigned to your organization by the federal agency"
        },
        "FederalAwardIdentifier": {
            "type": "string",
            "title": "Federal Award Identifier",
            "description": "For new applications leave blank. For a continuation or revision to an existing award, enter the previously assigned Federal award identifier number. If a changed/corrected application, enter the Federal Identifier in accordance with agency instructions.",
            "minLength": 1,
            "maxLength": 25,
        },
        "StateReceiveDate": {
            # A user will never fill this in, it's just on the form for agencies to use
            "type": "string",
            "title": "Date Received by State",
            "description": "Enter the date received by the State, if applicable.",
            "format": "date",
            "readOnly": True,
        },
        "StateApplicationID": {
            # A user will never fill this in, it's just on the form for agencies to use
            "type": "string",
            "title": "State Application Identifier",
            "description": "Enter the identifier assigned by the State, if applicable.",
            "minLength": 0,
            "maxLength": 30,
            "readOnly": True,
        },
        "OrganizationName": {
            "type": "string",
            "title": "Organization Name",
            "description": "Enter the legal name of the applicant that will undertake the assistance activity.",
            "minLength": 1,
            "maxLength": 60,
        },
        "EmployerTaxpayerIdentificationNumber": {
            "type": "string",
            "title": "EIN/TIN",
            "description": "Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444.",
            "minLength": 9,
            "maxLength": 30,
        },
        "SAMUEI": {
            "type": "string",
            "title": "SAM UEI",
            "description": "UEI of the applicant organization. This field is pre-populated from the Application cover sheet.",
            "minLength": 12,
            "maxLength": 12,
        },
        "Applicant": {
            "allOf": [{"$ref": "#/$defs/Address"}],
            "title": "Applicant",
            "description": "Enter information about the applicant.",
        },
        "DepartmentName": {
            "type": "string",
            "title": "Department Name",
            "description": "Enter the name of primary organizational department, service, laboratory, or equivalent level within the organization which will undertake the assistance activity.",
            "minLength": 1,
            "maxLength": 30,
        },
        "DivisionName": {
            "type": "string",
            "title": "Division Name",
            "description": "Enter the name of primary organizational division, office, or major subdivision which will undertake the assistance activity.",
            "minLength": 1,
            "maxLength": 100,
        },
        "ContactPerson": {
            "allOf": [{"$ref": "#/$defs/PersonName"}],
            "title": "Contact Person",
            "description": "Enter information about the contact person.",
        },
        "OrganizationAffiliation": {
            "type": "string",
            "title": "Organizational Affiliation",
            "description": "Enter the organization if different from the applicant organization.",
            "minLength": 1,
            "maxLength": 60,
        },
        "PhoneNumber": {
            "allOf": [{"$ref": "#/$defs/PhoneNumber"}],
            "title": "Telephone Number",
            "description": "Enter the daytime Telephone Number.",
        },
        "Fax": {
            "allOf": [{"$ref": "#/$defs/PhoneNumber"}],
            "title": "Fax Number",
            "description": "Enter the Fax Number.",
        },
        "Email": {
            "type": "string",
            "title": "Email",
            "description": "Enter a valid Email Address.",
            "format": "email",
        },
        "ApplicantTypeCode": {
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
                    "H: Public/State Controlled Institution of Higher Education",
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
        "ApplicantTypeOtherSpecify": {
            "type": "string",
            "title": "Type of Applicant Other Explanation",
            "description": 'Enter the applicant type here if you selected "Other (specify)" for Type of Applicant.',
            "minLength": 0,
            "maxLength": 30,
        },
        "AgencyName": {
            "type": "string",
            "title": "Agency Name",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 60,
        },
        "CFDANumber": {
            "type": "string",
            "title": "Assistance Listing Number",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 15,
        },
        "CFDAProgramTitle": {
            "type": "string",
            "title": "Assistance Listing Title",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 120,
        },
        "FundingOpportunityNumber": {
            "type": "string",
            "title": "Opportunity Number",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 40,
        },
        "FundingOpportunityTitle": {
            "type": "string",
            "title": "Opportunity Title",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 255,
        },
        "CompetitionIdentificationNumber": {
            "type": "string",
            "title": "Competition Number",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 40,
        },
        "CompetitionIdentificationTitle": {
            "type": "string",
            "title": "Competition Title",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 255,
        },
        "AreasAffected": {
            "allOf": [{"$ref": "#/$defs/AttachmentField"}],
            "title": "Areas Affected",
            "description": "List the areas or entities using the categories (e.g., cities, counties, states, etc.) specified in agency instructions.",
        },
        "ProjectTitle": {
            "type": "string",
            "title": "Project Title",
            "description": "Enter a brief, descriptive title of the project.",
            "minLength": 1,
            "maxLength": 200,
        },
        "AdditionalProjectTitle": {
            "type": "array",
            "title": "Additional Project Title",
            "description": "Attach file(s) using the appropriate buttons.",
            "maxItems": 100,
            "items": {"allOf": [{"$ref": "#/$defs/AttachmentField"}]},
        },
        "CongressionalDistrictApplicant": {
            "type": "string",
            "title": "Applicant District",
            "description": "Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.If outside the US, enter 00-000.",
            "minLength": 1,
            "maxLength": 6,
        },
        "CongressionalDistrictProgramProject": {
            "type": "string",
            "title": "Program District",
            "description": "Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.If all districts in a state are affected, enter \"all\" for the district number. Example: MD-all for all congressional districts in Maryland.If nationwide (all districts in all states), enter US-all.If the program/project is outside the US, enter 00-000.",
            "minLength": 1,
            "maxLength": 6,
        },
        "AdditionalCongressionalDistricts": {
            "allOf": [{"$ref": "#/$defs/AttachmentField"}],
            "title": "Additional Congressional Districts",
            "description": "Additional Congressional Districts.",
        },
        "ProjectStartDate": {
            "type": "string",
            "title": "Project Start Date",
            "description": "Enter the date in the format MM/DD/YYYY. ",
            "format": "date",
        },
        "ProjectEndDate": {
            "type": "string",
            "title": "Project End Date",
            "description": "Enter the date in the format MM/DD/YYYY. ",
            "format": "date",
        },
        "FederalEstimatedFunding": {
            "allOf": [{"$ref": "#/$defs/BudgetMonetaryAmount"}],
            "title": "Federal Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "ApplicantEstimatedFunding": {
            "allOf": [{"$ref": "#/$defs/BudgetMonetaryAmount"}],
            "title": "Applicant Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "StateEstimatedFunding": {
            "allOf": [{"$ref": "#/$defs/BudgetMonetaryAmount"}],
            "title": "State Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "LocalEstimatedFunding": {
            "allOf": [{"$ref": "#/$defs/BudgetMonetaryAmount"}],
            "title": "Local Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "OtherEstimatedFunding": {
            "allOf": [{"$ref": "#/$defs/BudgetMonetaryAmount"}],
            "title": "Other Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "ProgramIncomeEstimatedFunding": {
            "allOf": [{"$ref": "#/$defs/BudgetMonetaryAmount"}],
            "title": "Program Income Estimated Funding",
            "description": "Enter the dollar amount.",
        },
        "TotalEstimatedFunding": {
            "allOf": [{"$ref": "#/$defs/BudgetMonetaryAmount"}],
            "title": "Total Estimated Funding",
            "description": "Total dollar amount. This is a calculated field.",
        },
        "StateReview": {
            "type": "string",
            "title": "Application Subject to Review",
            "description": "One selection is required.",
            "enum": [
                "a. This application was made available to the State under the Executive Order 12372 Process for review on",
                "b. Program is subject to E.O. 12372 but has not been selected by the State for review.",
                "c. Program is not covered by E.O. 12372.",
            ],
        },
        "StateReviewAvailableDate": {
            "type": "string",
            "title": "State Review Date",
            "description": "Enter the date in the format MM/DD/YYYY.",
            "format": "date",
        },
        "DelinquentFederalDebt": {
            "type": "boolean",
            "title": "Applicant Delinquent on Federal Debt",
            "description": "A selection is required.",
        },
        "DebtExplanation": {
            "allOf": [{"$ref": "#/$defs/AttachmentField"}],
            "title": "Debt Explanation",
            "description": "Debt Explanation is required.",
        },
        "CertificationAgree": {
            "type": "boolean",
            "title": "Certification Agree",
            "description": "Check to select.",
        },
        "AuthorizedRepresentative": {
            "allOf": [{"$ref": "#/$defs/PersonName"}],
            "title": "Authorized Representative Header",
            "description": "",
        },
        "AuthorizedRepresentativePhoneNumber": {
            "allOf": [{"$ref": "#/$defs/PhoneNumber"}],
            "title": "AOR Telephone Number",
            "description": "Enter the daytime Telephone Number.",
        },
        "AuthorizedRepresentativeFax": {
            "allOf": [{"$ref": "#/$defs/PhoneNumber"}],
            "title": "AOR Fax Number",
            "description": "Enter the Fax Number.",
        },
        "AuthorizedRepresentativeEmail": {
            "type": "string",
            "format": "email",
            "title": "AOR Email",
            "description": "Enter a valid Email Address.",
        },
        "AORSignature": {
            "type": "string",
            "title": "AOR Signature",
            "description": "Completed by Grants.gov upon submission.",
            "minLength": 1,
            "maxLength": 144,
        },
        "DateSigned": {
            "type": "string",
            "format": "date",
            "title": "Date Signed",
            "description": "Completed by Grants.gov upon submission.",
        },
    },
    "$defs": {
        "Address": {
            "type": "object",
            "title": "Address",
            "description": "Enter an address.",
            "required": [
                "Street1",
                "City",
                "Country",
            ],
            # Conditional validation rules for an address field
            "allOf": [
                # If country is United States, State and ZipCode are required
                {
                    "if": {
                        "properties": {"Country": {"const": "USA: UNITED STATES"}},
                        "required": ["Country"],  # Only run rule if Country is set
                    },
                    "then": {"required": ["State", "ZipCode"]},
                },
            ],
            "properties": {
                "Street1": {
                    "type": "string",
                    "title": "Street1",
                    "description": "Enter the first line of the Street Address.",
                    "minLength": 1,
                    "maxLength": 55,
                },
                "Street2": {
                    "type": "string",
                    "title": "Street2",
                    "description": "Enter the second line of the Street Address.",
                    "minLength": 1,
                    "maxLength": 55,
                },
                "City": {
                    "type": "string",
                    "title": "City",
                    "description": "Enter the City.",
                    "minLength": 1,
                    "maxLength": 35,
                },
                "County": {
                    "type": "string",
                    "title": "County/Parish",
                    "description": "Enter the County/Parish.",
                    "minLength": 1,
                    "maxLength": 30,
                },
                "State": {
                    "allOf": [{"$ref": "#/$defs/StateCode"}],
                    "title": "State",
                    "description": "Enter the State.",
                },
                "Province": {
                    "type": "string",
                    "title": "Province",
                    "description": "Enter the Province.",
                    "minLength": 1,
                    "maxLength": 30,
                    # Note that grants.gov would hide this if the country isn't USA, but it isn't required even then
                },
                "Country": {"$ref": "#/$defs/CountryCode"},
                "ZipCode": {
                    "type": "string",
                    "title": "Zip / Postal Code",
                    "description": "Enter the nine-digit Postal Code (e.g., ZIP code). This field is required if the country is the United States.",
                },
            },
        },
        "PersonName": {
            "type": "object",
            "title": "Name and Contact Information Header",
            "description": "",
            "required": [
                "FirstName",
                "LastName",
            ],
            "properties": {
                "Prefix": {
                    "type": "string",
                    "title": "Prefix",
                    "description": "Select the Prefix from the provided list or enter a new Prefix not provided on the list.",
                    "minLength": 1,
                    "maxLength": 10,
                },
                "FirstName": {
                    "type": "string",
                    "title": "First Name",
                    "description": "Enter the First Name.",
                    "minLength": 1,
                    "maxLength": 35,
                },
                "MiddleName": {
                    "type": "string",
                    "title": "Middle Name",
                    "description": "Enter the Middle Name.",
                    "minLength": 1,
                    "maxLength": 25,
                },
                "LastName": {
                    "type": "string",
                    "title": "Last Name",
                    "description": "Enter the Last Name.",
                    "minLength": 1,
                    "maxLength": 60,
                },
                "Suffix": {
                    "type": "string",
                    "title": "Suffix",
                    "description": "Select the Suffix from the provided list or enter a new Suffix not provided on the list.",
                    "minLength": 1,
                    "maxLength": 10,
                },
                "Title": {
                    # This isn't in this part of the model of the SF424, but is in the global lib
                    "type": "string",
                    "title": "Title",
                    "description": "Enter the position title.",
                    "minLength": 1,
                    "maxLength": 45,
                },
            },
        },
        "BudgetMonetaryAmount": {
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
        "PhoneNumber": {
            "type": "string",
            "minLength": 1,
            "maxLength": 25,
        },
        "AttachmentField": {"type": "string", "format": "uuid"},
        "StateCode": {
            "type": "string",
            "title": "State",
            "description": "US State or Territory Code",
            "enum": shared_schema.STATES,
        },
        "CountryCode": {
            "type": "string",
            "title": "Country",
            "description": "Country Code",
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
            {"type": "field", "definition": "/properties/SubmissionType"},
            {"type": "field", "definition": "/properties/ApplicationType"},
            {"type": "field", "definition": "/properties/RevisionType"},
            {"type": "field", "definition": "/properties/RevisionOtherSpecify"},
            {"type": "field", "definition": "/properties/DateReceived"},
            {"type": "field", "definition": "/properties/ApplicantID"},
            {"type": "field", "definition": "/properties/FederalEntityIdentifier"},
            {"type": "field", "definition": "/properties/FederalAwardIdentifier"},
            {"type": "field", "definition": "/properties/StateReceiveDate"},
            {"type": "field", "definition": "/properties/StateApplicationID"},
            {"type": "field", "definition": "/properties/OrganizationName"},
            {"type": "field", "definition": "/properties/EmployerTaxpayerIdentificationNumber"},
            {"type": "field", "definition": "/properties/SAMUEI"},
            # TODO - any nested field causes frontend errors, probably needs to be defined differently
            # {"type": "field", "definition": "/properties/Applicant/Street1"},
            # {"type": "field", "definition": "/properties/Applicant/Street2"},
            # {"type": "field", "definition": "/properties/Applicant/City"},
            # {"type": "field", "definition": "/properties/Applicant/County"},
            # {"type": "field", "definition": "/properties/Applicant/State"},
            # {"type": "field", "definition": "/properties/Applicant/Province"},
            # {"type": "field", "definition": "/properties/Applicant/Country"},
            # {"type": "field", "definition": "/properties/Applicant/ZipCode"},
            {"type": "field", "definition": "/properties/DepartmentName"},
            {"type": "field", "definition": "/properties/DivisionName"},
            # {"type": "field", "definition": "/properties/ContactPerson/Prefix"},
            # {"type": "field", "definition": "/properties/ContactPerson/FirstName"},
            # {"type": "field", "definition": "/properties/ContactPerson/MiddleName"},
            # {"type": "field", "definition": "/properties/ContactPerson/LastName"},
            # {"type": "field", "definition": "/properties/ContactPerson/Suffix"},
            # {"type": "field", "definition": "/properties/ContactPerson/Title"},
            {"type": "field", "definition": "/properties/PhoneNumber"},
            {"type": "field", "definition": "/properties/Fax"},
            {"type": "field", "definition": "/properties/Email"},
            {"type": "field", "definition": "/properties/ApplicantTypeCode"},
            {"type": "field", "definition": "/properties/ApplicantTypeOtherSpecify"},
            {"type": "field", "definition": "/properties/AgencyName"},
            {"type": "field", "definition": "/properties/CFDANumber"},
            {"type": "field", "definition": "/properties/CFDAProgramTitle"},
            {"type": "field", "definition": "/properties/FundingOpportunityNumber"},
            {"type": "field", "definition": "/properties/FundingOpportunityTitle"},
            {"type": "field", "definition": "/properties/CompetitionIdentificationNumber"},
            {"type": "field", "definition": "/properties/CompetitionIdentificationTitle"},
            {"type": "field", "definition": "/properties/AreasAffected"},
            {"type": "field", "definition": "/properties/ProjectTitle"},
            {"type": "field", "definition": "/properties/AdditionalProjectTitle"},
            {"type": "field", "definition": "/properties/CongressionalDistrictApplicant"},
            {"type": "field", "definition": "/properties/CongressionalDistrictProgramProject"},
            {"type": "field", "definition": "/properties/AdditionalCongressionalDistricts"},
            {"type": "field", "definition": "/properties/ProjectStartDate"},
            {"type": "field", "definition": "/properties/ProjectEndDate"},
            {"type": "field", "definition": "/properties/FederalEstimatedFunding"},
            {"type": "field", "definition": "/properties/ApplicantEstimatedFunding"},
            {"type": "field", "definition": "/properties/StateEstimatedFunding"},
            {"type": "field", "definition": "/properties/LocalEstimatedFunding"},
            {"type": "field", "definition": "/properties/OtherEstimatedFunding"},
            {"type": "field", "definition": "/properties/ProgramIncomeEstimatedFunding"},
            {"type": "field", "definition": "/properties/TotalEstimatedFunding"},
            {"type": "field", "definition": "/properties/StateReview"},
            {"type": "field", "definition": "/properties/StateReviewAvailableDate"},
            {"type": "field", "definition": "/properties/DelinquentFederalDebt"},
            {"type": "field", "definition": "/properties/DebtExplanation"},
            {"type": "field", "definition": "/properties/CertificationAgree"},
            # {"type": "field", "definition": "/properties/AuthorizedRepresentative/Prefix"},
            # {"type": "field", "definition": "/properties/AuthorizedRepresentative/FirstName"},
            # {"type": "field", "definition": "/properties/AuthorizedRepresentative/MiddleName"},
            # {"type": "field", "definition": "/properties/AuthorizedRepresentative/LastName"},
            # {"type": "field", "definition": "/properties/AuthorizedRepresentative/Suffix"},
            # {"type": "field", "definition": "/properties/AuthorizedRepresentative/Title"},
            {"type": "field", "definition": "/properties/AuthorizedRepresentativePhoneNumber"},
            {"type": "field", "definition": "/properties/AuthorizedRepresentativeFax"},
            {"type": "field", "definition": "/properties/AuthorizedRepresentativeEmail"},
            {"type": "field", "definition": "/properties/AORSignature"},
            {"type": "field", "definition": "/properties/DateSigned"},
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
    "SAMUEI": {"gg_pre_population": {"rule": "uei"}},
    "AgencyName": {"gg_pre_population": {"rule": "agency_name"}},
    "CFDANumber": {"gg_pre_population": {"rule": "assistance_listing_number"}},
    "CFDAProgramTitle": {"gg_pre_population": {"rule": "assistance_listing_program_title"}},
    "FundingOpportunityNumber": {"gg_pre_population": {"rule": "opportunity_number"}},
    "FundingOpportunityTitle": {"gg_pre_population": {"rule": "opportunity_title"}},
    "CompetitionIdentificationNumber": {"gg_pre_population": {"rule": "public_competition_id"}},
    "CompetitionIdentificationTitle": {"gg_pre_population": {"rule": "competition_title"}},
    ##### POST-POPULATION RULES
    "DateReceived": {"gg_post_population": {"rule": "current_date"}},
    "DateSigned": {"gg_post_population": {"rule": "current_date"}},
    "AORSignature": {"gg_post_population": {"rule": "signature"}},
    ##### VALIDATION RULES
    "AreasAffected": {"gg_validation": {"rule": "attachment"}},
    "AdditionalProjectTitle": {"gg_validation": {"rule": "attachment"}},
    "AdditionalCongressionalDistricts": {"gg_validation": {"rule": "attachment"}},
    "DebtExplanation": {"gg_validation": {"rule": "attachment"}},
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
    # form_rule_schema=FORM_RULE_SCHEMA,
    # No form instructions at the moment.
)
