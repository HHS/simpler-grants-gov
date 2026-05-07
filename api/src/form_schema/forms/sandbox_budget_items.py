import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form

"""
Local demo form for budget item FieldList development.

!! DO NOT SYNC TO PRODUCTION !!

This form is intentionally narrow in scope.

It exists to provide a controlled environment for testing:
- repeatable budget item rows
- row add/remove behavior
- validation behavior
- total cost interactions
- future SessionProvider integration

This file should remain separate from the broader sandbox form so the
budget item demo can stay focused and easy to reason about.
"""

FORM_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        # ---------------------------------------------------------
        # Budget items demo
        # ---------------------------------------------------------
        # This section models a small, repeatable set of budget rows
        # inspired by equipment / contractual grant budget entries.
        "budget_items": {
            "type": "array",
            "title": "Budget Items",
            "description": "Repeatable budget item demo for FieldList.",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": [
                    "item_name",
                    "quantity",
                    "unit_cost",
                ],
                "properties": {
                    "item_name": {
                        "type": "string",
                        "title": "Item Name",
                        "description": "Enter the name of the budget item.",
                        "minLength": 1,
                        "maxLength": 200,
                    },
                    "description": {
                        "type": "string",
                        "title": "Description",
                        "description": "Provide a short description of the item and its purpose.",
                        "maxLength": 500,
                    },
                    "quantity": {
                        "type": "number",
                        "title": "Quantity",
                        "description": "Enter the number of units.",
                        "minimum": 0,
                    },
                    "unit_cost": {
                        "type": "number",
                        "title": "Unit Cost",
                        "description": "Enter the cost per unit.",
                        "minimum": 0,
                    },
                    "total_cost": {
                        "type": "number",
                        "title": "Total Cost",
                        "description": (
                            "Auto-calculated from quantity × unit cost by default. "
                            "Can be manually overridden in the demo experience."
                        ),
                        "minimum": 0,
                    },
                },
            },
        },
    },
    "required": [
        "budget_items",
    ],
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "name": "budget_items_section",
        "label": "Budget Items",
        "children": [
            {
                "type": "fieldList",
                "name": "budget_items",
                "label": "Budget Items",
                "description": "Add and manage repeatable budget line items.",
                "children": [
                    {
                        "type": "field",
                        "definition": "/properties/budget_items/items/properties/item_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/budget_items/items/properties/description",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/budget_items/items/properties/quantity",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/budget_items/items/properties/unit_cost",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/budget_items/items/properties/total_cost",
                    },
                ],
            },
        ],
    },
]

FORM_RULE_SCHEMA: dict[str, dict] = {}

FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "Local-only budget item demo form. Not intended for production XML generation.",
        "version": "1.0",
        "form_name": "BUDGET_ITEMS_DEMO_FORM",
        "namespaces": {},
        "xml_structure": {
            "root_element": "BUDGET_ITEMS_DEMO_FORM",
            "version": "1.0",
        },
    },
}

SANDBOX_BUDGET_ITEMS = Form(
    form_id=uuid.UUID("7b3b5f41-3f24-4f95-9e9d-29d3f5a67c11"),
    legacy_form_id=999002,
    form_name="Budget Items Demo Form - DO NOT SYNC PRODUCTION",
    short_form_name="BUDGET_ITEMS_DEMO_DO_NOT_SYNC",
    form_version="1.0",
    agency_code="LOCAL",
    omb_number="LOCAL-BUDGET-DEMO",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("d8ab1b70-4f55-4b43-a2b7-1d2b7e6f9082"),
    form_type=FormType.SF424,  # placeholder until a more appropriate local demo type exists
    sgg_version="1.0",
    is_deprecated=False,
)
