export const BUDGET_ACTIVITY_COLUMNS = [0, 1, 2, 3, 4] as const;

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
