import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form

"""
Local demo form for FieldList min/max behavior development.

!! DO NOT SYNC TO PRODUCTION !!

This form is intentionally narrow in scope.

It exists to provide a controlled environment for testing:
- fully optional FieldLists
- minimum entry constraints
- maximum entry constraints
- add/remove control behavior
- group-level validation behavior

This file should remain separate from other sandbox forms so min/max
behavior can stay focused and easy to reason about.
"""

FORM_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        # ---------------------------------------------------------
        # Optional FieldList demo
        # ---------------------------------------------------------
        "project_websites": {
            "type": "array",
            "title": "Project Websites",
            "description": "Optional repeatable website list.",
            "minItems": 0,
            "maxItems": 3,
            "items": {
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "title": "Label",
                        "description": "Enter a short label for the website.",
                        "maxLength": 100,
                    },
                    "url": {
                        "type": "string",
                        "title": "URL",
                        "description": "Enter the website URL.",
                        "format": "uri",
                        "maxLength": 200,
                    },
                },
            },
        },
        # ---------------------------------------------------------
        # Max reached demo
        # ---------------------------------------------------------
        "partner_organizations": {
            "type": "array",
            "title": "Partner Organizations",
            "description": "Repeatable partner organization list with a max of 2.",
            "minItems": 0,
            "maxItems": 2,
            "items": {
                "type": "object",
                "required": [
                    "organization_name",
                ],
                "properties": {
                    "organization_name": {
                        "type": "string",
                        "title": "Organization Name",
                        "description": "Enter the partner organization name.",
                        "minLength": 1,
                        "maxLength": 200,
                    },
                    "role": {
                        "type": "string",
                        "title": "Role",
                        "description": "Describe the partner's role.",
                        "maxLength": 200,
                    },
                },
            },
        },
        # ---------------------------------------------------------
        # Min reached demo
        # ---------------------------------------------------------
        "primary_contacts": {
            "type": "array",
            "title": "Primary Contacts",
            "description": "Repeatable contact list with a minimum of 1 entry.",
            "minItems": 1,
            "maxItems": 3,
            "items": {
                "type": "object",
                "required": [
                    "first_name",
                    "email",
                ],
                "properties": {
                    "first_name": {
                        "type": "string",
                        "title": "First Name",
                        "description": "Enter the contact's first name.",
                        "minLength": 1,
                        "maxLength": 100,
                    },
                    "last_name": {
                        "type": "string",
                        "title": "Last Name",
                        "description": "Enter the contact's last name.",
                        "maxLength": 100,
                    },
                    "email": {
                        "type": "string",
                        "title": "Email",
                        "description": "Enter the contact's email address.",
                        "format": "email",
                    },
                },
            },
        },
    },
    "required": [
        "primary_contacts",
    ],
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "name": "optional_field_list_section",
        "label": "Optional FieldList",
        "children": [
            {
                "type": "fieldList",
                "name": "project_websites",
                "label": "Project Websites",
                "description": "Optional list. Starts with no entries. Max 3.",
                "children": [
                    {
                        "type": "field",
                        "definition": "/properties/project_websites/items/properties/label",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/project_websites/items/properties/url",
                    },
                ],
            },
        ],
    },
    {
        "type": "section",
        "name": "max_field_list_section",
        "label": "Max Reached FieldList",
        "children": [
            {
                "type": "fieldList",
                "name": "partner_organizations",
                "label": "Partner Organizations",
                "description": "Optional list with a maximum of 2 entries.",
                "children": [
                    {
                        "type": "field",
                        "definition": "/properties/partner_organizations/items/properties/organization_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/partner_organizations/items/properties/role",
                    },
                ],
            },
        ],
    },
    {
        "type": "section",
        "name": "min_field_list_section",
        "label": "Min Reached FieldList",
        "children": [
            {
                "type": "fieldList",
                "name": "primary_contacts",
                "label": "Primary Contacts",
                "description": "Required list. Starts with 1 blank entry. Max 3.",
                "children": [
                    {
                        "type": "field",
                        "definition": "/properties/primary_contacts/items/properties/first_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/primary_contacts/items/properties/last_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/primary_contacts/items/properties/email",
                    },
                ],
            },
        ],
    },
]

FORM_RULE_SCHEMA: dict[str, dict] = {}

FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "Local-only min/max FieldList demo form. Not intended for production XML generation.",
        "version": "1.0",
        "form_name": "FIELDLIST_MIN_MAX_DEMO_FORM",
        "namespaces": {},
        "xml_structure": {
            "root_element": "FIELDLIST_MIN_MAX_DEMO_FORM",
            "version": "1.0",
        },
    },
}

SANDBOX_FIELDLIST_MIN_MAX = Form(
    form_id=uuid.UUID("31e7a4fd-2b16-4d89-9f78-b7a9df48d421"),
    legacy_form_id=999003,
    form_name="FieldList Min Max Demo Form - DO NOT SYNC PRODUCTION",
    short_form_name="FIELDLIST_MIN_MAX_DEMO_DO_NOT_SYNC",
    form_version="1.0",
    agency_code="LOCAL",
    omb_number="LOCAL-FIELDLIST-MIN-MAX-DEMO",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("9c6d6c55-f2f7-4707-b36f-3b8652f0f8a1"),
    form_type=FormType.SF424,  # placeholder until a more appropriate local demo type exists
    sgg_version="1.0",
    is_deprecated=False,
)
