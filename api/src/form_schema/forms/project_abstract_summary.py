import uuid

from src.db.models.competition_models import Form

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
            "type": "string",
            "title": "Applicant Name",
            "description": "This should match the 'Legal Name' field from the SF-424 form",
            "minLength": 1,
            "maxLength": 60,
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
        "label": "1. Everything",
        "name": "Everything",
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
    # TODO - before we can enable prepopulation we need the following rules:
    #   * assistance listing number
    "funding_opportunity_number": {"gg_pre_population": {"rule": "opportunity_number"}},
    "assistance_listing_number": {"gg_pre_population": {"rule": "assistance_listing_number"}},
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
    # No form instructions at the moment.
)
