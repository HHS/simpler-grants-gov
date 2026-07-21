import {
  UswdsWidgetProps,
  type UiSchemaTableColumn,
  type UiSchemaTableMultiField,
  type UiSchemaTableRow,
} from "src/types/applyForm/types";

import { useCallback, useMemo } from "react";
import { Table } from "@trussworks/react-uswds";

import TableCell from "./TableCell";

function getFieldName(definition: string | undefined): string | undefined {
  return definition?.split("/").filter(Boolean).pop();
}

/**
 * Extract a form value for a given JSON Schema property path.
 * @param definition - JSON Schema property path (e.g., "/properties/federal_share")
 * @param value - The form object containing field values
 * @returns The form value, or undefined if not found or invalid
 */
function getRenderValue(
  definition: string | undefined,
  value: unknown,
): string | number | undefined {
  const fieldName = getFieldName(definition);

  if (!fieldName || !value || typeof value !== "object") {
    return undefined;
  }

  const renderValue = (value as Record<string, unknown>)[fieldName];
  return typeof renderValue === "string" || typeof renderValue === "number"
    ? renderValue
    : undefined;
}

/**
 * TableWidget renders a data table with support for multiple cell types.
 *
 * This widget integrates with JSON Schema form rendering to display tabular data
 * with the following cell types:
 * - `plainText`: Static text content (category names, labels, etc.)
 * - `input`: Editable numeric input fields for form data
 * - `readOnly`: Calculated/computed values that cannot be edited
 *
 * Features:
 * - Responsive table layout with responsive USWDS Table component
 * - Automatic form value binding and updates
 * - Validation for numeric input cells (decimal numbers with optional signs)
 * - Number formatting support (integer, decimal, currency, dollar, percentage)
 * - Disabled state management (locks all input cells when form is locked)
 * - Accessibility: proper table semantics, ARIA labels, captions
 *
 * The widget automatically:
 * - Binds input cell values from the form data based on JSON Schema properties
 * - Updates form data when input cells change
 * - Formats read-only values according to the specified format
 * - Handles form locked state by disabling all input cells
 *
 * @example
 * // Table widget configuration in UI schema
 * {
 *   type: "multiField",
 *   name: "budget_table",
 *   widget: "Table",
 *   definition: [
 *     "/properties/federal_share",
 *     "/properties/non_federal_share",
 *     "/properties/total"
 *   ],
 *   children: {
 *     columns: [
 *       { columnHeader: "Budget Category", width: 30 },
 *       { columnHeader: "Federal Share", width: 23 },
 *       { columnHeader: "Non-Federal Share", width: 23 },
 *       { columnHeader: "Total", width: 24 }
 *     ],
 *     rows: [
 *       {
 *         cells: [
 *           { type: "plainText", staticContent: "Administrative" },
 *           {
 *             type: "input",
 *             definition: "/properties/federal_share",
 *             format: "dollar"
 *           },
 *           {
 *             type: "readOnly",
 *             definition: "/properties/non_federal_share",
 *             format: "dollar"
 *           },
 *           {
 *             type: "readOnly",
 *             definition: "/properties/total",
 *             format: "dollar"
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */
function TableWidget({
  disabled,
  isFormLocked,
  label,
  onChange,
  uiSchemaField,
  value,
}: UswdsWidgetProps) {
  /**
   * Handle changes to input cells and update the form value.
   * @param definition - JSON Schema property path for the cell
   * @param nextValue - The new value entered by the user
   */
  const handleCellChange = useCallback(
    (definition: string, nextValue: string) => {
      const fieldName = getFieldName(definition);

      if (!fieldName) {
        return;
      }

      const currentValue =
        value && typeof value === "object" && !Array.isArray(value)
          ? value
          : {};

      onChange?.({
        ...(currentValue as Record<string, unknown>),
        [fieldName]: nextValue,
      });
    },
    [onChange, value],
  );
  // ensure hooks are called unconditionally; default to empty arrays
  const columns: UiSchemaTableColumn[] =
    (uiSchemaField as UiSchemaTableMultiField | undefined)?.children?.columns ??
    [];
  const rows: UiSchemaTableRow[] =
    (uiSchemaField as UiSchemaTableMultiField | undefined)?.children?.rows ??
    [];

  const cellChangeHandlers = useMemo(
    () =>
      rows.reduce(
        (handlers, row) => {
          row.cells.forEach((cell) => {
            if (cell.type === "input" && cell.definition) {
              handlers[cell.definition] = (nextValue: string) =>
                handleCellChange(cell.definition, nextValue);
            }
          });

          return handlers;
        },
        {} as Record<string, (nextValue: string) => void>,
      ),
    [handleCellChange, rows],
  );

  if (
    uiSchemaField?.type !== "multiField" ||
    uiSchemaField.widget !== "Table"
  ) {
    return null;
  }
  const expectedCellCount = columns.length;
  const isInteractionDisabled = disabled || isFormLocked;
  // Validate that each row has the correct number of cells.
  rows.forEach((row, rowIndex) => {
    if (!Array.isArray(row.cells)) {
      throw new Error(
        `Table row ${rowIndex + 1} must contain exactly ${expectedCellCount} cells.`,
      );
    }

    if (row.cells.length !== expectedCellCount) {
      throw new Error(
        `Table row ${rowIndex + 1} must contain exactly ${expectedCellCount} cells.`,
      );
    }
  });

  return (
    <Table
      bordered
      fullWidth
      scrollable
      data-testid="table"
      data-table-name={uiSchemaField.name}
      data-table-column-count={columns.length}
      data-table-row-count={rows.length}
      caption={
        <span className="usa-sr-only">{label ?? uiSchemaField.name}</span>
      }
    >
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.columnHeader}
              scope="col"
              style={column.width ? { width: `${column.width}%` } : undefined}
            >
              {column.columnHeader}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`table-row-${rowIndex}`}>
            {row.cells.map((cell, cellIndex) => {
              const cellId = `${uiSchemaField.name}-${rowIndex}-${cellIndex}`;

              return (
                <td
                  key={`table-row-${rowIndex}-cell-${cellIndex}`}
                  data-table-cell-type={cell.type}
                >
                  <TableCell
                    cell={cell}
                    disabled={
                      cell.type === "input" ? isInteractionDisabled : false
                    }
                    id={cellId}
                    onChange={
                      cell.type === "input" && cell.definition
                        ? cellChangeHandlers[cell.definition]
                        : undefined
                    }
                    value={
                      cell.type === "plainText"
                        ? undefined
                        : getRenderValue(cell.definition, value)
                    }
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default TableWidget;
