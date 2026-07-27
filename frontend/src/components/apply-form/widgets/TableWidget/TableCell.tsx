import { TableWidgetCellConfig } from "src/types/applyForm/types";
import { formatTableCellValue } from "src/utils/applyForm/formatTableCellValue";

import { ChangeEvent, useState } from "react";

const READ_ONLY_OUTPUT_CLASS =
  "usa-input margin-0 width-full overflow-x-auto display-block border border-base-light bg-base-lightest text-right text-wrap";

type TableCellProps = {
  /** The cell configuration from the table widget schema */
  cell: TableWidgetCellConfig;
  /** Unique identifier for the cell */
  id: string;
  /** HTML form name for the cell input */
  name?: string;
  /** The value to display or edit in the cell */
  value?: number | string | null;
  /** Whether the cell should be disabled (read-only mode) */
  disabled?: boolean;
  /** Callback when the cell value changes (only for editable input cells) */
  onChange?: (value: string) => void;
};

function getStringValue(value: number | string | null | undefined): string {
  return value === undefined || value === null ? "" : String(value);
}

/**
 * TableCell renders a single cell in a table widget.
 *
 * Supports three types of cells:
 * - `plainText`: Static text content, non-interactive
 * - `readOnly`: Formatted numeric value, non-interactive with distinctive styling
 * - `input`: Editable numeric input field, with decimal number validation
 *
 * When an input cell is disabled, it renders as a read-only formatted value
 * to prevent user interaction while displaying the current value clearly.
 *
 * Number formatting options include:
 * - `integer`: Whole numbers with thousand separators (e.g., "1,234")
 * - `decimal`: Two decimal places with thousand separators (e.g., "1,234.50")
 * - `currency`: Two decimal places (e.g., "1,234.50")
 * - `dollar`: Currency format with $ sign (e.g., "$1,234.50")
 * - `percentage`: Two decimal places with % sign (e.g., "12.50%")
 *
 * @example
 * // Plain text cell
 * <TableCell
 *   cell={{ type: "plainText", staticContent: "Administrative" }}
 *   id="category-cell"
 * />
 *
 * @example
 * // Editable input cell
 * <TableCell
 *   cell={{
 *     type: "input",
 *     definition: "/properties/federal_share",
 *     format: "dollar"
 *   }}
 *   id="federal-cell"
 *   value={5000}
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // Read-only cell
 * <TableCell
 *   cell={{
 *     type: "readOnly",
 *     definition: "/properties/total",
 *     format: "dollar"
 *   }}
 *   id="total-cell"
 *   value={10000}
 * />
 */
function TableCell({
  cell,
  id,
  name,
  value,
  disabled = false,
  onChange,
}: TableCellProps) {
  const [inputValue, setInputValue] = useState(getStringValue(value));
  const [lastSyncedValue, setLastSyncedValue] = useState(value);
  if (lastSyncedValue !== value) {
    setLastSyncedValue(value);
    setInputValue(getStringValue(value));
  }

  if (cell.type === "plainText") {
    return (
      <span className="display-block text-wrap">{cell.staticContent}</span>
    );
  }

  if (cell.type === "readOnly" || (cell.type === "input" && disabled)) {
    const renderedValue = formatTableCellValue(value, cell.format);
    return (
      <span className={READ_ONLY_OUTPUT_CLASS} data-testid={`${id}-read-only`}>
        {renderedValue === "" ? "\u00A0" : renderedValue}
      </span>
    );
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    if (nextValue === "" || /^-?\d*\.?\d*$/.test(nextValue)) {
      setInputValue(nextValue);
      onChange?.(nextValue);
    }
  };

  return (
    <input
      aria-label={`Editable table value for ${cell.definition}`}
      className="usa-input margin-0 width-full overflow-x-auto"
      data-testid={`${id}-input`}
      id={id}
      name={name}
      inputMode="decimal"
      onChange={handleChange}
      pattern="-?[0-9]*[.]?[0-9]*"
      type="text"
      value={inputValue}
      disabled={disabled}
    />
  );
}

export default TableCell;
