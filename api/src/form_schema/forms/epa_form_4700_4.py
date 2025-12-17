import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import ADDRESS_SHARED_V1, COMMON_SHARED_V1

DIRECTIONS = """General. Recipients of Federal financial assistance from the U.S. Environmental Protection Agency must comply with the following statutes and regulations.

Title VI of the Civil Rights Acts of 1964 provides that no person in the United States shall, on the grounds of race, color, or national origin, be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any program or activity receiving Federal financial assistance. The Act goes on to explain that the statute shall not be construed to authorize action with respect to any employment practice of any employer, employment agency, or labor organization (except where the primary objective of the Federal financial assistance is to provide employment). Section 13 of the 1972 Amendments to the Federal Water Pollution Control Act provides that no person in the United States shall on the ground of sex, be excluded from participation in, be denied the benefits of, or be subjected to discrimination under the Federal Water Pollution Control Act, as amended. Employment discrimination on the basis of sex is prohibited in all such programs or activities. Section 504 of the Rehabilitation Act of 1973 provides that no otherwise qualified individual with a disability in the United States shall solely by reason of disability be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any program or activity receiving Federal financial assistance. Employment discrimination on the basis of disability is prohibited in all such programs or activities. The Age Discrimination Act of 1975 provides that no person on the basis of age shall be excluded from participation under any program or activity receiving Federal financial assistance. Employment discrimination is not covered. Age discrimination in employment is prohibited by the Age Discrimination in Employment Act administered by the Equal Employment Opportunity Commission. Title IX of the Education Amendments of 1972 provides that no person in the United States on the basis of sex shall be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any education program or activity receiving Federal financial assistance. Employment discrimination on the basis of sex is prohibited in all such education programs or activities. Note: an education program or activity is not limited to only those conducted by a formal institution. 40 C.F.R. Part 5 implements Title IX of the Education Amendments of 1972. 40 C.F.R. Part 7 implements Title VI of the Civil Rights Act of 1964, Section 13 of the 1972 Amendments to the Federal Water Pollution Control Act, and Section 504 of The Rehabilitation Act of 1973.

Items "Applicant" means any entity that files an application or unsolicited proposal or otherwise requests EPA assistance. 40 C.F.R. §§ 5.105, 7.25. "Recipient" means any State or its political subdivision, any instrumentality of a State or its political subdivision, any public or private agency, institution, organizations, or other entity, or any person to which Federal financial assistance is extended directly or through another recipient, including any successor, assignee, or transferee of a recipient, but excluding the ultimate beneficiary of the assistance. 40 C.F.R. §§ 5.105, 7.25. "Civil rights lawsuits and administrative complaints" means any lawsuit or administrative complaint alleging discrimination on the basis of race, color, national origin, sex, age, or disability pending or decided against the applicant and/or entity which actually benefits from the grant, but excluding employment complaints not covered by 40 C.F.R. Parts 5 and 7. For example, if a city is the named applicant but the grant will actually benefit the Department of Sewage, civil rights lawsuits involving both the city and the Department of Sewage should be listed. "Civil rights compliance review" means: any federal agency-initiated investigation of a particular aspect of the applicant's and/or recipient's programs or activities to determine compliance with the federal non-discrimination laws. Submit this form with the original and required copies of applications, requests for extensions, requests for increase of funds, etc. Updates of information are all that are required after the initial application submission. If any item is not relevant to the project for which assistance is requested, write "NA" for "Not Applicable." In the event applicant is uncertain about how to answer any questions, EPA program officials should be contacted for clarification."""

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "applicant_name",
        "applicant_address",
        "sam_uei",
        "point_of_contact_name",
        "point_of_contact_phone_number",
        "point_of_contact_email",
        "point_of_contact_title",
        "applicant_signature",
    ],
    "properties": {
        "applicant_name": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
            "title": "Name",
        },
        # NOTE - this isn't the same address type as most other forms
        # There is only a single line for address, and all fields are always required.
        "applicant_address": {
            "type": "object",
            "required": ["address", "city", "state", "zip_code"],
            "properties": {
                "address": {"type": "string", "title": "Address", "minLength": 1, "maxLength": 110},
                "city": {
                    "allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("city")}],
                },
                "state": {
                    "allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("state")}],
                },
                "zip_code": {
                    "allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("zip_code")}],
                },
            },
        },
        "sam_uei": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("sam_uei")}],
            "title": "Unique Entity Identifier (UEI)",
        },
        # This doesn't follow the normal convention of multiple fields for a name
        # and instead just has a big name textbox
        "point_of_contact_name": {
            "type": "string",
            "title": "Name",
            "minLength": 1,
            "maxLength": 100,
        },
        "point_of_contact_phone_number": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
            "title": "Phone",
        },
        "point_of_contact_email": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_email")}],
            "title": "Email",
        },
        "point_of_contact_title": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
            "title": "Title",
        },
        "federal_financial_assistance": {  # FederalFinancialAssistanceQuestion
            "type": "boolean",
            "title": "Is the applicant currently receiving EPA Assistance?",
        },
        "civil_rights_lawsuit_question1": {  # CivilRightsLawSuits1
            "allOf": [{"$ref": "#/$defs/civil_rights_lawsuit_question"}],
            "title": "List all pending civil rights lawsuits and administrative complaints filed under federal law against the applicant/recipient that allege discrimination based on race, color, national origin, sex, age, or disability. (Do not include employment complaints not covered by 40 C.F.R. Parts 5 and 7.) IV. List all civil rights",
        },
        "civil_rights_lawsuit_question2": {  # CivilRightsLawSuits2
            "allOf": [{"$ref": "#/$defs/civil_rights_lawsuit_question"}],
            "title": "List all civil rights lawsuits and administrative complaints decided against the applicant/recipient within the last year that alleged discrimination based on race, color, national origin, sex, age, or disability and enclose a copy of all decisions. Please describe all corrective actions taken. (Do not include employment complaints not covered by 40 C.F.R. Parts 5 and 7.)",
        },
        "civil_rights_lawsuit_question3": {  # CivilRightsLawSuits3
            "allOf": [{"$ref": "#/$defs/civil_rights_lawsuit_question"}],
            "title": "List all civil rights compliance reviews of the applicant/recipient conducted under federal nondiscrimination laws by any federal agency within the last two years and enclose a copy of the review and any decisions, orders, or agreements based on the review. Please describe any corrective action taken. (40 C.F.R. § 7.80(c)(3))",
        },
        "construction_federal_assistance": {  # ConstructionFederalAssistance
            "type": "boolean",
            "title": "Is the applicant requesting EPA assistance for new construction? If no, proceed to VII; if yes, answer (a) and/or (b) below",
        },
        "construction_new_facilities": {  # Construction
            "type": "boolean",
            "title": "a. If the grant is for new construction, will all new facilities or alterations to existing facilities be designed and constructed to be readily accessible to and usable by persons with disabilities? If yes, proceed to VII; if no, proceed to VI(b)",
        },
        "construction_new_facilities_explanation": {  # Construction2
            "type": "string",
            "title": "b. If the grant is for new construction and the new facilities or alterations to existing facilities will not be readily accessible to and usable by persons with disabilities, explain how a regulatory exception (40 C.F.R. 7.70) applies.",
            "minLength": 1,
            "maxLength": 500,
        },
        "notice1": {  # Notice1
            "type": "boolean",
            "title": "Does the applicant/recipient provide initial and continuing notice that it does not discriminate on the basis of race, color, national origin, sex, age, or disability in its program or activities? (40 C.F.R 5.140 and 7.95)",
        },
        "notice2": {  # Notice2
            "type": "boolean",
            "title": "a. Do the methods of notice accommodate those with impaired vision or hearing?",
        },
        "notice3": {  # Notice3
            "type": "boolean",
            "title": "b. Is the notice posted in a prominent place in the applicant's/recipient’s website, in the offices or facilities or, for education programs and activities, in appropriate periodicals and other written communications?",
        },
        "notice4": {  # Notice4
            "type": "boolean",
            "title": "c. Does the notice identify a designated civil rights coordinator?",
        },
        "demographic_data": {  # Demographic
            "type": "boolean",
            "title": "Does the applicant/recipient maintain demographic data on the race, color, national origin, sex, age, or disability status of the population it serves? (40 C.F.R. 7.85(a))",
        },
        "policy": {  # Policy
            "type": "boolean",
            "title": "Does the applicant/recipient have a policy/procedure for providing meaningful access to services for persons with limited English proficiency? (Title VI, 40 C.F.R. Part 7, Lau v Nichols 414 U.S. (1974))",
        },
        "policy_explanation": {  # Policy2
            "type": "string",
            "title": "If the applicant is an education program or activity, or has 15 or more employees, has it designated an employee to coordinate its compliance with 40 C.F.R. Parts 5 and 7? Provide the name, title, position, mailing address, e-mail address, fax number, and telephone number of the designated coordinator.",
            "minLength": 1,
            "maxLength": 1000,
        },
        "program_explanation": {  # Program
            "type": "string",
            "title": "If the applicant is an education program or activity, or has 15 or more employees, has it adopted grievance procedures that assure the prompt and fair resolution of complaints that allege a violation of 40 C.F.R. Parts 5 and 7? Provide a legal citation or applicant’s/ recipient’s website address for, or a copy of, the procedures.",
            "minLength": 1,
            "maxLength": 1000,
        },
        "applicant_signature": {
            "type": "object",
            "required": ["aor_title"],
            "properties": {
                "aor_signature": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("signature")}],
                    "title": "A. Signature of Authorized Official",
                },
                "aor_title": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
                    "title": "B. Title of Authorized Official",
                },
                "submitted_date": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("submitted_date")}],
                    "title": "C. Date",
                },
            },
        },
    },
    "$defs": {
        "civil_rights_lawsuit_question": {"type": "string", "minLength": 1, "maxLength": 4000}
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "A. Applicant/Recipient (Name, Address, City, State, Zip Code)",
        "name": "applicant",
        "children": [
            {"type": "field", "definition": "/properties/applicant_name"},
            {"type": "field", "definition": "/properties/applicant_address/properties/address"},
            {"type": "field", "definition": "/properties/applicant_address/properties/city"},
            {"type": "field", "definition": "/properties/applicant_address/properties/state"},
            {"type": "field", "definition": "/properties/applicant_address/properties/zip_code"},
        ],
    },
    {
        "type": "section",
        "label": "B.",
        "name": "uei",
        "children": [
            {"type": "field", "definition": "/properties/sam_uei"},
        ],
    },
    {
        "type": "section",
        "label": "C. Applicant/Recipient Point of Contact",
        "name": "poc",
        "children": [
            {"type": "field", "definition": "/properties/point_of_contact_name"},
            {"type": "field", "definition": "/properties/point_of_contact_phone_number"},
            {"type": "field", "definition": "/properties/point_of_contact_email"},
            {"type": "field", "definition": "/properties/point_of_contact_title"},
        ],
    },
    # I have no idea how we want to organize and group these fields
    # so deferring to frontend to sort that out with product folks
    # and just putting everything in one big list (sorry)
    {
        "type": "section",
        "label": "III-XI",
        "name": "questions",
        "children": [
            {
                "type": "field",
                "definition": "/properties/federal_financial_assistance",
                "widget": "Radio",
            },
            {"type": "field", "definition": "/properties/civil_rights_lawsuit_question1"},
            {"type": "field", "definition": "/properties/civil_rights_lawsuit_question2"},
            {"type": "field", "definition": "/properties/civil_rights_lawsuit_question3"},
            {
                "type": "field",
                "definition": "/properties/construction_federal_assistance",
                "widget": "Radio",
            },
            {
                "type": "field",
                "definition": "/properties/construction_new_facilities",
                "widget": "Radio",
            },
            {"type": "field", "definition": "/properties/construction_new_facilities_explanation"},
            {"type": "field", "definition": "/properties/notice1", "widget": "Radio"},
            {"type": "field", "definition": "/properties/notice2", "widget": "Radio"},
            {"type": "field", "definition": "/properties/notice3", "widget": "Radio"},
            {"type": "field", "definition": "/properties/notice4", "widget": "Radio"},
            {"type": "field", "definition": "/properties/demographic_data", "widget": "Radio"},
            {"type": "field", "definition": "/properties/policy", "widget": "Radio"},
            {"type": "field", "definition": "/properties/policy_explanation"},
            {"type": "field", "definition": "/properties/program_explanation"},
        ],
    },
    {
        "type": "section",
        "label": "For the Applicant/Recipient",
        "name": "signature",
        "description": "I certify that the statements I have made on this form and all attachments thereto are true, accurate and complete. I acknowledge that any knowingly false or misleading statement may be punishable by fine or imprisonment or both under applicable law. I assure that I will fully comply with all applicable civil rights statutes and EPA regulations.",
        "children": [
            {
                "type": "null",
                "definition": "/properties/applicant_signature/properties/aor_signature",
            },
            {"type": "field", "definition": "/properties/applicant_signature/properties/aor_title"},
            {
                "type": "null",
                "definition": "/properties/applicant_signature/properties/submitted_date",
            },
        ],
    },
    {
        "type": "section",
        "label": "Instructions for EPA Form 4700-4 (Rev. 04/2021)",
        "name": "instructions",
        "description": DIRECTIONS,
        "children": [],
    },
]

FORM_RULE_SCHEMA = {
    #### PRE-POPULATION RULES
    "sam_uei": {"gg_pre_population": {"rule": "uei"}},
    #### POST-POPULATION RULES
    "application_signature": {
        "aor_signature": {"gg_post_population": {"rule": "signature"}},
        "submitted_date": {"gg_post_population": {"rule": "current_date"}},
    },
}

# XML transformation rules for converting Simpler EPA Form 4700-4 JSON to Grants.gov XML format
FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for converting Simpler EPA Form 4700-4 JSON to XML",
        "version": "1.0",
        "form_name": "EPA4700_4_5_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/EPA4700_4_5_0-V5.0",
            "EPA4700_4_5_0": "http://apply.grants.gov/forms/EPA4700_4_5_0-V5.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/EPA4700_4_5_0-V5.0.xsd",
        "xml_structure": {
            "root_element": "EPA4700_4_5_0",
            "version": "5.0",
        },
    },
    # Applicant Information - wrapped under ApplicantInfo element
    # XSD requires both ApplicantName and ApplicantAddress to be grouped under ApplicantInfo
    "applicant_info": {
        "xml_transform": {
            "type": "conditional",
            "target": "ApplicantInfo",
            "conditional_transform": {
                "type": "field_grouping",
                "source_fields": ["applicant_name", "applicant_address"],
            },
        },
        # Nested field transformations for the grouped fields
        "nested_fields": {
            "applicant_name": {
                "xml_transform": {
                    "target": "ApplicantName",
                }
            },
            "applicant_address": {
                "xml_transform": {
                    "target": "ApplicantAddress",
                    "type": "nested_object",
                },
                "address": {
                    "xml_transform": {
                        "target": "Address",
                    }
                },
                "city": {
                    "xml_transform": {
                        "target": "City",
                    }
                },
                "state": {
                    "xml_transform": {
                        "target": "State",
                    }
                },
                "zip_code": {
                    "xml_transform": {
                        "target": "ZipCode",
                    }
                },
            },
        },
    },
    # SAM UEI
    "sam_uei": {
        "xml_transform": {
            "target": "SAMUEI",
        }
    },
    # Point of Contact
    "point_of_contact_name": {
        "xml_transform": {
            "target": "POCName",
        }
    },
    "point_of_contact_phone_number": {
        "xml_transform": {
            "target": "Phone",
        }
    },
    "point_of_contact_email": {
        "xml_transform": {
            "target": "Email",
        }
    },
    "point_of_contact_title": {
        "xml_transform": {
            "target": "Title",
        }
    },
    # Questions (all optional fields)
    "federal_financial_assistance": {
        "xml_transform": {
            "target": "FederalFinancialAssistanceQuestion",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "civil_rights_lawsuit_question1": {
        "xml_transform": {
            "target": "CivilRightsLawSuits1",
        }
    },
    "civil_rights_lawsuit_question2": {
        "xml_transform": {
            "target": "CivilRightsLawSuits2",
        }
    },
    "civil_rights_lawsuit_question3": {
        "xml_transform": {
            "target": "CivilRightsLawSuits3",
        }
    },
    "construction_federal_assistance": {
        "xml_transform": {
            "target": "ConstructionFederalAssistance",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "construction_new_facilities": {
        "xml_transform": {
            "target": "Construction",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "construction_new_facilities_explanation": {
        "xml_transform": {
            "target": "Construction2",
        }
    },
    "notice1": {
        "xml_transform": {
            "target": "Notice1",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "notice2": {
        "xml_transform": {
            "target": "Notice2",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "notice3": {
        "xml_transform": {
            "target": "Notice3",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "notice4": {
        "xml_transform": {
            "target": "Notice4",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "demographic_data": {
        "xml_transform": {
            "target": "Demographic",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "policy": {
        "xml_transform": {
            "target": "Policy1",
            "value_transform": {"type": "boolean_to_yes_no"},
        }
    },
    "policy_explanation": {
        "xml_transform": {
            "target": "Policy2",
        }
    },
    "program_explanation": {
        "xml_transform": {
            "target": "Program",
        }
    },
    # Applicant Signature (nested object)
    "applicant_signature": {
        "xml_transform": {
            "target": "ApplicantSignature",
            "type": "nested_object",
        },
        "aor_signature": {
            "xml_transform": {
                "target": "AORSignature",
            }
        },
        "aor_title": {
            "xml_transform": {
                "target": "PersonTitle",
            }
        },
        "submitted_date": {
            "xml_transform": {
                "target": "SubmittedDate",
            }
        },
    },
}

EPA_FORM_4700_4_v5_0 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/773
    form_id=uuid.UUID("4f0b0974-9a16-490b-a0f2-d03dfdc26ecd"),
    legacy_form_id=773,
    form_name="EPA Form 4700-4",
    short_form_name="EPA4700_4",
    form_version="5.0",
    agency_code="SGG",
    omb_number="2030-0020",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    # No form instructions
    form_type=FormType.EPA_FORM_4700_4,
    sgg_version="1.0",
    is_deprecated=False,
)
