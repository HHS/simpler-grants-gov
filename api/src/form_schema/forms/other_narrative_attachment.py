import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": ["attachments"],
    "properties": {
        "attachments": {
            "type": "array",
            "title": "Other Narrative Files",
            "description": "At least one file must be attached",
            "minItems": 1,
            "maxItems": 100,
            "items": {"allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}]},
        }
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "1. Other Narrative File(s)",
        "name": "otherNarrativeFiles",
        "children": [
            {"type": "field", "definition": "/properties/attachments", "widget": "AttachmentArray"},
        ],
    }
]

FORM_RULE_SCHEMA = {
    ##### VALIDATION RULES
    "attachments": {"gg_validation": {"rule": "attachment"}},
}

OtherNarrativeAttachment_v1_2 = Form(
    # https://grants.gov/forms/form-items-description/fid/542
    form_id=uuid.UUID("8899954c-2919-4398-96aa-73961179fe16"),
    legacy_form_id=542,
    form_name="Other Narrative Attachments",
    short_form_name="OtherNarrativeAttachments",
    form_version="1.2",
    agency_code="SGG",
    omb_number=None,
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    form_instruction_id=uuid.UUID("63a8c6da-faf0-4634-8034-af4f0ce3ed08"),
    form_type=FormType.OTHER_NARRATIVE_ATTACHMENT,
    sgg_version="1.0",
    is_deprecated=False,
)
