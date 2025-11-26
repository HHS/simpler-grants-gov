import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

DIRECTIONS = """Certification for Contracts, Grants, Loans, and Cooperative Agreements

The undersigned certifies, to the best of his or her knowledge and belief, that:

(1) No Federal appropriated funds have been paid or will be paid, by or on behalf of the undersigned, to any person for influencing or attempting to influence an officer or employee of an agency, a Member of Congress, an officer or employee of Congress, or an employee of a Member of Congress in connection with the awarding of any Federal contract, the making of any Federal grant, the making of any Federal loan, the entering into of any cooperative agreement, and the extension, continuation, renewal, amendment, or modification of any Federal contract, grant, loan, or cooperative agreement

(2) If any funds other than Federal appropriated funds have been paid or will be paid to any person for influencing or attempting to influence an officer or employee of any agency, a Member of Congress, an officer or employee of Congress, or an employee of a Member of Congress in connection with this Federal contract, grant, loan, or cooperative agreement, the undersigned shall complete and submit Standard Form-LLL, ''Disclosure of Lobbying Activities,'' in accordance with its instructions.

(3) The undersigned shall require that the language of this certification be included in the award documents for all subawards at all tiers (including subcontracts, subgrants, and contracts under grants, loans, and cooperative agreements) and that all subrecipients shall certify and disclose accordingly. This certification is a material representation of fact upon which reliance was placed when this transaction was made or entered into. Submission of this certification is a prerequisite for making or entering into this transaction imposed by section 1352, title 31, U.S. Code. Any person who fails to file the required certification shall be subject to a civil penalty of not less than $10,000 and not more than $100,000 for each such failure.

Statement for Loan Guarantees and Loan Insurance

The undersigned states, to the best of his or her knowledge and belief, that:

If any funds have been paid or will be paid to any person for influencing or attempting to influence an officer or employee of any agency, a Member of Congress, an officer or employee of Congress, or an employee of a Member of Congress in connection with this commitment providing for the United States to insure or guarantee a loan, the undersigned shall complete and submit Standard Form-LLL, ''Disclosure of Lobbying Activities,'' in accordance with its instructions. Submission of this statement is a prerequisite for making or entering into this transaction imposed by section 1352, title 31, U.S. Code. Any person who fails to file the required statement shall be subject to a civil penalty of not less than $10,000 and not more than $100,000 for each such failure.
"""

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "organization_name",
        "authorized_representative_name",
        "authorized_representative_title",
    ],
    "properties": {
        "organization_name": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
            "title": "Applicant's Organization",
        },
        "authorized_representative_name": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("person_name")}]
        },
        "authorized_representative_title": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
            "title": "Title",
        },
        "authorized_representative_signature": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("signature")}],
            "title": "Signature",
        },
        "submitted_date": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("submitted_date")}],
            "title": "Date",
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "1. Directions",
        "name": "directions",
        "description": DIRECTIONS,
        "children": [],
    },
    {
        "type": "section",
        "label": "2. Applicant's Organization",
        "name": "applicantsOrganization",
        "children": [
            {"type": "field", "definition": "/properties/organization_name"},
        ],
    },
    {
        "type": "section",
        "label": "3. Printed Name and Title of Authorized Representative",
        "name": "authorizedRepresentative",
        "children": [
            {
                "type": "field",
                "definition": "/properties/authorized_representative_name/properties/prefix",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative_name/properties/first_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative_name/properties/middle_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative_name/properties/last_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative_name/properties/suffix",
            },
            {"type": "field", "definition": "/properties/authorized_representative_title"},
        ],
    },
    {
        "type": "section",
        "label": "4. Signature",
        "name": "signature",
        "children": [
            {"type": "null", "definition": "/properties/authorized_representative_signature"},
            {"type": "null", "definition": "/properties/submitted_date"},
        ],
    },
]

FORM_RULE_SCHEMA = {
    #### POST-POPULATION RULES
    "authorized_representative_signature": {"gg_post_population": {"rule": "signature"}},
    "submitted_date": {"gg_post_population": {"rule": "current_date"}},
}

GG_LobbyingForm_v1_1 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/255
    form_id=uuid.UUID("295d60a6-a3d1-4413-88fe-f4e5ee43b409"),
    legacy_form_id=255,
    form_name="Grants.gov Lobbying Form",
    short_form_name="GG_LobbyingForm",
    form_version="1.1",
    agency_code="SGG",
    omb_number="4040-0013",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    form_instruction_id=uuid.UUID("ef1102b5-64af-47a5-b23e-e8d699032027"),
    form_type=FormType.GG_LOBBYING_FORM,
    sgg_version="1.0",
    is_deprecated=False,
)
