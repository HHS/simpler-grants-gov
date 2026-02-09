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


FORM_RULE_SCHEMA = {
    ##### PRE-POPULATION RULES
    "activity_line_items": {
        # Marking this as an array means each line item that exists
        # will have rules run on them iteratively.
        # For each of these we use "@THIS." to tell it to do a relative
        # path within the same array that we're summing to.
        "gg_type": "array",
        "budget_summary": {
            # Section A - Budget Summary: Total amount (Column G, Rows 1-4)
            # is the sum of Columns C-G within the same row.
            "total_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "@THIS.federal_estimated_unobligated_amount",
                        "@THIS.non_federal_estimated_unobligated_amount",
                        "@THIS.federal_new_or_revised_amount",
                        "@THIS.non_federal_new_or_revised_amount",
                    ],
                }
            },
        },
        "budget_categories": {
            # Section B - Budget Categories: Total direct charge amount (Row 6I, Columns 1-4)
            # is the sum of Rows 6A-6H within the same column.
            "total_direct_charge_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "@THIS.personnel_amount",
                        "@THIS.fringe_benefits_amount",
                        "@THIS.travel_amount",
                        "@THIS.equipment_amount",
                        "@THIS.supplies_amount",
                        "@THIS.contractual_amount",
                        "@THIS.construction_amount",
                        "@THIS.other_amount",
                    ],
                }
            },
            # Section B - Budget Categories: Total amount (Row 6K, Columns 1-4)
            # is the sum of Rows 6I+6J within the same column.
            "total_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "@THIS.total_direct_charge_amount",
                        "@THIS.total_indirect_charge_amount",
                    ],
                    # This rule needs to run after we calculate the total_direct_charge_amount above
                    "order": 2,
                }
            },
        },
        "non_federal_resources": {
            # Section C - Non-federal resources: Total Amount (Column E, Rows 8-11)
            # is the sum of Columns B-D within the same row.
            "total_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "@THIS.applicant_amount",
                        "@THIS.state_amount",
                        "@THIS.other_amount",
                    ],
                }
            }
        },
    },
    "total_budget_summary": {
        # Section A - Budget Summary: Total Federal Estimated Unobligated Funds (Column C, Row 5)
        # is the sum of (Column C, Rows 1-4)
        "federal_estimated_unobligated_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": [
                    "activity_line_items[*].budget_summary.federal_estimated_unobligated_amount"
                ],
            }
        },
        # Section A - Budget Summary: Total Non-Federal Estimated Unobligated Funds (Column D, Row 5)
        # is the sum of (Column D, Rows 1-4)
        "non_federal_estimated_unobligated_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": [
                    "activity_line_items[*].budget_summary.non_federal_estimated_unobligated_amount"
                ],
            }
        },
        # Section A - Budget Summary: Total Federal New or Revised Budget (Column E, Row 5)
        # is the sum of (Column E, Rows 1-4)
        "federal_new_or_revised_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_summary.federal_new_or_revised_amount"],
            }
        },
        # Section A - Budget Summary: Total Federal New or Revised Budget (Column F, Row 5)
        # is the sum of (Column F, Rows 1-4)
        "non_federal_new_or_revised_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": [
                    "activity_line_items[*].budget_summary.non_federal_new_or_revised_amount"
                ],
            }
        },
        # Section A - Total Amount (Column E, Row 5)
        # is the sum of (Column E, Rows 1-4)
        "total_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_summary.total_amount"],
                # Run this in the 2nd iteration after the total_amount of the activity line items is calculated
                "order": 2,
            }
        },
    },
    "total_budget_categories": {
        # Section B - Budget Categories: Total Personnel Amount (Row A, Column 5)
        # is the sum of (Row A, Columns 1-4)
        "personnel_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.personnel_amount"],
            }
        },
        # Section B - Budget Categories: Total Fringe Benefits Amount (Row B, Column 5)
        # is the sum of (Row B, Columns 1-4)
        "fringe_benefits_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.fringe_benefits_amount"],
            }
        },
        # Section B - Budget Categories: Total Travel Amount (Row C, Column 5)
        # is the sum of (Row C, Columns 1-4)
        "travel_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.travel_amount"],
            }
        },
        # Section B - Budget Categories: Total Equipment Amount (Row D, Column 5)
        # is the sum of (Row D, Columns 1-4)
        "equipment_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.equipment_amount"],
            }
        },
        # Section B - Budget Categories: Total Supplies Amount (Row E, Column 5)
        # is the sum of (Row E, Columns 1-4)
        "supplies_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.supplies_amount"],
            }
        },
        # Section B - Budget Categories: Total Contractual Amount (Row F, Column 5)
        # is the sum of (Row F, Columns 1-4)
        "contractual_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.contractual_amount"],
            }
        },
        # Section B - Budget Categories: Total Construction Amount (Row G, Column 5)
        # is the sum of (Row G, Columns 1-4)
        "construction_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.construction_amount"],
            }
        },
        # Section B - Budget Categories: Total Other Amount (Row H, Column 5)
        # is the sum of (Row H, Columns 1-4)
        "other_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.other_amount"],
            }
        },
        # Section B - Budget Categories: Total Direct Charges Amount (Row I, Column 5)
        # is the sum of (Row I, Columns 1-4)
        "total_direct_charge_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.total_direct_charge_amount"],
                # Needs to run after we calculate this in the activity line items
                "order": 2,
            }
        },
        # Section B - Budget Categories: Total Indirect Charges Amount (Row J, Column 5)
        # is the sum of (Row j, Columns 1-4)
        "total_indirect_charge_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.total_indirect_charge_amount"],
            }
        },
        # Section B - Budget Categories: Total Amount (Row K, Column 5)
        # is the sum of (Row K, Columns 1-4)
        "total_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.total_amount"],
                # This needs to run after we calculate the total amount in the activity line items
                # which happens in the 2nd iteration.
                "order": 3,
            }
        },
        # Section B - Budget Categories: Program Income (Row 7, Column 5)
        # is the sum of (Row 7, Columns 1-4)
        "program_income_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].budget_categories.program_income_amount"],
            }
        },
    },
    "total_non_federal_resources": {
        # Section C - Non-federal Resources: Total Applicant Amount (Row 12, Column B)
        # is the sum of (Column B, Rows 8-11)
        "applicant_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].non_federal_resources.applicant_amount"],
            }
        },
        # Section C - Non-federal Resources: Total State Amount (Row 12, Column C)
        # is the sum of (Column C, Rows 8-11)
        "state_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].non_federal_resources.state_amount"],
            }
        },
        # Section C - Non-federal Resources: Total Other Amount (Row 12, Column D)
        # is the sum of (Column D, Rows 8-11)
        "other_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].non_federal_resources.other_amount"],
            }
        },
        # Section C - Non-federal Resources: Total Amount (Row 12, Column E)
        # is the sum of (Column E, Rows 8-11)
        "total_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].non_federal_resources.total_amount"],
                # Needs to be calculated after the value from activity line items
                "order": 2,
            }
        },
    },
    "forecasted_cash_needs": {
        "federal_forecasted_cash_needs": {
            # Section D - Forecasted Cash Needs: Federal Total (Column E, Row 13)
            # is the sum of (Row 13, Columns A-D)
            "total_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "@THIS.first_quarter_amount",
                        "@THIS.second_quarter_amount",
                        "@THIS.third_quarter_amount",
                        "@THIS.fourth_quarter_amount",
                    ],
                }
            }
        },
        "non_federal_forecasted_cash_needs": {
            # Section D - Forecasted Cash Needs: Non-Federal Total (Column E, Row 14)
            # is the sum of (Row 14, Columns A-D)
            "total_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "@THIS.first_quarter_amount",
                        "@THIS.second_quarter_amount",
                        "@THIS.third_quarter_amount",
                        "@THIS.fourth_quarter_amount",
                    ],
                }
            }
        },
        "total_forecasted_cash_needs": {
            # Section D - Forecasted Cash Needs: 1st Quarter Total (Row 15, Column A)
            # is the sum of (Column A, Rows 13-14)
            "first_quarter_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "forecasted_cash_needs.federal_forecasted_cash_needs.first_quarter_amount",
                        "forecasted_cash_needs.non_federal_forecasted_cash_needs.first_quarter_amount",
                    ],
                }
            },
            # Section D - Forecasted Cash Needs: 2nd Quarter Total (Row 15, Column B)
            # is the sum of (Column B, Rows 13-14)
            "second_quarter_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "forecasted_cash_needs.federal_forecasted_cash_needs.second_quarter_amount",
                        "forecasted_cash_needs.non_federal_forecasted_cash_needs.second_quarter_amount",
                    ],
                }
            },
            # Section D - Forecasted Cash Needs: 3rd Quarter Total (Row 15, Column C)
            # is the sum of (Column C, Rows 13-14)
            "third_quarter_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "forecasted_cash_needs.federal_forecasted_cash_needs.third_quarter_amount",
                        "forecasted_cash_needs.non_federal_forecasted_cash_needs.third_quarter_amount",
                    ],
                }
            },
            # Section D - Forecasted Cash Needs: 4th Quarter Total (Row 15, Column D)
            # is the sum of (Column D, Rows 13-14)
            "fourth_quarter_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "forecasted_cash_needs.federal_forecasted_cash_needs.fourth_quarter_amount",
                        "forecasted_cash_needs.non_federal_forecasted_cash_needs.fourth_quarter_amount",
                    ],
                }
            },
            # Section D - Forecasted Cash Needs: Total Amount (Row 15, Column E)
            # is the sum of (Column E, Rows 13-14)
            "total_amount": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "forecasted_cash_needs.federal_forecasted_cash_needs.total_amount",
                        "forecasted_cash_needs.non_federal_forecasted_cash_needs.total_amount",
                    ],
                    # Needs to run after we calculate the total for each of federal and non-federal
                    # forecasted cash needs that runs in the first iteration
                    "order": 2,
                }
            },
        },
    },
    "total_federal_fund_estimates": {
        # Section E - Federal Fund Estimates: First Year Amount (Row 20, Column B)
        # is the sum of (Column B, Rows 16-19)
        "first_year_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].federal_fund_estimates.first_year_amount"],
            }
        },
        # Section E - Federal Fund Estimates: Second Year Amount (Row 20, Column C)
        # is the sum of (Column C, Rows 16-19)
        "second_year_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].federal_fund_estimates.second_year_amount"],
            }
        },
        # Section E - Federal Fund Estimates: Third Year Amount (Row 20, Column D)
        # is the sum of (Column D, Rows 16-19)
        "third_year_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].federal_fund_estimates.third_year_amount"],
            }
        },
        # Section E - Federal Fund Estimates: Fourth Year Amount (Row 20, Column E)
        # is the sum of (Column E, Rows 16-19)
        "fourth_year_amount": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["activity_line_items[*].federal_fund_estimates.fourth_year_amount"],
            }
        },
    },
}

# XML Transformation Rules for SF-424A
FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for converting Simpler SF-424A JSON to XML",
        "version": "1.0",
        "form_name": "SF424A",
        "namespaces": {
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "SF424A": "http://apply.grants.gov/forms/SF424A-V1.0",
            "default": "http://apply.grants.gov/forms/SF424A-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd",
        "xml_structure": {
            "root_element": "BudgetInformation",
            "root_namespace_prefix": "SF424A",  # Use SF424A: prefix for root element per XSD
            # Required attributes for XSD validation
            "root_attributes": {
                "programType": "Non-Construction",
                "glob:coreSchemaVersion": "1.0",  # Static value required by XSD
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
            "include_null": "Include empty XML element: <Field></Field>",
            "default_value": "Use configured default value when field is None",
        },
    },
    # Required first child element for XSD validation
    "form_version_identifier": {
        "xml_transform": {
            "target": "FormVersionIdentifier",
            "namespace": "glob",
            "attributes": {"xmlns:glob": "http://apply.grants.gov/system/Global-V1.0"},
        }
    },
    # Note: program_type is handled as a root attribute via xml_structure.root_attributes
    # and should NOT have a separate xml_transform rule
    # Activity title - appears as an attribute on line items
    "activity_title": {
        "xml_transform": {
            "target": "activityTitle",
            "type": "attribute",
        }
    },
    # Non-Federal Resources field mappings (Section C)
    # These map the internal field names to XSD element names
    "applicant_amount": {
        "xml_transform": {
            "target": "BudgetApplicantContributionAmount",
        }
    },
    "state_amount": {
        "xml_transform": {
            "target": "BudgetStateContributionAmount",
        }
    },
    # Note: other_amount and total_amount are defined later in correct XSD order
    # They are overridden in NonFederalResources section via field_overrides
    # CFDA/Assistance Listing Number - appears in Section A
    "assistance_listing_number": {
        "xml_transform": {
            "target": "CFDANumber",
        }
    },
    # Section A - Budget Summary field mappings
    "federal_estimated_unobligated_amount": {
        "xml_transform": {
            "target": "BudgetFederalEstimatedUnobligatedAmount",
        }
    },
    "non_federal_estimated_unobligated_amount": {
        "xml_transform": {
            "target": "BudgetNonFederalEstimatedUnobligatedAmount",
        }
    },
    "federal_new_or_revised_amount": {
        "xml_transform": {
            "target": "BudgetFederalNewOrRevisedAmount",
        }
    },
    "non_federal_new_or_revised_amount": {
        "xml_transform": {
            "target": "BudgetNonFederalNewOrRevisedAmount",
        }
    },
    # Section B - Budget Categories field mappings
    "personnel_amount": {
        "xml_transform": {
            "target": "BudgetPersonnelRequestedAmount",
        }
    },
    "fringe_benefits_amount": {
        "xml_transform": {
            "target": "BudgetFringeBenefitsRequestedAmount",
        }
    },
    "travel_amount": {
        "xml_transform": {
            "target": "BudgetTravelRequestedAmount",
        }
    },
    "equipment_amount": {
        "xml_transform": {
            "target": "BudgetEquipmentRequestedAmount",
        }
    },
    "supplies_amount": {
        "xml_transform": {
            "target": "BudgetSuppliesRequestedAmount",
        }
    },
    "contractual_amount": {
        "xml_transform": {
            "target": "BudgetContractualRequestedAmount",
        }
    },
    "construction_amount": {
        "xml_transform": {
            "target": "BudgetConstructionRequestedAmount",
        }
    },
    # other_amount mapping for BudgetCategories (correct XSD position)
    # Note: This will be overridden to BudgetOtherContributionAmount in NonFederalResources via field_overrides
    "other_amount": {
        "xml_transform": {
            "target": "BudgetOtherRequestedAmount",
        }
    },
    "total_direct_charge_amount": {
        "xml_transform": {
            "target": "BudgetTotalDirectChargesAmount",
        }
    },
    "total_indirect_charge_amount": {
        "xml_transform": {
            "target": "BudgetIndirectChargesAmount",
        }
    },
    # total_amount mapping for BudgetCategories (correct XSD position)
    # Note: This will be overridden to BudgetTotalContributionAmount in NonFederalResources via field_overrides
    "total_amount": {
        "xml_transform": {
            "target": "BudgetTotalAmount",
        }
    },
    "program_income_amount": {
        "xml_transform": {
            "target": "ProgramIncomeAmount",
        }
    },
    # Section E - Federal Funds Needed field mappings
    "first_year_amount": {
        "xml_transform": {
            "target": "BudgetFirstYearAmount",
        }
    },
    "second_year_amount": {
        "xml_transform": {
            "target": "BudgetSecondYearAmount",
        }
    },
    "third_year_amount": {
        "xml_transform": {
            "target": "BudgetThirdYearAmount",
        }
    },
    "fourth_year_amount": {
        "xml_transform": {
            "target": "BudgetFourthYearAmount",
        }
    },
    # Budget sections decomposition
    # Transform row-oriented activity_line_items array to column-oriented arrays
    # organized by section type (budget_summary, budget_categories, etc.)
    #
    # Note: This transformation handles the data restructuring step. The XML generation
    # phase will handle:
    # - Adding activity_title and assistance_listing_number as XML attributes on line items
    # - Using different XML element names for line items vs totals per XSD
    # - Proper XML namespace handling and element ordering
    #
    # XSD Structure per section:
    # - BudgetSummary: SummaryLineItem (with activityTitle & CFDANumber) + SummaryTotals
    # - BudgetCategories: CategorySet (with activityTitle) + CategoryTotals
    # - NonFederalResources: ResourceLineItem (with activityTitle) + ResourceTotals
    # - FederalFundsNeeded: FundsLineItem (with activityTitle) + FundsTotals
    "budget_sections": {
        "xml_transform": {
            "type": "conditional",
            # No target - array decomposition outputs multiple fields at root level per XSD
            "conditional_transform": {
                "type": "array_decomposition",
                "source_array_field": "activity_line_items",
                "field_mappings": {
                    # Section A - Budget Summary (XSD requires BudgetSummary with SummaryLineItem/SummaryTotals)
                    # Note: CFDANumber (assistance_listing_number) is a child element, not an attribute
                    "BudgetSummary": {
                        "item_field": "budget_summary",
                        "item_wrapper": "SummaryLineItem",
                        "item_attributes": ["activity_title"],
                        "total_field": "total_budget_summary",
                        "total_wrapper": "SummaryTotals",
                        "field_overrides": {
                            "total_amount": "BudgetTotalNewOrRevisedAmount",
                        },
                    },
                    # Section B - Budget Categories (XSD requires CategorySet/CategoryTotals)
                    # Note: Uses "Requested" naming (BudgetOtherRequestedAmount, BudgetTotalAmount)
                    # instead of "Contribution" naming used in NonFederalResources
                    "BudgetCategories": {
                        "item_field": "budget_categories",
                        "item_wrapper": "CategorySet",
                        "item_attributes": ["activity_title"],
                        "total_field": "total_budget_categories",
                        "total_wrapper": "CategoryTotals",
                    },
                    # Section C - Non-Federal Resources (XSD requires ResourceLineItem/ResourceTotals)
                    # Note: Uses "Contribution" naming (BudgetOtherContributionAmount, BudgetTotalContributionAmount)
                    # instead of "Requested"/"Amount" naming used in BudgetCategories
                    "NonFederalResources": {
                        "item_field": "non_federal_resources",
                        "item_wrapper": "ResourceLineItem",
                        "item_attributes": ["activity_title"],
                        "total_field": "total_non_federal_resources",
                        "total_wrapper": "ResourceTotals",
                        # Override global field mappings for this section
                        "field_overrides": {
                            "other_amount": "BudgetOtherContributionAmount",
                            "total_amount": "BudgetTotalContributionAmount",
                        },
                    },
                    # Note: FederalFundsNeeded moved to separate config after BudgetForecastedCashNeeds for correct XSD order
                },
            },
        }
    },
    # Forecasted Cash Needs - Section D (after budget sections per XSD order)
    # This requires pivoting the data structure from JSON to XML format
    "forecasted_cash_needs": {
        "xml_transform": {
            "type": "conditional",
            "target": "BudgetForecastedCashNeeds",
            "conditional_transform": {
                "type": "pivot_object",
                "source_field": "forecasted_cash_needs",
                "field_mapping": {
                    "BudgetFirstYearAmounts": {
                        "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.total_amount",
                        "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.total_amount",
                        "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.total_amount",
                    },
                    "BudgetFirstQuarterAmounts": {
                        "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.first_quarter_amount",
                        "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.first_quarter_amount",
                        "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.first_quarter_amount",
                    },
                    "BudgetSecondQuarterAmounts": {
                        "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.second_quarter_amount",
                        "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.second_quarter_amount",
                        "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.second_quarter_amount",
                    },
                    "BudgetThirdQuarterAmounts": {
                        "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.third_quarter_amount",
                        "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.third_quarter_amount",
                        "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.third_quarter_amount",
                    },
                    "BudgetFourthQuarterAmounts": {
                        "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.fourth_quarter_amount",
                        "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.fourth_quarter_amount",
                        "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.fourth_quarter_amount",
                    },
                },
            },
        }
    },
    # Section E - Federal Funds Needed (separate from budget_sections for correct XSD order)
    # Must come AFTER BudgetForecastedCashNeeds per XSD
    "budget_sections_federal_funds": {
        "xml_transform": {
            "type": "conditional",
            # No target - array decomposition outputs fields at root level per XSD
            "conditional_transform": {
                "type": "array_decomposition",
                "source_array_field": "activity_line_items",
                "field_mappings": {
                    # Section E - Federal Funds Needed (XSD requires FundsLineItem/FundsTotals)
                    "FederalFundsNeeded": {
                        "item_field": "federal_fund_estimates",
                        "item_wrapper": "FundsLineItem",
                        "item_attributes": ["activity_title"],
                        "total_field": "total_federal_fund_estimates",
                        "total_wrapper": "FundsTotals",
                    },
                },
            },
        }
    },
    # Section F - Other Information (nested object with child field mappings)
    # Must be LAST per XSD sequence order
    "other_information": {
        "xml_transform": {
            "target": "OtherInformation",
            "type": "compose_object",
            "field_mapping": {
                "OtherDirectChargesExplanation": "direct_charges_explanation",
                "OtherIndirectChargesExplanation": "indirect_charges_explanation",
                "Remarks": "remarks",
            },
        },
    },
}

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
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("e89a8372-1a6e-43fb-897f-29c89f243f9e"),
    form_type=FormType.SF424A,
    sgg_version="1.0",
    is_deprecated=False,
)
