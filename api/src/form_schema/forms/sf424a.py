import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "activity_line_items",
        "confirmation",
    ],
    "properties": {
        "activity_line_items": {
            "type": "array",
            "minItems": 1,
            "maxItems": 4,
            "items": {
                "type": "object",
                "required": ["activity_title"],
                "properties": {
                    "activity_title": {
                        # Activity title appears in multiple places on the form
                        # as a sort of header that is shared between several tables.
                        # * Section A - Column A
                        # * Section B - Row 6
                        # * Section C - Column A
                        # * Section E - Column A
                        "type": "string",
                        "minLength": 0,
                        "maxLength": 120,
                    },
                    "assistance_listing_number": {
                        # Section A - Column B
                        "type": "string",
                        "minLength": 0,
                        "maxLength": 15,
                    },
                    "budget_summary": {
                        # Section A
                        "allOf": [{"$ref": "#/$defs/budget_summary"}],
                    },
                    "budget_categories": {
                        # Section B
                        "allOf": [{"$ref": "#/$defs/budget_categories"}],
                    },
                    "non_federal_resources": {
                        # Section C
                        "allOf": [{"$ref": "#/$defs/non_federal_resources"}],
                    },
                    "federal_fund_estimates": {
                        # Section E
                        "allOf": [{"$ref": "#/$defs/federal_fund_estimates"}],
                    },
                },
            },
        },
        "total_budget_summary": {
            # Section A - Total Row (Column 5)
            "allOf": [{"$ref": "#/$defs/budget_summary"}],
        },
        "total_budget_categories": {
            # Section B - Total Column (Column 5)
            "allOf": [{"$ref": "#/$defs/budget_categories"}],
        },
        "total_non_federal_resources": {
            # Section C - Total Row (Line 12)
            "allOf": [{"$ref": "#/$defs/non_federal_resources"}],
        },
        "forecasted_cash_needs": {
            # Section D
            "type": "object",
            # No required fields
            "required": [],
            "properties": {
                "federal_forecasted_cash_needs": {
                    # Section D - Line 13
                    "allOf": [{"$ref": "#/$defs/forecasted_cash_needs"}],
                },
                "non_federal_forecasted_cash_needs": {
                    # Section D - Line 14
                    "allOf": [{"$ref": "#/$defs/forecasted_cash_needs"}],
                },
                "total_forecasted_cash_needs": {
                    # Section D - Line 15
                    "allOf": [{"$ref": "#/$defs/forecasted_cash_needs"}],
                },
            },
        },
        "total_federal_fund_estimates": {
            # Section E - Total Row (Line 20)
            "allOf": [{"$ref": "#/$defs/federal_fund_estimates"}],
            # No required fields
        },
        "direct_charges_explanation": {
            # Line 21
            "type": "string",
            "title": "Direct Charges",
            "description": "Use this space to explain amounts for individual direct object class cost categories that may appear to be out of the ordinary or to explain the details as required by the Federal grantor agency.",
            "minLength": 0,
            "maxLength": 50,
        },
        "indirect_charges_explanation": {
            # Line 22
            "type": "string",
            "title": "Indirect Charges",
            "description": "Enter the type of indirect rate (provisional, predetermined, final or fixed) that will be in effect during the funding period, the estimated amount of the base to which the rate is applied, and the total indirect expense.",
            "minLength": 0,
            "maxLength": 50,
        },
        "remarks": {
            # Line 23
            "type": "string",
            "title": "Remarks",
            "description": "Provide any other explanations or comments deemed necessary.",
            "minLength": 0,
            "maxLength": 250,
        },
        "confirmation": {
            "type": "boolean",
            "title": "Confirmation",
            "description": "Is this form complete?",
            "enum": [True],
        },
    },
    "$defs": {
        "budget_summary": {
            # Represents a row from Section A
            "type": "object",
            "properties": {
                "federal_estimated_unobligated_amount": {
                    # Column C
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "non_federal_estimated_unobligated_amount": {
                    # Column D
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "federal_new_or_revised_amount": {
                    # Column E
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "non_federal_new_or_revised_amount": {
                    # Column F
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "total_amount": {
                    # Column G
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
            },
        },
        "budget_categories": {
            # Represents a column from Section B
            "type": "object",
            # No required fields
            "required": [],
            "properties": {
                "personnel_amount": {
                    # Row A
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "fringe_benefits_amount": {
                    # Row B
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "travel_amount": {
                    # Row C
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "equipment_amount": {
                    # Row D
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "supplies_amount": {
                    # Row E
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "contractual_amount": {
                    # Row F
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "construction_amount": {
                    # Row G
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "other_amount": {
                    # Row H
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "total_direct_charge_amount": {
                    # Row I
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "total_indirect_charge_amount": {
                    # Row J
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "total_amount": {
                    # Row K
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "program_income_amount": {
                    # Line 7
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
            },
        },
        "non_federal_resources": {
            # Represents a row from Section C
            "type": "object",
            # No required fields
            "required": [],
            "properties": {
                "applicant_amount": {
                    # Column B
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "state_amount": {
                    # Column C
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "other_amount": {
                    # Column D
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "total_amount": {
                    # Column E
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
            },
        },
        "federal_fund_estimates": {
            # Represents a row from Section E
            "type": "object",
            # No required fields
            "required": [],
            "properties": {
                "first_year_amount": {
                    # Column B
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "second_year_amount": {
                    # Column C
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "third_year_amount": {
                    # Column D
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "fourth_year_amount": {
                    # Column E
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
            },
        },
        "forecasted_cash_needs": {
            # Represents a row from Section D
            "type": "object",
            # No required fields
            "required": [],
            "properties": {
                "first_quarter_amount": {
                    # Column 1st Quarter
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "second_quarter_amount": {
                    # Column 2nd Quarter
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "third_quarter_amount": {
                    # Column 3rd Quarter
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "fourth_quarter_amount": {
                    # Column 4th Quarter
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
                "total_amount": {
                    # Column Total for 1st Year
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                },
            },
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "name": "SectionA",
        "type": "section",
        "label": "Section A - Budget summary",
        "children": [
            {
                "type": "multiField",
                "name": "Budget424aSectionA",
                "widget": "Budget424aSectionA",
                "definition": [
                    "/properties/activity_line_items",
                    "/properties/total_budget_summary",
                ],
            }
        ],
    },
    {
        "name": "SectionB",
        "type": "section",
        "label": "Section B - Budget categories",
        "description": "Enter funds required for each object class category for the selected program.",
        "children": [
            {
                "type": "multiField",
                "name": "Budget424aSectionB",
                "widget": "Budget424aSectionB",
                "definition": [
                    "/properties/activity_line_items",
                    "/properties/total_budget_categories",
                ],
            }
        ],
    },
    {
        "name": "SectionC",
        "type": "section",
        "label": "Section C - Non-federal resources",
        "description": "Enter resources provided by the applicant, state, or other sources (e.g., donors) for the selected program.",
        "children": [
            {
                "type": "multiField",
                "name": "Budget424aSectionC",
                "widget": "Budget424aSectionC",
                "definition": [
                    "/properties/activity_line_items",
                    "/properties/total_non_federal_resources",
                ],
            }
        ],
    },
    {
        "name": "SectionD",
        "type": "section",
        "label": "Section D - Forecasted cash needs",
        "children": [
            {
                "type": "multiField",
                "name": "Budget424aSectionD",
                "widget": "Budget424aSectionD",
                "definition": ["/properties/forecasted_cash_needs"],
            }
        ],
    },
    {
        "name": "SectionE",
        "type": "section",
        "label": "Section E - Budget estimates of federal funds needed for balance of the project ",
        "children": [
            {
                "type": "multiField",
                "name": "Budget424aSectionE",
                "widget": "Budget424aSectionE",
                "definition": [
                    "/properties/activity_line_items",
                    "/properties/total_federal_fund_estimates",
                ],
            }
        ],
    },
    {
        "name": "SectionF",
        "type": "section",
        "label": "Section F - Other budget information",
        "children": [
            {
                "type": "multiField",
                "name": "Budget424aSectionF",
                "widget": "Budget424aSectionF",
                "definition": [
                    "/properties/direct_charges_explanation",
                    "/properties/indirect_charges_explanation",
                    "/properties/remarks",
                    "/properties/confirmation",
                ],
            }
        ],
    },
]

SF424a_v1_0 = Form(
    # https://grants.gov/forms/form-items-description/fid/241
    form_id=uuid.UUID("08e6603f-d197-4a60-98cd-d49acb1fc1fd"),
    legacy_form_id=241,
    form_name="Budget Information for Non-Construction Programs (SF-424A)",
    short_form_name="SF424A",
    form_version="1.0",
    agency_code="SGG",
    omb_number="4040-0006",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    # No rule schema yet, we'll likely but automated sums in this
    form_rule_schema=None,
    form_instruction_id=uuid.UUID("e89a8372-1a6e-43fb-897f-29c89f243f9e"),
    form_type=FormType.SF424A,
    sgg_version="1.0",
    is_deprecated=False,
)
