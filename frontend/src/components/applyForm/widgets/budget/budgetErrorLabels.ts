import { FormValidationWarning } from "src/components/applyForm/types";

export type SectionKey = "A" | "B" | "C" | "D" | "E" | "F";
export type ColumnLabelStyle = "letter" | "number";
export type RowLabelStyle = "number" | "letter";

export function getBudgetErrors({
  errors,
  id,
  section,
  columnLabel = "letter",
  rowLabel = "number",
  startingRowNumber = 6,
}: {
  errors?: FormValidationWarning[];
  id: string;
  section: SectionKey;
  columnLabel?: ColumnLabelStyle;
  rowLabel?: RowLabelStyle;
  startingRowNumber?: number;
}): string[] {
  // Special-case: Section A "contains/minContains" failures
  if (section === "A") {
    const hasContainsError = (errors ?? []).some(
      (e) =>
        e.field === "activity_line_items" &&
        typeof e.message === "string" &&
        /does not contain|minContains|items matching/i.test(e.message),
    );
    // the system will send up an empty array for activity line items if nothing is filled out
    // we need to interpret this into an error for the required activity title field on the first line
    // item only. The alternative to this custom handling would be to send up an empty object in the line
    // items array. As this would build budget form specific logic into the form data pruning function,
    // better to handle here for now - DWS
    const hasEmptyArrayError = (errors ?? []).some(
      (e) => e.field === "activity_line_items" && e.type === "minItems",
    );

    const hasRequiredError =
      (hasContainsError &&
        (id === "activity_line_items[0]--activity_title" ||
          id === "activity_line_items[0]--assistance_listing_number" ||
          id === "activity_line_items[0]--budget_summary--total_amount")) ||
      (id === "activity_line_items[0]--activity_title" && hasEmptyArrayError);

    if (hasRequiredError) {
      return ["This field is required."];
    }
  }

  const hasMatchingError = (errors ?? []).some((e) => e.field === id);
  if (!hasMatchingError) return [];

  const position = parseRowColumn(section, id);
  if (!position) {
    return (errors ?? []).filter((e) => e.field === id).map((e) => e.message);
  }

  const columnString =
    columnLabel === "letter"
      ? toColumnLetter(position.columnNumber)
      : String(position.columnNumber);

  let rowString: string;
  if (section === "B") {
    if (rowLabel === "letter") {
      const letter =
        position.rowLetter ??
        (position.rowIndex != null
          ? toRowLetterFromIndex(position.rowIndex)
          : undefined);
      rowString = letter ?? String(position.rowNumberAbsolute ?? "");
    } else {
      const numeric =
        position.rowNumberAbsolute ??
        (position.rowIndex != null
          ? startingRowNumber + position.rowIndex
          : undefined);
      rowString = String(numeric ?? "");
    }
  } else {
    rowString = String(position.rowNumberAbsolute);
  }

  return [`Row ${rowString} Column ${columnString}`];
}

/** Parsed position of a field in the printed form grid. */
type ParsedPosition = {
  columnNumber: number;
  rowNumberAbsolute: number;
  rowIndex?: number;
  rowLetter?: string;
} | null;

function parseRowColumn(section: SectionKey, id: string): ParsedPosition {
  switch (section) {
    case "A":
      return parseSectionA(id);
    case "B":
      return parseSectionB(id);
    case "C":
      return parseSectionC(id);
    case "D":
      return parseSectionD(id);
    case "E":
      return parseSectionE(id);
    case "F":
      return parseSectionF(id);
  }
}

/* ---------------- Section A ---------------- */
function parseSectionA(id: string): ParsedPosition {
  const activityIndex = getMatchIndex(id, /activity_line_items\[(\d+)\]/, 1);
  if (activityIndex == null) return null;

  const fieldKey = getMatchField(id, /--(?:budget_summary--)?([a-z_]+)$/);
  const columnByField: Record<string, number> = {
    activity_title: 1,
    assistance_listing_number: 2,
    federal_estimated_unobligated_amount: 3,
    non_federal_estimated_unobligated_amount: 4,
    federal_new_or_revised_amount: 5,
    non_federal_new_or_revised_amount: 6,
    total_amount: 7,
  };
  const columnNumber = fieldKey ? columnByField[fieldKey] : undefined;
  return columnNumber
    ? { rowNumberAbsolute: activityIndex + 1, columnNumber }
    : null;
}

/* ---------------- Section B ---------------- */
function parseSectionB(id: string): ParsedPosition {
  const rowIndexByField: Record<string, number> = {
    personnel_amount: 0,
    fringe_benefits_amount: 1,
    travel_amount: 2,
    equipment_amount: 3,
    supplies_amount: 4,
    contractual_amount: 5,
    construction_amount: 6,
    other_amount: 7,
    total_direct_charge_amount: 8,
    total_indirect_charge_amount: 9,
    total_amount: 10,
  };

  const activityIndex = getMatchIndex(
    id,
    /activity_line_items\[(\d+)\]--budget_categories--/,
    1,
  );
  if (activityIndex != null) {
    const fieldKey = getMatchField(id, /--budget_categories--([a-z_]+)$/);
    if (!fieldKey || !(fieldKey in rowIndexByField)) return null;

    const rowIndex = rowIndexByField[fieldKey];
    const rowNumberAbsolute = 6 + rowIndex;
    const rowLetter = toRowLetterFromIndex(rowIndex);

    return {
      rowIndex,
      rowLetter,
      rowNumberAbsolute,
      columnNumber: activityIndex + 1,
    };
  }

  const totalsFieldKey = getMatchField(
    id,
    /^total_budget_categories--([a-z_]+)$/,
  );
  if (totalsFieldKey && totalsFieldKey in rowIndexByField) {
    const rowIndex = rowIndexByField[totalsFieldKey];
    const rowNumberAbsolute = 6 + rowIndex;
    const rowLetter = toRowLetterFromIndex(rowIndex);
    return {
      rowIndex,
      rowLetter,
      rowNumberAbsolute,
      columnNumber: 5,
    };
  }

  return null;
}

/* ---------------- Section C ---------------- */
function parseSectionC(id: string): ParsedPosition {
  const activityIndex = getMatchIndex(id, /activity_line_items\[(\d+)\]/, 1);
  if (activityIndex != null) {
    if (/--activity_title$/.test(id)) {
      return { rowNumberAbsolute: activityIndex + 8, columnNumber: 1 };
    }
    const fieldKey = getMatchField(id, /--non_federal_resources--([a-z_]+)$/);
    const columnByField: Record<string, number> = {
      applicant_amount: 2,
      state_amount: 3,
      other_amount: 4,
    };
    const columnNumber = fieldKey ? columnByField[fieldKey] : undefined;
    if (columnNumber) {
      return { rowNumberAbsolute: activityIndex + 8, columnNumber };
    }
  }

  const totalsFieldKey = getMatchField(
    id,
    /^total_non_federal_resources--([a-z_]+)$/,
  );
  if (totalsFieldKey) {
    const columnByField: Record<string, number> = {
      applicant_amount: 2,
      state_amount: 3,
      other_amount: 4,
      total_amount: 5,
    };
    const columnNumber = columnByField[totalsFieldKey];
    if (columnNumber) {
      return { rowNumberAbsolute: 12, columnNumber };
    }
  }

  return null;
}

/* ---------------- Section D ---------------- */
function parseSectionD(id: string): ParsedPosition {
  const rowKey = getMatchField(id, /^forecasted_cash_needs--([a-z_]+)--/);
  const columnKey = getMatchField(id, /--([a-z_]+)$/);
  if (!rowKey || !columnKey) return null;

  const rowNumberByKey: Record<string, number> = {
    federal_forecasted_cash_needs: 13,
    non_federal_forecasted_cash_needs: 14,
    total_forecasted_cash_needs: 15,
  };
  const columnNumberByKey: Record<string, number> = {
    first_quarter_amount: 1,
    second_quarter_amount: 2,
    third_quarter_amount: 3,
    fourth_quarter_amount: 4,
    total_amount: 5,
  };

  const rowNumberAbsolute = rowNumberByKey[rowKey];
  const columnNumber = columnNumberByKey[columnKey];
  return rowNumberAbsolute && columnNumber
    ? { rowNumberAbsolute, columnNumber }
    : null;
}

/* ---------------- Section E ---------------- */
function parseSectionE(id: string): ParsedPosition {
  const activityIndex = getMatchIndex(id, /activity_line_items\[(\d+)\]/, 1);
  if (activityIndex != null) {
    if (/--activity_title$/.test(id)) {
      return { rowNumberAbsolute: activityIndex + 16, columnNumber: 1 };
    }
    const yearKey = getMatchField(id, /--federal_fund_estimates--([a-z_]+)$/);
    const columnNumberByYear: Record<string, number> = {
      first_year_amount: 2,
      second_year_amount: 3,
      third_year_amount: 4,
      fourth_year_amount: 5,
    };
    const columnNumber = yearKey ? columnNumberByYear[yearKey] : undefined;
    if (columnNumber) {
      return { rowNumberAbsolute: activityIndex + 16, columnNumber };
    }
  }

  const totalsYearKey = getMatchField(
    id,
    /^total_federal_fund_estimates--([a-z_]+)$/,
  );
  if (totalsYearKey) {
    const columnNumberByYear: Record<string, number> = {
      first_year_amount: 2,
      second_year_amount: 3,
      third_year_amount: 4,
      fourth_year_amount: 5,
    };
    const columnNumber = columnNumberByYear[totalsYearKey];
    if (columnNumber) {
      return { rowNumberAbsolute: 20, columnNumber };
    }
  }

  return null;
}

/* ---------------- Section F ---------------- */
function parseSectionF(id: string): ParsedPosition {
  const rowNumberById: Record<string, number> = {
    direct_charges_explanation: 21,
    indirect_charges_explanation: 22,
    remarks: 23,
  };
  const rowNumberAbsolute = rowNumberById[id];
  return rowNumberAbsolute ? { rowNumberAbsolute, columnNumber: 1 } : null;
}

/* ---------------- Helpers ---------------- */
function getMatchIndex(
  id: string,
  expression: RegExp,
  groupIndex: number,
): number | null {
  const match = id.match(expression);
  if (!match) return null;
  const index = Number(match[groupIndex]);
  return Number.isNaN(index) ? null : index;
}

function getMatchField(id: string, expression: RegExp): string | null {
  const match = id.match(expression);
  return match ? match[1] : null;
}

function toColumnLetter(columnNumber: number): string {
  let result = "";
  let n = columnNumber;
  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

function toRowLetterFromIndex(rowIndex: number): string {
  return String.fromCharCode(65 + rowIndex);
}
