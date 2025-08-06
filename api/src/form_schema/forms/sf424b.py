import uuid

from src.db.models.competition_models import Form

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": ["signature", "title", "applicant_organization"],
    "properties": {
        "signature": {
            "type": "string",
            "title": "Signature of the Authorized Certifying Official",
            "description": "Completed by Grants.gov upon submission.",
            "minLength": 1,
            "maxLength": 144,
        },
        "title": {
            # FUTURE WORK: This gets copied from the SF-424's AuthorizedRepresentativeTitle field
            "type": "string",
            "title": "Title",
            "description": "This should match the 'Authorized Representative Title' field from the SF-424 form",
            "minLength": 1,
            "maxLength": 45,
        },
        "applicant_organization": {
            # FUTURE WORK: This gets copied from the SF-424's OrganizationName field (called Legal Name in the UI)
            "type": "string",
            "title": "Applicant Organization",
            "description": "This should match the 'Legal Name' field from the SF-424 form",
            "minLength": 1,
            "maxLength": 60,
        },
        "date_signed": {
            "type": "string",
            "format": "date",
            "title": "Date Signed",
            "description": "Completed by Grants.gov upon submission.",
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "1. Everything",
        "name": "Everything",
        "children": [
            {"type": "field", "definition": "/properties/signature"},
            {"type": "field", "definition": "/properties/title"},
            {"type": "field", "definition": "/properties/applicant_organization"},
            {"type": "field", "definition": "/properties/date_signed"},
        ],
    }
]

FORM_RULE_SCHEMA = {
    ##### POST-POPULATION RULES
    "signature": {"gg_post_population": {"rule": "signature"}},
    "date_signed": {"gg_post_population": {"rule": "current_date"}},
}

SF424b_v1_1 = Form(
    # https://grants.gov/forms/form-items-description/fid/240
    form_id=uuid.UUID("1d0681f8-26f9-4ff1-a75e-e33477668f73"),
    legacy_form_id=240,
    form_name="Assurances for Non-Construction Programs (SF-424B)",
    short_form_name="SF424B",
    form_version="1.1",
    agency_code="SGG",
    omb_number="4040-0007",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    # No form instructions at the moment.
)
