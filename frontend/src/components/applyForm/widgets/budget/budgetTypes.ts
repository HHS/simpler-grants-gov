export type MoneyString = string | undefined;
export interface BudgetCategories {
  personnel_amount?: MoneyString;
  fringe_benefits_amount?: MoneyString;
  travel_amount?: MoneyString;
  equipment_amount?: MoneyString;
  supplies_amount?: MoneyString;
  contractual_amount?: MoneyString;
  construction_amount?: MoneyString;
  other_amount?: MoneyString;
  total_direct_charge_amount?: MoneyString;
  total_indirect_charge_amount?: MoneyString;
  total_amount?: MoneyString;
  program_income_amount?: MoneyString;
}
export type FieldKey = keyof BudgetCategories;
export type RowDef = {
  key: FieldKey;
  label: string;
  letter: string;
  note?: string;
};
export interface ActivityItem extends BaseActivityItem {
  budget_categories?: BudgetCategories;
  budget_summary?: { total_amount?: MoneyString };
}

export interface BaseActivityItem {
  activity_title?: string;
  assistance_listing_number?: string;
}
