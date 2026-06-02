import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form

"""
Local demo form for FieldList widget development.

!! DO NOT SYNC TO PRODUCTION !!

This form exists purely for development and QA purposes.
"""

FORM_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "demo_text": {
            "type": "string",
            "title": "Demo Text",
            "description": "Required field to verify standard form validation still works.",
            "minLength": 1,
        },
        "contact_people_test": {
            "type": "array",
            "title": "Contact People",
            "description": "Tests minItems 2 / maxItems 3.",
            "minItems": 2,
            "maxItems": 3,
            "items": {
                "type": "object",
                "required": ["first_name"],
                "properties": {
                    "prefix": {"type": "string", "title": "Prefix"},
                    "first_name": {
                        "type": "string",
                        "title": "First Name",
                        "minLength": 1,
                    },
                    "last_name": {"type": "string", "title": "Last Name"},
                    "email": {
                        "type": "string",
                        "title": "Email",
                        "format": "email",
                    },
                },
            },
        },
        "project_addresses_test": {
            "type": "array",
            "title": "Project Addresses",
            "description": "Tests minItems 1 / maxItems 1.",
            "minItems": 1,
            "maxItems": 1,
            "items": {
                "type": "object",
                "required": ["street_1", "city", "state", "zip_code"],
                "properties": {
                    "address_type": {
                        "type": "string",
                        "title": "Address Type",
                        "enum": ["Primary", "Mailing", "Physical", "Project Site"],
                    },
                    "street_1": {
                        "type": "string",
                        "title": "Street Address 1",
                        "minLength": 1,
                    },
                    "city": {
                        "type": "string",
                        "title": "City",
                        "minLength": 1,
                    },
                    "state": {
                        "type": "string",
                        "title": "State",
                        "minLength": 2,
                        "maxLength": 2,
                    },
                    "zip_code": {
                        "type": "string",
                        "title": "ZIP Code",
                        "minLength": 5,
                        "maxLength": 10,
                    },
                },
            },
        },
        "budget_line_items_test": {
            "type": "array",
            "title": "Budget Line Items",
            "description": "Tests minItems 0 / maxItems 2.",
            "minItems": 0,
            "maxItems": 2,
            "items": {
                "type": "object",
                "required": ["category", "description", "quantity"],
                "properties": {
                    "category": {
                        "type": "string",
                        "title": "Category",
                        "enum": [
                            "Personnel",
                            "Equipment",
                            "Travel",
                            "Supplies",
                            "Other",
                        ],
                    },
                    "description": {
                        "type": "string",
                        "title": "Description",
                        "minLength": 1,
                    },
                    "quantity": {
                        "type": "number",
                        "title": "Quantity",
                        "minimum": 0,
                    },
                },
            },
        },
    },
    "required": ["demo_text"],
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "name": "field_list_demos",
        "label": "FieldList Demos",
        "children": [
            {
                "type": "field",
                "definition": "/properties/demo_text",
            },
            {
                "type": "fieldList",
                "name": "contact_people_test",
                "label": "Contact People",
                "description": "Tests two initial entries, max of three, and required child errors.",
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
                        "definition": "/properties/contact_people_test/items/properties/last_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/contact_people_test/items/properties/email",
                    },
                ],
            },
            {
                "type": "fieldList",
                "name": "project_addresses_test",
                "label": "Project Addresses",
                "description": "Tests delete blocked at one entry and add blocked at one entry.",
                "children": [
                    {
                        "type": "field",
                        "definition": "/properties/project_addresses_test/items/properties/address_type",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/project_addresses_test/items/properties/street_1",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/project_addresses_test/items/properties/city",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/project_addresses_test/items/properties/state",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/project_addresses_test/items/properties/zip_code",
                    },
                ],
            },
            {
                "type": "fieldList",
                "name": "budget_line_items_test",
                "label": "Budget Line Items",
                "description": "Tests zero initial entries, add behavior, max of two, and required child errors.",
                "children": [
                    {
                        "type": "field",
                        "definition": "/properties/budget_line_items_test/items/properties/category",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/budget_line_items_test/items/properties/description",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/budget_line_items_test/items/properties/quantity",
                    },
                ],
            },
        ],
    },
]

FORM_RULE_SCHEMA: dict[str, dict] = {}

FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "Local-only FieldList demo form. Not intended for production XML generation.",
        "version": "1.0",
        "form_name": "FIELDLIST_DEMO_FORM",
        "namespaces": {},
        "xml_structure": {
            "root_element": "FIELDLIST_DEMO_FORM",
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
    form_type=FormType.SF424,
    sgg_version="1.0",
    is_deprecated=False,
)
