import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form

"""
Local demo form for Table widget development.
!! DO NOT SYNC TO PRODUCTION !!
This form exists purely for development and QA purposes.
It provides a controlled environment to test:
- table UI schema validation
- table config generation
- table structure and desktop rendering
- future table cell behavior


Rows contain cells in the same order as the configured table columns.
This form should NOT be synced to production environments.
"""
FORM_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "administrative_federal_share": {
            "type": "number",
            "title": "Administrative Federal Share",
            "minimum": 0,
        },
        "administrative_non_federal_share": {
            "type": "number",
            "title": "Administrative Non-Federal Share",
            "minimum": 0,
            "readOnly": True,
        },
        "construction_federal_share": {
            "type": "number",
            "title": "Construction Federal Share",
            "minimum": 0,
        },
        "construction_non_federal_share": {
            "type": "number",
            "title": "Construction Non-Federal Share",
            "minimum": 0,
            "readOnly": True,
        },
    },
    "required": [
        "administrative_federal_share",
        "construction_federal_share",
    ],
}


FORM_UI_SCHEMA = [
    {
        "type": "section",
        "name": "table_demo",
        "label": "Table Demo",
        "description": (
            "Temporary local-only Table configuration demo using SF424C-style "
            "construction budget categories. Table structure is currently rendered; "
            "cell behavior is in progress."
        ),
        "children": [
            {
                "type": "multiField",
                "name": "construction_budget_table",
                "widget": "Table",
                "definition": [
                    "/properties/administrative_federal_share",
                    "/properties/administrative_non_federal_share",
                    "/properties/construction_federal_share",
                    "/properties/construction_non_federal_share",
                ],
                "children": {
                    "columns": [
                        {
                            "columnHeader": "Budget Category",
                            "width": 22,
                        },
                        {
                            "columnHeader": "Federal Share",
                            "width": 11,
                        },
                        {
                            "columnHeader": "Non-Federal Share",
                            "width": 11,
                        },
                        {
                            "columnHeader": "Total",
                            "width": 11,
                        },
                        {
                            "columnHeader": "Year 1",
                            "width": 11,
                        },
                        {
                            "columnHeader": "Year 2",
                            "width": 11,
                        },
                        {
                            "columnHeader": "Year 3",
                            "width": 11,
                        },
                        {
                            "columnHeader": "Year 4",
                            "width": 11,
                        },
                    ],
                    "rows": [
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "Administrative and legal expenses ",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/administrative_federal_share",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/administrative_non_federal_share",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "Construction ",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/construction_federal_share",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/construction_non_federal_share",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                                {
                                    "type": "plainText",
                                    "staticContent": "—",
                                },
                            ],
                        },
                        *[
                            {
                                "cells": [
                                    {
                                        "type": "plainText",
                                        "staticContent": row_name,
                                    },
                                    {
                                        "type": "input",
                                        "definition": "/properties/construction_federal_share",
                                    },
                                    {
                                        "type": "plainText",
                                        "staticContent": "—",
                                    },
                                    {
                                        "type": "plainText",
                                        "staticContent": "—",
                                    },
                                    {
                                        "type": "input",
                                        "definition": "/properties/construction_federal_share",
                                    },
                                    {
                                        "type": "plainText",
                                        "staticContent": "—",
                                    },
                                    {
                                        "type": "plainText",
                                        "staticContent": "—",
                                    },
                                    {
                                        "type": "plainText",
                                        "staticContent": "—",
                                    },
                                ],
                            }
                            for row_name in [
                                "Land, structures, rights-of-way, and appraisals",
                                "Relocation expenses and payments",
                                "Architectural and engineering fees",
                                "Other architectural and engineering fees",
                                "Project inspection fees",
                                "Site work",
                                "Demolition and removal",
                                "Equipment",
                                "Miscellaneous",
                                *[
                                    f"Additional Test Row {row_number}"
                                    for row_number in range(12, 51)
                                ],
                            ]
                        ],
                    ],
                },
            },
        ],
    },
]


FORM_RULE_SCHEMA: dict[str, dict] = {}


FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "Local-only Table demo form. Not intended for production XML generation.",
        "version": "1.0",
        "form_name": "TABLE_DEMO_FORM",
        "namespaces": {},
        "xml_structure": {
            "root_element": "TABLE_DEMO_FORM",
            "version": "1.0",
        },
    },
}


SANDBOX_TABLE = Form(
    form_id=uuid.UUID("d418c13c-ea9b-40f7-bb26-f856c73a8449"),
    legacy_form_id=999003,
    form_name="Table Demo Form - DO NOT SYNC PRODUCTION",
    short_form_name="TABLE_DEMO_DO_NOT_SYNC",
    form_version="1.0",
    agency_code="LOCAL",
    omb_number="LOCAL-TABLE-DEMO",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("e6436fd7-50f8-418a-a5f1-55d5cb940ac7"),
    form_type=FormType.SF424,
    sgg_version="1.0",
    is_deprecated=False,
)
