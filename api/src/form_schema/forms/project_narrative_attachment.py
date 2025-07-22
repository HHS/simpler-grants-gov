import uuid

from src.db.models.competition_models import Form

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": ["attachments"],
    "properties": {
        "attachments": {
            "type": "array",
            "title": "Project Narrative Files",
            "description": "At least one file must be attached",
            "minItems": 1,
            "maxItems": 100,
            "items": {"allOf": [{"$ref": "#/$defs/attachment_field"}]},
        }
    },
    "$defs": {
        # Just defining this separately so it's easier to refactor when we have a shared schema
        "attachment_field": {"type": "string", "format": "uuid"},
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "1. Everything",
        "name": "Everything",
        "children": [
            {"type": "field", "definition": "/properties/attachments"},
        ],
    }
]

FORM_RULE_SCHEMA = {
    ##### VALIDATION RULES
    "attachments": {"gg_validation": {"rule": "attachment"}},
}

ProjectNarrativeAttachment_v1_2 = Form(
    # https://grants.gov/forms/form-items-description/fid/539
    form_id=uuid.UUID("32165da2-354d-42c0-a986-cf4f2f350039"),
    legacy_form_id=539,
    form_name="Project Narrative Attachment Form",
    short_form_name="ProjectNarrativeAttachments_1_2",
    form_version="1.2",
    agency_code="SGG",
    omb_number=None,
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    # No form instructions at the moment.
)
