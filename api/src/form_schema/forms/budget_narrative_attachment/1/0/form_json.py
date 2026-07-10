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
            "title": "Budget Narrative Files",
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
        "label": "1. Budget Narrative File(s)",
        "name": "budgetNarrativeFiles",
        "children": [
            {"type": "field", "definition": "/properties/attachments", "widget": "AttachmentArray"},
        ],
    }
]

FORM_RULE_SCHEMA = {
    ##### VALIDATION RULES
    "attachments": {"gg_validation": {"rule": "attachment"}},
}

FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for Budget Narrative Attachments form",
        "version": "1.0",
        "form_name": "BudgetNarrativeAttachments_1_2",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/BudgetNarrativeAttachments_1_2-V1.2",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/BudgetNarrativeAttachments_1_2-V1.2.xsd",
        "xml_structure": {
            "root_element": "BudgetNarrativeAttachments_1_2",
            "root_attributes": {
                "FormVersion": "1.2",  # Static value required by XSD
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
        },
        "attachment_fields": {
            "attachments": {
                "xml_element": "Attachments",
                "type": "multiple",
            },
        },
    },
    # No explicit field mapping needed - attachments are handled automatically via attachment_fields config
}

BudgetNarrativeAttachment_v1_2 = Form(
    # https://grants.gov/forms/form-items-description/fid/543
    form_id=uuid.UUID("66092260-d3c2-4427-8fd2-bb14e1590aff"),
    legacy_form_id=543,
    form_name="Budget Narrative Attachment Form",
    short_form_name="BudgetNarrativeAttachments_1_2",
    form_version="1.2",
    agency_code="SGG",
    omb_number=None,
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("2bf892d2-dbba-4126-a71c-b4b8ea2f2908"),
    form_type=FormType.BUDGET_NARRATIVE_ATTACHMENT,
    sgg_version="1.0",
    is_deprecated=False,
)
