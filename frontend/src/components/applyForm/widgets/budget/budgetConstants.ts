import { FieldKey, RowDef } from "./budgetTypes";

export const DATA_CELL_BASE_CLASS =
  "border-bottom-0 border-top-0 padding-05 verticle-align-top sf424a__cell";

export const ACTIVITY_COLUMN_COUNT = 4;

export const BUDGET_ACTIVITY_COLUMNS = [0, 1, 2, 3, 4] as const;

export const SECTION_B_ROW_I_KEY: FieldKey = "total_direct_charge_amount";
export const SECTION_B_ROW_K_KEY: FieldKey = "total_amount";

export const SECTION_B_ROWS: RowDef[] = [
  { key: "personnel_amount", label: "a. Personnel", letter: "a" },
  { key: "fringe_benefits_amount", label: "b. Fringe benefits", letter: "b" },
  { key: "travel_amount", label: "c. Travel", letter: "c" },
  { key: "equipment_amount", label: "d. Equipment", letter: "d" },
  { key: "supplies_amount", label: "e. Supplies", letter: "e" },
  { key: "contractual_amount", label: "f. Contractual", letter: "f" },
  { key: "construction_amount", label: "g. Construction", letter: "g" },
  { key: "other_amount", label: "h. Other", letter: "h" },
  {
    key: "total_direct_charge_amount",
    label: "i. Total direct charges",
    letter: "i",
    note: "Sum of rows a-h",
  },
  {
    key: "total_indirect_charge_amount",
    label: "j. Total indirect charges",
    letter: "j",
  },
  {
    key: "total_amount",
    label: "k. TOTAL (i + j)",
    letter: "k",
    note: "Direct + Indirect",
  },
];

export const QUARTERS = [
  { key: "first_quarter_amount", quarter: "1st Quarter", label: "A" },
  { key: "second_quarter_amount", quarter: "2nd Quarter", label: "B" },
  { key: "third_quarter_amount", quarter: "3rd Quarter", label: "C" },
  { key: "fourth_quarter_amount", quarter: "4th Quarter", label: "D" },
  {
    key: "total_amount",
    quarter: "Total for 1st year (sum of A-D)",
    label: "E",
  },
] as const;

export const YEARS = [
  { key: "first_year_amount", short: "First year", colLabel: "B" },
  { key: "second_year_amount", short: "Second year", colLabel: "C" },
  { key: "third_year_amount", short: "Third year", colLabel: "D" },
  { key: "fourth_year_amount", short: "Fourth year", colLabel: "E" },
] as const;
