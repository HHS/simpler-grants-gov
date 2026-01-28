import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

INSTRUCTIONS = (
    "Instructions: On this form, you will attach the various files that "
    "make up your grant application. Please consult with the appropriate "
    "Agency Guidelines for more information about each needed file. "
    "Please remember that any files you attach must be in the document format "
    "and named as specified in the Guidelines."
)

IMPORTANT = (
    "Important: Please attach your files in the proper sequence."
    " See the appropriate Agency Guidelines for details."
)

FORM_JSON_SCHEMA = {
    "type": "object",
    # No required fields
    "properties": {
        "att1": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 1",
            "description": "First attachment file",
        },
        "att2": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 2",
            "description": "Second attachment file",
        },
        "att3": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 3",
            "description": "Third attachment file",
        },
        "att4": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 4",
            "description": "Fourth attachment file",
        },
        "att5": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 5",
            "description": "Fifth attachment file",
        },
        "att6": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 6",
            "description": "Sixth attachment file",
        },
        "att7": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 7",
            "description": "Seventh attachment file",
        },
        "att8": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 8",
            "description": "Eighth attachment file",
        },
        "att9": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 9",
            "description": "Ninth attachment file",
        },
        "att10": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 10",
            "description": "Tenth attachment file",
        },
        "att11": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 11",
            "description": "Eleventh attachment file",
        },
        "att12": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 12",
            "description": "Twelfth attachment file",
        },
        "att13": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 13",
            "description": "Thirteenth attachment file",
        },
        "att14": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 14",
            "description": "Fourteenth attachment file",
        },
        "att15": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Attachment 15",
            "description": "Fifteenth attachment file",
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "",
        "name": "instructions",
        "description": INSTRUCTIONS,
        "children": [],
    },
    {
        "type": "section",
        "label": "",
        "name": "important",
        "description": IMPORTANT,
        "children": [],
    },
    {
        "type": "section",
        "label": "1) Attachment 1",
        "name": "attachment1",
        "children": [
            {"type": "field", "definition": "/properties/att1", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "2) Attachment 2",
        "name": "attachment2",
        "children": [
            {"type": "field", "definition": "/properties/att2", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "3) Attachment 3",
        "name": "attachment3",
        "children": [
            {"type": "field", "definition": "/properties/att3", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "4) Attachment 4",
        "name": "attachment4",
        "children": [
            {"type": "field", "definition": "/properties/att4", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "5) Attachment 5",
        "name": "attachment5",
        "children": [
            {"type": "field", "definition": "/properties/att5", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "6) Attachment 6",
        "name": "attachment6",
        "children": [
            {"type": "field", "definition": "/properties/att6", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "7) Attachment 7",
        "name": "attachment7",
        "children": [
            {"type": "field", "definition": "/properties/att7", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "8) Attachment 8",
        "name": "attachment8",
        "children": [
            {"type": "field", "definition": "/properties/att8", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "9) Attachment 9",
        "name": "attachment9",
        "children": [
            {"type": "field", "definition": "/properties/att9", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "10) Attachment 10",
        "name": "attachment10",
        "children": [
            {"type": "field", "definition": "/properties/att10", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "11) Attachment 11",
        "name": "attachment11",
        "children": [
            {"type": "field", "definition": "/properties/att11", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "12) Attachment 12",
        "name": "attachment12",
        "children": [
            {"type": "field", "definition": "/properties/att12", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "13) Attachment 13",
        "name": "attachment13",
        "children": [
            {"type": "field", "definition": "/properties/att13", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "14) Attachment 14",
        "name": "attachment14",
        "children": [
            {"type": "field", "definition": "/properties/att14", "widget": "Attachment"},
        ],
    },
    {
        "type": "section",
        "label": "15) Attachment 15",
        "name": "attachment15",
        "children": [
            {"type": "field", "definition": "/properties/att15", "widget": "Attachment"},
        ],
    },
]

FORM_RULE_SCHEMA = {
    ##### VALIDATION RULES
    "att1": {"gg_validation": {"rule": "attachment"}},
    "att2": {"gg_validation": {"rule": "attachment"}},
    "att3": {"gg_validation": {"rule": "attachment"}},
    "att4": {"gg_validation": {"rule": "attachment"}},
    "att5": {"gg_validation": {"rule": "attachment"}},
    "att6": {"gg_validation": {"rule": "attachment"}},
    "att7": {"gg_validation": {"rule": "attachment"}},
    "att8": {"gg_validation": {"rule": "attachment"}},
    "att9": {"gg_validation": {"rule": "attachment"}},
    "att10": {"gg_validation": {"rule": "attachment"}},
    "att11": {"gg_validation": {"rule": "attachment"}},
    "att12": {"gg_validation": {"rule": "attachment"}},
    "att13": {"gg_validation": {"rule": "attachment"}},
    "att14": {"gg_validation": {"rule": "attachment"}},
    "att15": {"gg_validation": {"rule": "attachment"}},
}

FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for Attachment form",
        "version": "1.0",
        "form_name": "AttachmentForm_1_2",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/AttachmentForm_1_2-V1.2.xsd",
        "xml_structure": {
            "root_element": "AttachmentForm_1_2",
            "root_attributes": {
                "FormVersion": "1.2",  # Static value required by XSD
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
        },
        "attachment_fields": {
            "att1": {
                "xml_element": "ATT1",
                "type": "single_with_wrapper",
            },
            "att2": {
                "xml_element": "ATT2",
                "type": "single_with_wrapper",
            },
            "att3": {
                "xml_element": "ATT3",
                "type": "single_with_wrapper",
            },
            "att4": {
                "xml_element": "ATT4",
                "type": "single_with_wrapper",
            },
            "att5": {
                "xml_element": "ATT5",
                "type": "single_with_wrapper",
            },
            "att6": {
                "xml_element": "ATT6",
                "type": "single_with_wrapper",
            },
            "att7": {
                "xml_element": "ATT7",
                "type": "single_with_wrapper",
            },
            "att8": {
                "xml_element": "ATT8",
                "type": "single_with_wrapper",
            },
            "att9": {
                "xml_element": "ATT9",
                "type": "single_with_wrapper",
            },
            "att10": {
                "xml_element": "ATT10",
                "type": "single_with_wrapper",
            },
            "att11": {
                "xml_element": "ATT11",
                "type": "single_with_wrapper",
            },
            "att12": {
                "xml_element": "ATT12",
                "type": "single_with_wrapper",
            },
            "att13": {
                "xml_element": "ATT13",
                "type": "single_with_wrapper",
            },
            "att14": {
                "xml_element": "ATT14",
                "type": "single_with_wrapper",
            },
            "att15": {
                "xml_element": "ATT15",
                "type": "single_with_wrapper",
            },
        },
    },
    # No explicit field mapping needed - attachments are handled automatically via attachment_fields config
}

AttachmentForm_v1_2 = Form(
    # https://grants.gov/forms/form-items-description/fid/540
    form_id=uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
    legacy_form_id=540,
    form_name="Attachment Form",
    short_form_name="AttachmentForm_1_2",
    form_version="1.2",
    agency_code="SGG",
    omb_number=None,
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=None,
    form_type=FormType.ATTACHMENT_FORM,
    sgg_version="1.0",
    is_deprecated=False,
)
