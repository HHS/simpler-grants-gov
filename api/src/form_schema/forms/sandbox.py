import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

"""
Local demo form for FieldList widget development.

!! DO NOT SYNC TO PRODUCTION !!

This form exists purely for development and QA purposes.

It provides a controlled environment to test:
- widget rendering
- validation behavior
- print view
- FieldList functionality

This form should NOT be synced to production environments.
"""

FORM_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        # -----------------------------
        # Basic inputs
        # -----------------------------
        "demo_text": {
            "type": "string",
            "title": "Demo Text",
            "description": "Basic single-line text input.",
            "minLength": 1,
            "maxLength": 100,
        },
        "demo_textarea": {
            "type": "string",
            "title": "Demo Text Area",
            "description": "Long-form text input for textarea behavior.",
            "minLength": 1,
            "maxLength": 1000,
        },
        "demo_email": {
            "type": "string",
            "title": "Demo Email",
            "description": "Email input demo.",
            "format": "email",
        },
        "demo_date": {
            "type": "string",
            "title": "Demo Date",
            "description": "Date input demo.",
            "format": "date",
        },
        # -----------------------------
        # Choice inputs
        # -----------------------------
        "demo_checkbox": {
            "type": "boolean",
            "title": "Demo Checkbox",
            "description": "Boolean checkbox demo.",
        },
        "demo_select": {
            "type": "string",
            "title": "Demo Select",
            "description": "Single-select dropdown demo.",
            "enum": [
                "Option A",
                "Option B",
                "Option C",
            ],
        },
        "demo_multiselect": {
            "type": "array",
            "title": "Demo MultiSelect",
            "description": "Multi-select demo.",
            "items": {
                "type": "string",
                "enum": [
                    "Choice 1",
                    "Choice 2",
                    "Choice 3",
                    "Choice 4",
                ],
            },
            "minItems": 1,
            "maxItems": 4,
        },
        "demo_radio": {
            "type": "boolean",
            "title": "Demo Radio",
            "description": "Boolean radio demo.",
        },
        # -----------------------------
        # Attachments
        # -----------------------------
        "demo_attachment": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Demo Attachment",
            "description": "Single attachment widget demo.",
        },
        "demo_attachment_array": {
            "type": "array",
            "title": "Demo Attachment Array",
            "description": "Multiple attachment widget demo.",
            "maxItems": 10,
            "items": {
                "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            },
        },
        # -----------------------------
        # Read-only / print / null-ish
        # -----------------------------
        "demo_read_only_text": {
            "type": "string",
            "title": "Demo Read Only Text",
            "description": "Read-only field demo.",
            "readOnly": True,
        },
        "demo_print_value": {
            "type": "string",
            "title": "Demo Print Value",
            "description": "Useful for validating print rendering behavior.",
        },
        # -----------------------------
        # FieldList demos
        # -----------------------------
        "contact_people_test": {
            "type": "array",
            "title": "Contact People",
            "description": "Repeatable contact people demo for FieldList.",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["first_name"],
                "properties": {
                    "prefix": {
                        "type": "string",
                        "title": "Prefix",
                    },
                    "first_name": {
                        "type": "string",
                        "title": "First Name",
                        "minLength": 1,
                    },
                    "middle_name": {
                        "type": "string",
                        "title": "Middle Name",
                    },
                    "last_name": {
                        "type": "string",
                        "title": "Last Name",
                    },
                    "suffix": {
                        "type": "string",
                        "title": "Suffix",
                    },
                    "contact_person_title": {
                        "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
                        "title": "Title",
                        "description": "Enter the position title.",
                    },
                    "organization_affiliation": {
                        "type": "string",
                        "title": "Organizational Affiliation",
                        "description": "Enter the organization if different from the applicant organization.",
                        "minLength": 1,
                        "maxLength": 60,
                    },
                    "phone_number": {
                        "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
                        "title": "Telephone Number",
                        "description": "Enter the daytime Telephone Number.",
                    },
                    "fax": {
                        "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
                        "title": "Fax Number",
                        "description": "Enter the fax Number.",
                    },
                    "email": {
                        "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_email")}],
                        "title": "Email",
                        "description": "Enter a valid email Address.",
                    },
                },
            },
        },
    },
    "required": [
        "demo_text",
        "demo_email",
        "demo_select",
        "contact_people_test",
    ],
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "name": "basic_inputs",
        "label": "Basic Inputs",
        "children": [
            {
                "type": "field",
                "definition": "/properties/demo_text",
            },
            {
                "type": "field",
                "definition": "/properties/demo_textarea",
            },
            {
                "type": "field",
                "definition": "/properties/demo_email",
            },
            {
                "type": "field",
                "definition": "/properties/demo_date",
            },
        ],
    },
    {
        "type": "section",
        "name": "choice_inputs",
        "label": "Choice Inputs",
        "children": [
            {
                "type": "field",
                "definition": "/properties/demo_checkbox",
            },
            {
                "type": "field",
                "definition": "/properties/demo_select",
            },
            {
                "type": "field",
                "definition": "/properties/demo_multiselect",
            },
            {
                "type": "field",
                "definition": "/properties/demo_radio",
                "widget": "Radio",
            },
        ],
    },
    {
        "type": "section",
        "name": "attachments",
        "label": "Attachments",
        "children": [
            {
                "type": "field",
                "definition": "/properties/demo_attachment",
                "widget": "Attachment",
            },
            {
                "type": "field",
                "definition": "/properties/demo_attachment_array",
                "widget": "AttachmentArray",
            },
        ],
    },
    {
        "type": "section",
        "name": "read_only_and_print",
        "label": "Read Only and Print",
        "children": [
            {
                "type": "field",
                "definition": "/properties/demo_read_only_text",
            },
            {
                "type": "field",
                "definition": "/properties/demo_print_value",
            },
        ],
    },
    {
        "type": "section",
        "name": "field_list_demos",
        "label": "FieldList Demos",
        "children": [
            {
                "type": "fieldList",
                "name": "contact_people_test",
                "label": "Contact People",
                "description": "Repeatable contact people demo.",
                "defaultSize": 1,
                "children": [
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/prefix",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/first_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/middle_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/last_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/suffix",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/contact_person_title",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/organization_affiliation",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/phone_number",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/fax",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/email",
                    },
                ],
            },
        ],
    },
]

FORM_RULE_SCHEMA: dict[str, dict] = {}

FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "Local-only widget demo form. Not intended for production XML generation.",
        "version": "1.0",
        "form_name": "WIDGET_DEMO_FORM",
        "namespaces": {},
        "xml_structure": {
            "root_element": "WIDGET_DEMO_FORM",
            "version": "1.0",
        },
    },
}

SANDBOX = Form(
    form_id=uuid.UUID("d9d3e9a1-5b5e-4b36-a8b2-9c61c9d2b3b1"),
    legacy_form_id=999001,
    form_name="FieldList Demo Form - DO NOT SYNC PRODUCTION",
    short_form_name="FIELDLIST_DEMO_DO_NOT_SYNC",
    form_version="1.0",
    agency_code="LOCAL",
    omb_number="LOCAL-DEMO",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("b8d44b2a-36c8-4e41-9f47-b3c5c7c7a9b0"),
    form_type=FormType.SF424,  # placeholder until a generic demo type exists
    sgg_version="1.0",
    is_deprecated=False,
)
