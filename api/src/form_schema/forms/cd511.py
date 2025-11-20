import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

DIRECTIONS_CERTIFICATION_TITLE = "CERTIFICATION REGARDING LOBBYING"

DIRECTIONS_CERTIFICATION_BODY = "Applicants should also review the instructions for certification included in the regulations before completing this form. Signature on this form provides for compliance with certification requirements under 15 CFR Part 28, 'New Restrictions on Lobbying.' The certifications shall be treated as a material representation of fact upon which reliance will be placed when the Department of Commerce determines to award the covered transaction, grant, or cooperative agreement."

DIRECTIONS_LOBBYING_TITLE = "Lobbying"

DIRECTIONS_LOBBYING_BODY = """
As required by Section 1352, Title 31 of the U.S. Code, and implemented at 15 CFR Part 28, for persons entering into a grant, cooperative agreement or contract over $100,000 or a loan or loan guarantee over $150,000 as defined at 15 CFR Part 28, Sections 28.105 and 28.110, the applicant certifies that to the best of his or her knowledge and belief, that:

(1) No Federal appropriated funds have been paid or will be paid, by or on behalf of the undersigned, to any person for influencing or attempting to influence an officer or employee of any agency, a Member of Congress in connection with the awarding of any Federal contract, the making of any Federal grant, the making of any Federal loan, the entering into of any cooperative agreement, and the extension, continuation, renewal, amendment, or modification of any Federal contract, grant, loan, or cooperative agreement.

(2) If any funds other than Federal appropriated funds have been paid or will be paid to any person for influencing or attempting to influence an officer or employee of any agency, a Member of Congress, an officer or employee of Congress, or an employee of a member of Congress in connection with this Federal contract, grant, loan, or cooperative agreement, the undersigned shall complete and submit Standard Form-LLL, 'Disclosure Form to Report Lobbying.' in accordance with its instructions.

(3) The undersigned shall require that the language of this certification be included in the award documents for all subawards at all tiers (including subcontracts, subgrants, and contracts under grants, loans, and cooperative agreements) and that all subrecipients shall certify and disclose accordingly.

This certification is a material representation of fact upon which reliance was placed when this transaction was made or entered into. Submission of this certification is a prerequisite for making or entering into this transaction imposed by section 1352, title 31, U.S. Code. Any person who fails to file the required certification shall be subject to a civil penalty of not less than $10,000 and not more than $100,000 for each such failure occurring on or before October 23, 1996, and of not less than $11,000 and not more than $110,000 for each such failure occurring after October 23, 1996.
"""

DIRECTIONS_LOANS_TITLE = "Statement for Loan Guarantees and Loan Insurance"

DIRECTIONS_LOANS_BODY = """
The undersigned states, to the best of his or her knowledge and belief, that:

In any funds have been paid or will be paid to any person for influencing or attempting to influence an officer or employee of any agency, a Member of Congress, an officer or employee of Congress, or an employee of a Member of Congress in connection with this commitment providing for the United States to insure or guarantee a loan, the undersigned shall complete and submit Standard Form-LLL, 'Disclosure Form to Report Lobbying,' in accordance with its instructions.

Submission of this statement is a prerequisite for making or entering into this transaction imposed by section 1352, title 31, U.S. Code. Any person who fails to file the required statement shall be subject to a civil penalty of not less than $10,000 and not more than $100,000 for each such failure occurring on or before October 23, 1996, and of not less than $11,000 and not more than $110,000 for each such failure occurring after October 23, 1996.
"""

DIRECTIONS_COMPLY_TITLE = "As the duly authorized representative of the applicant, I hereby certify that the applicant will comply with the above applicable certification."

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "applicant_name",
        "contact_person",
        "contact_person_title",
    ],
    "allOf": [
        ### These two rules go together and make sure that one of
        ### award_number and project_name is provided.
        #
        # If award_number is not present, then project_name is required
        {
            "if": {"not": {"required": ["award_number"]}},
            "then": {"required": ["project_name"]},
        },
        # If project_name is not present, then award_number is required
        {
            "if": {"not": {"required": ["project_name"]}},
            "then": {"required": ["award_number"]},
        },
    ],
    "properties": {
        # Note this was called OrganizationName in the legacy system
        # but the display text was "Name of Applicant".
        "applicant_name": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
            "title": "Name of Applicant",
        },
        "award_number": {
            "type": "string",
            "title": "Award Number",
            "description": "Required if Project Name is blank",
            "minLength": 1,
            "maxLength": 25,
        },
        "project_name": {
            "type": "string",
            "title": "Project Name",
            "description": "Required if Award Number is blank",
            "minLength": 1,
            "maxLength": 60,
        },
        "contact_person": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("person_name")}],
            "title": "Contact Person",
        },
        "contact_person_title": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
        },
        "signature": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("signature")}],
        },
        "submitted_date": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("submitted_date")}],
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": DIRECTIONS_CERTIFICATION_TITLE,
        "name": "directions1",
        "description": DIRECTIONS_CERTIFICATION_BODY,
        "children": [],
    },
    {
        "type": "section",
        "label": DIRECTIONS_LOBBYING_TITLE,
        "name": "directions2",
        "description": DIRECTIONS_LOBBYING_BODY,
        "children": [],
    },
    {
        "type": "section",
        "label": DIRECTIONS_LOANS_TITLE,
        "name": "directions3",
        "description": DIRECTIONS_LOANS_BODY,
        "children": [],
    },
    {
        "type": "section",
        "label": DIRECTIONS_COMPLY_TITLE,
        "name": "directions4",
        "description": "",
        "children": [],
    },
    {
        "type": "section",
        "name": "award",
        "label": "1. Award",
        "children": [
            {"type": "field", "definition": "/properties/applicant_name"},
            {"type": "field", "definition": "/properties/award_number"},
            {"type": "field", "definition": "/properties/project_name"},
        ],
    },
    {
        "type": "section",
        "name": "contact_person",
        "label": "2. Contact Person",
        "children": [
            {"type": "field", "definition": "/properties/contact_person/properties/prefix"},
            {"type": "field", "definition": "/properties/contact_person/properties/first_name"},
            {"type": "field", "definition": "/properties/contact_person/properties/middle_name"},
            {"type": "field", "definition": "/properties/contact_person/properties/last_name"},
            {"type": "field", "definition": "/properties/contact_person/properties/suffix"},
            {"type": "field", "definition": "/properties/contact_person_title"},
        ],
    },
    {
        "type": "section",
        "name": "signature",
        "label": "3. Signature",
        "children": [
            {"type": "null", "definition": "/properties/signature"},
            {"type": "null", "definition": "/properties/submitted_date"},
        ],
    },
]


FORM_RULE_SCHEMA = {
    ##### POST-POPULATION RULES
    "submitted_date": {"gg_post_population": {"rule": "current_date"}},
    "signature": {"gg_post_population": {"rule": "signature"}},
}

CD511_v1_1 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/276
    form_id=uuid.UUID("7057eaee-f043-4029-b7f2-c932f11ce900"),
    legacy_form_id=276,
    form_name="CD511",
    short_form_name="CD511",
    form_version="1.1",
    agency_code="SGG",
    omb_number=None,
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=None,
    # CD511 does not have any instructions
    form_type=FormType.CD511,
    sgg_version="1.0",
    is_deprecated=False,
)
