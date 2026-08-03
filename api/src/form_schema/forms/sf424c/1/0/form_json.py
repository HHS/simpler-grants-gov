import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [],
    "properties": {
        "budget_information": {
            # Table 1 — Budget Information for Construction Programs
            "type": "object",
            "required": [],
            "properties": {
                "administrative_and_legal_expenses": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "land_structures_rights_of_way": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "relocation_expenses": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "architectural_engineering_fees": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "other_architectural_engineering_fees": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "project_inspection_fees": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "site_work": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "demolition_and_removal": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "construction": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                    "required": ["total_cost"],
                },
                "equipment": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "miscellaneous": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "subtotal_1": {
                    # Row 12 — Subtotal (sum of rows 1–11)
                    "allOf": [{"$ref": "#/$defs/budget_calculated_row"}],
                },
                "contingencies": {
                    # Row 13
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "subtotal_2": {
                    # Row 14 — Subtotal (rows 12 + 13)
                    "allOf": [{"$ref": "#/$defs/budget_calculated_row"}],
                },
                "project_income": {
                    "allOf": [{"$ref": "#/$defs/budget_row"}],
                },
                "total_project_costs": {
                    # Row 16 — Total project costs (row 14 - row 15)
                    "allOf": [{"$ref": "#/$defs/budget_calculated_row"}],
                },
            },
        },
        "federal_funding": {
            # Section 17 — Federal Funding
            "type": "object",
            "required": [],
            "properties": {
                "total_project_costs": {
                    "allOf": [
                        {"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_total_non_negative")}
                    ],
                },
                "federal_percentage_share": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("percentage")}],
                },
                "federal_funding_share": {
                    "allOf": [
                        {"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_total_non_negative")}
                    ],
                },
            },
        },
    },
    "$defs": {
        "budget_row": {
            "type": "object",
            "required": [],
            "properties": {
                "total_cost": {
                    # Column A — Total Cost
                    "allOf": [
                        {"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount_non_negative")}
                    ],
                },
                "non_allowable_cost": {
                    # Column B — Costs Not Allowable
                    "allOf": [
                        {"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount_non_negative")}
                    ],
                },
                "total_allowable_cost": {
                    # Column C — Total Allowable Costs
                    "allOf": [
                        {"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_total_non_negative")}
                    ],
                },
            },
        },
        "budget_calculated_row": {
            "type": "object",
            "required": [],
            "properties": {
                "total_cost": {
                    # Column A — Total Cost
                    "allOf": [
                        {"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_total_non_negative")}
                    ],
                },
                "non_allowable_cost": {
                    # Column B — Costs Not Allowable
                    "allOf": [
                        {"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_total_non_negative")}
                    ],
                },
                "total_allowable_cost": {
                    # Column C — Total Allowable Costs
                    "allOf": [
                        {"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_total_non_negative")}
                    ],
                },
            },
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "name": "Table1",
        "type": "section",
        "label": "Budget Information for Construction Programs",
        "description": "NOTE: Certain Federal assistance programs require additional computations to arrive at the Federal share of project costs eligible for participation. If such is the case, you will be notified.",
        "children": [
            {
                "type": "multiField",
                "name": "budget_424c_table_1",
                "widget": "Table",
                "definition": ["/properties/budget_information"],
                "children": {
                    "columns": [
                        {
                            "columnHeader": "COST CLASSIFICATION",
                            "width": 40,
                        },
                        {
                            "columnHeader": "a. Total Cost",
                            "width": 20,
                        },
                        {
                            "columnHeader": "b. Costs Not Allowable \nfor Participation",
                            "width": 20,
                        },
                        {
                            "columnHeader": "c. Total Allowable Costs \n(Columns a - b)",
                            "width": 20,
                        },
                    ],
                    "rows": [
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "1. Administrative and legal expenses",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/administrative_and_legal_expenses/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/administrative_and_legal_expenses/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/administrative_and_legal_expenses/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "2. Land, structures, rights-of-way, appraisals, etc.",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/land_structures_rights_of_way/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/land_structures_rights_of_way/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/land_structures_rights_of_way/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "3. Relocation expenses and payments",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/relocation_expenses/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/relocation_expenses/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/relocation_expenses/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "4. Architectural and engineering fees",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/architectural_engineering_fees/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/architectural_engineering_fees/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/architectural_engineering_fees/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "5. Other architectural and engineering fees",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/other_architectural_engineering_fees/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/other_architectural_engineering_fees/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/other_architectural_engineering_fees/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "6. Project inspection fees",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/project_inspection_fees/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/project_inspection_fees/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/project_inspection_fees/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "7. Site work",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/site_work/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/site_work/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/site_work/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "8. Demolition and removal",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/demolition_and_removal/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/demolition_and_removal/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/demolition_and_removal/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "9. Construction",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/construction/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/construction/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/construction/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "10. Equipment",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/equipment/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/equipment/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/equipment/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "11. Miscellaneous",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/miscellaneous/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/miscellaneous/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/miscellaneous/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "12. SUBTOTAL (sum of lines 1-11)",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/subtotal_1/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/subtotal_1/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/subtotal_1/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "13. Contingencies",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/contingencies/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/contingencies/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/contingencies/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "14. SUBTOTAL",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/subtotal_2/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/subtotal_2/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/subtotal_2/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "15. Project (program) income",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/project_income/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/project_income/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/project_income/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "16.  TOTAL PROJECT COSTS (subtract 15 from 14)",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/total_project_costs/properties/total_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/total_project_costs/properties/non_allowable_cost",
                                    "format": "dollar",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/total_project_costs/properties/total_allowable_cost",
                                    "format": "dollar",
                                },
                            ],
                        },
                    ],
                },
            }
        ],
    },
    {
        "name": "Table2",
        "type": "section",
        "label": "Federal Funding",
        "description": "Federal assistance requested, calculate as follows.",
        "children": [
            {
                "type": "multiField",
                "name": "budget_424c_table_2",
                "widget": "Table",
                "definition": ["/properties/federal_funding"],
                "children": {
                    "columns": [
                        {
                            "columnHeader": "Field",
                            "width": 60,
                        },
                        {
                            "columnHeader": "Value",
                            "width": 40,
                        },
                    ],
                    "rows": [
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "Total project costs",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/total_project_costs",
                                    "format": "dollar",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "Federal percentage share \n(Consult Federal agency for Federal percentage share.)",
                                },
                                {
                                    "type": "input",
                                    "definition": "/properties/federal_percentage_share",
                                    "format": "percentage",
                                },
                            ],
                        },
                        {
                            "cells": [
                                {
                                    "type": "plainText",
                                    "staticContent": "Federal funding share",
                                },
                                {
                                    "type": "readOnly",
                                    "definition": "/properties/federal_funding_share",
                                    "format": "dollar",
                                },
                            ],
                        },
                    ],
                },
            }
        ],
    },
]
FORM_RULE_SCHEMA = {
    ##### PRE-POPULATION RULES
    "budget_information": {
        # Rows 1-11 — total_allowable_cost = total_cost - non_allowable_cost
        "administrative_and_legal_expenses": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.administrative_and_legal_expenses.total_cost",
                        "budget_information.administrative_and_legal_expenses.non_allowable_cost",
                    ],
                }
            }
        },
        "land_structures_rights_of_way": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.land_structures_rights_of_way.total_cost",
                        "budget_information.land_structures_rights_of_way.non_allowable_cost",
                    ],
                }
            }
        },
        "relocation_expenses": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.relocation_expenses.total_cost",
                        "budget_information.relocation_expenses.non_allowable_cost",
                    ],
                }
            }
        },
        "architectural_engineering_fees": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.architectural_engineering_fees.total_cost",
                        "budget_information.architectural_engineering_fees.non_allowable_cost",
                    ],
                }
            }
        },
        "other_architectural_engineering_fees": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.other_architectural_engineering_fees.total_cost",
                        "budget_information.other_architectural_engineering_fees.non_allowable_cost",
                    ],
                }
            }
        },
        "project_inspection_fees": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.project_inspection_fees.total_cost",
                        "budget_information.project_inspection_fees.non_allowable_cost",
                    ],
                }
            }
        },
        "site_work": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.site_work.total_cost",
                        "budget_information.site_work.non_allowable_cost",
                    ],
                }
            }
        },
        "demolition_and_removal": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.demolition_and_removal.total_cost",
                        "budget_information.demolition_and_removal.non_allowable_cost",
                    ],
                }
            }
        },
        "construction": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.construction.total_cost",
                        "budget_information.construction.non_allowable_cost",
                    ],
                }
            }
        },
        "equipment": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.equipment.total_cost",
                        "budget_information.equipment.non_allowable_cost",
                    ],
                }
            }
        },
        "miscellaneous": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.miscellaneous.total_cost",
                        "budget_information.miscellaneous.non_allowable_cost",
                    ],
                }
            }
        },
        # Row 12 — Subtotal 1 (sum of rows 1-11)
        "subtotal_1": {
            "total_cost": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "budget_information.administrative_and_legal_expenses.total_cost",
                        "budget_information.land_structures_rights_of_way.total_cost",
                        "budget_information.relocation_expenses.total_cost",
                        "budget_information.architectural_engineering_fees.total_cost",
                        "budget_information.other_architectural_engineering_fees.total_cost",
                        "budget_information.project_inspection_fees.total_cost",
                        "budget_information.site_work.total_cost",
                        "budget_information.demolition_and_removal.total_cost",
                        "budget_information.construction.total_cost",
                        "budget_information.equipment.total_cost",
                        "budget_information.miscellaneous.total_cost",
                    ],
                }
            },
            "non_allowable_cost": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "budget_information.administrative_and_legal_expenses.non_allowable_cost",
                        "budget_information.land_structures_rights_of_way.non_allowable_cost",
                        "budget_information.relocation_expenses.non_allowable_cost",
                        "budget_information.architectural_engineering_fees.non_allowable_cost",
                        "budget_information.other_architectural_engineering_fees.non_allowable_cost",
                        "budget_information.project_inspection_fees.non_allowable_cost",
                        "budget_information.site_work.non_allowable_cost",
                        "budget_information.demolition_and_removal.non_allowable_cost",
                        "budget_information.construction.non_allowable_cost",
                        "budget_information.equipment.non_allowable_cost",
                        "budget_information.miscellaneous.non_allowable_cost",
                    ],
                }
            },
            "total_allowable_cost": {
                # Runs after total_cost and non_allowable_cost are set (order 2)
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.subtotal_1.total_cost",
                        "budget_information.subtotal_1.non_allowable_cost",
                    ],
                    "order": 2,
                }
            },
        },
        # Row 13 — Contingencies
        "contingencies": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.contingencies.total_cost",
                        "budget_information.contingencies.non_allowable_cost",
                    ],
                }
            }
        },
        # Row 14 — Subtotal 2 (subtotal_1 + contingencies)
        "subtotal_2": {
            "total_cost": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "budget_information.subtotal_1.total_cost",
                        "budget_information.contingencies.total_cost",
                    ],
                    "order": 3,
                }
            },
            "non_allowable_cost": {
                "gg_pre_population": {
                    "rule": "sum_monetary",
                    "fields": [
                        "budget_information.subtotal_1.non_allowable_cost",
                        "budget_information.contingencies.non_allowable_cost",
                    ],
                    "order": 3,
                }
            },
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.subtotal_2.total_cost",
                        "budget_information.subtotal_2.non_allowable_cost",
                    ],
                    "order": 4,
                }
            },
        },
        # Row 15 — Project income
        "project_income": {
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.project_income.total_cost",
                        "budget_information.project_income.non_allowable_cost",
                    ],
                }
            }
        },
        # Row 16 — Total project costs (subtotal_2 - project_income)
        "total_project_costs": {
            "total_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.subtotal_2.total_cost",
                        "budget_information.project_income.total_cost",
                    ],
                    "order": 4,
                }
            },
            "non_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.subtotal_2.non_allowable_cost",
                        "budget_information.project_income.non_allowable_cost",
                    ],
                    "order": 4,
                }
            },
            "total_allowable_cost": {
                "gg_pre_population": {
                    "rule": "subtract_monetary",
                    "fields": [
                        "budget_information.subtotal_2.total_allowable_cost",
                        "budget_information.project_income.total_allowable_cost",
                    ],
                    "order": 5,
                }
            },
        },
    },
    # Section 17 — Federal Funding
    "federal_funding": {
        # Total project costs — copied from Table 1 Row 16 Column C (total_allowable_cost)
        "total_project_costs": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["budget_information.total_project_costs.total_allowable_cost"],
                "order": 6,
            }
        },
        # Federal funding share = total_project_costs * federal_percentage_share / 100
        "federal_funding_share": {
            "gg_pre_population": {
                "rule": "multiply_by_percentage",
                "amount": "federal_funding.total_project_costs",
                "percentage": "federal_funding.federal_percentage_share",
                "order": 7,
            }
        },
    },
}

# XML Transformation Rules for SF-424C v2.0
FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for converting Simpler SF-424C JSON to XML",
        "version": "2.0",
        "form_name": "SF424C",
        "namespaces": {
            "SF424C_2_0": "http://apply.grants.gov/forms/SF424C_2_0-V2.0",
            "default": "http://apply.grants.gov/forms/SF424C_2_0-V2.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424C_2_0-V2.0.xsd",
        "xml_structure": {
            "root_element": "SF424C_2_0",
            "root_namespace_prefix": "SF424C_2_0",
            "root_attributes": {
                "programType": "Construction",
                "FormVersion": "2.0",
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
            "include_null": "Include empty XML element: <Field></Field>",
            "default_value": "Use configured default value when field is None",
        },
    },
    # Table 1 - Budget Information for Construction Programs field mappings
    # Each row maps to a ProjectCosts child element in the XSD.
    # Each row has three columns: total_cost (A), non_allowable_cost (B), total_allowable_cost (C).
    "budget_information": {
        "xml_transform": {
            "target": "ProjectCosts",
            "type": "nested_object",
        },
        "administrative_and_legal_expenses": {
            "xml_transform": {"target": "AdministrationCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "land_structures_rights_of_way": {
            "xml_transform": {"target": "LandCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "relocation_expenses": {
            "xml_transform": {"target": "RelocationCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "architectural_engineering_fees": {
            "xml_transform": {"target": "ArchitecturalCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "other_architectural_engineering_fees": {
            "xml_transform": {"target": "OtherArchitecturalCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "project_inspection_fees": {
            "xml_transform": {"target": "InspectionFeesCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "site_work": {
            "xml_transform": {"target": "SiteWorkCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "demolition_and_removal": {
            "xml_transform": {"target": "DemolitionCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "construction": {
            "xml_transform": {"target": "ConstructionCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "equipment": {
            "xml_transform": {"target": "EquipmentCost", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "miscellaneous": {
            "xml_transform": {"target": "Miscellaneous", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        # Subtotal rows — calculated by rules engine; same column structure as user-input rows
        "subtotal_1": {
            "xml_transform": {
                "target": "CostSubtotalBeforeContingencies",
                "type": "nested_object",
            },
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "contingencies": {
            "xml_transform": {"target": "Contingencies", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "subtotal_2": {
            "xml_transform": {
                "target": "CostSubtotalAfterContingencies",
                "type": "nested_object",
            },
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "project_income": {
            "xml_transform": {"target": "ProgramIncome", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
        "total_project_costs": {
            "xml_transform": {"target": "TotalProjectCosts", "type": "nested_object"},
            "total_cost": {"xml_transform": {"target": "BudgetEstimatedCostAmount"}},
            "non_allowable_cost": {"xml_transform": {"target": "BudgetNonAllowableCostAmount"}},
            "total_allowable_cost": {"xml_transform": {"target": "BudgetTotalAllowableCostAmount"}},
        },
    },
    # Section 17 - Federal Funding field mappings
    # Note: No xml_transform on federal_funding itself so its children bubble up to root level,
    # matching the XSD where these are direct children of SF424C_2_0.
    # Note: federal_funding.total_project_costs is UI-only; no XSD element.
    "federal_funding": {
        "federal_percentage_share": {
            "xml_transform": {"target": "FederalFundingPercentageShareValue"}
        },
        "federal_funding_share": {"xml_transform": {"target": "FederalFundingShareValue"}},
    },
}

SF424c_v2_0 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/408
    form_id=uuid.UUID("b98c72d0-4dd4-425f-bb9c-a7b72dc6972b"),
    legacy_form_id=408,
    form_name="Budget Information for Construction Programs (SF-424C)",
    short_form_name="SF424C",
    form_version="2.0",
    agency_code="SGG",
    omb_number="4040-0008",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=None,
    form_type=FormType.SF424C,
    sgg_version="1.0",
    is_deprecated=False,
)
