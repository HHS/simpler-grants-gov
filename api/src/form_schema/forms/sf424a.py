import uuid

from src.db.models.competition_models import Form
from src.services.xml_generation.constants import CURRENCY_REGEX

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
        "budget_monetary_amount": {
            # Represents a monetary amount. We use a string instead of number
            # to avoid any floating point rounding issues.
            "type": "string",
            # Pattern here effectively says:
            # * An optional negative sign
            # * Any number of digits
            # * An optional decimal point
            # * Then exactly 2 digits - if there was a decimal
            "pattern": CURRENCY_REGEX,
            # Limit the max amount based on the length (11-digits, allows up to 99 billion)
            "maxLength": 14,
        },
        "budget_summary": {
            # Represents a row from Section A
            "type": "object",
            "properties": {
                "federal_estimated_unobligated_amount": {
                    # Column C
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "non_federal_estimated_unobligated_amount": {
                    # Column D
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "federal_new_or_revised_amount": {
                    # Column E
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "non_federal_new_or_revised_amount": {
                    # Column F
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "total_amount": {
                    # Column G
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
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
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "fringe_benefits_amount": {
                    # Row B
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "travel_amount": {
                    # Row C
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "equipment_amount": {
                    # Row D
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "supplies_amount": {
                    # Row E
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "contractual_amount": {
                    # Row F
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "construction_amount": {
                    # Row G
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "other_amount": {
                    # Row H
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "total_direct_charge_amount": {
                    # Row I
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "total_indirect_charge_amount": {
                    # Row J
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "total_amount": {
                    # Row K
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "program_income_amount": {
                    # Line 7
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
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
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "state_amount": {
                    # Column C
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "other_amount": {
                    # Column D
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "total_amount": {
                    # Column E
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
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
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "second_year_amount": {
                    # Column C
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "third_year_amount": {
                    # Column D
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "fourth_year_amount": {
                    # Column E
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
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
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "second_quarter_amount": {
                    # Column 2nd Quarter
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "third_quarter_amount": {
                    # Column 3rd Quarter
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "fourth_quarter_amount": {
                    # Column 4th Quarter
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
                },
                "total_amount": {
                    # Column Total for 1st Year
                    "allOf": [{"$ref": "#/$defs/budget_monetary_amount"}],
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
            }
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
    # No form instructions at the moment.
)
