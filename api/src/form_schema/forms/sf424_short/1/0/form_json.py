import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import ADDRESS_SHARED_V1, COMMON_SHARED_V1

# Applicant type codes shared by the SF-424 family (globLib:ApplicantTypeCodeDataType).
APPLICANT_TYPE_CODES = [
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
]

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "agency_name",
        "funding_opportunity_number",
        "funding_opportunity_title",
        "organization_name",
        "applicant",
        "applicant_type_code",
        "employer_taxpayer_identification_number",
        "sam_uei",
        "congressional_district_applicant",
        "project_title",
        "project_description",
        "project_start_date",
        "project_end_date",
        "project_director",
        "contact_person",
        "application_certification",
        "authorized_representative",
        "authorized_representative_title",
        "authorized_representative_email",
        "authorized_representative_phone_number",
    ],
    # Conditional validation rules for SF-424 Short
    "allOf": [
        # If one of the applicant_type_code values is X: Other, applicant_type_other_specify is required
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
    "$defs": {
        # globLib:ContactPersonDataTypeV3 - reused by the project director (item 7) and the
        # primary contact / grants administrator (item 8). Name and Address are required per
        # the XSD; the form additionally marks Title, Email and Telephone Number as required.
        "contact_person_group": {
            "type": "object",
            "required": ["name", "title", "address", "phone_number", "email"],
            "properties": {
                "name": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("person_name")}],
                    "title": "Name",
                    "description": "Enter the name.",
                },
                "title": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
                    "title": "Title",
                    "description": "Enter the position title.",
                },
                "address": {
                    "allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("address")}],
                    "title": "Address",
                    "description": "Enter the address.",
                },
                "phone_number": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
                    "title": "Telephone Number",
                    "description": "Enter the daytime Telephone Number.",
                },
                "fax": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
                    "title": "Fax Number",
                    "description": "Enter the Fax Number.",
                },
                "email": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_email")}],
                    "title": "Email",
                    "description": "Enter a valid email Address.",
                },
            },
        },
    },
    "properties": {
        "agency_name": {
            "type": "string",
            "title": "Name of Federal Agency",
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
        "date_received": {
            "type": "string",
            "title": "Date Received",
            "description": "Completed by Grants.gov upon submission.",
            "format": "date",
            "readOnly": True,
        },
        "funding_opportunity_number": {
            "type": "string",
            "title": "Funding Opportunity Number",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 40,
        },
        "funding_opportunity_title": {
            "type": "string",
            "title": "Funding Opportunity Title",
            "description": "Pre-populated from the Application cover sheet.",
            "minLength": 1,
            "maxLength": 255,
        },
        "organization_name": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
            "title": "Legal Name",
            "description": "Enter the legal name of applicant that will undertake the assistance activity. This is the name that the organization has registered with the System for Award Management (SAM.gov). Information on registering with SAM may be obtained by visiting the Grants.gov website.",
        },
        "applicant": {
            "allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("address")}],
            "title": "Address",
            "description": "Enter the address of the applicant.",
        },
        "applicant_web_address": {
            "type": "string",
            "title": "Web Address",
            "description": "Enter the applicant's web address, if applicable.",
            "minLength": 1,
            # The XSD models this as an unbounded anyURI; we cap the length as a safeguard.
            "maxLength": 250,
        },
        "applicant_type_code": {
            # In the XML model this is 3 separate fields (ApplicantTypeCode1-3); we join them
            # together into a single array value.
            "type": "array",
            "title": "Type of Applicant",
            "description": "Select a minimum of one applicant type or select up to three applicant types in accordance with agency instructions. If “Other” is selected, then specify Other Type of Applicant in text box.",
            "minItems": 1,
            "maxItems": 3,
            "items": {
                "type": "string",
                "enum": APPLICANT_TYPE_CODES,
            },
        },
        "applicant_type_other_specify": {
            "type": "string",
            "title": "Type of Applicant Other Explanation",
            "description": 'Enter the applicant type here if you selected "Other (specify)" for Type of applicant.',
            "minLength": 0,
            "maxLength": 30,
        },
        "employer_taxpayer_identification_number": {
            "type": "string",
            "title": "EIN/TIN",
            "description": "Enter either TIN or EIN as assigned by the Internal Revenue Service.  If your organization is not in the US, enter 44-4444444.",
            "minLength": 9,
            "maxLength": 30,
        },
        "sam_uei": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("sam_uei")}],
            "title": "SAM UEI",
            "description": "UEI of the applicant organization. This field is pre-populated from the Application cover sheet.",
        },
        "congressional_district_applicant": {
            "type": "string",
            "title": "Congressional District of Applicant",
            "description": "Congressional District of Applicant is required: Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th District, CA-012 for California's 12th District, NC-103 for North Carolina's 103rd District. If outside the U.S., enter 00-000.",
            "minLength": 1,
            "maxLength": 6,
        },
        "project_title": {
            "type": "string",
            "title": "Project Title",
            "description": "Enter a brief, descriptive title of the project.",
            "minLength": 1,
            "maxLength": 200,
        },
        "project_description": {
            "type": "string",
            "title": "Project Description",
            "description": "Enter a brief description of the project.",
            "minLength": 1,
            "maxLength": 1000,
        },
        "project_start_date": {
            "type": "string",
            "title": "Project Start Date",
            "description": "Enter the date in the format MM/DD/YYYY.",
            "format": "date",
        },
        "project_end_date": {
            "type": "string",
            "title": "Project End Date",
            "description": "Enter the date in the format MM/DD/YYYY.",
            "format": "date",
        },
        "project_director": {
            "allOf": [{"$ref": "#/$defs/contact_person_group"}],
            "title": "Project Director",
            "description": "Enter information about the project director.",
        },
        "same_as_project_director": {
            "type": "boolean",
            "title": "Same as Project Director (if checked, fill in information same as Project Director above)",
        },
        "contact_person": {
            "allOf": [{"$ref": "#/$defs/contact_person_group"}],
            "title": "Primary Contact/Grants Administrator",
            "description": "Enter information about the primary contact.",
        },
        "application_certification": {
            "type": "boolean",
            "title": "** I Agree",
            "description": "** The list of certifications and assurances, or an internet site where you may obtain this list, is contained in the announcement or agency specific instructions. By signing this application, I certify (1) to the statements contained in the list of certifications and (2) that the statements herein are true, complete and accurate to the best of my knowledge. I also provide the required assurances and agree to comply with any resulting terms if I accept an award. I am aware that any false, fictitious, or fraudulent statements or claims may subject me to criminal, civil, or administrative penalties. (U.S. Code, Title 18, Section 1001)",
        },
        "authorized_representative": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("person_name")}],
            "title": "Authorized Representative",
            "description": "Enter the name of the authorized representative.",
        },
        "authorized_representative_title": {
            "type": "string",
            "title": "Title",
            "description": "Enter the position title.",
            "minLength": 1,
            "maxLength": 45,
        },
        "authorized_representative_email": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_email")}],
            "title": "Email",
            "description": "Enter a valid email Address.",
        },
        "authorized_representative_phone_number": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
            "title": "Telephone Number",
            "description": "Enter the daytime Telephone Number.",
        },
        "authorized_representative_fax": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
            "title": "Fax Number",
            "description": "Enter the Fax Number.",
        },
        "aor_signature": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("signature")}],
            "title": "Signature of Authorized Representative",
            "description": "Completed by Grants.gov upon submission.",
            "readOnly": True,
        },
        "authorized_representative_date_signed": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("submitted_date")}],
            "title": "Date Signed",
            "description": "Completed by Grants.gov upon submission.",
            "readOnly": True,
        },
    },
}

_CONTACT_PERSON_GROUP_UI_CHILDREN = [
    {"type": "field", "definition": "{base}/properties/name/properties/prefix"},
    {"type": "field", "definition": "{base}/properties/name/properties/first_name"},
    {"type": "field", "definition": "{base}/properties/name/properties/middle_name"},
    {"type": "field", "definition": "{base}/properties/name/properties/last_name"},
    {"type": "field", "definition": "{base}/properties/name/properties/suffix"},
    {"type": "field", "definition": "{base}/properties/title"},
    {"type": "field", "definition": "{base}/properties/email"},
    {"type": "field", "definition": "{base}/properties/phone_number"},
    {"type": "field", "definition": "{base}/properties/fax"},
    {"type": "field", "definition": "{base}/properties/address/properties/street1"},
    {"type": "field", "definition": "{base}/properties/address/properties/street2"},
    {"type": "field", "definition": "{base}/properties/address/properties/city"},
    {"type": "field", "definition": "{base}/properties/address/properties/county"},
    {"type": "field", "definition": "{base}/properties/address/properties/state"},
    {"type": "field", "definition": "{base}/properties/address/properties/province"},
    {"type": "field", "definition": "{base}/properties/address/properties/country"},
    {"type": "field", "definition": "{base}/properties/address/properties/zip_code"},
]


def _contact_person_ui_children(base: str) -> list[dict]:
    return [
        {"type": child["type"], "definition": child["definition"].format(base=base)}
        for child in _CONTACT_PERSON_GROUP_UI_CHILDREN
    ]


FORM_UI_SCHEMA = [
    {
        "type": "section",
        "name": "federal_agency",
        "label": "1. Name of Federal Agency",
        "children": [{"type": "null", "definition": "/properties/agency_name"}],
    },
    {
        "type": "section",
        "name": "assistance_listing",
        "label": "2. Assistance Listing Number and Title",
        "children": [
            {"type": "null", "definition": "/properties/assistance_listing_number"},
            {"type": "null", "definition": "/properties/assistance_listing_program_title"},
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
        "name": "funding_opportunity",
        "label": "4. Funding Opportunity Number and Title",
        "children": [
            {"type": "null", "definition": "/properties/funding_opportunity_number"},
            {"type": "null", "definition": "/properties/funding_opportunity_title"},
        ],
    },
    {
        "type": "section",
        "name": "applicant_information",
        "label": "5. Applicant Information",
        "children": [
            {"type": "field", "definition": "/properties/organization_name"},
            {"type": "field", "definition": "/properties/applicant/properties/street1"},
            {"type": "field", "definition": "/properties/applicant/properties/street2"},
            {"type": "field", "definition": "/properties/applicant/properties/city"},
            {"type": "field", "definition": "/properties/applicant/properties/county"},
            {"type": "field", "definition": "/properties/applicant/properties/state"},
            {"type": "field", "definition": "/properties/applicant/properties/province"},
            {"type": "field", "definition": "/properties/applicant/properties/country"},
            {"type": "field", "definition": "/properties/applicant/properties/zip_code"},
            {"type": "field", "definition": "/properties/applicant_web_address"},
            {
                "type": "field",
                "definition": "/properties/applicant_type_code",
                "widget": "MultiSelect",
            },
            {"type": "field", "definition": "/properties/applicant_type_other_specify"},
            {"type": "field", "definition": "/properties/employer_taxpayer_identification_number"},
            {"type": "null", "definition": "/properties/sam_uei"},
            {"type": "field", "definition": "/properties/congressional_district_applicant"},
        ],
    },
    {
        "type": "section",
        "name": "project_information",
        "label": "6. Project Information",
        "children": [
            {"type": "field", "definition": "/properties/project_title"},
            {"type": "field", "definition": "/properties/project_description"},
            {"type": "field", "definition": "/properties/project_start_date"},
            {"type": "field", "definition": "/properties/project_end_date"},
        ],
    },
    {
        "type": "section",
        "name": "project_director",
        "label": "7. Project Director",
        "children": _contact_person_ui_children("/properties/project_director"),
    },
    {
        "type": "section",
        "name": "contact_person",
        "label": "8. Primary Contact/Grants Administrator",
        "children": [
            {"type": "field", "definition": "/properties/same_as_project_director"},
            *_contact_person_ui_children("/properties/contact_person"),
        ],
    },
    {
        "type": "section",
        "name": "authorized_representative",
        "label": "9. Authorized Representative",
        "children": [
            {
                "type": "field",
                "definition": "/properties/application_certification",
                "printDescription": True,
            },
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
            {"type": "field", "definition": "/properties/authorized_representative_email"},
            {"type": "field", "definition": "/properties/authorized_representative_phone_number"},
            {"type": "field", "definition": "/properties/authorized_representative_fax"},
            {"type": "null", "definition": "/properties/aor_signature"},
            {"type": "null", "definition": "/properties/authorized_representative_date_signed"},
        ],
    },
]


FORM_RULE_SCHEMA = {
    ##### PRE-POPULATION RULES
    "agency_name": {"gg_pre_population": {"rule": "agency_name"}},
    "assistance_listing_number": {"gg_pre_population": {"rule": "assistance_listing_number"}},
    "assistance_listing_program_title": {
        "gg_pre_population": {"rule": "assistance_listing_program_title"}
    },
    "funding_opportunity_number": {"gg_pre_population": {"rule": "opportunity_number"}},
    "funding_opportunity_title": {"gg_pre_population": {"rule": "opportunity_title"}},
    "sam_uei": {"gg_pre_population": {"rule": "uei"}},
    ##### POST-POPULATION RULES
    "date_received": {"gg_post_population": {"rule": "current_date"}},
    "aor_signature": {"gg_post_population": {"rule": "signature"}},
    "authorized_representative_date_signed": {"gg_post_population": {"rule": "current_date"}},
}


# The nested name/address groups shared by the project director and contact person.
_CONTACT_PERSON_GROUP_XML_TRANSFORM = {
    "xml_transform": {"target": "PLACEHOLDER", "type": "nested_object"},
    "name": {
        "xml_transform": {"target": "Name", "namespace": "globLib", "type": "nested_object"},
        "prefix": {"xml_transform": {"target": "PrefixName", "namespace": "globLib"}},
        "first_name": {"xml_transform": {"target": "FirstName", "namespace": "globLib"}},
        "middle_name": {"xml_transform": {"target": "MiddleName", "namespace": "globLib"}},
        "last_name": {"xml_transform": {"target": "LastName", "namespace": "globLib"}},
        "suffix": {"xml_transform": {"target": "SuffixName", "namespace": "globLib"}},
    },
    "title": {"xml_transform": {"target": "Title", "namespace": "globLib"}},
    "address": {
        "xml_transform": {"target": "Address", "namespace": "globLib", "type": "nested_object"},
        "street1": {"xml_transform": {"target": "Street1", "namespace": "globLib"}},
        "street2": {"xml_transform": {"target": "Street2", "namespace": "globLib"}},
        "city": {"xml_transform": {"target": "City", "namespace": "globLib"}},
        "county": {"xml_transform": {"target": "County", "namespace": "globLib"}},
        "state": {"xml_transform": {"target": "State", "namespace": "globLib"}},
        "province": {"xml_transform": {"target": "Province", "namespace": "globLib"}},
        "zip_code": {"xml_transform": {"target": "ZipPostalCode", "namespace": "globLib"}},
        "country": {"xml_transform": {"target": "Country", "namespace": "globLib"}},
    },
    "phone_number": {"xml_transform": {"target": "Phone", "namespace": "globLib"}},
    "fax": {"xml_transform": {"target": "Fax", "namespace": "globLib"}},
    "email": {"xml_transform": {"target": "Email", "namespace": "globLib"}},
}


def _contact_person_group_xml(target: str) -> dict:
    group = {key: value for key, value in _CONTACT_PERSON_GROUP_XML_TRANSFORM.items()}
    group["xml_transform"] = {"target": target, "type": "nested_object"}
    return group


# XML Transformation Rules for SF-424 Short Organizational 3.0
FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for converting Simpler SF-424 Short JSON to Grants.gov XML format",
        # NOTE: the top-level applicant Address element is in the form namespace per the XSD,
        # while the Address groups inside ProjectDirectorGroup/ContactPersonGroup are in globLib.
        # The applicant Address uses "namespace": "default" to force the form namespace and
        # prevent the globLib namespace from the contact person groups from bleeding onto it.
        "version": "1.0",
        "form_name": "SF424_Short_3_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SF424_Short_3_0-V3.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_Short_3_0-V3.0.xsd",
        "xml_structure": {"root_element": "SF424_Short_3_0", "version": "3.0"},
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
            "include_null": "Include empty XML element: <Field></Field>",
            "default_value": "Use configured default value when field is None",
        },
    },
    # Opportunity information - order matches XSD sequence
    "agency_name": {"xml_transform": {"target": "AgencyName"}},
    "assistance_listing_number": {"xml_transform": {"target": "CFDANumber"}},
    "assistance_listing_program_title": {"xml_transform": {"target": "CFDAProgramTitle"}},
    "date_received": {"xml_transform": {"target": "DateReceived", "null_handling": "include_null"}},
    "funding_opportunity_number": {"xml_transform": {"target": "FundingOpportunityNumber"}},
    "funding_opportunity_title": {"xml_transform": {"target": "FundingOpportunityTitle"}},
    # Applicant information
    "organization_name": {"xml_transform": {"target": "OrganizationName"}},
    "applicant": {
        # "namespace": "default" forces the Address element into the form's default namespace
        # (SF424_Short_3_0), preventing the globLib namespace used by the contact person group's
        # nested Address elements from bleeding onto this top-level element.
        "xml_transform": {"target": "Address", "namespace": "default", "type": "nested_object"},
        "street1": {"xml_transform": {"target": "Street1", "namespace": "globLib"}},
        "street2": {"xml_transform": {"target": "Street2", "namespace": "globLib"}},
        "city": {"xml_transform": {"target": "City", "namespace": "globLib"}},
        "county": {"xml_transform": {"target": "County", "namespace": "globLib"}},
        "state": {"xml_transform": {"target": "State", "namespace": "globLib"}},
        "province": {"xml_transform": {"target": "Province", "namespace": "globLib"}},
        "zip_code": {"xml_transform": {"target": "ZipPostalCode", "namespace": "globLib"}},
        "country": {"xml_transform": {"target": "Country", "namespace": "globLib"}},
    },
    "applicant_web_address": {"xml_transform": {"target": "ApplicantWebAddress"}},
    # One-to-many mapping - applicant type codes (must come before other fields per XSD)
    "applicant_type_code_mapping": {
        "xml_transform": {
            "target": "ApplicantTypeCode",  # Not used for one-to-many
            "type": "conditional",
            "conditional_transform": {
                "type": "one_to_many",
                "source_field": "applicant_type_code",
                "target_pattern": "ApplicantTypeCode{index}",
                "max_count": 3,  # SF-424 Short supports up to 3 applicant type codes
            },
        }
    },
    "applicant_type_other_specify": {"xml_transform": {"target": "ApplicantTypeOtherSpecify"}},
    "employer_taxpayer_identification_number": {
        "xml_transform": {"target": "EmployerTaxpayerIdentificationNumber"}
    },
    "sam_uei": {"xml_transform": {"target": "SAMUEI"}},
    "congressional_district_applicant": {
        "xml_transform": {"target": "CongressionalDistrictApplicant"}
    },
    # Project information
    "project_title": {"xml_transform": {"target": "ProjectTitle"}},
    "project_description": {"xml_transform": {"target": "ProjectDescription"}},
    "project_start_date": {"xml_transform": {"target": "ProjectStartDate"}},
    "project_end_date": {"xml_transform": {"target": "ProjectEndDate"}},
    # Project director (item 7) and primary contact (item 8) - ContactPersonDataTypeV3
    "project_director": _contact_person_group_xml("ProjectDirectorGroup"),
    "same_as_project_director": {
        "xml_transform": {
            "target": "SameAsProjectDirector",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "contact_person": _contact_person_group_xml("ContactPersonGroup"),
    # Certification and authorized representative
    "application_certification": {
        "xml_transform": {
            "target": "ApplicationCertification",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "authorized_representative": {
        "xml_transform": {"target": "AuthorizedRepresentative", "type": "nested_object"},
        "prefix": {"xml_transform": {"target": "PrefixName", "namespace": "globLib"}},
        "first_name": {"xml_transform": {"target": "FirstName", "namespace": "globLib"}},
        "middle_name": {"xml_transform": {"target": "MiddleName", "namespace": "globLib"}},
        "last_name": {"xml_transform": {"target": "LastName", "namespace": "globLib"}},
        "suffix": {"xml_transform": {"target": "SuffixName", "namespace": "globLib"}},
    },
    "authorized_representative_title": {
        "xml_transform": {"target": "AuthorizedRepresentativeTitle"}
    },
    "authorized_representative_email": {
        "xml_transform": {"target": "AuthorizedRepresentativeEmail"}
    },
    "authorized_representative_phone_number": {
        "xml_transform": {"target": "AuthorizedRepresentativePhoneNumber"}
    },
    "authorized_representative_fax": {
        "xml_transform": {"target": "AuthorizedRepresentativeFaxNumber"}
    },
    "aor_signature": {"xml_transform": {"target": "AuthorizedRepresentativeSignature"}},
    "authorized_representative_date_signed": {
        "xml_transform": {"target": "AuthorizedRepresentativeDateSigned"}
    },
}


SF424Short_v3_0 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/711
    form_id=uuid.UUID("cf355a4d-d840-43fd-a78f-729edf41ab4c"),
    legacy_form_id=711,
    form_name="Application for Federal Domestic Assistance-Short Organizational (SF-424)",
    short_form_name="SF424_Short_3_0",
    form_version="3.0",
    agency_code="SGG",
    omb_number="4040-0003",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("550e8400-e29b-41d4-a716-446655440000"),
    form_type=FormType.SF424_SHORT,
    sgg_version="1.0",
    is_deprecated=False,
)
